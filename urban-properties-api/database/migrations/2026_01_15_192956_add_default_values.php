<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrator', 'sales_agent', 'buyer'])
                ->default('buyer')
                ->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->enum('status', ['available', 'reserved', 'sold'])
                ->default('available')
                ->change();

            $table->unsignedTinyInteger('bedrooms')
                ->default(0)
                ->change();

            $table->unsignedTinyInteger('bathrooms')
                ->default(0)
                ->change();
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])
                ->default('scheduled')
                ->change();
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
                ->default('pending')
                ->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'paid', 'failed'])
                ->default('pending')
                ->change();
        });
    }

    public function down(): void
    {
        // Uklanjanje DEFAULT vrednosti (MySQL) — mora raw SQL jer Schema builder nema pouzdano drop default.
        DB::statement("ALTER TABLE users MODIFY role ENUM('administrator','sales_agent','buyer') NOT NULL");

        DB::statement("ALTER TABLE properties MODIFY status ENUM('available','reserved','sold') NOT NULL");
        DB::statement("ALTER TABLE properties MODIFY bedrooms TINYINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE properties MODIFY bathrooms TINYINT UNSIGNED NOT NULL");

        DB::statement("ALTER TABLE viewing_appointments MODIFY status ENUM('scheduled','completed','cancelled') NOT NULL");

        DB::statement("ALTER TABLE offers MODIFY status ENUM('pending','accepted','rejected','withdrawn') NOT NULL");

        DB::statement("ALTER TABLE transactions MODIFY payment_status ENUM('pending','paid','failed') NOT NULL");
    }
};
