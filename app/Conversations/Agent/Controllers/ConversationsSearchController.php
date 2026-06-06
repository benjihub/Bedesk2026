<?php namespace App\Conversations\Agent\Controllers;

use App\Attributes\AttributeFilters;
use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class ConversationsSearchController extends BaseController
{
    public function __invoke()
    {
        $this->authorize('index', Conversation::class);

        $params = $this->validate(request(), [
            'query' => 'string|nullable',
            'filters' => 'string|nullable',
            'page' => 'integer|nullable',
            'orderBy' => 'string|nullable',
            'orderDir' => 'string|nullable',
        ]);

        $builder = Conversation::query();
        $this->applyGroupVisibilityFilter($builder);

        $dataSource = new Datasource(
            $builder,
            $params,
            filtererName: config('scout.driver'),
        );

        (new AttributeFilters())->applyToDatasource($dataSource);

        $pagination = (new ConversationListBuilder())->simplePagination(
            $dataSource->paginate(),
        );

        return $this->success(['pagination' => $pagination]);
    }

    protected function applyGroupVisibilityFilter(Builder $builder): void
    {
        $user = Auth::user();
        if (!$user || $user->getPermission('admin')) {
            return;
        }

        $groupIds = $user->groups->pluck('id')->toArray();

        $builder->where(function (Builder $query) use ($groupIds) {
            if (empty($groupIds)) {
                $query->whereRaw('1 = 0');
                return;
            }

            $query->whereIn('group_id', $groupIds);
        });
    }
}
