<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->foreign('sales_agent_id')->references('id')->on('users')->restrictOnDelete();
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->foreign('property_id')->references('id')->on('properties')->restrictOnDelete();
            $table->foreign('buyer_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('sales_agent_id')->references('id')->on('users')->restrictOnDelete();
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->foreign('property_id')->references('id')->on('properties')->restrictOnDelete();
            $table->foreign('buyer_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('transaction_id')->references('id')->on('transactions')->restrictOnDelete();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('offer_id')->references('id')->on('offers')->restrictOnDelete();
            $table->foreign('buyer_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('sales_agent_id')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['offer_id']);
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['sales_agent_id']);
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['transaction_id']);
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['sales_agent_id']);
        });

        Schema::table('viewing_appointments', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['sales_agent_id']);
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropForeign(['sales_agent_id']);
        });
    }
};
