<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Offer extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'property_id',
        'buyer_id',
        'sales_agent_id',
        'amount',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // N:1 Offer -> Property.
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // N:1 Offer -> User (buyer).
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // 1:1 Offer -> Transaction (opciono, kad ponuda postane kupoprodaja).
    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }
}
