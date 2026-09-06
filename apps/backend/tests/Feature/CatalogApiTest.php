<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
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
