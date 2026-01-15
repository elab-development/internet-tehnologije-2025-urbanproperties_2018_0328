<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ViewingAppointment extends Model
{
    use HasFactory;

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'property_id',
        'buyer_id',
        'sales_agent_id',
        'scheduled_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    // N:1 ViewingAppointment -> Property.
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // N:1 ViewingAppointment -> User (buyer).
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // N:1 ViewingAppointment -> User (sales_agent).
    public function salesAgent()
    {
        return $this->belongsTo(User::class, 'sales_agent_id');
    }
}
