<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'brand' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'], 'size' => ['nullable', 'string', 'max:16'], 'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', $request->filled('min_price') ? 'gte:min_price' : 'min:0'], 'sort' => ['nullable', 'in:newest,price_asc,price_desc,name,best_selling'], 'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48']]);
        $query = Product::query()->where('status', 'PUBLISHED')->with(['brand', 'images', 'categories', 'variants.size', 'variants.inventories']);
        $query->when($data['search'] ?? null, fn (Builder $q, string $term) => $q->where(fn (Builder $inner) => $inner->where('name', 'like', "%{$term}%")
            ->orWhereHas('brand', fn (Builder $b) => $b->where('name', 'like', "%{$term}%"))->orWhereHas('variants', fn (Builder $v) => $v->where('sku', 'like', "%{$term}%"))));
        $query->when($data['brand'] ?? null, fn (Builder $q, string $slug) => $q->whereHas('brand', fn (Builder $b) => $b->where('slug', $slug)));
        $query->when($data['category'] ?? null, fn (Builder $q, string $slug) => $q->whereHas('categories', fn (Builder $cat) => $cat->where(fn (Builder $match) => $match->where('slug', $slug)->orWhere('name', $slug))));
        $query->when($data['size'] ?? null, fn (Builder $q, string $size) => $q->whereHas('variants', fn (Builder $v) => $v->whereHas('size', fn (Builder $s) => $s->where('value', $size))->whereHas('inventories', fn (Builder $i) => $i->whereColumn('on_hand', '>', 'reserved'))));
        if (isset($data['min_price']) || isset($data['max_price'])) {
            $query->whereHas('variants', function (Builder $variant) use ($data): void {
                if (isset($data['min_price'])) {
                    $variant->where('price', '>=', $data['min_price']);
                }
                if (isset($data['max_price'])) {
                    $variant->where('price', '<=', $data['max_price']);
                }
            });
        }
        match ($data['sort'] ?? 'newest') {
            'name' => $query->orderBy('name'),
            'price_asc' => $query->orderByRaw('(select min(price) from product_variants where product_id=products.id and deleted_at is null) asc'),
            'price_desc' => $query->orderByRaw('(select min(price) from product_variants where product_id=products.id and deleted_at is null) desc'),
            'best_selling' => $query->orderByDesc(DB::table('order_items')
                ->join('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->whereColumn('product_variants.product_id', 'products.id')
                ->whereIn('orders.status', ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
                ->selectRaw('coalesce(sum(order_items.quantity), 0)')),
            default => $query->latest('published_at'),
        };
        // Stable tie-breaking prevents products moving between equal-ranked pages.
        $query->orderByDesc('products.id');
        $products = $query->paginate($data['per_page'] ?? 12)->withQueryString();

        return response()->json(['data' => collect($products->items())->map(fn (Product $p) => $this->resource($p))->values(),
            'meta' => ['current_page' => $products->currentPage(), 'last_page' => $products->lastPage(), 'per_page' => $products->perPage(), 'total' => $products->total()],
            'filters' => [
                'brands' => Brand::whereIn('id', Product::where('status', 'PUBLISHED')->select('brand_id'))->orderBy('name')->get(['name', 'slug']),
                'categories' => Category::whereIn('id', DB::table('category_product')->select('category_id')
                    ->whereIn('product_id', Product::where('status', 'PUBLISHED')->select('id')))->orderBy('name')->get(['name', 'slug']),
            ],
            'links' => ['first' => $products->url(1), 'last' => $products->url($products->lastPage()), 'prev' => $products->previousPageUrl(), 'next' => $products->nextPageUrl()]]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::where('status', 'PUBLISHED')->where('slug', $slug)->with(['brand', 'images', 'categories', 'variants.size', 'variants.inventories'])->firstOrFail();

        return response()->json(['data' => $this->resource($product)]);
    }

    /** @return array<string,mixed> */
    private function resource(Product $product): array
    {
        return ['slug' => $product->slug, 'name' => $product->name, 'description' => $product->description, 'brand' => ['name' => $product->brand->name, 'slug' => $product->brand->slug],
            'categories' => $product->categories->map->only(['name', 'slug'])->values(), 'images' => $product->images->map->only(['id', 'path', 'alt_text', 'is_primary'])->values(),
            'variants' => $product->variants->map(fn ($v) => ['id' => $v->id, 'sku' => $v->sku, 'size' => $v->size->label, 'price' => (string) $v->price, 'currency' => $v->currency,
                'weight_grams' => $v->weight_grams, 'available_stock' => $v->inventories->sum(fn ($i) => max(0, $i->on_hand - $i->reserved)), 'sold_out' => $v->inventories->sum(fn ($i) => max(0, $i->on_hand - $i->reserved)) === 0])->values()];
    }
}
