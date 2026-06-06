<?php

namespace Common\AI\Providers;

use Common\AI\Embeddings\EmbeddingsResponse;
use Common\AI\Images\GenerateImageResponse;
use Common\AI\Text\TextResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;

abstract class BaseProvider
{
    protected ProviderParams $params;

    public function __construct(ProviderParams|null $params = null)
    {
        $this->params = $params ?? new ProviderParams();
    }

    public function configure(): ProviderParams
    {
        return $this->params;
    }

    public function setParams(ProviderParams $params): static
    {
        $this->params = $params;
        return $this;
    }

    abstract public function generateEmbeddings(
        string|Collection $input,
    ): EmbeddingsResponse;

    abstract public function generateText(): TextResponse;

    abstract public function generateTextStream(): LazyCollection;

    abstract public function generateImage(array $data): GenerateImageResponse;
}
