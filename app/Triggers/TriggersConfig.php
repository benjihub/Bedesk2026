<?php

namespace App\Triggers;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\ConversationStatus;
use App\Core\Modules;
use App\Models\User;
use App\Team\Models\Group;
use Common\Core\Values\ValueLists;

class TriggersConfig
{
    protected static array $operators = [
        'contains' => [
            'label' => 'Contains',
            'type' => 'primitive',
        ],
        'not_contains' => [
            'label' => 'Does not contain',
            'type' => 'primitive',
        ],
        'starts_with' => [
            'label' => 'Starts with',
            'type' => 'primitive',
        ],
        'ends_with' => [
            'label' => 'Ends with',
            'type' => 'primitive',
        ],
        'equals' => [
            'label' => 'Equals',
            'type' => 'primitive',
        ],
        'not_equals' => [
            'label' => 'Does not equal',
            'type' => 'primitive',
        ],
        'matches_regex' => [
            'label' => 'Matches regex pattern',
            'type' => 'primitive',
        ],
        'more' => [
            'label' => 'More than',
            'type' => 'primitive',
        ],
        'less' => [
            'label' => 'Less than',
            'type' => 'primitive',
        ],
        'is' => [
            'label' => 'Is',
            'type' => 'primitive',
        ],
        'not' => [
            'label' => 'Is not',
            'type' => 'primitive',
        ],
        'changed' => [
            'label' => 'Changed',
            'type' => 'mixed',
        ],
        'changed_to' => [
            'label' => 'Changed to',
            'type' => 'mixed',
        ],
        'changed_from' => [
            'label' => 'Changed from',
            'type' => 'mixed',
        ],
        'not_changed' => [
            'label' => 'Not changed',
            'type' => 'mixed',
        ],
        'not_changed_to' => [
            'label' => 'Not changed to',
            'type' => 'mixed',
        ],
        'not_changed_from' => [
            'label' => 'Not changed from',
            'type' => 'mixed',
        ],
    ];

