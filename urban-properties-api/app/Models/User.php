<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'administrator';
    public const ROLE_SALES_AGENT = 'sales_agent';
    public const ROLE_BUYER = 'buyer';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // 1:N Agent -> Properties.
    public function properties()
    {
        return $this->hasMany(Property::class, 'sales_agent_id');
    }

    // 1:N Buyer -> ViewingAppointments.
    public function viewingAppointmentsAsBuyer()
    {
        return $this->hasMany(ViewingAppointment::class, 'buyer_id');
    }

    // 1:N Agent -> ViewingAppointments.
    public function viewingAppointmentsAsSalesAgent()
    {
        return $this->hasMany(ViewingAppointment::class, 'sales_agent_id');
    }

    // 1:N Buyer -> Offers.
    public function offers()
    {
        return $this->hasMany(Offer::class, 'buyer_id');
    }

    // 1:N Buyer -> Transactions.
    public function transactionsAsBuyer()
    {
        return $this->hasMany(Transaction::class, 'buyer_id');
    }

    // 1:N Agent -> Transactions.
    public function transactionsAsSalesAgent()
    {
        return $this->hasMany(Transaction::class, 'sales_agent_id');
    }
}
