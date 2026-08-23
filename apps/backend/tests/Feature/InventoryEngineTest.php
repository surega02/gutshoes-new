<?php

use App\Domain\Inventory\InventoryService;
use App\Enums\ReservationStatus;
use App\Jobs\ReleaseExpiredInventoryReservations;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function inventoryOrder(Warehouse $warehouse, string $number): Order
{
    return Order::create(['order_number' => $number, 'warehouse_id' => $warehouse->id, 'customer_email' => 'buyer@example.test', 'customer_name' => 'Buyer', 'customer_phone' => '08123456789',
        'status' => 'PENDING_PAYMENT', 'subtotal' => '100000.00', 'shipping_fee' => '10000.00', 'grand_total' => '110000.00', 'currency' => 'IDR', 'idempotency_key' => 'key-'.$number,
        'payload_hash' => hash('sha256', $number), 'expires_at' => now()->addDay()]);
}

it('prevents sequential contenders from overselling the final unit', function () {
    $warehouse = Warehouse::factory()->create();
    $inventory = Inventory::factory()->create(['warehouse_id' => $warehouse->id, 'on_hand' => 1, 'reserved' => 0]);
    $service = app(InventoryService::class);
    $first = inventoryOrder($warehouse, 'ORD-INV-1');
    $second = inventoryOrder($warehouse, 'ORD-INV-2');
    $service->reserve($inventory, $first, 1);
    expect(fn () => $service->reserve($inventory, $second, 1))->toThrow(DomainException::class);
    expect($inventory->refresh()->reserved)->toBe(1)->and($inventory->on_hand)->toBe(1);
});

it('records every mutation as an immutable movement', function () {
    $inventory = Inventory::factory()->create(['on_hand' => 2, 'reserved' => 0]);
    $service = app(InventoryService::class);
    $service->add($inventory, 3, 'Supplier receipt');
    $movement = InventoryMovement::firstOrFail();
    expect($movement->quantity_delta)->toBe(3)->and($movement->on_hand_after)->toBe(5);
    expect(fn () => $movement->update(['reason' => 'tampered']))->toThrow(LogicException::class);
});

it('releases expired reservations exactly once', function () {
    $warehouse = Warehouse::factory()->create();
    $inventory = Inventory::factory()->create(['warehouse_id' => $warehouse->id, 'on_hand' => 5, 'reserved' => 0]);
    $order = inventoryOrder($warehouse, 'ORD-EXP-1');
    $order->update(['expires_at' => now()->subMinute()]);
    $reservation = app(InventoryService::class)->reserve($inventory, $order, 2);
    $reservation->update(['expires_at' => now()->subMinute()]);
    $job = new ReleaseExpiredInventoryReservations;
    $job->handle(app(InventoryService::class));
    $job->handle(app(InventoryService::class));
    expect($reservation->refresh()->status)->toBe(ReservationStatus::EXPIRED->value)->and($inventory->refresh()->reserved)->toBe(0);
    expect(InventoryMovement::where('type', 'RELEASE')->count())->toBe(1);
});

it('converts a reservation to sold stock idempotently', function () {
    $warehouse = Warehouse::factory()->create();
    $inventory = Inventory::factory()->create(['warehouse_id' => $warehouse->id, 'on_hand' => 3, 'reserved' => 0, 'sold' => 0]);
    $reservation = app(InventoryService::class)->reserve($inventory, inventoryOrder($warehouse, 'ORD-SELL-1'), 2);
    expect(app(InventoryService::class)->sell($reservation))->toBeTrue();
    expect(app(InventoryService::class)->sell($reservation))->toBeFalse();
    expect($inventory->refresh()->on_hand)->toBe(1)->and($inventory->reserved)->toBe(0)->and($inventory->sold)->toBe(2);
});
