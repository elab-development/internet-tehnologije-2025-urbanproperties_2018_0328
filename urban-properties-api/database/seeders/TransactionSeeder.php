<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\Property;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $acceptedOffers = Offer::with('property') // da $offer->property radi bez N+1.
            ->where('status', Offer::STATUS_ACCEPTED)
            ->doesntHave('transaction')
            ->get();

        foreach ($acceptedOffers as $offer) {
            $property = $offer->property;

            Transaction::factory()->create([
                'offer_id' => $offer->id,
                'property_id' => $offer->property_id,
                'buyer_id' => $offer->buyer_id,
                'sales_agent_id' => $property->sales_agent_id,
                'final_price' => $offer->amount,
                'signed_at' => now()->subDays(fake()->numberBetween(0, 30)),
                'payment_status' => fake()->randomElement([
                    Transaction::PAYMENT_PENDING,
                    Transaction::PAYMENT_PAID,
                ]),
            ]);

            $property->update(['status' => Property::STATUS_SOLD]);
        }
    }
}
