<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class WarehouseFactory extends Factory
{
    public function definition(): array
    {
        return ['code' => 'DEV-'.fake()->unique()->numerify('###'), 'name' => fake()->company().' Warehouse', 'address_line' => fake()->streetAddress(), 'province' => 'DKI Jakarta', 'city' => 'Jakarta Selatan', 'district' => 'Kebayoran Baru', 'postal_code' => '12110', 'is_active' => true];
    }
}
