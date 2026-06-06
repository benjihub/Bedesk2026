<?php namespace Envato;

use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class EnvatoApiClient
{
    public function getBuyerPurchases(int $userId): ?Collection
    {
        $user = User::with('social_profiles')->find($userId);
        $profile = $user->social_profiles
            ->where('service_name', 'envato')
            ->first();

        if (!$profile) {
            return null;
        }

        if (
            !$profile->access_expires_at ||
            $profile->access_expires_at->lessThan(now())
        ) {
            $r = Http::post('https://api.envato.com/token', [
                'grant_type' => 'refresh_token',
                'client_id' => config('services.envato.client_id'),
                'client_secret' => config('services.envato.client_secret'),
                'refresh_token' => $profile->refresh_token,
            ]);

            if (!$r->successful()) {
                return null;
            }

            $profile
                ->fill([
                    'access_token' => $r['access_token'],
                    'access_expires_in' => now()->addSeconds($r['expires_in']),
                ])
                ->save();
        }

        return $this->getBuyerPurchasesByToken($profile->access_token);
    }

    public function getBuyerPurchasesByToken(string $token): Collection
    {
        $r = $this->call('buyer/purchases', [], 'v3', $token);
        return collect($r['purchases'])
            ->filter(
                fn(
                    array $purchase, // skip support extensions
                ) => !is_null($purchase['license']),
            )
            ->map(
                fn(array $purchase) => $this->transformPurchaseData(
                    $purchase,
                    $r['buyer']['username'],
                ),
            );
    }

    public function getPurchaseByCode(string $code): ?array
    {
        if (!$code) {
            return null;
        }

        return cache()->remember(
            "purchase.$code",
            now()->addMinutes(10),
            function () use ($code) {
                try {
                    $response = $this->call('author/sale', ['code' => $code]);
                } catch (Exception $e) {
                    return null;
                }

                if (!isset($response['item'])) {
                    return null;
                }

                $data = $this->transformPurchaseData(
                    $response->json(),
                    code: $code,
                );
                $data['code'] = $code;
                return $data;
            },
        );
    }

    public function getAuthorItems(): array
    {
        $response = $this->call('market/private/user/username.json', [], 'v1');
        $response = $this->call(
            'discovery/search/search/item',
            ['username' => $response['username']],
            'v1',
        );

        return array_map(
            fn($item) => [
                'name' => $item['name'],
                'id' => $item['id'],
                'image' =>
                    $item['previews']['icon_with_landscape_preview'][
                        'icon_url'
                    ] ?? null,
            ],
            $response['matches'],
        );
    }

    public function call(
        string $uri,
        array $params = [],
        string $version = 'v3',
        ?string $token = null,
    ): Response {
        if ($version === 'v3') {
            $base = 'https://api.envato.com/v3/market/';
        } else {
            $base = 'https://api.envato.com/v1/';
        }

        $token ??= config('services.envato.personal_token');
        return Http::throw()
            ->withToken($token)
            ->get("{$base}{$uri}", $params);
    }

    protected function transformPurchaseData(
        array $data,
        string|null $envatoUsername = null,
        string|null $code = null,
    ): array {
        return [
            'item_name' => $data['item']['name'],
            'item_id' => $data['item']['id'],
            'code' => $code ?? $data['code'],
            'purchased_at' => Arr::get($data, 'sold_at')
                ? Carbon::parse(Arr::get($data, 'sold_at'))
                : null,
            'supported_until' => $this->getSupportedUntilDate($data),
            'url' => Arr::get($data, 'item.url'),
            'image' => Arr::get($data, 'item.previews.icon_preview.icon_url'),
            'envato_username' => $envatoUsername ?? Arr::get($data, 'buyer'),
        ];
    }

    protected function getSupportedUntilDate(array $data): ?Carbon
    {
        if ($date = Arr::get($data, 'supported_until')) {
            return Carbon::parse($date);
        }

        // adding 30 days temporarily for mobile app category as it's not supported by default on codecanyon
        if (
            Str::startsWith(
                Arr::get($data, 'item.classification') ?? '',
                'mobile',
            )
        ) {
            return now()->addDays(30);
        }
        return null;
    }
}
