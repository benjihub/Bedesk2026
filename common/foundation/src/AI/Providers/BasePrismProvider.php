<?php

namespace Common\AI\Providers;

use Common\AI\Chat\AssistantMessage;
use Common\AI\Chat\UserMessage;
use OpenAI\Exceptions\ErrorException;
use Common\AI\Embeddings\EmbeddingsResponse;
use Common\AI\Exceptions\LlmException;
use Common\AI\Images\GenerateImageResponse;
use Common\AI\Providers\BaseProvider;
use Common\AI\Text\TextResponse;
use Common\AI\TokenUsage;
use Common\AI\Tools\BaseTool;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Prism\Prism\Enums\ChunkType;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Exceptions\PrismRateLimitedException;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Prism;
use Prism\Prism\Schema\BooleanSchema;
use Prism\Prism\Schema\NumberSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;
use Prism\Prism\Text\PendingRequest as PendingTextRequest;
use Prism\Prism\Embeddings\PendingRequest as PendingEmbeddingsRequest;
use Prism\Prism\Schema\ArraySchema;
use Prism\Prism\Structured\PendingRequest as PendingStructuredTextRequest;
use Prism\Prism\ValueObjects\Messages\UserMessage as PrismUserMessage;
use Prism\Prism\ValueObjects\Messages\AssistantMessage as PrismAssistantMessage;
use Prism\Prism\ValueObjects\ProviderRateLimit;

abstract class BasePrismProvider extends BaseProvider
{
    protected Provider $provider;
    protected string $defaultEmbeddingModel;

    abstract protected function getDefaultTextModel(): string;

    protected function modifyEmbeddingsRequest(
        PendingEmbeddingsRequest $request,
    ): void {}

    public function generateText(): TextResponse
    {
        try {
            $response = $this->params->schema
                ? $this->buildPrismStructuredTextRequest()->asStructured()
                : $this->buildPrismTextRequest()->asText();

            return new TextResponse(
                $response->text,
                null,
                new TokenUsage(
                    $response->usage->completionTokens +
                        $response->usage->promptTokens,
                    $response->usage->promptTokens,
                ),
            );
        } catch (ErrorException $e) {
            if ($e instanceof PrismRateLimitedException) {
                if (
                    Arr::first(
                        $e->rateLimits,
                        fn(
                            ProviderRateLimit $rate_limit,
                        ) => $rate_limit->remaining === 0,
                    )
                ) {
                    throw LlmException::quotaExceeded();
                }
            }

            throw LlmException::generic($e->getMessage());
        }
    }

    public function generateEmbeddings(
        string|Collection $input,
    ): EmbeddingsResponse {
        $request = Prism::embeddings()
            ->using(
                $this->provider,
                $this->params->model ?? $this->defaultEmbeddingModel,
            )
            ->fromArray(is_iterable($input) ? $input->toArray() : [$input]);

        $this->modifyEmbeddingsRequest($request);

        $response = $request->asEmbeddings();

        return new EmbeddingsResponse(
            embeddings: collect($response->embeddings)->map(
                fn($embedding) => $embedding->embedding,
            ),
            usage: new TokenUsage(totalTokens: $response->usage->tokens),
        );
    }

    public function generateImage(array $data): GenerateImageResponse
    {
        $response = Prism::image()
            ->using($this->provider, 'dall-e-3')
            ->withPrompt($this->params->systemPrompt)
            ->withProviderOptions([
                'n' => 1,
                'size' => $data['size'] ?? '1024x1024',
                'response_format' => 'url',
                'metadata' => [
                    'app_name' => config('app.name'),
                ],
            ])
            ->generate();

        $image = $response->firstImage();

        return new GenerateImageResponse(
            url: $image->url,
            size: $data['size'] ?? '1024x1024',
            revisedPrompt: $image->revisedPrompt,
            usage: new TokenUsage(
                $response->usage->promptTokens +
                    $response->usage->completionTokens,
                $response->usage->promptTokens,
            ),
        );
    }

