<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('sales_agent_id');

            $table->string('title');
            $table->text('description');
            $table->string('type');
            $table->string('address');
            $table->string('city');
            $table->decimal('area_m2', 10, 2);
            $table->unsignedTinyInteger('bedrooms');
            $table->unsignedTinyInteger('bathrooms');
            $table->decimal('price', 12, 2);
            $table->string('3d_image_url');
            $table->enum('status', ['available', 'reserved', 'sold']);

            // BITNO: DATETIME umesto TIMESTAMP (bez default vrednosti).
            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });

        Schema::create('viewing_appointments', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id');
            $table->unsignedBigInteger('buyer_id');
            $table->unsignedBigInteger('sales_agent_id');

            $table->timestamp('scheduled_at');
            $table->enum('status', ['scheduled', 'completed', 'cancelled']);
            $table->text('notes');

            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id');
            $table->unsignedBigInteger('buyer_id');
            $table->unsignedBigInteger('transaction_id')->nullable();

            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn']);

            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('offer_id');
            $table->unsignedBigInteger('buyer_id');
            $table->unsignedBigInteger('sales_agent_id');

            $table->decimal('final_price', 12, 2);
            $table->timestamp('signed_at');
            $table->enum('payment_status', ['pending', 'paid', 'failed']);

            $table->dateTime('created_at');
            $table->dateTime('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('viewing_appointments');
        Schema::dropIfExists('properties');
    }
};
