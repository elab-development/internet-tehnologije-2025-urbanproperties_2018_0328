<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email');
            $table->timestamp('email_verified_at'); // bez nullable.
            $table->string('password');
            $table->string('phone'); // bez nullable.
            $table->enum('role', ['administrator', 'sales_agent', 'buyer']); // bez default.
            $table->string('remember_token', 100); // bez nullable.

            $table->timestamp('created_at'); // bez nullable i bez default.
            $table->timestamp('updated_at'); // bez nullable i bez default.
        });

        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('sales_agent_id'); // bez FK constraint.

            $table->string('title');
            $table->text('description'); // bez nullable.
            $table->string('type');
            $table->string('address');
            $table->string('city');
            $table->decimal('area_m2', 10, 2); // bez nullable.
            $table->unsignedTinyInteger('bedrooms'); // bez default.
            $table->unsignedTinyInteger('bathrooms'); // bez default.
            $table->decimal('price', 12, 2);
            $table->string('3d_image_url'); // bez nullable.
            $table->enum('status', ['available', 'reserved', 'sold']); // bez default.

            $table->timestamp('created_at');
            $table->timestamp('updated_at');
        });

        Schema::create('viewing_appointments', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id');   // bez FK constraint.
            $table->unsignedBigInteger('buyer_id');      // bez FK constraint.
            $table->unsignedBigInteger('sales_agent_id');// bez FK constraint.

            $table->timestamp('scheduled_at');
            $table->enum('status', ['scheduled', 'completed', 'cancelled']); // bez default.
            $table->text('notes'); // bez nullable.

            $table->timestamp('created_at');
            $table->timestamp('updated_at');
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('property_id');   // bez FK constraint.
            $table->unsignedBigInteger('buyer_id');      // bez FK constraint.
            $table->unsignedBigInteger('sales_agent_id');// bez FK constraint.

            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn']); // bez default.

            $table->timestamp('created_at');
            $table->timestamp('updated_at');
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('offer_id');      // bez FK constraint.
            $table->unsignedBigInteger('property_id');   // bez FK constraint.
            $table->unsignedBigInteger('buyer_id');      // bez FK constraint.
            $table->unsignedBigInteger('sales_agent_id');// bez FK constraint.

            $table->decimal('final_price', 12, 2);
            $table->timestamp('signed_at'); // bez nullable.
            $table->enum('payment_status', ['pending', 'paid', 'failed']); // bez default.

            $table->timestamp('created_at');
            $table->timestamp('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('viewing_appointments');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('users');
    }
};
