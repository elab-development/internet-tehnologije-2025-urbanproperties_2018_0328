<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\User;
use App\Models\ViewingAppointment;
use Illuminate\Database\Seeder;

class ViewingAppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::where('role', User::ROLE_BUYER)->get();

        $properties = Property::whereIn('status', [Property::STATUS_AVAILABLE, Property::STATUS_RESERVED])
            ->inRandomOrder()
            ->take(12)
            ->get();

        foreach ($properties as $property) {
            $buyer = $buyers->random();

            ViewingAppointment::factory()
                ->for($property)                 // property_id.
                ->for($buyer, 'buyer')           // buyer_id.
                ->for($property->salesAgent, 'salesAgent') // sales_agent_id.
                ->create([
                    'status' => fake()->randomElement([
                        ViewingAppointment::STATUS_SCHEDULED,
                        ViewingAppointment::STATUS_COMPLETED,
                        ViewingAppointment::STATUS_CANCELLED,
                    ]),
                ]);
        }
    }
}
