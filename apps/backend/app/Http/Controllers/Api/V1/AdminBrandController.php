<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBrandController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Brand::latest()->paginate(25)]);
    }

    public function store(Request $r): JsonResponse
    {
        $d = $r->validate(['name' => ['required', 'string', 'max:255', 'unique:brands'], 'slug' => ['required', 'alpha_dash', 'max:255', 'unique:brands'], 'description' => ['nullable', 'string', 'max:2000']]);

        return response()->json(['data' => Brand::create($d)], 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return response()->json(['data' => $brand]);
    }

    public function update(Request $r, Brand $brand): JsonResponse
    {
        $d = $r->validate(['name' => ['required', 'string', 'max:255', 'unique:brands,name,'.$brand->id], 'slug' => ['required', 'alpha_dash', 'max:255', 'unique:brands,slug,'.$brand->id], 'description' => ['nullable', 'string', 'max:2000']]);
        $brand->update($d);

        return response()->json(['data' => $brand->refresh()]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
