<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Order\CancelOrderService;
use App\Domain\Order\OrderAccess;
use App\Domain\Refund\ProcessRefundService;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Refund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CancellationRefundController extends Controller
{
    public function cancel(Request $request, string $orderNumber, CancelOrderService $cancellations, OrderAccess $access): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        $key = $request->header('Idempotency-Key');
        abort_unless(is_string($key) && strlen($key) >= 16 && strlen($key) <= 128, 422, 'A valid Idempotency-Key header is required.');
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $access->authorize($request, $order);
        $cancellation = $cancellations->cancel($order, $data['reason'], $key, $request->user()?->id);

        if ($request->user()?->role === UserRole::ADMIN) {
            AuditLog::create([
                'admin_id' => $request->user()->id, 'action' => 'cancel',
                'entity_type' => Order::class, 'entity_id' => $order->id,
                'description' => 'Cancel order '.$order->order_number,
                'metadata' => ['reason' => $data['reason']],
                'request_id' => $request->attributes->get('request_id'),
            ]);
        }

        return response()->json(['data' => ['cancellation' => $cancellation, 'refund' => Refund::where('order_id', $order->id)->first()]], 201);
    }

    public function refund(Refund $refund, ProcessRefundService $refunds): JsonResponse
    {
        return response()->json(['data' => $refunds->process($refund)]);
    }
}
