<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('only exposes published products and keeps sold out variants visible', function () {
    $brand = Brand::factory()->create();
    $size = Size::factory()->create();
    $warehouse = Warehouse::factory()->create();
    $published = Product::factory()->create(['brand_id' => $brand->id, 'status' => 'PUBLISHED']);
    $variant = ProductVariant::factory()->create(['product_id' => $published->id, 'size_id' => $size->id, 'price' => '699000.00']);
    Inventory::factory()->create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => 2, 'reserved' => 2]);
    Product::factory()->create(['brand_id' => $brand->id, 'status' => 'DRAFT']);
    $response = $this->getJson('/api/v1/products')->assertOk()->assertJsonPath('meta.total', 1);
    expect($response->json('data.0.variants.0.price'))->toBe('699000.00')->and($response->json('data.0.variants.0.sold_out'))->toBeTrue();
});

it('supports catalog search by SKU', function () {
    $product = Product::factory()->create(['name' => 'Sepatu Lari']);
    ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'RUN-SEARCH-42']);
    $this->getJson('/api/v1/products?search=RUN-SEARCH')->assertOk()->assertJsonPath('meta.total', 1);
});

it('forbids customer access to admin catalog APIs', function () {
    $this->actingAs(User::factory()->create())->getJson('/api/v1/admin/products')->assertForbidden();
});

it('lets an admin manage master sizes and protects sizes used by product variants', function () {
    $admin = User::factory()->admin()->create();
    $created = $this->actingAs($admin)->postJson('/api/v1/admin/sizes', [
        'system' => 'EU',
        'value' => '42.5',
        'label' => 'EU 42.5',
    ])->assertCreated()->assertJsonPath('data.value', '42.5');

    $sizeId = $created->json('data.id');
    $this->actingAs($admin)->putJson('/api/v1/admin/sizes/'.$sizeId, [
        'system' => 'EU',
        'value' => '42.5',
        'label' => 'EU 42½',
    ])->assertOk()->assertJsonPath('data.label', 'EU 42½');

    ProductVariant::factory()->create(['size_id' => $sizeId]);
    $this->actingAs($admin)->getJson('/api/v1/admin/sizes')
        ->assertOk()
        ->assertJsonPath('data.0.product_variants_count', 1);
    $this->actingAs($admin)->deleteJson('/api/v1/admin/sizes/'.$sizeId)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('size');

    $unused = Size::factory()->create(['system' => 'UK', 'value' => '8.5', 'label' => 'UK 8.5']);
    $this->actingAs($admin)->deleteJson('/api/v1/admin/sizes/'.$unused->id)->assertOk();
    $this->assertSoftDeleted('sizes', ['id' => $unused->id]);
});

it('allows an admin to create and publish a complete product', function () {
    $admin = User::factory()->admin()->create();
    $brand = Brand::factory()->create();
    $category = Category::create(['name' => 'Running', 'slug' => 'running']);
    $size = Size::factory()->create();
    $payload = ['brand_id' => $brand->id, 'name' => 'Gut Runner', 'slug' => 'gut-runner', 'description' => 'Running shoe', 'status' => 'DRAFT', 'category_ids' => [$category->id],
        'variants' => [['size_id' => $size->id, 'sku' => 'GUT-RUN-42', 'price' => '599000.00', 'currency' => 'IDR', 'weight_grams' => 850, 'is_active' => true]]];
    Storage::fake('public');
    $created = $this->actingAs($admin)->postJson('/api/v1/admin/products', $payload)->assertCreated();
    $this->actingAs($admin)->post('/api/v1/admin/products/'.$created->json('data.id').'/images', ['image' => UploadedFile::fake()->image('shoe.webp', 600, 600), 'is_primary' => true], ['Accept' => 'application/json'])->assertCreated();
    $this->actingAs($admin)->postJson('/api/v1/admin/products/'.$created->json('data.id').'/publish')->assertOk()->assertJsonPath('data.status', 'PUBLISHED');
});

it('validates and stores product images on the public disk', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->create();
    $response = $this->actingAs($admin)->post('/api/v1/admin/products/'.$product->id.'/images', ['image' => UploadedFile::fake()->image('shoe.webp', 600, 600), 'alt_text' => 'Sepatu', 'is_primary' => true], ['Accept' => 'application/json']);
    $response->assertCreated();
    Storage::disk('public')->assertExists($response->json('data.path'));
});

