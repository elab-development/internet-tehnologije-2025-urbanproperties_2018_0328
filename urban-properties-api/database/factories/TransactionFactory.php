<?php

namespace Database\Factories;

use App\Models\Offer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'offer_id' => Offer::factory(),
            'property_id' => Property::factory(),
            'buyer_id' => User::factory()->buyer(),
            'sales_agent_id' => User::factory()->salesAgent(),
            'final_price' => fake()->randomFloat(2, 30000, 450000),
            'signed_at' => fake()->optional()->dateTimeBetween('-30 days', 'now'),
            'payment_status' => Transaction::PAYMENT_PENDING,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['payment_status' => Transaction::PAYMENT_PAID]);
    }

    public function failed(): static
    {
        return $this->state(fn () => ['payment_status' => Transaction::PAYMENT_FAILED]);
    }

    public function pending(): static
    {
        return $this->state(fn () => ['payment_status' => Transaction::PAYMENT_PENDING]);
    }
}
