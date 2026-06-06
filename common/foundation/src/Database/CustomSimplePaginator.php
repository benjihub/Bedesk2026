<?php

namespace Common\Database;

class CustomSimplePaginator extends \Illuminate\Pagination\Paginator
{
    public function toArray(): array
    {
        return [
            'current_page' => $this->currentPage(),
            'data' => $this->items->values()->toArray(),
            'from' => $this->firstItem(),
            'next_page' => $this->hasMorePages()
                ? $this->currentPage() + 1
                : null,
            'per_page' => $this->perPage(),
            'prev_page' =>
                $this->currentPage() > 1 ? $this->currentPage() - 1 : null,
            'to' => $this->lastItem(),
        ];
    }
}
