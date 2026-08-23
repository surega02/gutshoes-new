<?php

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\StoreConfiguration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns operational dashboard with database low stock threshold', function () {
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    StoreConfiguration::create(['key' => 'low_stock_threshold', 'value' => 3, 'is_public' => false, 'updated_by' => $admin->id]);
    Inventory::factory()->create(['on_hand' => 4, 'reserved' => 2]);
    $this->actingAs($admin)->getJson('/api/v1/admin/dashboard')->assertOk()->assertJsonPath('data.low_stock_threshold', 3)->assertJsonPath('data.low_stock_count', 1)->assertJsonPath('data.revenue.currency', 'IDR');
});

it('forbids non admins from every operations endpoint', function () {
    $customer = User::factory()->create(['role' => UserRole::CUSTOMER]);
    $this->actingAs($customer)->getJson('/api/v1/admin/orders')->assertForbidden();
    $this->actingAs($customer)->putJson('/api/v1/admin/configurations/low_stock_threshold', ['value' => 5])->assertForbidden();
});

it('filters and caps paginated admin order queries', function () {
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    Order::query()->limit(0);
    $this->actingAs($admin)->getJson('/api/v1/admin/orders?status=PAID&per_page=500')->assertOk()->assertJsonPath('meta.per_page', 100);
});

it('writes a redacted immutable audit record for admin mutation', function () {
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    $this->actingAs($admin)->withHeader('X-Request-ID', 'audit-request-1')->putJson('/api/v1/admin/configurations/low_stock_threshold', ['value' => 7, 'secret' => 'must-not-persist'])->assertOk();
    $log = AuditLog::first();
    expect($log)->not->toBeNull()->and($log->admin_id)->toBe($admin->id)->and($log->request_id)->toBe('audit-request-1')->and($log->metadata)->not->toHaveKey('secret');
    $this->assertDatabaseHas('store_configurations', ['key' => 'low_stock_threshold']);
});

it('adjusts inventory through the domain engine and records its audit trail', function () {
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    $inventory = Inventory::factory()->create(['on_hand' => 5, 'reserved' => 0]);
    $this->actingAs($admin)->patchJson("/api/v1/admin/inventories/{$inventory->id}/adjust", ['delta' => -2, 'reason' => 'Cycle count'])->assertOk()->assertJsonPath('data.on_hand', 3);
    $this->assertDatabaseHas('inventory_movements', ['inventory_id' => $inventory->id, 'type' => 'ADJUST']);
    expect(AuditLog::count())->toBe(1);
});
