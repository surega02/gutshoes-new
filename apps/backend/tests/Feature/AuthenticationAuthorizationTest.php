<?php

use App\Enums\UserRole;
use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('rejects unauthenticated profile access with API envelope', function () {
    $this->getJson('/api/v1/profile')->assertUnauthorized()->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('authenticates an administrator and rotates the session', function () {
    $admin = User::factory()->admin()->create(['password' => Hash::make('Strong!Password123')]);
    $this->postJson('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'Strong!Password123'])
        ->assertOk()->assertJsonPath('data.role', UserRole::ADMIN->value);
    $this->assertAuthenticatedAs($admin);
});

it('prevents customers from reading another customer address', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $address = Address::create(['user_id' => $owner->id, 'label' => 'Rumah', 'recipient_name' => 'Owner', 'phone' => '08123456789',
        'address_line' => 'Jalan Pengujian 1', 'province' => 'DKI Jakarta', 'city' => 'Jakarta', 'district' => 'Setiabudi', 'postal_code' => '12910']);
    $this->actingAs($attacker)->getJson("/api/v1/addresses/{$address->id}")->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});

it('creates the first admin non-interactively without exposing credentials', function () {
    $this->artisan('gutshoes:create-admin', ['--email' => 'admin@example.test', '--name' => 'Admin Development', '--password' => 'Strong!Password123'])->assertSuccessful();
    $admin = User::where('email', 'admin@example.test')->firstOrFail();
    expect($admin->role)->toBe(UserRole::ADMIN)->and(Hash::check('Strong!Password123', $admin->password))->toBeTrue();
});

it('logs out and invalidates the authenticated session', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->postJson('/api/v1/auth/logout')->assertOk()->assertJsonPath('data.logged_out', true);
});
