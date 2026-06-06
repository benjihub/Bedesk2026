<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Ai\AiAgent\Models\AiAgentFlow;

class SampleAiAgentFlowSeeder extends Seeder
{
    public function run()
    {
        $name = 'Test Agent Flow';

        $nodes = [
            [
                'id' => 'n_start',
                'type' => 'start',
                'next' => 'n_welcome',
            ],
            [
                'id' => 'n_welcome',
                'type' => 'message',
                'parentId' => 'start',
                'data' => [
                    'message' => "Hello, I'm Test Agent. How can I help?",
                ],
                'next' => 'n_options',
            ],
            [
                'id' => 'n_options',
                'type' => 'buttons',
                'parentId' => 'n_welcome',
                'data' => [
                    'message' => 'Choose an option:',
                ],
            ],
            [
                'id' => 'n_btn_order',
                'type' => 'buttonsItem',
                'parentId' => 'n_options',
                'data' => [
                    'name' => 'order',
                    'label' => 'Order status',
                ],
                'next' => 'n_order_reply',
            ],
            [
                'id' => 'n_btn_pricing',
                'type' => 'buttonsItem',
                'parentId' => 'n_options',
                'data' => [
                    'name' => 'price',
                    'label' => 'Pricing',
                ],
                'next' => 'n_pricing_reply',
            ],
            [
                'id' => 'n_order_reply',
                'type' => 'message',
                'data' => [
                    'message' => 'Please provide your order number and I will check it for you.',
                ],
            ],
            [
                'id' => 'n_pricing_reply',
                'type' => 'message',
                'data' => [
                    'message' => 'Our pricing varies by plan — can you tell me which plan you are interested in?',
                ],
            ],
        ];

        $config = ['nodes' => $nodes];

        $flow = AiAgentFlow::updateOrCreate(
            ['name' => $name],
            ['description' => 'A simple test flow for the AI agent', 'config' => $config]
        );

        if ($this->command) {
            $this->command->info('Seeded AiAgentFlow id='.$flow->id.' name="'.$flow->name.'"');
        }
    }
}
