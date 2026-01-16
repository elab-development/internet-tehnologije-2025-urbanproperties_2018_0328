<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ViewingAppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'buyer_id' => $this->buyer_id,
            'sales_agent_id' => $this->sales_agent_id,
            'scheduled_at' => $this->scheduled_at,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'property' => $this->whenLoaded('property', function () {
                return (new PropertyResource($this->property))->resolve();
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
