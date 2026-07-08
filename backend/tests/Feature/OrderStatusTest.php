<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed'); // Seed roles and initial items
    }

    public function test_happy_path_transitions()
    {
        $customer = User::where('role', 'requester')->first();
        $approver = User::where('role', 'approver')->first();
        $item = Item::first();
        
        $initialStock = $item->stock;

        // Create Draft
        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 2]
            ]
        ]);
        $response->assertStatus(201);
        $orderId = $response->json('data.id');

        // Submit
        $this->actingAs($customer)->postJson("/api/orders/{$orderId}/submit")->assertStatus(200);

        // Approve
        $this->actingAs($approver)->postJson("/api/orders/{$orderId}/approve")->assertStatus(200);

        // Fulfill
        $this->actingAs($approver)->postJson("/api/orders/{$orderId}/fulfill")->assertStatus(200);
        
        // Assert Stock Deducted
        $this->assertEquals($initialStock - 2, $item->fresh()->stock);

        // Close
        $this->actingAs($approver)->postJson("/api/orders/{$orderId}/close")->assertStatus(200);
        
        $this->assertEquals('closed', Order::find($orderId)->status);
    }

    public function test_forbidden_case_requester_attempting_approval()
    {
        $customer = User::where('role', 'requester')->first();
        $item = Item::first();

        // Create Draft & Submit
        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 1]
            ]
        ]);
        $orderId = $response->json('data.id');
        $this->actingAs($customer)->postJson("/api/orders/{$orderId}/submit")->assertStatus(200);

        // Attempt Approval as Customer (Forbidden)
        $this->actingAs($customer)->postJson("/api/orders/{$orderId}/approve")
            ->assertStatus(400)
            ->assertJsonPath('message', 'Unauthorized: Only approvers can perform this action.');
    }

    public function test_fail_case_approve_with_insufficient_stock()
    {
        $customer = User::where('role', 'requester')->first();
        $approver = User::where('role', 'approver')->first();
        $item = Item::first();
        
        $overStockQuantity = $item->stock + 10;

        // Create Draft & Submit
        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'lines' => [
                ['item_id' => $item->id, 'quantity' => $overStockQuantity]
            ]
        ]);
        $orderId = $response->json('data.id');
        $this->actingAs($customer)->postJson("/api/orders/{$orderId}/submit")->assertStatus(200);

        // Attempt Approval (Fails)
        $this->actingAs($approver)->postJson("/api/orders/{$orderId}/approve")
            ->assertStatus(400)
            ->assertJsonPath('message', 'Insufficient stock for item: ' . $item->name);
    }
}
