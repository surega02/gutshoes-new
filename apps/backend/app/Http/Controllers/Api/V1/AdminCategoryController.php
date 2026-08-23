<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Category::with('parent')->latest()->paginate(25)]);
    }

    public function store(Request $r): JsonResponse
    {
        $d = $this->data($r);

        return response()->json(['data' => Category::create($d)], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json(['data' => $category]);
    }

    public function update(Request $r, Category $category): JsonResponse
    {
        $category->update($this->data($r, $category));

        return response()->json(['data' => $category->refresh()]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string,mixed> */
    private function data(Request $r, ?Category $category = null): array
    {
        return $r->validate(['parent_id' => ['nullable', 'integer', 'exists:categories,id', 'not_in:'.($category instanceof Category ? $category->id : 0)], 'name' => ['required', 'string', 'max:255'], 'slug' => ['required', 'alpha_dash', 'max:255', 'unique:categories,slug,'.($category instanceof Category ? $category->id : 'NULL')], 'description' => ['nullable', 'string', 'max:2000']]);
    }
}
