<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)->with(['items', 'shipment', 'payment'])->latest()->paginate(max(1, min((int) $request->input('per_page', 15), 50)));

        return response()->json(['data' => $orders->items(), 'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'per_page' => $orders->perPage(), 'total' => $orders->total()]]);
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->where('user_id', $request->user()->id)->with(['items', 'addresses', 'payment', 'shipment', 'statusHistories', 'refunds:id,order_id,status,amount,currency,completed_at'])->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function track(Request $request): JsonResponse
    {
        $data = $request->validate(['order_number' => ['required', 'string'], 'email' => ['required', 'email']]);
        $order = Order::where('order_number', $data['order_number'])->where('customer_email', $data['email'])->with(['shipment', 'statusHistories'])->firstOrFail();

        return response()->json(['data' => ['order_number' => $order->order_number, 'status' => $order->status, 'shipment' => $order->shipment, 'timeline' => $order->statusHistories]]);
    }
}
