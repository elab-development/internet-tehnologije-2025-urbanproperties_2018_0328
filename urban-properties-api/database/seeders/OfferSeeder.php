<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class OfferSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::where('role', User::ROLE_BUYER)->get();

        $properties = Property::whereIn('status', [Property::STATUS_AVAILABLE, Property::STATUS_RESERVED])
            ->inRandomOrder()
            ->take(10)
            ->get();

        foreach ($properties as $property) {
            // 2 pending ponude.
            for ($i = 0; $i < 2; $i++) {
                $buyer = $buyers->random();

                Offer::factory()
                    ->pending()
                    ->for($property)
                    ->for($buyer, 'buyer')
                    ->create([
                         'sales_agent_id' => $property->sales_agent_id,
                        'amount' => round($property->price * fake()->randomFloat(2, 0.85, 1.05), 2),
                    ]);
            }

            // 1 accepted ponuda (ne uvek, da bude realnije).
            if (fake()->boolean(50)) {
                $buyer = $buyers->random();

                Offer::factory()
                    ->accepted()
                    ->for($property)
                    ->for($buyer, 'buyer')
                    ->create([
                        'sales_agent_id' => $property->sales_agent_id,
                        'amount' => round($property->price * fake()->randomFloat(2, 0.95, 1.10), 2),
                    ]);
            }
        }
    }
}
