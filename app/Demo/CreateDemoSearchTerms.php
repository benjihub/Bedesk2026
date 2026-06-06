<?php

namespace App\Demo;

use App\HelpCenter\Models\SearchTerm;
use App\Models\User;
use Faker\Generator;
use Illuminate\Support\Facades\File;

class CreateDemoSearchTerms
{
    protected Generator $faker;

    public function __construct()
    {
        $this->faker = app(Generator::class);
    }

    public function execute()
    {
        $terms = json_decode(
            File::get(resource_path('demo/demo-search-terms.json')),
            true,
        );
        $userIds = User::where('type', 'user')->pluck('id');

        $data = [];

        foreach ($terms as $term) {
            $data[] = [
                'term' => $term,
                'normalized_term' => $term,
                'result_count' => rand(0, 10),
                'clicked_article' => rand(0, 1),
                'created_ticket' => rand(0, 1),
                'user_id' => $userIds->random(),
                'created_at' => $this->faker->dateTimeBetween(
                    '6 days ago',
                    'now',
                ),
            ];
        }

        SearchTerm::insert($data);
    }
}
