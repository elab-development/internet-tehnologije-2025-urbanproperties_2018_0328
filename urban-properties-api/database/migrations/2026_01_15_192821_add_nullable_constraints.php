<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->string('remember_token', 100)->nullable()->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
            $table->decimal('area_m2', 10, 2)->nullable()->change();
            $table->string('3d_image_url')->nullable()->change();
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->text('notes')->nullable()->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('signed_at')->nullable()->change();
        });

        // DODATO: offers.transaction_id nullable
        Schema::table('offers', function (Blueprint $table) {
            // prvo skloni FK da bi mogao da menjaš kolonu
            $table->dropForeign(['transaction_id']);
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->unsignedBigInteger('transaction_id')->nullable()->change();
        });

        Schema::table('offers', function (Blueprint $table) {
            // vrati FK (preporuka: kad se transaction obriše -> transaction_id postaje NULL)
            $table->foreign('transaction_id')
                ->references('id')->on('transactions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable(false)->change();
            $table->string('phone')->nullable(false)->change();
            $table->string('remember_token', 100)->nullable(false)->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->text('description')->nullable(false)->change();
            $table->decimal('area_m2', 10, 2)->nullable(false)->change();
            $table->string('3d_image_url')->nullable(false)->change();
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->text('notes')->nullable(false)->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('signed_at')->nullable(false)->change();
        });

        // rollback za offers.transaction_id
        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['transaction_id']);
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->unsignedBigInteger('transaction_id')->nullable(false)->change();
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->foreign('transaction_id')
                ->references('id')->on('transactions')
                ->restrictOnDelete();
        });
    }
};
