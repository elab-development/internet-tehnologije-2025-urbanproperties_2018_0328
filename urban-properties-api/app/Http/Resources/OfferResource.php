<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'buyer_id' => $this->buyer_id,
            'transaction_id' => $this->transaction_id,
            'amount' => $this->amount,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Ako ti treba agent za UI, uzmi ga preko property-ja.
            'sales_agent_id' => $this->whenLoaded('property', function () {
                return $this->property?->sales_agent_id;
            }),

            'property' => $this->whenLoaded('property', function () {
                return (new PropertyResource($this->property))->resolve();
            }),
            'buyer' => $this->whenLoaded('buyer', function () {
                return (new UserResource($this->buyer))->resolve();
            }),
            'transaction' => $this->whenLoaded('transaction', function () {
                return (new TransactionResource($this->transaction))->resolve();
            }),
        ];
    }
}
