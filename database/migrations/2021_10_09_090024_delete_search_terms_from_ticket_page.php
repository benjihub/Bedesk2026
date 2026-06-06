<?php

namespace modules\helpdesk\database\migrations;

use App\HelpCenter\Actions\AggregateSearchTerms;
use App\HelpCenter\Models\SearchTerm;
use App\Models\User;
use Axisofstevil\StopWords\Filter;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $this->aggregateTerms();

        // delete terms that were from ticket page
        SearchTerm::where('page', 'ticket')->orWhereNull('page')->delete();

        // delete terms that were from admin or agent
        $userIds = User::whereHas('permissions', function (Builder $builder) {
            $builder->where('name', 'admin')->orWhere('name', 'tickets.update');
        })->pluck('id');
        SearchTerm::whereIn('id', $userIds)->delete();

        // normalize terms
        foreach (SearchTerm::cursor() as $searchTerm) {
            $searchTerm->normalized_term = slugify(
                (new Filter())->cleanText($searchTerm->term),
                ' ',
            );
            $searchTerm->save();
        }

        // delete too long or too short
        SearchTerm::whereRaw('length(normalized_term) < 4')
            ->orWhereRaw('length(normalized_term) > 100')
            ->delete();

        Schema::table('search_terms', function (Blueprint $table) {
            $table->dropColumn('page');
            $table->dropColumn('source');
        });
    }

    public function aggregateTerms()
    {
        $termsToDelete = [];
        app(SearchTerm::class)
            ->orderBy('created_at', 'desc')
            ->select(['id', 'created_at', 'term'])
            ->chunk(1000, function (Collection $terms) use (&$termsToDelete) {
                $chunks = $this->chunkTermsByCreatedAt($terms);

                foreach ($chunks as $original) {
                    if (count($original) < 2) {
                        continue;
                    }

                    $aggregated = app(AggregateSearchTerms::class)->execute(
                        $original,
                    );

                    $termIds = collect($original)
                        ->diffUsing($aggregated, function ($a, $b) {
                            return $a['normalized_term'] !==
                                $b['normalized_term'];
                        })
                        ->pluck('id');
                    $termsToDelete = array_merge(
                        $termsToDelete,
                        $termIds->toArray(),
                    );
                }
            });

        SearchTerm::whereIn('id', $termsToDelete)->delete();
    }

    private function chunkTermsByCreatedAt(Collection $terms): array
    {
        $grouped = [];

        $last = null;

        /** @var SearchTerm $term */
        foreach ($terms as $term) {
            if (
                $last === null ||
                !$term->created_at->isSameMinute(
                    Carbon::createFromTimestamp($last),
                )
            ) {
                $grouped[$term->created_at->timestamp] = [$term];
                $last = $term->created_at->timestamp;
            } else {
                $grouped[$last][] = $term;
            }
        }
        return $grouped;
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
};
