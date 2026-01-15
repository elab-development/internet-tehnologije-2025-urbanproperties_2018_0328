<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Property extends Model
{
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_SOLD = 'sold';

    protected $fillable = [
        'sales_agent_id',
        'title',
        'description',
        'type',
        'address',
        'city',
        'area_m2',
        'bedrooms',
        'bathrooms',
        'price',
        '3d_image_url',
        'status',
    ];

    protected $casts = [
        'area_m2' => 'decimal:2',
        'price' => 'decimal:2',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
    ];

    // N:1 Property -> User (sales_agent).
    public function salesAgent()
    {
        return $this->belongsTo(User::class, 'sales_agent_id');
    }

    // 1:N Property -> ViewingAppointments.
    public function viewingAppointments()
    {
        return $this->hasMany(ViewingAppointment::class);
    }

    // 1:N Property -> Offers.
    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

}
