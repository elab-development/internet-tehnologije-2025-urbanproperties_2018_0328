<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Opciono: admin liste (setAttribute u AdminController).
            'properties_count' => $this->when(!is_null($this->properties_count), (int) $this->properties_count),
            'viewing_appointments_count' => $this->when(!is_null($this->viewing_appointments_count), (int) $this->viewing_appointments_count),
            'offers_count' => $this->when(!is_null($this->offers_count), (int) $this->offers_count),
            'transactions_count' => $this->when(!is_null($this->transactions_count), (int) $this->transactions_count),
        ];
    }
}
