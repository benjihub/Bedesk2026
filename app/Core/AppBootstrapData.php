<?php namespace App\Core;

use Common\Core\Bootstrap\BaseBootstrapData;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;

class AppBootstrapData extends BaseBootstrapData
{
    public function init(): self
    {
        parent::init();

        if (!$this->data['user']?->isAgent()) {
            $this->data['settings']['notif']['subs']['integrated'] = false;
        }

        $this->data['settings']['websockets_setup'] = !in_array(
            config('broadcasting.default'),
            ['null', 'log'],
        );

        $this->data['settings']['modules'] = [];
        foreach (config('modules') as $name => $module) {
            $this->data['settings']['modules'][$name] = [
                'installed' => $module['installed'] ?? false,
                'setup' => $module['setup'] ?? false,
            ];
        }

        // not used in main app, only in chat widget
        unset($this->data['settings']['chatWidget']);
        $this->data['settings']['aiAgent'] = [
            'enabled' => $this->data['settings']['aiAgent']['enabled'] ?? false,
            'name' =>
                $this->data['settings']['aiAgent']['name'] ?? 'AI assistant',
            'image' => $this->data['settings']['aiAgent']['image'] ?? null,
        ];

        // only used in customer new ticket page
        unset($this->data['settings']['hc.newTicket']);

        // if auto loading livechat widget on help center, include hashed customer data
        if (settings('hc.showLivechat') && Auth::check()) {
            $this->data['livechatWidgetUser'] = [
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
                'email_hash' => hash_hmac(
                    'sha256',
                    Auth::user()->email,
                    settings('app.widget_hmac_secret'),
                ),
            ];
        }

        return $this;
    }

    protected function getAuthRedirectUri(): string
    {
        if ($this->data['user']) {
            return $this->data['user']->isAgent()
                ? '/dashboard/conversations?viewId=all'
                : '/';
        }

        return '/';
    }

    protected function getDefaultMetaTags(): string
    {
        $pageName = 'hc-landing-page';
        if (View::exists("editable-views::seo-tags.$pageName")) {
            return view("editable-views::seo-tags.$pageName")->render();
        } else {
            return view("seo.$pageName.seo-tags")->render();
        }
    }
}
