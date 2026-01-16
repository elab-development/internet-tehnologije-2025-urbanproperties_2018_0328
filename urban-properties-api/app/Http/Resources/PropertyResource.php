<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sales_agent_id' => $this->sales_agent_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'address' => $this->address,
            'city' => $this->city,
            'area_m2' => $this->area_m2,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'price' => $this->price,
            '3d_image_url' => $this->{'3d_image_url'},
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Opciono, samo ako je eager-loaded u kontroleru.
            'sales_agent' => $this->whenLoaded('salesAgent', function () {
                return (new UserResource($this->salesAgent))->resolve();
            }),
        ];
    }
}
