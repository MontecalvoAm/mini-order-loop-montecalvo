<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Users
        User::create([
            'name' => 'Rita Requester',
            'email' => 'requester@demo.test',
            'password' => Hash::make('password'),
            'role' => 'requester',
        ]);

        User::create([
            'name' => 'Alan Approver',
            'email' => 'approver@demo.test',
            'password' => Hash::make('password'),
            'role' => 'approver',
        ]);

        // Items
        $items = [
            ['name' => 'Laptop', 'sku' => 'ITM-001', 'price' => 999.99, 'stock' => 50],
            ['name' => 'Mouse', 'sku' => 'ITM-002', 'price' => 25.50, 'stock' => 200],
            ['name' => 'Keyboard', 'sku' => 'ITM-003', 'price' => 45.00, 'stock' => 150],
            ['name' => 'Monitor', 'sku' => 'ITM-004', 'price' => 199.99, 'stock' => 80],
            ['name' => 'Webcam', 'sku' => 'ITM-005', 'price' => 59.99, 'stock' => 120],
            ['name' => 'Headset', 'sku' => 'ITM-006', 'price' => 89.99, 'stock' => 90],
            ['name' => 'USB-C Hub', 'sku' => 'ITM-007', 'price' => 35.00, 'stock' => 300],
            ['name' => 'Desk Mat', 'sku' => 'ITM-008', 'price' => 19.99, 'stock' => 250],
            ['name' => 'Office Chair', 'sku' => 'ITM-009', 'price' => 249.99, 'stock' => 40],
            ['name' => 'Standing Desk', 'sku' => 'ITM-010', 'price' => 399.99, 'stock' => 20],
        ];

        foreach ($items as $item) {
            Item::create($item);
        }
    }
}
