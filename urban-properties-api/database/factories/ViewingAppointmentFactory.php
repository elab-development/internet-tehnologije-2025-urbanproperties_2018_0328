<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use App\Models\ViewingAppointment;
use Illuminate\Database\Eloquent\Factories\Factory;

class ViewingAppointmentFactory extends Factory
{
    protected $model = ViewingAppointment::class;

    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'buyer_id' => User::factory()->buyer(),
            'sales_agent_id' => User::factory()->salesAgent(),
            'scheduled_at' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'status' => ViewingAppointment::STATUS_SCHEDULED,
            'notes' => fake()->optional()->sentence(10),
        ];
    }

    public function scheduled(): static
    {
        return $this->state(fn () => ['status' => ViewingAppointment::STATUS_SCHEDULED]);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => ViewingAppointment::STATUS_COMPLETED]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => ViewingAppointment::STATUS_CANCELLED]);
    }
}
