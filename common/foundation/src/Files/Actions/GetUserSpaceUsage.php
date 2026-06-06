<?php namespace Common\Files\Actions;

use App\Models\User;
use Common\Billing\Models\Product;
use Common\Files\Uploads\Uploads;
use Common\Files\Uploads\UploadType;
use Common\Settings\Settings;
use Illuminate\Support\Facades\Auth;

class GetUserSpaceUsage
{
    protected User $user;

    public function __construct(
        ?User $user = null,
        protected ?string $uploadType = null,
    ) {
        $this->user = $user ?? Auth::user();
    }

    public function execute(): array
    {
        return [
            'used' => $this->getSpaceUsed(),
            'available' => $this->getAvailableSpace(),
        ];
    }

    public function getSpaceUsed(): int|float
    {
        return (int) $this->user
            ->entries(['owner' => true])
            ->where('type', '!=', 'folder')
            ->when(
                $this->uploadType,
                fn($query) => $query->where('upload_type', $this->uploadType),
            )
            ->withTrashed()
            ->sum('file_size');
    }

    public function getAvailableSpace(): int|float|null
    {
        if (
            !$this->uploadType ||
            !($uploadType = Uploads::type($this->uploadType))
        ) {
            return null;
        }

        $maxSpaceUsage = $uploadType->defaultMaxSpaceUsage();

        if (!$this->user) {
            $guestRoleMax = app('guestRole')->getRestrictionValue(
                'files.create',
                'max_space_usage',
            );
            if ($guestRoleMax !== null) {
                $maxSpaceUsage = $guestRoleMax;
            }
        }

        $userMax = $this->user->getRestrictionValue(
            'files.create',
            'max_space_usage',
        );
        if ($userMax !== null) {
            $maxSpaceUsage = $userMax;
        }

        return $maxSpaceUsage;
    }

    public function hasEnoughSpaceToUpload(int $bytes): bool
    {
        $availableSpace = $this->getAvailableSpace();

        // unlimited space
        if (is_null($availableSpace)) {
            return true;
        }
        return $this->getSpaceUsed() + $bytes <= $availableSpace;
    }
}
