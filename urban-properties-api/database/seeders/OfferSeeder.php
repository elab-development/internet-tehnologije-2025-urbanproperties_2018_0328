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
        $buyerIds = User::where('role', User::ROLE_BUYER)->pluck('id');
        if ($buyerIds->isEmpty()) {
            return;
        }

        $properties = Property::whereIn('status', [
                Property::STATUS_AVAILABLE,
                Property::STATUS_RESERVED,
            ])
            ->inRandomOrder()
            ->limit(10)
            ->get(['id', 'price', 'status']);

        $now = now();
        $rows = [];

        foreach ($properties as $property) {

            // 2 pending ponude.
            for ($i = 0; $i < 2; $i++) {
                $rows[] = [
                    'property_id'    => $property->id,
                    'buyer_id'       => $buyerIds->random(),
                    'transaction_id' => null,
                    'status'         => Offer::STATUS_PENDING,
                    'amount'         => round($property->price * fake()->randomFloat(2, 0.85, 1.05), 2),
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];
            }

            // 1 accepted ponuda (50%).
            if (fake()->boolean(50)) {
                $rows[] = [
                    'property_id'    => $property->id,
                    'buyer_id'       => $buyerIds->random(),
                    'transaction_id' => null,
                    'status'         => Offer::STATUS_ACCEPTED,
                    'amount'         => round($property->price * fake()->randomFloat(2, 0.95, 1.10), 2),
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];

                if ($property->status === Property::STATUS_AVAILABLE) {
                    $property->updateQuietly(['status' => Property::STATUS_RESERVED]);
                }
            }
        }

        // Jedan upis u bazu. Nema factory-ja. Nema afterCreating spirale.
        Offer::insert($rows);
    }
}
