<?php namespace App\HelpCenter\Controllers;

use App\HelpCenter\Actions\HcCategoryLoader;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\HelpCenter\Requests\ModifyHcCategory;
use Common\Core\BaseController;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class HcCategoryController extends BaseController
{
    public function show()
    {
        $this->authorize('index', HcArticle::class);

        $data = (new HcCategoryLoader())->loadData(request('loader'));

        return $this->renderClientOrApi([
            'data' => $data,
            'pageName' => 'category-page',
        ]);
    }

    public function store(ModifyHcCategory $request)
    {
        $this->authorize('store', HcArticle::class);

        $last = HcCategory::orderBy('position', 'desc')->first();

        $category = HcCategory::create([
            ...$request->validated(),
            'position' => $last ? $last->position + 1 : 1,
        ]);

        $category->syncImage();

        return $this->success(['category' => $category]);
    }

    public function update(int $id, ModifyHcCategory $request)
    {
        $this->authorize('update', HcArticle::class);

        $category = HcCategory::findOrFail($id);

        $category->fill($request->validated())->save();

        $category->syncImage();

        return $this->success(['category' => $category]);
    }

    public function destroy(int $id)
    {
        $this->authorize('destroy', HcArticle::class);

        $category = HcCategory::findOrFail($id);

        $this->blockOnDemoSite();

        $category
            ->where('parent_id', $category->id)
            ->update(['parent_id' => null]);

        $category->articles()->detach();

        $category->images()->detach();

        $category->delete();

        return $this->success();
    }

    public function sidenavContent(int $categoryId)
    {
        $this->authorize('index', HcArticle::class);

        $categories = HcCategory::where('parent_id', $categoryId)
            ->orderByPosition()
            ->with([
                'articles' => function (BelongsToMany $query) {
                    $query->select('id', 'title', 'position', 'slug');
                },
            ])
            ->limit(20)
            ->get();

        return $this->success(['sections' => $categories]);
    }
}
