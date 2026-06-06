<?php

namespace App\Contacts\Controllers;

use App\Contacts\Actions\LoadCustomerProfile;
use App\Contacts\Models\Email;
use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Core\BaseController;
use Common\Tags\Tag;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CustomerProfileController extends BaseController
{
    public function show(int $userId)
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('users.update'));

        $user = User::findOrFail($userId);

        return $this->success([
            'user' => (new LoadCustomerProfile())->execute($user),
        ]);
    }

    public function update(int $userId)
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('users.update'));

        $data = $this->validate(
            request(),
            [
                'name' => 'string',
                'emails' => 'array',
                'emails.*' => [
                    'required',
                    'email',
                    Rule::unique('emails', 'address')->ignore(
                        $userId,
                        'user_id',
                    ),
                    Rule::unique('users', 'email')->ignore($userId),
                ],
                'tags' => 'array',
                'tags.*' => 'string',
                'details' => 'string|nullable',
                'notes' => 'string|nullable',
                'timezone' => 'string|nullable',
                'country' => 'string|nullable',
                'language' => 'string|nullable',
                'attributes' => 'array',
            ],
            [],
            [
                'emails.*' => 'email',
            ],
        );

        $user = User::with(['details', 'secondaryEmails'])->findOrFail($userId);

        // save details and notes
        if (!$user->details) {
            $user->setRelation('details', $user->details()->create([]));
        }
        $user->details
            ->fill([
                'details' => $data['details'] ?? null,
                'notes' => $data['notes'] ?? null,
            ])
            ->save();

        // save tags
        if (array_key_exists('tags', $data)) {
            $tagIds = Tag::whereIn('name', $data['tags'])->pluck('id');
            $user->tags()->sync($tagIds);
        }

        // save emails
        if (array_key_exists('emails', $data)) {
            if (empty($data['emails'])) {
                $user->secondaryEmails()->delete();
            } else {
                foreach ($data['emails'] as $email) {
                    $user
                        ->secondaryEmails()
                        ->firstOrCreate(['address' => $email]);
                }
            }
        }

        if (array_key_exists('attributes', $data)) {
            $user->updateCustomAttributes($data['attributes']);
        }

        $user
            ->fill([
                'name' => $data['name'] ?? null,
                'timezone' => $data['timezone'] ?? null,
                'country' => $data['country'] ?? null,
                'language' => $data['language'] ?? null,
            ])
            ->save();

        return $this->success();
    }

    public function conversations(int $userId)
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('users.update'));

        $builder = Conversation::query()
            ->where('user_id', $userId)
            ->when(
                request('statusId'),
                fn($query) => $query->where('status_id', request('statusId')),
            );

        // shows latest chats first, then tickets
        if (!request('orderBy')) {
            $builder
                ->orderBy('status_category', 'desc')
                ->orderBy('type', 'asc')
                ->orderBy('id', 'desc');
        } else {
            $builder->orderBy(request('orderBy'), request('orderDir'));
        }

        return $this->success([
            'pagination' => (new ConversationListBuilder())->simplePagination(
                $builder->simplePaginate(),
            ),
        ]);
    }
}
