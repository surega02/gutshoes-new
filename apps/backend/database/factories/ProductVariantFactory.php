<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Size;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        return ['product_id' => Product::factory(), 'size_id' => Size::factory(), 'sku' => 'DEV-'.fake()->unique()->numerify('######'), 'price' => fake()->randomElement([399000, 499000, 699000]), 'currency' => 'IDR', 'weight_grams' => fake()->numberBetween(500, 1500), 'is_active' => true];
    }
}
