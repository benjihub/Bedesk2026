<?php namespace Common\Core\Values;

use Common\Core\BaseController;
use Common\Core\Values\ValueLists;

class ValueListsController extends BaseController
{
    public function index(string $names)
    {
        $values = app(ValueLists::class)->get($names, request()->all());
        return $this->success($values);
    }
}
