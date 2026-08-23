<?php

namespace App\Domain\Promotion;

use App\Models\Cart;
use App\Models\Promotion;
use App\Models\Voucher;
use DomainException;

class PricingService
{
    /** @return array<string,mixed> */
    public function calculate(Cart $cart, ?string $voucherCode, string $shippingFee = '0.00'): array
    {
        $cart->load(['items.variant.product', 'items.variant']);
        $subtotal = 0.0;
        $productDiscount = 0.0;
        $lines = [];
        foreach ($cart->items as $item) {
            $unit = (float) $item->variant->price;
            $line = $unit * $item->quantity;
            $subtotal += $line;
            $promotion = Promotion::query()->where('is_active', true)->where('starts_at', '<=', now())->where('ends_at', '>=', now())
                ->whereHas('products', fn ($q) => $q->whereKey($item->variant->product_id))->orderByDesc('priority')->first();
            $discount = $promotion ? ($promotion->type === 'PERCENTAGE' ? $line * ((float) $promotion->value / 100) : min($line, (float) $promotion->value)) : 0.0;
            $productDiscount += $discount;
            $lines[] = ['variant_id' => $item->product_variant_id, 'sku' => $item->variant->sku, 'quantity' => $item->quantity, 'unit_price' => number_format($unit, 2, '.', ''), 'discount' => number_format($discount, 2, '.', ''), 'line_total' => number_format($line - $discount, 2, '.', '')];
        }
        $afterProducts = $subtotal - $productDiscount;
        $voucherDiscount = 0.0;
        $shipping = (float) $shippingFee;
        $voucher = null;
        if ($voucherCode) {
            $voucher = Voucher::where('code', $voucherCode)->where('is_active', true)->where('starts_at', '<=', now())->where('ends_at', '>=', now())->first();
            if (! $voucher) {
                throw new DomainException('Voucher is invalid or expired.');
            } if ($afterProducts < (float) $voucher->minimum_amount) {
                throw new DomainException('Minimum transaction is not met.');
            }
            if ($voucher->usage_limit && $voucher->usages()->count() >= $voucher->usage_limit) {
                throw new DomainException('Voucher usage limit reached.');
            }
            $applicable = $voucher->products()->doesntExist() || $cart->items->contains(fn ($i) => $voucher->products()->whereKey($i->variant->product_id)->exists());
            if (! $applicable) {
                throw new DomainException('Voucher is not applicable.');
            }
            if ($voucher->type === 'PERCENTAGE') {
                $voucherDiscount = $afterProducts * ((float) $voucher->value / 100);
            } elseif ($voucher->type === 'FIXED_AMOUNT') {
                $voucherDiscount = min($afterProducts, (float) $voucher->value);
            } else {
                $voucherDiscount = $shipping;
            }
            if ($voucher->maximum_discount !== null) {
                $voucherDiscount = min($voucherDiscount, (float) $voucher->maximum_discount);
            }
        }

        return ['items' => $lines, 'subtotal' => number_format($subtotal, 2, '.', ''), 'product_discount' => number_format($productDiscount, 2, '.', ''), 'voucher_discount' => number_format($voucherDiscount, 2, '.', ''),
            'shipping_fee' => number_format($shipping, 2, '.', ''), 'grand_total' => number_format(max(0,$afterProducts + $shipping - $voucherDiscount),2,'.',''), 'currency' => 'IDR', 'voucher' => $voucher?->code];
    }
}
