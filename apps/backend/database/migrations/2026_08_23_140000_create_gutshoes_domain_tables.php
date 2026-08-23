<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name');
            $table->string('phone', 32)->nullable();
            $table->timestamps();
        });
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 32)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 16)->nullable();
            $table->timestamps();
        });
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 64);
            $table->string('recipient_name');
            $table->string('phone', 32);
            $table->string('address_line');
            $table->string('province');
            $table->string('city');
            $table->string('district');
            $table->string('postal_code', 10);
            $table->string('provider_area_id')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'is_default']);
        });
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])->default('DRAFT')->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['brand_id', 'name']);
        });
        Schema::create('category_product', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['category_id', 'product_id']);
        });
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('alt_text')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['product_id', 'position']);
        });
        Schema::create('sizes', function (Blueprint $table) {
            $table->id();
            $table->string('system', 16)->default('EU');
            $table->string('value', 16);
            $table->string('label', 32);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['system', 'value']);
        });
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('size_id')->constrained()->restrictOnDelete();
            $table->string('sku')->unique();
            $table->decimal('price', 15, 2);
            $table->char('currency', 3)->default('IDR');
            $table->unsignedInteger('weight_grams');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['product_id', 'size_id']);
        });
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('phone', 32)->nullable();
            $table->string('address_line');
            $table->string('province');
            $table->string('city');
            $table->string('district');
            $table->string('postal_code', 10);
            $table->string('provider_area_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('on_hand')->default(0);
            $table->unsignedInteger('reserved')->default(0);
            $table->unsignedInteger('sold')->default(0);
            $table->timestamps();
            $table->unique(['warehouse_id', 'product_variant_id']);
            $table->index(['warehouse_id', 'on_hand', 'reserved']);
        });
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('guest_token')->nullable()->unique();
            $table->enum('status', ['ACTIVE', 'CONVERTED', 'ABANDONED'])->default('ACTIVE')->index();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();
            $table->unique(['cart_id', 'product_variant_id']);
        });
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['PERCENTAGE', 'FIXED_AMOUNT']);
            $table->decimal('value', 15, 2);
            $table->unsignedInteger('priority')->default(0)->index();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('promotion_products', function (Blueprint $table) {
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['promotion_id', 'product_id']);
        });
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name');
            $table->enum('type', ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']);
            $table->decimal('value', 15, 2)->default(0);
            $table->decimal('minimum_amount', 15, 2)->default(0);
            $table->decimal('maximum_discount', 15, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('usage_limit_per_user')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('voucher_products', function (Blueprint $table) {
            $table->foreignId('voucher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['voucher_id', 'product_id']);
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 32)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $table->foreignId('voucher_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_email')->index();
            $table->string('customer_name');
            $table->string('customer_phone', 32);
            $table->enum('status', ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED'])->default('PENDING_PAYMENT')->index();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('product_discount', 15, 2)->default(0);
            $table->decimal('voucher_discount', 15, 2)->default(0);
            $table->decimal('shipping_fee', 15, 2);
            $table->decimal('grand_total', 15, 2);
            $table->char('currency', 3)->default('IDR');
            $table->string('idempotency_key', 128)->unique();
            $table->char('payload_hash', 64);
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('brand_name');
            $table->string('sku');
            $table->string('size_label');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 15, 2);
            $table->unsignedInteger('weight_grams');
            $table->timestamps();
            $table->index(['order_id', 'sku']);
        });
        Schema::create('order_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['SHIPPING', 'BILLING']);
            $table->string('recipient_name');
            $table->string('phone', 32);
            $table->string('address_line');
            $table->string('province');
            $table->string('city');
            $table->string('district');
            $table->string('postal_code', 10);
            $table->string('provider_area_id')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'type']);
        });
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'created_at']);
        });
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32)->default('MIDTRANS');
            $table->string('provider_transaction_id')->nullable()->unique();
            $table->string('snap_token')->nullable();
            $table->enum('status', ['PENDING', 'SETTLEMENT', 'CAPTURE', 'DENY', 'CANCEL', 'EXPIRE', 'REFUND', 'FAILURE'])->default('PENDING')->index();
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('IDR');
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'provider']);
        });
        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32);
            $table->string('event_id')->unique();
            $table->string('transaction_id')->nullable()->index();
            $table->char('payload_hash', 64);
            $table->json('payload_redacted');
            $table->timestamp('processed_at')->nullable();
            $table->string('processing_error')->nullable();
            $table->timestamps();
        });
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('provider', 64);
            $table->string('courier', 64);
            $table->string('service', 64);
            $table->decimal('fee', 15, 2);
            $table->string('tracking_number')->nullable()->unique();
            $table->enum('status', ['PENDING', 'READY', 'SHIPPED', 'DELIVERED', 'FAILED'])->default('PENDING')->index();
            $table->json('quote_snapshot');
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->enum('status', ['ACTIVE', 'RELEASED', 'SOLD', 'EXPIRED'])->default('ACTIVE')->index();
            $table->timestamp('expires_at')->index();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
            $table->unique(['inventory_id', 'order_id']);
        });
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['ADD', 'ADJUST', 'RESERVE', 'RELEASE', 'SELL', 'RETURN'])->index();
            $table->integer('quantity_delta');
            $table->unsignedInteger('on_hand_after');
            $table->unsignedInteger('reserved_after');
            $table->string('reference_type', 64)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->timestamps();
            $table->index(['reference_type', 'reference_id']);
        });
        Schema::create('order_cancellations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['REQUESTED', 'APPROVED', 'REJECTED'])->default('REQUESTED')->index();
            $table->string('reason');
            $table->text('admin_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('provider_refund_id')->nullable()->unique();
            $table->string('idempotency_key', 128)->unique();
            $table->enum('status', ['PENDING', 'SUCCESS', 'FAILED'])->default('PENDING')->index();
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('IDR');
            $table->string('reason');
            $table->json('provider_response')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('voucher_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('discount_amount', 15, 2);
            $table->timestamps();
            $table->index(['voucher_id', 'user_id']);
        });
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 64)->index();
            $table->string('entity_type', 128)->index();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->string('request_id', 128)->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['entity_type', 'entity_id']);
        });
        Schema::create('store_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->boolean('is_public')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::create('email_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('recipient');
            $table->string('template', 64);
            $table->string('status', 32)->default('QUEUED')->index();
            $table->string('provider_message_id')->nullable()->unique();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE inventories ADD CONSTRAINT chk_inventory_reserved CHECK (reserved <= on_hand)');
            DB::statement('ALTER TABLE cart_items ADD CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0)');
            DB::statement('ALTER TABLE order_items ADD CONSTRAINT chk_order_item_quantity CHECK (quantity > 0)');
            DB::statement('ALTER TABLE inventory_reservations ADD CONSTRAINT chk_reservation_quantity CHECK (quantity > 0)');
            DB::statement('ALTER TABLE refunds ADD CONSTRAINT chk_refund_amount CHECK (amount > 0)');
        }
    }

    public function down(): void
    {
        $tables = ['email_deliveries', 'store_configurations', 'audit_logs', 'voucher_usages', 'refunds', 'order_cancellations', 'inventory_movements', 'inventory_reservations', 'shipments', 'payment_webhooks', 'payments', 'order_status_histories', 'order_addresses', 'order_items', 'orders', 'voucher_products', 'vouchers', 'promotion_products', 'promotions', 'cart_items', 'carts', 'inventories', 'warehouses', 'product_variants', 'sizes', 'product_images', 'category_product', 'products', 'categories', 'brands', 'addresses', 'customer_profiles', 'admin_profiles'];
        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
