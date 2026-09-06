<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CatalogDemoSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = Warehouse::updateOrCreate(
            ['code' => 'JKT-DEV-01'],
            ['name' => 'Gudang Development Jakarta', 'phone' => '02100000000', 'address_line' => 'Jakarta', 'province' => 'DKI Jakarta', 'city' => 'Jakarta Selatan', 'district' => 'Kebayoran Baru', 'postal_code' => '12120', 'is_active' => true],
        );

        $catalog = [
            ['name' => 'Stride Flow', 'slug' => 'stride-flow', 'brand' => 'AeroRun', 'category' => 'Lari', 'image' => 'running-blue.webp', 'price' => 699000],
            ['name' => 'Core Trainer', 'slug' => 'core-trainer', 'brand' => 'Motion Lab', 'category' => 'Training', 'image' => 'training-black.webp', 'price' => 749000],
            ['name' => 'Daily Court', 'slug' => 'daily-court', 'brand' => 'North Street', 'category' => 'Kasual', 'image' => 'lifestyle-cream.webp', 'price' => 599000],
            ['name' => 'Junior Dash', 'slug' => 'junior-dash', 'brand' => 'AeroRun', 'category' => 'Anak', 'image' => 'kids-navy.webp', 'price' => 449000],
            ['name' => 'Elevate High', 'slug' => 'elevate-high', 'brand' => 'Motion Lab', 'category' => 'Basket', 'image' => 'basketball-white.webp', 'price' => 899000],
            ['name' => 'Swift Indoor', 'slug' => 'swift-indoor', 'brand' => 'Field One', 'category' => 'Futsal', 'image' => 'futsal-red.webp', 'price' => 679000],
        ];

        Product::query()->where('status', 'PUBLISHED')->whereDoesntHave('images')->whereNotIn('slug', collect($catalog)->pluck('slug'))->update(['status' => 'ARCHIVED', 'published_at' => null]);

        $sizes = collect(range(36, 44))->mapWithKeys(fn (int $value) => [
            $value => Size::firstOrCreate(['system' => 'EU', 'value' => (string) $value], ['label' => (string) $value]),
        ]);

        foreach ($catalog as $index => $item) {
            $brand = Brand::firstOrCreate(['slug' => str($item['brand'])->slug()->toString()], ['name' => $item['brand']]);
            $category = Category::firstOrCreate(['slug' => str($item['category'])->slug()->toString()], ['name' => $item['category']]);
            $product = Product::updateOrCreate(
                ['slug' => $item['slug']],
                ['brand_id' => $brand->id, 'name' => $item['name'], 'description' => 'Sepatu untuk aktivitas '.$item['category'].' dengan pilihan ukuran dan stok yang dikelola melalui katalog GutShoes.', 'status' => 'PUBLISHED', 'published_at' => now()->subMinutes($index)],
            );
            $product->categories()->syncWithoutDetaching([$category->id]);

            foreach ([39, 40, 41, 42, 43] as $sizeValue) {
                $variant = ProductVariant::updateOrCreate(
                    ['sku' => 'GS-'.strtoupper(str_replace('-', '', substr($item['slug'], 0, 6))).'-'.$sizeValue],
                    ['product_id' => $product->id, 'size_id' => $sizes[$sizeValue]->id, 'price' => $item['price'], 'currency' => 'IDR', 'weight_grams' => 900, 'is_active' => true],
                );
                Inventory::updateOrCreate(
                    ['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id],
                    ['on_hand' => 5 + (($index + $sizeValue) % 4), 'reserved' => 0, 'sold' => 0],
                );
            }

            $source = base_path('../storefront/src/assets/products/'.$item['image']);
            if (! is_file($source)) {
                $this->command?->warn('Aset produk tidak ditemukan: '.$source);
                continue;
            }
            $path = 'products/'.$product->id.'/'.$item['image'];
            Storage::disk('public')->put($path, file_get_contents($source));
            $product->images()->updateOrCreate(
                ['path' => $path],
                ['alt_text' => $item['name'], 'position' => 1, 'is_primary' => true],
            );
            $product->images()->where('path', '!=', $path)->update(['is_primary' => false]);
        }

        $this->command?->info('Enam produk contoh dan gambarnya siap di katalog.');
    }
}

