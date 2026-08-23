<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdmin extends Command
{
    protected $signature = 'gutshoes:create-admin {--email=} {--password=} {--name=}';

    protected $description = 'Create or update a GutShoes administrator without public registration.';

    public function handle(): int
    {
        $email = $this->option('email') ?: config('gutshoes.bootstrap_admin.email') ?: $this->ask('Email');
        $name = $this->option('name') ?: config('gutshoes.bootstrap_admin.name') ?: $this->ask('Name');
        $password = $this->option('password') ?: config('gutshoes.bootstrap_admin.password') ?: $this->secret('Password');
        $data = compact('email', 'name', 'password');
        $validator = Validator::make($data, ['email' => ['required', 'email', 'max:255'], 'name' => ['required', 'string', 'max:255'], 'password' => ['required', Password::min(12)->letters()->mixedCase()->numbers()->symbols()]]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }
        $existing = User::withTrashed()->where('email', $email)->first();
        if ($existing && $existing->role !== UserRole::ADMIN) {
            $this->error('Email belongs to a customer account.');

            return self::FAILURE;
        }
        $admin = $existing ?? new User(['email' => $email]);
        $admin->fill(['name' => $name, 'password' => Hash::make($password), 'role' => UserRole::ADMIN, 'email_verified_at' => now()]);
        if ($admin->exists) {
            $admin->restore();
        }
        $admin->save();
        $admin->adminProfile()->updateOrCreate([], ['display_name' => $name]);
        $this->info("Administrator {$email} is ready.");

        return self::SUCCESS;
    }
}
