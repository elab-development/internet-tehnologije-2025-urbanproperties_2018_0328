<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';

    protected $fillable = [
        'offer_id',
        'property_id',
        'buyer_id',
        'sales_agent_id',
        'final_price',
        'signed_at',
        'payment_status',
    ];

    protected $casts = [
        'final_price' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    // N:1 Transaction -> Offer (u praksi 1:1 preko unique offer_id u bazi).
    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    // N:1 Transaction -> User (buyer).
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // N:1 Transaction -> User (sales_agent).
    public function salesAgent()
    {
        return $this->belongsTo(User::class, 'sales_agent_id');
    }
}
