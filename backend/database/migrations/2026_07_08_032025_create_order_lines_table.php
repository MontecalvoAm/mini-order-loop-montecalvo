<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->integer('quantity');
            $table->decimal('price_snapshot', 10, 2);
            $table->timestamps();
            
            $table->index('order_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_lines');
    }
};