it('returns validation errors instead of a database exception for duplicate variant SKUs', function () {
    $admin = User::factory()->admin()->create();
    $brand = Brand::factory()->create();
    $category = Category::create(['name' => 'Training Duplicate', 'slug' => 'training-duplicate']);
    $sizes = Size::factory()->count(2)->create();
    $product = Product::factory()->create(['brand_id' => $brand->id]);
    $variants = $sizes->map(fn ($size, $index) => ProductVariant::factory()->create([
        'product_id' => $product->id,
        'size_id' => $size->id,
        'sku' => 'ORIGINAL-'.$index,
    ]));
    $payload = [
        'brand_id' => $brand->id,
        'name' => $product->name,
        'slug' => $product->slug,
        'status' => 'DRAFT',
        'category_ids' => [$category->id],
        'variants' => $variants->map(fn ($variant) => [
            'id' => $variant->id,
            'size_id' => $variant->size_id,
            'sku' => 'VSP40',
            'price' => '459000',
            'weight_grams' => 900,
            'is_active' => true,
        ])->all(),
    ];

    $this->actingAs($admin)->putJson('/api/v1/admin/products/'.$product->id, $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('variants.1.sku');
});

it('paginates all matching products stably and resolves a slug outside the first page', function () {
    $brand = Brand::factory()->create(['slug' => 'target-brand']);
    $category = Category::create(['name' => 'Trail Running', 'slug' => 'trail-running']);
    $products = Product::factory()->count(25)->create(['brand_id' => $brand->id, 'published_at' => now()->startOfDay()]);
    $size = Size::factory()->create();
    foreach ($products as $product) {
        $product->categories()->attach($category);
        ProductVariant::factory()->create(['product_id' => $product->id, 'size_id' => $size->id]);
    }
    $other = Product::factory()->create();
    ProductVariant::factory()->create(['product_id' => $other->id, 'sku' => 'OUTSIDE-FIRST-PAGE']);
    $first = $this->getJson('/api/v1/products?brand=target-brand&category=trail-running&per_page=12')->assertOk()->assertJsonPath('meta.total', 25)->assertJsonPath('meta.last_page', 3);
    $second = $this->getJson('/api/v1/products?brand=target-brand&category=trail-running&per_page=12&page=2')->assertOk()->assertJsonPath('meta.current_page', 2);
    expect(array_intersect(array_column($first->json('data'), 'slug'), array_column($second->json('data'), 'slug')))->toBe([]);
    $this->getJson('/api/v1/products?brand=target-brand&page=3')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/products/'.$products->first()->slug)->assertOk()->assertJsonPath('data.name', (string) $products->first()->name);
    $search = $this->getJson('/api/v1/products?search=OUTSIDE-FIRST-PAGE')->assertOk()->assertJsonPath('data.0.slug', (string) $other->slug);
    expect(array_column($search->json('filters.brands'), 'slug'))->toContain('target-brand');
    expect(array_column($search->json('filters.categories'), 'slug'))->toContain('trail-running');
    $draft = Product::factory()->create(['status' => 'DRAFT']);
    $this->getJson('/api/v1/products/'.$draft->slug)->assertNotFound();
    $this->getJson('/api/v1/products/missing-product')->assertNotFound();
});

it('sorts best sellers by paid order quantities across variants and ignores unpaid orders', function () {
    $warehouse = Warehouse::factory()->create();
    $winner = Product::factory()->create();
    $runner = Product::factory()->create();
    $unpaid = Product::factory()->create();
    $variants = [
        ProductVariant::factory()->create(['product_id' => $winner->id]),
        ProductVariant::factory()->create(['product_id' => $winner->id]),
        ProductVariant::factory()->create(['product_id' => $runner->id]),
        ProductVariant::factory()->create(['product_id' => $unpaid->id]),
    ];
    foreach ([['PAID', 3, 0], ['DELIVERED', 4, 1], ['PROCESSING', 6, 2], ['PENDING_PAYMENT', 100, 3], ['CANCELLED', 100, 3], ['EXPIRED', 100, 3]] as $index => [$status, $quantity, $variantIndex]) {
        $order = Order::create(['order_number' => 'CATALOG-'.$index, 'warehouse_id' => $warehouse->id,
            'customer_email' => 'catalog@example.test', 'customer_name' => 'Catalog Test', 'customer_phone' => '08123456789',
            'status' => $status, 'subtotal' => 100000, 'shipping_fee' => 0, 'grand_total' => 100000,
            'idempotency_key' => 'catalog-'.$index, 'payload_hash' => hash('sha256', (string) $index), 'expires_at' => now()->addDay()]);
        $variant = $variants[$variantIndex];
        $order->items()->create(['product_variant_id' => $variant->id, 'product_name' => 'Test', 'brand_name' => 'Test',
            'sku' => $variant->sku, 'size_label' => '42', 'unit_price' => 100000, 'quantity' => $quantity, 'line_total' => $quantity * 100000, 'weight_grams' => 800]);
    }
    $this->getJson('/api/v1/products?sort=best_selling&per_page=1')->assertOk()->assertJsonPath('data.0.slug', (string) $winner->slug);
    $this->getJson('/api/v1/products?sort=best_selling&per_page=1&page=2')->assertOk()->assertJsonPath('data.0.slug', (string) $runner->slug);
    $this->getJson('/api/v1/products?sort=best_selling&per_page=1&page=3')->assertOk()->assertJsonPath('data.0.slug', (string) $unpaid->slug);
});

it('applies price bounds to one variant and accepts a standalone maximum', function () {
    $product = Product::factory()->create();
    ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 500000]);
    ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 900000]);
    $this->getJson('/api/v1/products?max_price=599999')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/products?min_price=600000&max_price=800000')->assertOk()->assertJsonPath('meta.total', 0);
});
