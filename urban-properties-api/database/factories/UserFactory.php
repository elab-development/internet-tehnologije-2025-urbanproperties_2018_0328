<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => 'password', // hashed cast u User modelu odradi hash.
            'phone' => fake()->optional()->phoneNumber(),
            'role' => User::ROLE_BUYER,
            'remember_token' => Str::random(10),
        ];
    }

    public function administrator(): static
    {
        return $this->state(fn () => [
            'role' => User::ROLE_ADMIN,
        ]);
    }

    public function salesAgent(): static
    {
        return $this->state(fn () => [
            'role' => User::ROLE_SALES_AGENT,
        ]);
    }

    public function buyer(): static
    {
        return $this->state(fn () => [
            'role' => User::ROLE_BUYER,
        ]);
    }
}
