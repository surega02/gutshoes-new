<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Order\FulfillmentService;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminFulfillmentController extends Controller
{
    public function update(Request $request, Order $order, FulfillmentService $fulfillment): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['PROCESSING', 'SHIPPED', 'DELIVERED'])], 'tracking_number' => ['nullable', 'string', 'max:255'], 'note' => ['nullable', 'string', 'max:255']]);
        $order = $fulfillment->transition($order, $data['status'], $data, $request->user()->id);

        return response()->json(['data' => $order]);
    }
}
