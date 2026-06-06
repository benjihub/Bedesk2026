<?php namespace Envato\SocialiteProviders;

use Envato\EnvatoApiClient;
use Illuminate\Support\Collection;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

class EnvatoProvider extends AbstractProvider implements ProviderInterface
{
    /**
     * {@inheritdoc}
     */
    protected $scopeSeparator = ' ';

    /**
     * {@inheritdoc}
     */
    protected $scopes = [
        'user:account',
        'user:username',
        'user:email',
        'purchase:history',
        'purchase:verify',
    ];

    /**
     * {@inheritdoc}
     */
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase(
            'https://api.envato.com/authorization',
            $state,
        );
    }

    /**
     * {@inheritdoc}
     */
    protected function getTokenUrl()
    {
        return 'https://api.envato.com/token';
    }

    /**
     * {@inheritdoc}
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get(
            'https://api.envato.com/v1/market/private/user/account.json',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
            ],
        );
        $response = json_decode($response->getBody()->getContents(), true)[
            'account'
        ];

        $response['email'] = $this->getEmailByToken($token);
        $response['username'] = $this->getUsernameByToken($token);
        $response['purchases'] = $this->getPurchasesByToken($token);

        return $response;
    }

    /**
     *  Get the account email of the current user.
     *
     * @param string $token
     *
     * @return string
     */
    protected function getEmailByToken($token)
    {
        $response = $this->getHttpClient()->get(
            'https://api.envato.com/v1/market/private/user/email.json',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
            ],
        );
        return json_decode($response->getBody()->getContents(), true)['email'];
    }

    /**
     *  Get the account username of the current user.
     *
     * @param string $token
     *
     * @return string
     */
    protected function getUsernameByToken($token)
    {
        $response = $this->getHttpClient()->get(
            'https://api.envato.com/v1/market/private/user/username.json',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
            ],
        );
        return json_decode(
            $response->getBody()->getContents(),
            true,
        )['username'];
    }

    protected function getPurchasesByToken(string $token): Collection
    {
        return (new EnvatoApiClient())->getBuyerPurchasesByToken($token);
    }

    /**
     * {@inheritdoc}
     */
    protected function getTokenFields($code)
    {
        return array_merge(parent::getTokenFields($code), [
            'grant_type' => 'authorization_code',
        ]);
    }

    /**
     * {@inheritdoc}
     */
    protected function mapUserToObject(array $user)
    {
        return (new User())->setRaw($user)->map([
            'id' => null,
            'nickname' => $user['username'],
            'name' => $user['firstname'] . ' ' . $user['surname'],
            'email' => $user['email'],
            'avatar' => $this->transformImageUrl($user['image']),
            'purchases' => $user['purchases'],
        ]);
    }

    /**
     * Replace :// with https:// as the former will cause issues.
     *
     * @param string $url
     * @return string
     */
    private function transformImageUrl($url)
    {
        return preg_replace('/^\/\//', 'https://', $url);
    }
}
