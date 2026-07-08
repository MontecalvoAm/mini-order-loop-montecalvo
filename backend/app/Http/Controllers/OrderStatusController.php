<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Exception;

class OrderStatusController extends Controller
{
    use ApiResponseTrait;

    protected $statusService;

    public function __construct(OrderStatusService $statusService)
    {
        $this->statusService = $statusService;
    }

    public function submit(Request $request, Order $order)
    {
        try {
            $this->statusService->submit($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order submitted');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function approve(Request $request, Order $order)
    {
        try {
            $this->statusService->approve($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order approved');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function reject(Request $request, Order $order)
    {
        $request->validate(['reason' => 'required|string']);
        try {
            $this->statusService->reject($order, $request->user(), $request->input('reason'));
            return $this->successResponse($order->load('activityLogs'), 'Order rejected');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function revise(Request $request, Order $order)
    {
        try {
            $this->statusService->revise($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order returned to draft');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function fulfill(Request $request, Order $order)
    {
        try {
            $this->statusService->fulfill($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order fulfilled');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function close(Request $request, Order $order)
    {
        try {
            $this->statusService->close($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order closed');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }

    public function cancel(Request $request, Order $order)
    {
        try {
            $this->statusService->cancel($order, $request->user());
            return $this->successResponse($order->load('activityLogs'), 'Order cancelled');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), [], 400);
        }
    }
}
