<?php

namespace App\Domain\Inventory;

use App\Enums\InventoryMovementType;
use App\Enums\ReservationStatus;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function add(Inventory $inventory, int $quantity, string $reason, ?User $actor = null): Inventory
    {
        if ($quantity <= 0) {
            throw new DomainException('Add quantity must be positive.');
        }

        return $this->mutate($inventory, $quantity, 0, 0, InventoryMovementType::ADD, $reason, $actor);
    }

    public function adjust(Inventory $inventory, int $delta, string $reason, ?User $actor = null): Inventory
    {
        if ($delta === 0) {
            throw new DomainException('Adjustment cannot be zero.');
        }

        return $this->mutate($inventory, $delta, 0, 0, InventoryMovementType::ADJUST, $reason, $actor);
    }

    public function reserve(Inventory $inventory, Order $order, int $quantity): InventoryReservation
    {
        if ($quantity <= 0) {
            throw new DomainException('Reservation quantity must be positive.');
        }

        return DB::transaction(function () use ($inventory, $order, $quantity): InventoryReservation {
            $locked = Inventory::query()->lockForUpdate()->findOrFail($inventory->id);
            if (($locked->on_hand - $locked->reserved) < $quantity) {
                throw new DomainException('Insufficient available stock.');
            }
            $reservation = InventoryReservation::query()->lockForUpdate()->firstOrNew(['inventory_id' => $locked->id, 'order_id' => $order->id]);
            if ($reservation->exists && $reservation->status !== ReservationStatus::ACTIVE->value) {
                throw new DomainException('Reservation is no longer active.');
            }
            $reservation->quantity = ($reservation->quantity ?? 0) + $quantity;
            $reservation->status = ReservationStatus::ACTIVE->value;
            $reservation->expires_at = $order->expires_at;
            $reservation->save();
            $locked->increment('reserved', $quantity);
            $locked->refresh();
            $this->movement($locked, InventoryMovementType::RESERVE, -$quantity, 'Stock reserved', Order::class, $order->id);

            return $reservation->refresh();
        }, 3);
    }

    public function release(InventoryReservation $reservation, ReservationStatus $finalStatus = ReservationStatus::RELEASED): bool
    {
        return DB::transaction(function () use ($reservation, $finalStatus): bool {
            $lockedReservation = InventoryReservation::query()->lockForUpdate()->findOrFail($reservation->id);
            if ($lockedReservation->status !== ReservationStatus::ACTIVE->value) {
                return false;
            }
            $inventory = Inventory::query()->lockForUpdate()->findOrFail($lockedReservation->inventory_id);
            if ($inventory->reserved < $lockedReservation->quantity) {
                throw new DomainException('Inventory reservation invariant violated.');
            }
            $inventory->decrement('reserved', $lockedReservation->quantity);
            $inventory->refresh();
            $lockedReservation->update(['status' => $finalStatus->value, 'released_at' => now()]);
            $this->movement($inventory, InventoryMovementType::RELEASE, $lockedReservation->quantity, 'Reservation released', InventoryReservation::class, $lockedReservation->id);

            return true;
        }, 3);
    }

    public function sell(InventoryReservation $reservation): bool
    {
        return DB::transaction(function () use ($reservation): bool {
            $lockedReservation = InventoryReservation::query()->lockForUpdate()->findOrFail($reservation->id);
            if ($lockedReservation->status === ReservationStatus::SOLD->value) {
                return false;
            }
            if ($lockedReservation->status !== ReservationStatus::ACTIVE->value) {
                throw new DomainException('Only active reservation can be sold.');
            }
            $inventory = Inventory::query()->lockForUpdate()->findOrFail($lockedReservation->inventory_id);
            $quantity = $lockedReservation->quantity;
            if ($inventory->reserved < $quantity || $inventory->on_hand < $quantity) {
                throw new DomainException('Inventory invariant violated.');
            }
            $inventory->decrementEach(['on_hand' => $quantity, 'reserved' => $quantity]);
            $inventory->increment('sold', $quantity);
            $inventory->refresh();
            $lockedReservation->update(['status' => ReservationStatus::SOLD->value, 'released_at' => now()]);
            $this->movement($inventory, InventoryMovementType::SELL, -$quantity, 'Reserved stock sold', InventoryReservation::class, $lockedReservation->id);

            return true;
        }, 3);
    }

    private function mutate(Inventory $inventory, int $onHandDelta, int $reservedDelta, int $soldDelta, InventoryMovementType $type, string $reason, ?User $actor): Inventory
    {
        return DB::transaction(function () use ($inventory, $onHandDelta, $reservedDelta, $soldDelta, $type, $reason, $actor): Inventory {
            $locked = Inventory::query()->lockForUpdate()->findOrFail($inventory->id);
            $newOnHand = $locked->on_hand + $onHandDelta;
            $newReserved = $locked->reserved + $reservedDelta;
            $newSold = $locked->sold + $soldDelta;
            if ($newOnHand < 0 || $newReserved < 0 || $newSold < 0 || $newReserved > $newOnHand) {
                throw new DomainException('Inventory cannot become negative or over-reserved.');
            }
            $locked->update(['on_hand' => $newOnHand, 'reserved' => $newReserved, 'sold' => $newSold]);
            $this->movement($locked, $type, $onHandDelta, $reason, null, null, $actor);

            return $locked->refresh();
        }, 3);
    }

    private function movement(Inventory $inventory, InventoryMovementType $type, int $delta, string $reason, ?string $referenceType = null, ?int $referenceId = null, ?User $actor = null): void
    {
        InventoryMovement::create(['inventory_id' => $inventory->id, 'type' => $type->value, 'quantity_delta' => $delta, 'on_hand_after' => $inventory->on_hand,
            'reserved_after' => $inventory->reserved, 'reference_type' => $referenceType, 'reference_id' => $referenceId, 'actor_id' => $actor?->id, 'reason' => $reason]);
    }
}
