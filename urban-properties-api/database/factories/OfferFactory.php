<?php

namespace Database\Factories;

use App\Models\Offer;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OfferFactory extends Factory
{
    protected $model = Offer::class;

    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'buyer_id' => User::factory()->buyer(),
            'sales_agent_id' => User::factory()->salesAgent(),
            'amount' => fake()->randomFloat(2, 30000, 450000),
            'status' => Offer::STATUS_PENDING,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => Offer::STATUS_PENDING]);
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => Offer::STATUS_ACCEPTED]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => Offer::STATUS_REJECTED]);
    }

    public function withdrawn(): static
    {
        return $this->state(fn () => ['status' => Offer::STATUS_WITHDRAWN]);
    }
}
