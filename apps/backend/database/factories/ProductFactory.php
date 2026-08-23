<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return ['brand_id' => Brand::factory(), 'name' => str($name)->title(), 'slug' => str($name)->slug(), 'description' => fake()->sentence(), 'status' => 'PUBLISHED', 'published_at' => now()];
    }
}