    public function generateTextStream(): LazyCollection
    {
        $request = $this->buildPrismTextRequest();

        return new LazyCollection(function () use ($request) {
            foreach ($request->asStream() as $chunk) {
                if ($chunk->chunkType === ChunkType::Text && $chunk->text) {
                    yield $chunk->text;
                }
            }
        });
    }

    protected function buildPrismTextRequest(): PendingTextRequest
    {
        $request = Prism::text()
            ->using(
                $this->provider,
                $this->params->model ?? $this->getDefaultTextModel(),
            )
            ->withProviderOptions([
                'store' => true,
                'metadata' => [
                    'app_name' => config('app.name'),
                ],
            ]);

        $request = $this->setCommonParamsOnPrismRequest($request);

        if (!empty($this->params->tools)) {
            $prismTools = array_map(function (BaseTool $tool) {
                $prismTool = Tool::as($tool->name)->for($tool->description);

                foreach ($tool->params as $name => $param) {
                    $prismTool->withParameter(
                        $this->propertyConfigToSchema([
                            ...$param,
                            'name' => $name,
                        ]),
                        $param['required'] ?? true,
                    );
                }

                $prismTool->using(fn(...$args) => $tool->execute($args));

                return $prismTool;
            }, $this->params->tools->toArray());

            $request->withTools($prismTools);
        }

        return $request;
    }

    protected function buildPrismStructuredTextRequest(): PendingStructuredTextRequest
    {
        $request = Prism::structured()
            ->using(
                $this->provider,
                $this->params->model ?? $this->getDefaultTextModel(),
            )
            ->withProviderOptions([
                'store' => true,
                'metadata' => [
                    'app_name' => config('app.name'),
                ],
                'schema' => [
                    'strict' => true,
                ],
            ]);

        $request = $this->setCommonParamsOnPrismRequest($request);

        $propertySchema = [];
        foreach (
            $this->params->schema['schema']['properties']
            as $name => $property
        ) {
            $propertySchema[] = $this->propertyConfigToSchema([
                ...$property,
                'name' => $name,
            ]);
        }

        $prismSchema = new ObjectSchema(
            name: $this->params->schema['name'],
            description: $this->params->schema['description'],
            properties: $propertySchema,
            requiredFields: $this->params->schema['schema']['required'],
            allowAdditionalProperties: $this->params->schema['schema'][
                'additionalProperties'
            ] ?? false,
        );

        return $request->withSchema($prismSchema);
    }

    protected function propertyConfigToSchema(array $property)
    {
        $name = $property['name'];
        $description = $property['description'];
        $nullable =
            is_array($property['type']) &&
            collect($property['type'])->some(
                fn($type) => $type === 'null' || $type === null,
            );
        return match ($property['type']) {
            'string' => new StringSchema($name, $description, $nullable),
            'number' => new NumberSchema($name, $description, $nullable),
            'boolean' => new BooleanSchema($name, $description, $nullable),
            'array' => new ArraySchema(
                name: $name,
                description: $description,
                items: new StringSchema(
                    name: $property['items']['name'] ?? 'item',
                    description: $property['items']['description'] ?? '',
                ),
                nullable: $nullable,
            ),
        };
    }

    protected function setCommonParamsOnPrismRequest(
        PendingStructuredTextRequest|PendingTextRequest $request,
    ) {
        if ($this->params->systemPrompt) {
            $request->withSystemPrompt($this->params->systemPrompt);
        }

        $messages = $this->params->messages->toArray();
        if (!empty($messages)) {
            $prismMessages = array_map(
                fn($message) => match ($message::class) {
                    UserMessage::class => new PrismUserMessage(
                        $message->content,
                    ),
                    AssistantMessage::class => new PrismAssistantMessage(
                        $message->content,
                    ),
                },
                $messages,
            );
            $request->withMessages($prismMessages);
        }

        if ($this->params->temperature) {
            $request->usingTemperature($this->params->temperature);
        }

        if ($this->params->maxTokens) {
            $request->withMaxTokens($this->params->maxTokens);
        }

        if (
            $this->params->maxSteps &&
            method_exists($request, 'withMaxSteps')
        ) {
            $request->withMaxSteps($this->params->maxSteps);
        }

        return $request;
    }
}
