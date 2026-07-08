<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $query = Order::with('user', 'orderLines.item')->orderBy('created_at', 'desc');

        // Role-based filtering
        if ($request->user()->role !== 'approver') {
            $query->where('user_id', $request->user()->id);
        }

        // Search by order ID or Item Name
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('orderLines.item', function ($qItem) use ($search) {
                      $qItem->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return $this->successResponse($query->get());
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Order::class);

        $validated = $request->validate([
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'status' => 'draft',
                'total_price' => 0,
            ]);

            $totalPrice = 0;
            foreach ($validated['lines'] as $line) {
                $item = Item::find($line['item_id']);
                $order->orderLines()->create([
                    'item_id' => $item->id,
                    'quantity' => $line['quantity'],
                    'price_snapshot' => $item->price,
                ]);
                $totalPrice += $item->price * $line['quantity'];
            }

            $order->update(['total_price' => $totalPrice]);

            $order->activityLogs()->create([
                'user_id' => $request->user()->id,
                'to_status' => 'draft',
                'comment' => 'Order drafted',
            ]);

            return $this->successResponse($order->load('orderLines'), 'Order created in draft', 201);
        });
    }

    public function show(Order $order)
    {
        Gate::authorize('view', $order);
        return $this->successResponse($order->load(['orderLines.item', 'activityLogs.user']));
    }

    public function update(Request $request, Order $order)
    {
        Gate::authorize('update', $order);

        $validated = $request->validate([
            'lines' => 'required|array|min:1',
            'lines.*.item_id' => 'required|exists:items,id',
            'lines.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated, $order) {
            $order->orderLines()->delete();

            $totalPrice = 0;
            foreach ($validated['lines'] as $line) {
                $item = Item::find($line['item_id']);
                $order->orderLines()->create([
                    'item_id' => $item->id,
                    'quantity' => $line['quantity'],
                    'price_snapshot' => $item->price,
                ]);
                $totalPrice += $item->price * $line['quantity'];
            }

            $order->update(['total_price' => $totalPrice]);

            return $this->successResponse($order->load('orderLines'), 'Order draft updated');
        });
    }

    public function destroy(Order $order)
    {
        Gate::authorize('delete', $order);
        $order->delete();
        return $this->successResponse(null, 'Order draft deleted');
    }
}
