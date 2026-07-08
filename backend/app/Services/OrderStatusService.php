<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class OrderStatusService
{
    public function submit(Order $order, User $user)
    {
        $this->authorize($user, $order, 'requester');
        $this->ensureState($order, ['draft']);

        if ($order->orderLines()->count() < 1) {
            throw new Exception("Order must have at least one item to submit.");
        }

        $this->transition($order, $user, 'submitted');
        return $order;
    }

    public function approve(Order $order, User $user)
    {
        $this->authorize($user, $order, 'approver');
        $this->ensureState($order, ['submitted']);

        // Check stock
        foreach ($order->orderLines as $line) {
            if ($line->item->stock < $line->quantity) {
                throw new Exception("Insufficient stock for item: " . $line->item->name);
            }
        }

        $this->transition($order, $user, 'approved');
        return $order;
    }

    public function reject(Order $order, User $user, string $reason)
    {
        $this->authorize($user, $order, 'approver');
        $this->ensureState($order, ['submitted']);

        $order->reject_reason = $reason;
        $order->save();

        $this->transition($order, $user, 'rejected', "Reason: $reason");
        return $order;
    }

    public function revise(Order $order, User $user)
    {
        $this->authorize($user, $order, 'requester');
        $this->ensureState($order, ['rejected']);

        $order->reject_reason = null;
        $order->save();

        $this->transition($order, $user, 'draft');
        return $order;
    }

    public function fulfill(Order $order, User $user)
    {
        $this->authorize($user, $order, 'approver');
        $this->ensureState($order, ['approved']);

        DB::transaction(function () use ($order, $user) {
            foreach ($order->orderLines as $line) {
                $item = $line->item()->lockForUpdate()->first();
                if ($item->stock < $line->quantity) {
                    throw new Exception("Insufficient stock for item: " . $item->name . " during fulfillment.");
                }
                $item->stock -= $line->quantity;
                $item->save();
            }
            $this->transition($order, $user, 'fulfilled');
        });

        return $order->refresh();
    }

    public function close(Order $order, User $user)
    {
        $this->authorize($user, $order, 'approver');
        $this->ensureState($order, ['fulfilled']);

        $this->transition($order, $user, 'closed');
        return $order;
    }

    public function cancel(Order $order, User $user)
    {
        $this->authorize($user, $order, 'requester');
        $this->ensureState($order, ['draft', 'submitted']);

        $this->transition($order, $user, 'cancelled');
        return $order;
    }

    private function authorize(User $user, Order $order, string $role)
    {
        if ($role === 'requester' && ($user->role !== 'requester' || $user->id !== $order->user_id)) {
            throw new Exception("Unauthorized: Only the owning customer can perform this action.");
        }
        if ($role === 'approver' && $user->role !== 'approver') {
            throw new Exception("Unauthorized: Only approvers can perform this action.");
        }
    }

    private function ensureState(Order $order, array $allowedStates)
    {
        if (!in_array($order->status, $allowedStates)) {
            throw new Exception("Invalid transition. Current status: {$order->status}");
        }
    }

    private function transition(Order $order, User $user, string $toStatus, string $comment = null)
    {
        $fromStatus = $order->status;
        $order->status = $toStatus;
        $order->save();

        $order->activityLogs()->create([
            'user_id' => $user->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'comment' => $comment,
        ]);
    }
}
