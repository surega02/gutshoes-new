<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Payment\CreatePaymentService;
use App\Domain\Payment\ProcessMidtransWebhook;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(Request $request, string $orderNumber, CreatePaymentService $payments): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $order = Order::where('order_number', $orderNumber)->where('customer_email', $data['email'])->firstOrFail();
        if ($request->user() && $order->user_id && $order->user_id !== $request->user()->id) {
            abort(403);
        }
        $result = $payments->create($order);

        return response()->json(['data' => ['payment' => $result['payment'], 'redirect_url' => $result['redirect_url']]], 201);
    }

    public function webhook(Request $request, ProcessMidtransWebhook $webhooks): JsonResponse
    {
        $event = $webhooks->handle($request->all());

        return response()->json(['data' => ['accepted' => true, 'event_id' => $event->event_id]]);
    }
}
