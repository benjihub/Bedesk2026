<?php

namespace Common\Auth\Factories;

use Common\Auth\UserSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;

class UserSessionFactory extends Factory
{
    protected $model = UserSession::class;

    public function definition(): array
    {
        $ip = $this->faker->ipv4;
        $country = Arr::random([
            'us',
            'de',
            'fr',
            'gb',
            'ca',
            'au',
            'jp',
            'cn',
            'in',
            'ru',
        ]);

        $date = $this->faker->dateTimeBetween(now()->subMinutes(60), now());

        return [
            'ip_address' => $ip,
            'country' => $country,
            'city' => $this->getCity($country),
            'platform' => Arr::random(['windows', 'linux', 'ios', 'androidos']),
            'device' => Arr::random(['mobile', 'tablet', 'desktop']),
            'browser' => Arr::random([
                'chrome',
                'firefox',
                'edge',
                'internet explorer',
                'safari',
            ]),
            'user_agent' => $this->faker->userAgent,
            'created_at' => $date,
            'updated_at' => $date,
        ];
    }

    public function getCity(string $country)
    {
        $citiesByPopulation = [
            'us' => [
                'New York',
                'Los Angeles',
                'Chicago',
                'Houston',
                'Phoenix',
                'Philadelphia',
                'San Antonio',
                'San Diego',
                'Dallas',
                'San Jose',
            ],
            'de' => [
                'Berlin',
                'Hamburg',
                'Munich',
                'Cologne',
                'Frankfurt',
                'Stuttgart',
                'Düsseldorf',
                'Dortmund',
                'Essen',
                'Leipzig',
            ],
            'fr' => [
                'Paris',
                'Marseille',
                'Lyon',
                'Toulouse',
                'Nice',
                'Nantes',
                'Montpellier',
                'Strasbourg',
                'Bordeaux',
                'Lille',
            ],
            'gb' => [
                'London',
                'Birmingham',
                'Glasgow',
                'Liverpool',
                'Leeds',
                'Sheffield',
                'Edinburgh',
                'Bristol',
                'Manchester',
                'Leicester',
            ],
            'ca' => [
                'Toronto',
                'Montreal',
                'Calgary',
                'Ottawa',
                'Edmonton',
                'Mississauga',
                'Winnipeg',
                'Vancouver',
                'Brampton',
                'Quebec City',
            ],
            'au' => [
                'Sydney',
                'Melbourne',
                'Brisbane',
                'Perth',
                'Adelaide',
                'Gold Coast',
                'Canberra',
                'Newcastle',
                'Wollongong',
                'Logan City',
            ],
            'jp' => [
                'Tokyo',
                'Yokohama',
                'Osaka',
                'Nagoya',
                'Sapporo',
                'Kobe',
                'Kyoto',
                'Fukuoka',
                'Kawasaki',
                'Saitama',
            ],
            'cn' => [
                'Shanghai',
                'Beijing',
                'Tianjin',
                'Guangzhou',
                'Shenzhen',
                'Chengdu',
                'Dongguan',
                'Chongqing',
                'Nanjing',
                'Xi\'an',
            ],
            'in' => [
                'Mumbai',
                'Delhi',
                'Bangalore',
                'Hyderabad',
                'Ahmedabad',
                'Chennai',
                'Kolkata',
                'Surat',
                'Pune',
                'Jaipur',
            ],
            'ru' => [
                'Moscow',
                'Saint Petersburg',
                'Novosibirsk',
                'Yekaterinburg',
                'Nizhny Novgorod',
                'Kazan',
                'Chelyabinsk',
                'Omsk',
                'Samara',
                'Rostov-on-Don',
            ],
        ];

        return Arr::random($citiesByPopulation[strtolower($country)]);
    }
}
