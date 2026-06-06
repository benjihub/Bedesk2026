<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        $models = [
            'App\\BuilderPage',
            'App\\Project',
            'App\\ProjectSetting',
            'App\\Models\\Album',
            'App\\Models\\Artist',
            'App\\Models\\ArtistBio',
            'App\\Models\\BackstageRequest',
            'App\\Models\\Channel',
            'App\\Models\\Genre',
            'App\\Models\\Like',
            'App\\Models\\Lyric',
            'App\\Models\\Playlist',
            'App\\Models\\ProfileImage',
            'App\\Models\\ProfileLink',
            'App\\Models\\Repost',
            'App\\Models\\Tag',
            'App\\Models\\Track',
            'App\\Models\\TrackPlay',
            'App\\Models\\User',
            'App\\Models\\UserProfile',
            'App\\Models\\Action',
            'modules\\helpdesk\\src\\Models\\Activity',
            'Common\\HelpCenter\\Models\\HcArticle',
            'Common\\HelpCenter\\Models\\HcArticleFeedback',
            'App\\Models\\ArticleRole',
            'App\\Models\\CannedReply',
            'Common\\HelpCenter\\Models\\HcCategory',
            'App\\Models\\Condition',
            'App\\Models\\Email',
            'App\\Models\\Operator',
            'App\\Models\\PurchaseCode',
            'App\\Models\\Reply',
            'modules\\helpdesk\\src\\Models\\SearchTerm',
            'App\\Models\\Tag',
            'App\\Models\\Ticket',
            'modules\\helpdesk\\src\\Models\\Trigger',
            'App\\Contacts\\Models\\UserDetails',
            'App\\Models\\Biolink',
            'App\\Models\\BiolinkAppearance',
            'App\\Models\\BiolinkLink',
            'App\\Models\\BiolinkPivot',
            'App\\Models\\BiolinkWidget',
            'App\\Models\\Link',
            'App\\Models\\LinkDomain',
            'App\\Models\\LinkGroup',
            'App\\Models\\LinkImage',
            'App\\Models\\LinkOverlay',
            'App\\Models\\LinkPage',
            'App\\Models\\LinkeableClick',
            'App\\Models\\LinkeableRule',
            'App\\Models\\TrackingPixel',
            'App\\Models\\FcmToken',
            'App\\Models\\File',
            'App\\Models\\FileEntry',
            'App\\Models\\Folder',
            'App\\Models\\RootFolder',
            'App\\Models\\ShareableLink',
            'App\\Auth\\Models\\User',
            'App\\Models\\Channel',
            'App\\Models\\Episode',
            'App\\Models\\Genre',
            'App\\Models\\Image',
            'App\\Models\\Keyword',
            'App\\Models\\Listable',
            'App\\Models\\Movie',
            'App\\Models\\NewsArticle',
            'App\\Models\\Person',
            'App\\Models\\ProductionCountry',
            'App\\Models\\ProfileLink',
            'App\\Models\\Review',
            'App\\Models\\ReviewFeedback',
            'App\\Models\\ReviewReport',
            'App\\Models\\Season',
            'App\\Models\\Series',
            'App\\Models\\Title',
            'App\\Models\\UserProfile',
            'App\\Models\\Video',
            'App\\Models\\VideoCaption',
            'App\\Models\\VideoPlay',
            'App\\Models\\VideoReport',
            'App\\Models\\VideoVote',
            'common\\Foundation\\Admin\\Appearance\\Themes\\CssTheme',
            'common\\Foundation\\Auth\\UserSession',
            'common\\Foundation\\Auth\\Ban',
            'common\\Foundation\\Auth\\Permissions\\Permission',
            'common\\Foundation\\Auth\\Roles\\Role',
            'common\\Foundation\\Auth\\SocialProfile',
            'common\\Foundation\\Billing\\Invoices\\Invoice',
            'common\\Foundation\\Billing\\Models\\Price',
            'common\\Foundation\\Billing\\Models\\Product',
            'common\\Foundation\\Billing\\Subscription',
            'common\\Foundation\\Comments\\Comment',
            'common\\Foundation\\Comments\\CommentReport',
            'common\\Foundation\\Comments\\CommentVote',
            'common\\Foundation\\Csv\\CsvExport',
            'common\\Foundation\\Domains\\CustomDomain',
            'common\\Foundation\\Files\\FileEntry',
            'common\\Foundation\\Files\\FileEntryPivot',
            'common\\Foundation\\Files\\FileEntryUser',
            'common\\Foundation\\Localizations\\Localization',
            'common\\Foundation\\Notifications\\NotificationSubscription',
            'common\\Foundation\\Pages\\CustomPage',
            'common\\Foundation\\Settings\\Setting',
            'common\\Foundation\\Tags\\Tag',
            'common\\Foundation\\Votes\\Vote',
        ];

        $tables = [
            'permissionables' => 'permissionable_type',
            'comments' => 'commentable_type',
            'custom_domains' => 'resource_type',
            'file_entry_models' => 'model_type',
            'taggables' => 'taggable_type',
            'link_clicks' => 'linkeable_type',
            'linkeable_rules' => 'linkeable_type',
            'channelables' => 'channelable_type',
            'creditables' => 'creditable_type',
            'listables' => 'listable_type',
            'genreables' => 'genreable_type',
            'activity_log' => 'subject_type',
            'bans' => ['bannable_type', 'created_by_type'],
            'images' => 'model_type',
            'news_article_models' => 'model_type',
            'notifications' => 'notifiable_type',
            'personal_access_tokens' => 'tokenable_type',
            'profile_links' => 'linkeable_type',
            'reviews' => 'reviewable_type',
            'likes' => 'likeable_type',
            'reposts' => 'repostable_type',
        ];

        foreach ($tables as $table => $_column) {
            if (Schema::hasTable($table)) {
                $columns = is_array($_column) ? $_column : [$_column];
                foreach ($columns as $column) {
                    foreach ($models as $model) {
                        try {
                            $constant_reflex = new ReflectionClassConstant(
                                $model,
                                'MODEL_TYPE',
                            );
                            $modelType = $constant_reflex->getValue();
                        } catch (ReflectionException $e) {
                            $modelType = null;
                        }

                        $model = trim($model, '\\');

                        if ($modelType) {
                            $base = DB::table($table)->where(function (
                                $builder,
                            ) use ($column, $model) {
                                $builder
                                    ->where($column, $model)
                                    ->orWhere(
                                        $column,
                                        str_replace(
                                            'App\Models',
                                            'App',
                                            $model,
                                        ),
                                    );
                            });

                            $hasId =
                                Schema::hasColumn($table, 'id') &&
                                $table !== 'notifications';
                            $lastId = $hasId ? $base->clone()->max('id') : null;

                            if (ctype_digit($lastId)) {
                                $lastId = (int) $lastId;
                            } else {
                                $lastId = 10000;
                            }

                            // update 10000 rows at a time
                            for ($i = 0; $i < $lastId; $i += 10000) {
                                $base
                                    ->clone()
                                    ->when($hasId, function ($builder) use (
                                        $i,
                                    ) {
                                        $builder
                                            ->where('id', '>', $i)
                                            ->where('id', '<=', $i + 10000);
                                    })
                                    ->update([$column => $modelType]);
                            }
                        }
                    }
                }
            }
        }
    }

    public function down() {}
};
