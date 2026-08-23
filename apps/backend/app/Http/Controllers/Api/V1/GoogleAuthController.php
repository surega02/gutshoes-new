<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse|SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();
        abort_unless(filled($googleUser->getEmail()), 422, 'Google account did not provide an email.');
        abort_unless(filter_var($googleUser->user['email_verified'] ?? false, FILTER_VALIDATE_BOOL), 403, 'Google email must be verified.');

        $user = DB::transaction(function () use ($googleUser): User {
            $user = User::withTrashed()->where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())->first();
            $user ??= new User(['email' => $googleUser->getEmail()]);
            abort_if($user->exists && $user->role === UserRole::ADMIN, 403, 'Admin account cannot use customer login.');
            $user->fill(['name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'GutShoes Customer',
                'google_id' => $googleUser->getId(), 'email_verified_at' => now(), 'role' => UserRole::CUSTOMER]);
            if ($user->exists) {
                $user->restore();
            }
            $user->save();
            DB::table('orders')->whereNull('user_id')->where('customer_email', $user->email)->update(['user_id' => $user->id, 'updated_at' => now()]);

            return $user;
        });

        Auth::login($user, true);
        request()->session()->regenerate();

        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/auth/callback');
    }
}
