<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        $city = fake()->randomElement(['Beograd', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica']);
        $type = fake()->randomElement(['apartment', 'house', 'studio', 'office']);

        return [
            'sales_agent_id' => User::factory()->salesAgent(),
            'title' => ucfirst($type) . " u gradu {$city}",
            'description' => fake()->sentence(12),
            'type' => $type,
            'address' => fake()->streetAddress(),
            'city' => $city,
            'area_m2' => fake()->randomFloat(2, 25, 250),
            'bedrooms' => fake()->numberBetween(0, 5),
            'bathrooms' => fake()->numberBetween(1, 3),
            'price' => fake()->randomFloat(2, 35000, 450000),
            '3d_image_url' => fake()->optional()->url(),
            'status' => Property::STATUS_AVAILABLE,
        ];
    }

    public function available(): static
    {
        return $this->state(fn () => ['status' => Property::STATUS_AVAILABLE]);
    }

    public function reserved(): static
    {
        return $this->state(fn () => ['status' => Property::STATUS_RESERVED]);
    }

    public function sold(): static
    {
        return $this->state(fn () => ['status' => Property::STATUS_SOLD]);
    }
}
