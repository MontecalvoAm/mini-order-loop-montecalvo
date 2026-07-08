<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Filtered in controller
    }

    public function view(User $user, Order $order): bool
    {
        return $user->role === 'approver' || $user->id === $order->user_id;
    }

    public function create(User $user): bool
    {
        return $user->role === 'requester';
    }

    public function update(User $user, Order $order): bool
    {
        return $user->id === $order->user_id && $order->status === 'draft';
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->id === $order->user_id && $order->status === 'draft';
    }
}