    public static array $conditions = [
        'event:type' => [
            'label' => 'Triggered when',
            'group' => 'filtering',
            'operators' => ['is'],
            'input_config' => [
                'type' => 'select',
                'select_options' => [
                    [
                        'name' => 'Conversation is created',
                        'value' => 'conversation_created',
                    ],
                    [
                        'name' => 'Conversation is updated',
                        'value' => 'conversation_updated',
                    ],
                ],
            ],
        ],
        'conversation:type' => [
            'needsChatModule' => true,
            'label' => 'Conversation type',
            'group' => 'filtering',
            'operators' => ['is'],
            'input_config' => [
                'type' => 'select',
                'select_options' => [
                    [
                        'name' => 'Chat',
                        'value' => 'chat',
                    ],
                    [
                        'name' => 'Ticket',
                        'value' => 'ticket',
                    ],
                ],
            ],
        ],
        'conversation:subject' => [
            'label' => 'Subject',
            'group' => 'conversation',
            'operators' => [
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'conversation:body' => [
            'label' => 'Content',
            'group' => 'conversation',
            'operators' => [
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'conversation:status' => [
            'label' => 'Status',
            'group' => 'conversation',
            'operators' => [
                'is',
                'not',
                'changed',
                'changed_to',
                'changed_from',
                'not_changed',
                'not_changed_to',
                'not_changed_from',
            ],
            'input_config' => [
                'type' => 'select',
                'select_options' => 'conversation:status',
            ],
        ],
        'conversation:category' => [
            'label' => 'Category',
            'group' => 'conversation',
            'operators' => [
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
                'is',
                'not',
            ],
            'input_config' => [
                'type' => 'select',
                'select_options' => 'conversation:category',
            ],
        ],
        'conversation:attachments' => [
            'label' => 'Number of attachments',
            'group' => 'conversation',
            'operators' => ['equals', 'not_equals', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],
        'conversation:assignee' => [
            'label' => 'Assignee',
            'group' => 'conversation',
            'operators' => [
                'is',
                'not',
                'changed',
                'changed_to',
                'changed_from',
                'not_changed',
                'not_changed_to',
                'not_changed_from',
            ],
            'input_config' => [
                'type' => 'select',
                'select_options' => 'agent:id',
            ],
        ],
        'conversation:mailboxAddress' => [
            'label' => 'Mailbox address',
            'group' => 'conversation',
            'operators' => [
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'customer:name' => [
            'label' => 'Customer name',
            'group' => 'customer',
            'operators' => [
                'is',
                'not',
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'customer:email' => [
            'label' => 'Customer email',
            'group' => 'customer',
            'operators' => [
                'is',
                'not',
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'customer:visited_url' => [
            'needsChatModule' => true,
            'label' => 'Visited URL',
            'group' => 'customer',
            'operators' => [
                'is',
                'not',
                'contains',
                'not_contains',
                'starts_with',
                'ends_with',
                'equals',
                'not_equals',
                'matches_regex',
            ],
            'input_config' => [
                'type' => 'text',
            ],
        ],
        'customer:location' => [
            'label' => 'Location',
            'group' => 'customer',
            'operators' => ['is'],
            'input_config' => [
                'type' => 'select',
                'select_options' => 'country:code',
            ],
        ],
        'customer:page_visits_count' => [
            'needsChatModule' => true,
            'label' => 'Page visits count',
            'group' => 'customer',
            'operators' => ['equals', 'not_equals', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],

        // time based
        'timeframe:hours_since_created' => [
            'label' => 'Hours since created',
            'group' => 'timeframe',
            'time_based' => true,
            'operators' => ['is', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],
        'timeframe:hours_since_closed' => [
            'label' => 'Hours since closed',
            'group' => 'timeframe',
            'time_based' => true,
            'operators' => ['is', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],
        'timeframe:hours_since_last_activity' => [
            'label' => 'Hours since last activity',
            'group' => 'timeframe',
            'time_based' => true,
            'operators' => ['is', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],
        'timeframe:hours_since_last_reply' => [
            'label' => 'Hours since last reply',
            'group' => 'timeframe',
            'time_based' => true,
            'operators' => ['is', 'more', 'less'],
            'input_config' => [
                'type' => 'text',
                'input_type' => 'number',
            ],
        ],
    ];

    protected static array $actions = [
        'send_email_to_user' => [
            'label' => 'Notify: via email',
            'updates_conversation' => false,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'select',
                        'name' => 'agent_id',
                        'select_options' => 'agent:id',
                    ],
                    [
                        'placeholder' => 'Subject',
                        'type' => 'text',
                        'name' => 'subject',
                    ],
                    [
                        'placeholder' => 'Email Message',
                        'type' => 'textarea',
                        'name' => 'message',
                    ],
                ],
            ],
        ],
        'add_note_to_conversation' => [
            'label' => 'Conversation: add a note',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'textarea',
                        'placeholder' => 'Note Text',
                        'name' => 'note_text',
                    ],
                ],
            ],
        ],
        'change_conversation_status' => [
            'label' => 'Conversation: change status',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'select',
                        'select_options' => 'conversation:status',
                        'name' => 'status_id',
                    ],
                ],
            ],
        ],
        'assign_conversation_to_agent' => [
            'label' => 'Conversation: assign to agent',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'select',
                        'select_options' => 'agent:id',
                        'name' => 'agent_id',
                    ],
                ],
            ],
        ],
        'transfer_conversation_to_group' => [
            'label' => 'Conversation: transfer to group',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'select',
                        'select_options' => 'group:id',
                        'name' => 'group_id',
                    ],
                ],
            ],
        ],
        'add_tags_to_conversation' => [
            'label' => 'Conversation: add tag(s)',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'text',
                        'placeholder' => 'Enter tag name...',
                        'default_value' => [],
                        'name' => 'tags_to_add',
                    ],
                ],
            ],
        ],
        'remove_tags_from_conversation' => [
            'label' => 'Conversation: remove tag(s)',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'text',
                        'placeholder' => 'Enter tag name... tags with comma',
                        'default_value' => [],
                        'name' => 'tags_to_remove',
                    ],
                ],
            ],
        ],
        'move_conversation_to_category' => [
            'label' => 'Conversation: move to category',
            'updates_conversation' => true,
            'aborts_cycle' => false,
            'input_config' => [
                'inputs' => [
                    [
                        'type' => 'select',
                        'select_options' => 'conversation:category',
                        'name' => 'category_name',
                    ],
                ],
            ],
        ],
        'delete_conversation' => [
            'label' => 'Conversation: delete',
            'updates_conversation' => true,
            'aborts_cycle' => true,
        ],
    ];

    public function get(): array
    {
        return [
            'operators' => self::$operators,
            'conditions' => array_filter(
                self::$conditions,
                fn($condition) => Modules::livechatInstalled() ||
                    !isset($condition['needsChatModule']),
            ),
            'actions' => self::$actions,
        ];
    }

    public function getWithSelectOptions(): array
    {
        $config = $this->get();
        $config['selectOptions'] = [
            'agent:id' => User::whereAgent()->limit(20)->get()->transform(
                fn($user) => [
                    'name' => $user->name,
                    'description' => $user->email,
                    'value' => $user->id,
                    'image' => $user->image,
                ],
            ),
            'group:id' => Group::get()->map(
                fn($group) => [
                    'name' => $group->name,
                    'value' => $group->id,
                ],
            ),
            'conversation:status' => ConversationStatus::get()->map(
                fn(ConversationStatus $status) => [
                    'name' => $status->label,
                    'value' => $status->id,
                ],
            ),
            'country:code' => array_map(
                fn($country) => [
                    'name' => $country['name'],
                    'value' => $country['code'],
                ],
                app(ValueLists::class)->countries(),
            ),
        ];

        $categoryAttribute = CustomAttribute::where('key', 'category')->first();
        if ($categoryAttribute) {
            $config['selectOptions']['conversation:category'] = collect(
                $categoryAttribute->config['options'],
            )->map(
                fn($option) => [
                    'name' => $option['label'],
                    'value' => $option['value'],
                ],
            );
        }

        return $config;
    }
}
