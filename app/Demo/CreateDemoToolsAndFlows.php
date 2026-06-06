<?php

namespace App\Demo;

use App\Team\Models\Group;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateDemoToolsAndFlows
{
    public function execute(): void
    {
        $this->createTools();
        $this->createFlows();
    }

    protected function createTools()
    {
        $groupId = Group::findDefault()?->id;

        DB::table('ai_agent_tools')->insert([
            'group_id' => $groupId,
            'name' => 'Example tool',
            'description' => 'Example tool for retrieving user TODOs',
            'active' => false,
            'activation_count' => 82,
            'created_at' => now(),
            'updated_at' => now(),
            'config' => json_encode([
                'apiRequest' => [
                    'url' =>
                        'https://jsonplaceholder.typicode.com/todos?userEmail=<be-variable name="email" type="user" fallback=""></be-variable>',
                    'headers' => [],
                    'method' => 'GET',
                    'bodyType' => 'json',
                    'body' => null,
                    'collectedData' => [],
                    'attributesUsed' => [
                        [
                            'name' => 'email',
                            'testValue' => 'email@email.com',
                        ],
                    ],
                ],
                'selectedResponseType' => 'live',
            ]),
            'response_schema' => json_encode([
                'arrays' => [
                    [
                        'name' => 'items',
                        'path' => '[root]',
                    ],
                ],
                'properties' => [
                    [
                        'id' => 'ff790510-2c78-45e7-a7ce-e69d65a8eb68',
                        'path' => '[root].[*].userId',
                        'value' => 10,
                        'format' => 'number',
                    ],
                    [
                        'id' => '5c76bdad-0f5c-4b6d-88e2-d111afbd74ca',
                        'path' => '[root].[*].id',
                        'value' => 200,
                        'format' => 'number',
                    ],
                    [
                        'id' => 'f21f1fb6-842d-432b-b23a-d9beaa9756ea',
                        'path' => '[root].[*].title',
                        'value' => 'ipsam aperiam voluptates qui',
                        'format' => 'string',
                    ],
                    [
                        'id' => '03e456b5-e8ee-4395-8c36-6d772de926ed',
                        'path' => '[root].[*].completed',
                        'value' => false,
                        'format' => 'boolean',
                    ],
                ],
                'data' => [
                    [
                        'userId' => 1,
                        'id' => 1,
                        'title' => 'delectus aut autem',
                        'completed' => false,
                    ],
                ],
            ]),
        ]);

        $toolId = DB::table('ai_agent_tools')->first()->id;

        DB::table('tool_responses')->insert([
            'tool_id' => $toolId,
            'type' => 'editorLive',
            'created_at' => now(),
            'request_key' => Str::random(),
            'response' => json_encode([
                [
                    'userId' => 1,
                    'id' => 1,
                    'title' => 'delectus aut autem',
                    'completed' => false,
                ],
                [
                    'userId' => 1,
                    'id' => 2,
                    'title' => 'quis ut nam facilis et officia qui',
                    'completed' => false,
                ],
                [
                    'userId' => 1,
                    'id' => 3,
                    'title' => 'fugiat veniam minus',
                    'completed' => false,
                ],
            ]),
        ]);
    }

    protected function createFlows()
    {
        $groupId = Group::findDefault()?->id;

        DB::table('ai_agent_flows')->insert([
            'group_id' => $groupId,
            'name' => 'Example flow',
            'activation_count' => 71,
            'created_at' => now(),
            'updated_at' => now(),
            'config' => json_encode([
                'nodes' => [
                    [
                        'id' => 'jV3KPxUHNZSl-yzQL0ERp',
                        'parentId' => 'start',
                        'type' => 'buttons',
                        'data' => [
                            'message' => 'Hi, how can I help you?',
                            'attachmentIds' => [],
                            'name' => null,
                            'preventTyping' => false,
                        ],
                    ],
                    [
                        'id' => 'wAZoyQr3pCHsncDoObIUm',
                        'parentId' => 'jV3KPxUHNZSl-yzQL0ERp',
                        'type' => 'buttonsItem',
                        'data' => [
                            'name' => 'Billing',
                        ],
                    ],
                    [
                        'id' => 'yxOSK9iSzeqEkZg_M74M7',
                        'parentId' => 'wAZoyQr3pCHsncDoObIUm',
                        'type' => 'articles',
                        'data' => [
                            'message' => null,
                            'attachmentIds' => [],
                            'articleIds' => [25, 9, 4],
                        ],
                    ],
                    [
                        'id' => 'kLDNPKjk8SlqwwzmpsFDm',
                        'parentId' => 'jV3KPxUHNZSl-yzQL0ERp',
                        'type' => 'buttonsItem',
                        'data' => [
                            'name' => 'Orders',
                        ],
                    ],
                    [
                        'id' => 'FpDfJBxCkqjVTKQFpit20',
                        'parentId' => 'kLDNPKjk8SlqwwzmpsFDm',
                        'type' => 'collectDetails',
                        'data' => [
                            'attributeIds' => [2],
                            'name' => null,
                        ],
                    ],
                    [
                        'id' => 'nZA5kCJM4zIHKDw21OCQe',
                        'parentId' => 'jV3KPxUHNZSl-yzQL0ERp',
                        'type' => 'buttonsItem',
                        'data' => [
                            'name' => 'Refunds',
                        ],
                    ],
                    [
                        'id' => 'R33PbJUP9qHazpuYzv81h',
                        'parentId' => 'nZA5kCJM4zIHKDw21OCQe',
                        'type' => 'transfer',
                        'data' => [
                            'message' => 'Transferring you to agent now!',
                            'attachmentIds' => [],
                        ],
                    ],
                ],
            ]),
        ]);
    }
}
