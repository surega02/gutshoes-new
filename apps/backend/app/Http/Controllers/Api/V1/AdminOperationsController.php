<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Inventory\InventoryService;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderCancellation;
use App\Models\Payment;
use App\Models\Promotion;
use App\Models\Refund;
use App\Models\Shipment;
use App\Models\StoreConfiguration;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOperationsController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $lowStock = (int) (StoreConfiguration::where('key', 'low_stock_threshold')->value('value') ?? 5);

        return response()->json(['data' => [
            'orders' => ['pending_payment' => Order::where('status', 'PENDING_PAYMENT')->count(), 'paid' => Order::where('status', 'PAID')->count(), 'processing' => Order::where('status', 'PROCESSING')->count()],
            'revenue' => ['paid_total' => number_format((float) Order::whereIn('status', ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])->sum('grand_total'), 2, '.', ''), 'currency' => 'IDR'],
            'low_stock_count' => Inventory::whereRaw('(on_hand - reserved) <= ?', [$lowStock])->count(), 'low_stock_threshold' => $lowStock,
        ]]);
    }

    public function orders(Request $request): JsonResponse
    {
        return $this->listing(Order::query()->with(['payment', 'shipment']), $request, ['status', 'customer_email', 'order_number'], 'created_at');
    }

    public function payments(Request $request): JsonResponse
    {
        return $this->listing(Payment::query()->with('order'), $request, ['status', 'provider'], 'created_at');
    }

    public function shipments(Request $request): JsonResponse
    {
        return $this->listing(Shipment::query()->with('order'), $request, ['status', 'courier', 'service'], 'created_at');
    }

    public function cancellations(Request $request): JsonResponse
    {
        return $this->listing(OrderCancellation::query()->with('order'), $request, ['status'], 'created_at');
    }

    public function refunds(Request $request): JsonResponse
    {
        return $this->listing(Refund::query()->with(['order', 'payment']), $request, ['status'], 'created_at');
    }

    public function customers(Request $request): JsonResponse
    {
        return $this->listing(User::query()->where('role', 'CUSTOMER'), $request, ['email'], 'created_at');
    }

    public function promotions(Request $request): JsonResponse
    {
        return $this->listing(Promotion::query(), $request, ['type', 'is_active'], 'priority');
    }

    public function vouchers(Request $request): JsonResponse
    {
        return $this->listing(Voucher::query(), $request, ['type', 'is_active', 'code'], 'created_at');
    }

    public function inventories(Request $request): JsonResponse
    {
        return $this->listing(Inventory::query()->with(['warehouse', 'variant.product']), $request, ['warehouse_id', 'product_variant_id'], 'updated_at');
    }

    public function adjustInventory(Request $request, Inventory $inventory, InventoryService $service): JsonResponse
    {
        $data = $request->validate(['delta' => ['required', 'integer', 'not_in:0'], 'reason' => ['required', 'string', 'max:255']]);

        return response()->json(['data' => $service->adjust($inventory, $data['delta'], $data['reason'], $request->user())]);
    }

    public function configurations(): JsonResponse
    {
        return response()->json(['data' => StoreConfiguration::orderBy('key')->get()]);
    }

    public function updateConfiguration(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['value' => ['required'], 'is_public' => ['sometimes', 'boolean']]);
        $configuration = StoreConfiguration::updateOrCreate(['key' => $key], ['value' => $data['value'], 'is_public' => $data['is_public'] ?? false, 'updated_by' => $request->user()->id]);

        return response()->json(['data' => $configuration]);
    }

    public function savePromotion(Request $request, ?Promotion $promotion = null): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string'], 'type' => ['required', Rule::in(['PERCENTAGE', 'FIXED_AMOUNT'])], 'value' => ['required', 'numeric', 'min:0'],
            'priority' => ['required', 'integer', 'min:0'], 'starts_at' => ['required', 'date'], 'ends_at' => ['required', 'date', 'after:starts_at'], 'is_active' => ['required', 'boolean'], 'product_ids' => ['sometimes', 'array'], 'product_ids.*' => ['integer', 'exists:products,id']]);
        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);
        $promotion ??= new Promotion;
        $promotion->fill($data)->save();
        $promotion->products()->sync($productIds);

        return response()->json(['data' => $promotion->load('products')], $promotion->wasRecentlyCreated ? 201 : 200);
    }

    public function deletePromotion(Promotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function saveVoucher(Request $request, ?Voucher $voucher = null): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:64', Rule::unique('vouchers', 'code')->ignore($voucher?->id)], 'name' => ['required', 'string'],
            'type' => ['required', Rule::in(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])], 'value' => ['required', 'numeric', 'min:0'], 'minimum_amount' => ['required', 'numeric', 'min:0'],
            'maximum_discount' => ['nullable', 'numeric', 'min:0'], 'usage_limit' => ['nullable', 'integer', 'min:1'], 'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['required', 'date'], 'ends_at' => ['required', 'date', 'after:starts_at'], 'is_active' => ['required', 'boolean'], 'product_ids' => ['sometimes', 'array'], 'product_ids.*' => ['integer', 'exists:products,id']]);
        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);
        $voucher ??= new Voucher;
        $voucher->fill($data)->save();
        $voucher->products()->sync($productIds);

        return response()->json(['data' => $voucher->load('products')], $voucher->wasRecentlyCreated ? 201 : 200);
    }

    public function deleteVoucher(Voucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * @param Builder<*> $query
     * @param  list<string>  $filters
     */
    private function listing(Builder $query, Request $request, array $filters, string $defaultSort): JsonResponse
    {
        foreach ($filters as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }
        $direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';
        $sort = in_array($request->input('sort'), array_merge($filters, [$defaultSort]), true) ? $request->input('sort') : $defaultSort;
        $page = $query->orderBy($sort, $direction)->paginate(min(max((int) $request->input('per_page', 15), 1), 100));

        return response()->json(['data' => $page->items(), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]]);
    }
}
