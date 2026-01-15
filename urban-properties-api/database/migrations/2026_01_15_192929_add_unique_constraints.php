<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->unique(['property_id', 'scheduled_at']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->unique('offer_id'); // 1:1 Transaction–Offer.
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique(['offer_id']);
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->dropUnique('viewing_appointments_property_id_scheduled_at_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });
    }
};
