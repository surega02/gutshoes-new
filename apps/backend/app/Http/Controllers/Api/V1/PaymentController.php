<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Order\OrderAccess;
use App\Domain\Payment\CreatePaymentService;
use App\Domain\Payment\ProcessMidtransWebhook;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(Request $request, string $orderNumber, CreatePaymentService $payments, OrderAccess $access): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $access->authorize($request, $order);
        $result = $payments->create($order);

        return response()->json(['data' => ['payment' => $result['payment'], 'redirect_url' => $result['redirect_url']]], 201);
    }

    public function webhook(Request $request, ProcessMidtransWebhook $webhooks): JsonResponse
    {
        $request->validate([
            'order_id' => ['required', 'string', 'max:255'],
            'transaction_id' => ['required', 'string', 'max:255'],
            'transaction_status' => ['required', 'string', 'max:32'],
            'status_code' => ['required', 'string', 'max:8'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'signature_key' => ['required', 'string', 'max:128'],
            'fraud_status' => ['sometimes', 'string', 'max:32'],
        ]);
        $event = $webhooks->handle($request->all());

        return response()->json(['data' => ['accepted' => true, 'event_id' => $event->event_id]]);
    }
}
