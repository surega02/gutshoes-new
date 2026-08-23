<?php

namespace App\Policies;

use App\Models\Address;
use App\Models\User;

class AddressPolicy
{
    public function before(User $user): ?bool
    {
        return $user->role->value === 'ADMIN' ? true : null;
    }

    public function view(User $user, Address $address): bool
    {
        return $address->user_id === $user->id;
    }

    public function update(User $user, Address $address): bool
    {
        return $this->view($user, $address);
    }

    public function delete(User $user, Address $address): bool
    {
        return $this->view($user, $address);
    }
}
