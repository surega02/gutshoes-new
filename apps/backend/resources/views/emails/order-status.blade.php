<!doctype html>
<html lang="id">
<body style="font-family:Arial,sans-serif;color:#14252e;line-height:1.6">
    <h1 style="font-size:24px">Pesanan {{ $order->order_number }}</h1>
    <p>Halo {{ $order->customer_name }}, pesanan Anda sudah dibuat dengan status <strong>{{ str_replace('_', ' ', $order->getRawOriginal('status')) }}</strong>.</p>
    <p>Total pembayaran: <strong>Rp{{ number_format((float) $order->grand_total, 0, ',', '.') }}</strong></p>
    @if ($order->expires_at)
        <p>Selesaikan pembayaran sebelum {{ $order->expires_at->timezone('Asia/Jakarta')->format('d M Y H:i') }} WIB.</p>
    @endif
    @if ($recoveryUrl)
        <p><a href="{{ $recoveryUrl }}" style="display:inline-block;padding:12px 18px;background:#087c9b;color:#fff;text-decoration:none;border-radius:8px">Lihat pesanan & lanjutkan pembayaran</a></p>
        <p style="font-size:12px;color:#60717a">Tautan ini bersifat rahasia. Jangan meneruskannya kepada orang lain.</p>
    @endif
    <p>Status email: {{ str_replace('_', ' ', $template) }}.</p>
</body>
</html>