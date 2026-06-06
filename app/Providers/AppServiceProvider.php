<?php namespace App\Providers;

use App\Attributes\Models\CustomAttribute;
use App\Attributes\Policies\AttributePolicy;
use App\CannedReplies\Models\CannedReply;
use App\CannedReplies\Policies\CannedReplyPolicy;
use App\Contacts\Models\PageVisit;
use App\Conversations\Commands\DeleteTestConversationsCommand;
use App\Conversations\Email\Commands\ImportEmailsViaImap;
use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Events\ConversationTyping;
use App\Conversations\Events\ConversationsAssignedToAgent;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Listeners\LogTicketCreated;
use App\Conversations\Listeners\LogTicketFirstReply;
use App\Conversations\Listeners\LogTicketMilestonesFromConversationUpdate;
use App\Conversations\Listeners\QueueDrainOnConversationClosed;
use App\Conversations\Listeners\QueueDrainOnReassignment;
use App\Conversations\Listeners\SendReplyCreatedNotif;
use App\Conversations\Listeners\SendTicketsAssignedNotif;
use App\Events\TelegramUpdateReceived;
use App\Features\Telegram\Listeners\HandleTelegramUpdate;
use App\Features\Telegram\Listeners\SendMessageToTelegram;
use App\Features\Telegram\Listeners\SendTypingToTelegram;
use App\Features\Line\Domain\Events\IncomingMessageReceived as LineIncomingMessageReceived;
use App\Features\Line\Listeners\HandleLineUpdate;
use App\Features\Line\Listeners\SendMessageToLine;
use App\Features\Line\Listeners\SendTypingToLine;
use App\Features\Whatsapp\Domain\Events\IncomingMessageReceived as WhatsappIncomingMessageReceived;
use App\Features\Whatsapp\Listeners\HandleWhatsappUpdate;
use App\Features\Whatsapp\Listeners\SendMessageToWhatsapp;
use App\Features\Whatsapp\Listeners\SendTypingToWhatsapp;
use App\Conversations\Models\Conversation;
use App\Conversations\Policies\ConversationFileEntryPolicy;
use App\Conversations\Policies\ConversationPolicy;
use App\Core\AppBootstrapData;
use App\Core\Commands\ResetDemoSiteCommand;
use App\Core\Listeners\DeleteUserRelations;
use App\Core\Modules;
use App\Core\UrlGenerator;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\HelpCenter\Models\SearchTerm;
use App\HelpCenter\Policies\HcArticlePolicy;
use App\Reports\Actions\GetAnalyticsHeaderData;
use App\Reports\Policies\HelpdeskReportPolicy;
use App\Team\Models\AgentInvite;
use App\Team\Models\Group;
use App\Team\Policies\GroupPolicy;
use App\Triggers\Models\Trigger;
use App\Triggers\Policies\TriggerPolicy;
use App\Triggers\TriggersCycle;
use Ai\AiAgent\Models\AiAgentSession;
use Common\Admin\Analytics\Actions\GetAnalyticsHeaderDataAction;
use Common\Auth\Events\UserCreated;
use Common\Auth\Events\UsersDeleted;
use Common\Core\Bootstrap\BootstrapData;
use Common\Core\Contracts\AppUrlGenerator;
use Common\Tags\TaggableController;
use Common\Websockets\API\WebsocketAPI;
use Illuminate\Console\Events\ArtisanStarting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->app->bind(BootstrapData::class, AppBootstrapData::class);

        // Policies
        Gate::policy(HcArticle::class, HcArticlePolicy::class);
        Gate::policy(HcCategory::class, HcArticlePolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(CustomAttribute::class, AttributePolicy::class);
        Gate::policy(CannedReply::class, CannedReplyPolicy::class);
        Gate::policy('ReportPolicy', HelpdeskReportPolicy::class);
        Gate::policy(Group::class, GroupPolicy::class);
        Gate::policy(Trigger::class, TriggerPolicy::class);
        Gate::policy(
            'conversationFileEntry',
            ConversationFileEntryPolicy::class,
        );

        Relation::enforceMorphMap([
            Conversation::MODEL_TYPE => Conversation::class,
            SearchTerm::MODEL_TYPE => SearchTerm::class,
            HcArticle::MODEL_TYPE => HcArticle::class,
            HcCategory::MODEL_TYPE => HcCategory::class,
            Group::MODEL_TYPE => Group::class,
            AgentInvite::MODEL_TYPE => AgentInvite::class,
            PageVisit::MODEL_TYPE => PageVisit::class,
        ]);

        $this->scheduleCommands();
        $this->registerEvents();

        // Create only one websocket API instance so API requests are made only once per request
        $this->app->singleton(WebsocketAPI::class, function (
            Application $app,
            array $options = [],
        ) {
            return new WebsocketAPI($options ?? []);
        });

        Modules::boot($this->app);

        // Log 403 responses with request context to make debugging easier
        Event::listen(RequestHandled::class, function (RequestHandled $e) {
            try {
                $status = $e->response->getStatusCode();
                if ($status === 403) {
                    \Illuminate\Support\Facades\Log::warning('Forbidden API response detected', [
                        'method' => $e->request->method(),
                        'url' => $e->request->fullUrl(),
                        'ip' => $e->request->ip(),
                        'user_id' => auth()->id(),
                        'route' => optional($e->request->route())?->getName(),
                        'params' => $e->request->except(['password','password_confirmation']),
                        'status' => $status,
                    ]);
                }
            } catch (\Throwable $_) {
                // best-effort only
            }
        });
    }

    public function register(): void
    {
        $this->app->bind(AppUrlGenerator::class, UrlGenerator::class);

        $this->app->bind(
            GetAnalyticsHeaderDataAction::class,
            GetAnalyticsHeaderData::class,
        );

        Modules::register($this->app);
    }

    protected function scheduleCommands(): void
    {
        $this->commands([
            ResetDemoSiteCommand::class,
            ImportEmailsViaImap::class,
            DeleteTestConversationsCommand::class,
        ]);

        $this->app->booted(function () {
            if (!$this->app->runningInConsole()) {
                return;
            }

            $schedule = $this->app->make(Schedule::class);

            // triggers
            $schedule
                ->call(function () {
                    (new TriggersCycle())->executeTimeBasedTriggers();
                })
                ->name('triggers:runTimeBased')
                ->hourly()
                ->withoutOverlapping(60);
        });
    }

    protected function registerEvents(): void
    {
        // User events
        Event::listen(UsersDeleted::class, DeleteUserRelations::class);
        Event::listen(UserCreated::class, function (UserCreated $e) {
            if ($e->user->isAgent()) {
                Group::findDefault()
                    ?->users()
                    ->syncWithoutDetaching([
                        $e->user->id => [
                            'created_at' => now(),
                        ],
                    ]);
            }
        });
        Event::listen(UsersDeleted::class, function (UsersDeleted $e) {
            foreach ($e->users as $user) {
                Group::findDefault()?->users()->detach($user);
            }
        });

        // Conversation events
        Event::listen(
            ConversationsAssignedToAgent::class,
            SendTicketsAssignedNotif::class,
        );
        Event::listen(
            ConversationsAssignedToAgent::class,
            QueueDrainOnReassignment::class,
        );
        Event::listen(
            ConversationsUpdated::class,
            QueueDrainOnConversationClosed::class,
        );
        Event::listen(
            ConversationsUpdated::class,
            LogTicketMilestonesFromConversationUpdate::class,
        );
        Event::listen(ConversationCreated::class, LogTicketCreated::class);
        Event::listen(
            ConversationMessageCreated::class,
            SendReplyCreatedNotif::class,
        );
        Event::listen(
            ConversationMessageCreated::class,
            LogTicketFirstReply::class,
        );
        // Bank proof extraction on image messages
        Event::listen(
            ConversationMessageCreated::class,
            \App\Conversations\Listeners\ProcessBankProofImage::class,
        );
        // Send messages back to Telegram
        Event::listen(
            ConversationMessageCreated::class,
            SendMessageToTelegram::class,
        );
        Event::listen(ConversationTyping::class, SendTypingToTelegram::class);
        // Handle WhatsApp incoming messages
        Event::listen(
            WhatsappIncomingMessageReceived::class,
            HandleWhatsappUpdate::class,
        );
        // Send messages back to WhatsApp
        Event::listen(
            ConversationMessageCreated::class,
            SendMessageToWhatsapp::class,
        );
        Event::listen(ConversationTyping::class, SendTypingToWhatsapp::class);
        Event::listen(ConversationsUpdated::class, function (
            ConversationsUpdated $e,
        ) {
            // make sure "ConversationsUpdated" events fired by the cycle do not trigger another cycle,
            // if conversation is updated during the cycle, it will handle restarting itself
            if (TriggersCycle::$isRunning) {
                return false;
            }

            $cycle = new TriggersCycle();
            foreach ($e->conversationsAfterUpdate as $conversation) {
                if (
                    $conversation->assigned_to === Conversation::ASSIGNED_AGENT
                ) {
                    try {
                        $cycle->runAgainstConversation(
                            $conversation,
                            $e->conversationsDataBeforeUpdate[$conversation->id] ?? [],
                        );
                    } catch (\Throwable $err) {
                        \Illuminate\Support\Facades\Log::error('TriggersCycle failed for conversation update', [
                            'conversation_id' => $conversation->id,
                            'group_id' => $conversation->group_id,
                            'assignee_id' => $conversation->assignee_id,
                            'error' => $err->getMessage(),
                        ]);
                    }
                }

                // If conversation was handed off to support and is now closed,
                // clear the handoff context, but do NOT auto-restore bot assignment.
                // Pause/resume of AI should be a manual decision.
                try {
                    if (
                        $conversation->status_category <=
                            Conversation::STATUS_CLOSED &&
                        $conversation->assigned_to ===
                            Conversation::ASSIGNED_AGENT
                    ) {
                        $session = $conversation
                            ->aiAgentSession()
                            ->first();
                        $context = is_array($session?->context ?? null)
                            ? $session->context
                            : [];
                        if (!empty($context['support_handoff_active'])) {
                            if ($session) {
                                $context['support_handoff_active'] = false;
                                $context['support_handoff_resolved_at'] =
                                    now()->toISOString();
                                $session->context = $context;
                                $session->save();
                            }
                        }
                    }
                } catch (\Throwable $ignore) {
                    // best-effort only
                }
            }
        });
        Event::listen(ConversationCreated::class, function (
            ConversationCreated $e,
        ) {
            // Log when new conversations are created so we can trace who/what created them.
            try {
                \Illuminate\Support\Facades\Log::info('ConversationCreated event', [
                    'conversation_id' => $e->conversation->id,
                    'assigned_to' => $e->conversation->assigned_to,
                    'assignee_id' => $e->conversation->assignee_id,
                    'group_id' => $e->conversation->group_id,
                    'type' => $e->conversation->type,
                    'user_id' => $e->conversation->user_id,
                    'request_user_id' => auth()->id(),
                    'auth_guard' => config('auth.defaults.guard'),
                    'stack' => collect(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 6))->map(fn($f) => ($f['function'] ?? null) . '@' . ($f['file'] ?? ''))->toArray(),
                ]);
            } catch (\Throwable $_) {
                // best-effort only
            }

            if (
                $e->conversation->assigned_to === Conversation::ASSIGNED_AGENT
            ) {
                try {
                    (new TriggersCycle())->runAgainstConversation($e->conversation);
                } catch (\Throwable $err) {
                    \Illuminate\Support\Facades\Log::error('TriggersCycle failed for conversation create', [
                        'conversation_id' => $e->conversation->id,
                        'group_id' => $e->conversation->group_id,
                        'assignee_id' => $e->conversation->assignee_id,
                        'error' => $err->getMessage(),
                    ]);
                }
            }
        });

        // Telegram incoming updates: create a conversation/message for testing.
        Event::listen(TelegramUpdateReceived::class, HandleTelegramUpdate::class);

        // LINE incoming messages -> create conversation/message
        Event::listen(LineIncomingMessageReceived::class, HandleLineUpdate::class);

        // Send outgoing agent messages to LINE
        Event::listen(ConversationMessageCreated::class, SendMessageToLine::class);
        Event::listen(ConversationTyping::class, SendTypingToLine::class);

        $this->handleTaggableEvents();
        $this->handleConversationUpdatedCommand();

        // telescope
        if (
            $this->app->environment('local') &&
            config('telescope.enabled', false) &&
            class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)
        ) {
            $this->app->register(
                \Laravel\Telescope\TelescopeServiceProvider::class,
            );
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    /**
     * TaggableController will not fire ConversationsUpdated event, need to do it manually here.
     */
    protected function handleTaggableEvents(): void
    {
        $tagEvent = null;
        TaggableController::$beforeTagChangeCallbacks[] = function (
            Collection $taggables,
        ) use (&$tagEvent) {
            if (
                $taggables->every(
                    fn($t) => $t->model_type === 'chat' ||
                        $t->model_type === 'ticket',
                )
            ) {
                $tagEvent = new ConversationsUpdated($taggables);
            }
        };
        TaggableController::$afterTagChangeCallbacks[] = function (
            Collection $taggables,
        ) use (&$tagEvent) {
            if ($tagEvent) {
                $tagEvent->dispatch($taggables);
            }
        };
    }

    /**
     * Broadcast only one ConversationsUpdated event before app terminates.
     */
    protected function handleConversationUpdatedCommand(): void
    {
        if ($this->app->runningInConsole()) {
            Event::listen(ArtisanStarting::class, function (
                ArtisanStarting $e,
            ) {
                $kernel = app(Kernel::class);

                if (method_exists($kernel, 'whenCommandLifecycleIsLongerThan')) {
                    $kernel->whenCommandLifecycleIsLongerThan(
                        0,
                        function () {
                            ConversationsUpdated::broadcastLatest();
                        },
                    );
                } else {
                    register_shutdown_function(function () {
                        ConversationsUpdated::broadcastLatest();
                    });
                }
            });
        } else {
            Event::listen(RequestHandled::class, function (RequestHandled $e) {
                ConversationsUpdated::broadcastLatest();
            });
        }
    }
}
