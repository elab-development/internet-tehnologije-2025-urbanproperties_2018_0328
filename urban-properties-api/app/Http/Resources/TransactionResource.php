<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'offer_id' => $this->offer_id,
            'buyer_id' => $this->buyer_id,
            'sales_agent_id' => $this->sales_agent_id,
            'final_price' => $this->final_price,
            'signed_at' => $this->signed_at,
            'payment_status' => $this->payment_status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'offer' => $this->whenLoaded('offer', function () {
                return (new OfferResource($this->offer))->resolve();
            }),

            // Nekretnina ide preko offer->property.
            'property' => $this->whenLoaded('offer', function () {
                if (!$this->offer?->relationLoaded('property')) {
                    return null;
                }
                return (new PropertyResource($this->offer->property))->resolve();
            }),

            'buyer' => $this->whenLoaded('buyer', function () {
                return (new UserResource($this->buyer))->resolve();
            }),
            'sales_agent' => $this->whenLoaded('salesAgent', function () {
                return (new UserResource($this->salesAgent))->resolve();
            }),
        ];
    }
}
