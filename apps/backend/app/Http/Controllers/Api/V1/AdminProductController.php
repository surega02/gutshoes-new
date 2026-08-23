<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'in:DRAFT,PUBLISHED,ARCHIVED'], 'per_page' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $query = Product::with(['brand', 'categories', 'variants.size', 'images'])->latest();
        $query->when($data['search'] ?? null, fn ($q, $term) => $q->where('name', 'like', "%{$term}%"));
        $query->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status));

        return response()->json(['data' => $query->paginate($data['per_page'] ?? 25)]);
    }

    public function store(Request $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request): Product {
            $data = $this->validated($request);
            $categories = $data['category_ids'];
            $variants = $data['variants'];
            unset($data['category_ids'],$data['variants']);
            $product = Product::create($data);
            $product->categories()->sync($categories);
            $this->syncVariants($product, $variants);

            return $product;
        });

        return response()->json(['data' => $product->load(['brand', 'categories', 'variants.size', 'images'])], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product->load(['brand', 'categories', 'variants.size', 'images'])]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $data = $this->validated($request, $product);
            $categories = $data['category_ids'];
            $variants = $data['variants'];
            unset($data['category_ids'],$data['variants']);
            $product->update($data);
            $product->categories()->sync($categories);
            $this->syncVariants($product, $variants);
        });

        return response()->json(['data' => $product->refresh()->load(['brand', 'categories', 'variants.size', 'images'])]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function publish(Product $product): JsonResponse
    {
        abort_if($product->variants()->where('is_active', true)->doesntExist(), 422, 'Product requires an active variant.');
        $product->update(['status' => 'PUBLISHED', 'published_at' => now()]);

        return response()->json(['data' => $product]);
    }

    public function uploadImage(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate(['image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120', 'dimensions:min_width=300,min_height=300,max_width=4000,max_height=4000'], 'alt_text' => ['nullable', 'string', 'max:255'], 'is_primary' => ['sometimes', 'boolean']]);
        $path = $data['image']->store("products/{$product->id}", 'public');
        if ($data['is_primary'] ?? false) {
            $product->images()->update(['is_primary' => false]);
        }
        $image = $product->images()->create(['path' => $path, 'alt_text' => $data['alt_text'] ?? null, 'is_primary' => $data['is_primary'] ?? false, 'position' => (int) $product->images()->max('position') + 1]);

        return response()->json(['data' => $image], 201);
    }

    public function deleteImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);
        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string,mixed> */
    private function validated(Request $r, ?Product $p = null): array
    {
        return $r->validate(['brand_id' => ['required', 'integer', 'exists:brands,id'], 'name' => ['required', 'string', 'max:255'], 'slug' => ['required', 'alpha_dash', 'max:255', 'unique:products,slug,'.($p instanceof Product ? $p->id : 'NULL')],
            'description' => ['nullable', 'string', 'max:10000'], 'status' => ['sometimes', 'in:DRAFT,ARCHIVED'], 'category_ids' => ['required', 'array', 'min:1'], 'category_ids.*' => ['integer', 'exists:categories,id'],
            'variants' => ['required', 'array', 'min:1'], 'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'], 'variants.*.size_id' => ['required', 'integer', 'exists:sizes,id'],
            'variants.*.sku' => ['required', 'string', 'max:100'], 'variants.*.price' => ['required', 'decimal:0,2', 'min:0'], 'variants.*.currency' => ['sometimes', 'string', 'size:3'],
            'variants.*.weight_grams' => ['required', 'integer', 'min:1', 'max:100000'], 'variants.*.is_active' => ['sometimes', 'boolean']]);
    }

    /** @param array<int,array<string,mixed>> $variants */
    private function syncVariants(Product $product, array $variants): void
    {
        $kept = [];
        foreach ($variants as $data) {
            $id = $data['id'] ?? null;
            unset($data['id']);
            $variant = $id ? $product->variants()->whereKey($id)->firstOrFail() : $product->variants()->make();
            $variant->fill($data + ['currency' => 'IDR', 'is_active' => true])->save();
            $kept[] = $variant->id;
        } $product->variants()->whereNotIn('id', $kept)->update(['is_active' => false]);
    }
}
