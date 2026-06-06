<?php

namespace Common\Core\Demo;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

trait BlocksFunctionalityOnDemoSite
{
    public function blockOnDemoSite()
    {
        if (
            config('app.demo') &&
            config('app.demo_email') !== request()->user()->email
        ) {
            abort(403, 'This action is disabled on demo site.');
        }
    }

    public function redactEmails(Collection|array $data, $key = 'email')
    {
        if (config('app.demo')) {
            return array_map(function ($item) use ($key) {
                if (Arr::has($item, $key)) {
                    Arr::set($item, $key, 'hidden@demo.com');
                }
                return $item;
            }, $data);
        }

        return $data;
    }
}
