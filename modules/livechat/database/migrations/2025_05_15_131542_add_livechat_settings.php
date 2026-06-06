<?php

use App\Models\User;
use Common\Settings\Models\Setting;
use Common\Settings\Themes\CssTheme;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        $this->insertMenuItems();
        $this->insertDefaultSettings();
        $this->isertWidgetThemes();
    }

    protected function insertMenuItems()
    {
        $menus = Setting::where('name', 'menus')->first()->value ?? [];

        foreach ($menus as &$menu) {
            if (in_array('dashboard-sidebar', $menu['positions'])) {
                array_splice($menu['items'], 3, 0, [
                    [
                        'label' => 'Campaigns',
                        'action' => '/dashboard/campaigns',
                        'type' => 'route',
                        'id' => 'mwdkzv',
                        'permissions' => ['campaigns.update'],
                    ],
                ]);
            }

            if (in_array('admin-sidebar', $menu['positions'])) {
                array_splice($menu['items'], 7, 0, [
                    [
                        'label' => 'Campaigns',
                        'action' => '/admin/campaigns',
                        'type' => 'route',
                        'id' => 'fufr42',
                        'permissions' => ['campaigns.update'],
                    ],
                ]);
            }
        }

        Setting::where('name', 'menus')->update(['value' => $menus]);
    }

    protected function insertDefaultSettings()
    {
        $settings = [
            'chatWidget' => json_encode([
                'hide' => false,
                'logo_light' => 'images/logo-light-mobile.png',
                'logo_dark' => 'images/logo-dark-mobile.png',
                'showAvatars' => true,
                'background' => [
                    'type' => 'color',
                    'id' => 'c1',
                    'backgroundColor' => 'rgb(239,245,245)',
                ],
                'fadeBg' => true,
                'showHcCard' => true,
                'hideHomeArticles' => false,
                'greeting' => 'Hi :name 👋',
                'greetingAnonymous' => 'Hi there 👋',
                'introduction' => 'How can we help?',
                'homeNewChatTitle' => 'Let\'s Chat',
                'homeNewChatSubtitle' => 'We’ll reply as soon as we can',
                'homeShowTickets' => false,
                'homeNewTicketTitle' => 'New ticket',
                'homeNewTicketSubtitle' => '',
                'position' => 'right',
                'spacing' => [
                    'side' => '16',
                    'bottom' => '16',
                ],
                'defaultTheme' => 'light',
                'inheritThemes' => true,
                'defaultScreen' => '/',
                'hideNavigation' => false,
                'screens' => ['/', 'conversations', 'hc'],
                'forms' => [
                    'preChat' => [
                        'disabled' => true,
                        'attributes' => [1, 2, 3],
                        'information' =>
                            'Please fill out this form before starting a chat',
                    ],
                    'postChat' => [
                        'disabled' => true,
                        'attributes' => [5],
                        'information' => 'How was your chat?',
                    ],
                ],
                'defaultMessage' => 'Hello! How can I help you today?',
                'inputPlaceholder' => 'Enter your message here...',
                'agentsAwayMessage' =>
                    "Our agents are not available right now, but you can still send messages. We'll notify you here and at your email address when you get a reply.",
                'inQueueMessage' =>
                    'One of our agents will be with you shortly. You are number :number in the queue. Your wait time will be approximately :minutes minute(s). Thank you for your patience.',
            ]),
            'chatPage' => json_encode([
                'title' => 'Hello! 👋',
                'subtitle' => 'Welcome to our chat page.
We are here to answer all your questions.',
            ]),
            'lc.timeout.agent' => 5,
            'lc.timeout.inactive' => 10,
            'lc.timeout.archive' => 15,
        ];

        foreach ($settings as $name => $value) {
            if (!Setting::where('name', $name)->exists()) {
                Setting::create([
                    'name' => $name,
                    'value' => $value,
                ]);
            }
        }
    }

    protected function isertWidgetThemes()
    {
        $admin = User::findAdmin();
        $darkValues = config('themes.dark');
        $lightValues = config('themes.light');

        if (CssTheme::where('type', 'chatWidget')->count() > 0) {
            return;
        }

        CssTheme::create([
            'name' => 'Widget light',
            'type' => 'chatWidget',
            'is_dark' => false,
            'default_light' => true,
            'values' => $lightValues,
            'user_id' => $admin ? $admin->id : 1,
        ]);

        CssTheme::create([
            'name' => 'Widget dark',
            'type' => 'chatWidget',
            'is_dark' => true,
            'default_dark' => true,
            'values' => $darkValues,
            'user_id' => $admin ? $admin->id : 1,
        ]);
    }
};
