<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Shipping\RegionAddressResolver;
use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->addresses()->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $address = DB::transaction(function () use ($request): Address {
            $data = $this->validated($request);
            if ($data['is_default'] ?? false) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            return $request->user()->addresses()->create($data);
        });

        return response()->json(['data' => $address], 201);
    }

    public function show(Request $request, Address $address): JsonResponse
    {
        $this->authorize('view', $address);

        return response()->json(['data' => $address]);
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);
        DB::transaction(function () use ($request, $address): void {
            $data = $this->validated($request);
            if ($data['is_default'] ?? false) {
                $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            } $address->update($data);
        });

        return response()->json(['data' => $address->refresh()]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorize('delete', $address);
        $address->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?RegionAddressResolver $regions = null): array
    {
        $data = $request->validate(['label' => ['required', 'string', 'max:64'], 'recipient_name' => ['required', 'string', 'max:255'], 'phone' => ['required', 'string', 'max:32'],
            'address_line' => ['required', 'string', 'max:500'], 'postal_code' => ['required', 'string', 'max:10'], 'province_code' => ['required', 'exists:region_provinces,code'], 'regency_code' => ['required', 'exists:region_regencies,code'], 'district_code' => ['required', 'exists:region_districts,code'], 'village_code' => ['required', 'exists:region_villages,code'], 'provider_area_id' => ['nullable', 'string', 'max:255'], 'is_default' => ['sometimes', 'boolean']]);

        return ($regions ?? app(RegionAddressResolver::class))->resolve($data);
    }
}
