<?php

use App\Models\Brand;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\Warehouse;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('creates all 34 GutShoes domain tables', function () {
    $tables = ['users', 'admin_profiles', 'customer_profiles', 'addresses', 'brands', 'categories', 'products', 'category_product',
        'product_images', 'sizes', 'product_variants', 'warehouses', 'inventories', 'carts', 'cart_items', 'promotions',
        'promotion_products', 'vouchers', 'voucher_products', 'orders', 'order_items', 'order_addresses', 'order_status_histories',
        'payments', 'payment_webhooks', 'shipments', 'inventory_reservations', 'inventory_movements', 'order_cancellations', 'refunds',
        'voucher_usages', 'audit_logs', 'store_configurations', 'email_deliveries'];

    expect($tables)->toHaveCount(34);
    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("Table {$table} tidak ditemukan");
    }
});

it('enforces unique SKU and variant size', function () {
    $brand = Brand::create(['name' => 'Test Brand', 'slug' => 'test-brand']);
    $product = Product::create(['brand_id' => $brand->id, 'name' => 'Test Shoe', 'slug' => 'test-shoe']);
    $size = Size::create(['system' => 'EU', 'value' => '42', 'label' => 'EU 42']);
    ProductVariant::create(['product_id' => $product->id, 'size_id' => $size->id, 'sku' => 'SKU-UNIQUE', 'price' => '699000.00', 'currency' => 'IDR', 'weight_grams' => 900]);

    expect(fn () => ProductVariant::create(['product_id' => $product->id, 'size_id' => $size->id, 'sku' => 'SKU-UNIQUE', 'price' => '699000.00', 'currency' => 'IDR', 'weight_grams' => 900]))
        ->toThrow(QueryException::class);
});

it('enforces foreign keys and inventory check constraint', function () {
    $warehouse = Warehouse::factory()->create();
    $variant = ProductVariant::factory()->create();
    Inventory::create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => 2, 'reserved' => 1, 'sold' => 0]);

    expect(fn () => DB::table('inventories')->insert(['warehouse_id' => $warehouse->id, 'product_variant_id' => 999999999, 'on_hand' => 1, 'reserved' => 0, 'sold' => 0, 'created_at' => now(), 'updated_at' => now()]))
        ->toThrow(QueryException::class);

    if (DB::getDriverName() === 'mysql') {
        $otherVariant = ProductVariant::factory()->create();
        expect(fn () => DB::table('inventories')->insert(['warehouse_id' => $warehouse->id, 'product_variant_id' => $otherVariant->id, 'on_hand' => 1, 'reserved' => 2, 'sold' => 0, 'created_at' => now(), 'updated_at' => now()]))
            ->toThrow(QueryException::class);
    }
});
