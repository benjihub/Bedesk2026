<?php namespace App\Core\Controllers;

use App\Models\User;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Actions\CompletePasswordReset;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse;
use Laravel\Fortify\Contracts\PasswordResetResponse;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;

class ResetPasswordController extends PasswordResetLinkController
{
    public function __construct(protected StatefulGuard $guard) {}

    public function sendResetPasswordLink(Request $request)
    {
        $status = $this->broker()->sendResetLink([
            'email' => $this->getEmailClosure($request->email),
        ]);

        return $status == Password::RESET_LINK_SENT
            ? app(SuccessfulPasswordResetLinkRequestResponse::class, [
                'status' => $status,
            ])
            : app(FailedPasswordResetLinkRequestResponse::class, [
                'status' => $status,
            ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $status = $this->broker()->reset(
            [
                'email' => $this->getEmailClosure($request->email),
                'password' => $request->password,
                'password_confirmation' => $request->password_confirmation,
                'token' => $request->token,
            ],
            function ($user) use ($request) {
                app(ResetsUserPasswords::class)->reset($user, $request->all());
                app(CompletePasswordReset::class)($this->guard, $user);
            },
        );

        if ($status == Password::PASSWORD_RESET) {
            $user = User::query()
                ->tap($this->getEmailClosure($request->email))
                ->first();
            if (!$user->email) {
                $user->update(['email' => $request->email]);
                $user
                    ->secondaryEmails()
                    ->where('address', $request->email)
                    ->delete();
            }

            return app(PasswordResetResponse::class, ['status' => $status]);
        }

        return app(FailedPasswordResetResponse::class, ['status' => $status]);
    }

    protected function getEmailClosure(string $email): \Closure
    {
        return fn(
            Builder $builder,
        ) => $builder->where(fn(Builder $query) => $query->where('email', $email)->orWhereHas('secondaryEmails', fn(Builder $q) => $q->where('address', $email)));
    }
}
