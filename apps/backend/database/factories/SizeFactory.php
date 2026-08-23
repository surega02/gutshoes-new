<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SizeFactory extends Factory
{
    public function definition(): array
    {
        $value = (string) fake()->unique()->numberBetween(36, 47);

        return ['system' => 'EU', 'value' => $value, 'label' => 'EU '.$value];
    }
}
