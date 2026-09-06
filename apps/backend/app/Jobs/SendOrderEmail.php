<?php

namespace App\Jobs;

use App\Domain\Order\GuestOrderAccess;
use App\Models\EmailDelivery;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendOrderEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly int $orderId, public readonly string $template)
    {
        $this->afterCommit();
    }

    public function handle(?GuestOrderAccess $guestAccess = null): void
    {
        $guestAccess ??= app(GuestOrderAccess::class);
        $order = Order::with(['items', 'payment'])->findOrFail($this->orderId);
        $delivery = EmailDelivery::firstOrCreate(
            ['order_id' => $order->id, 'recipient' => $order->customer_email, 'template' => $this->template],
            ['status' => 'QUEUED']
        );
        if ($delivery->status === 'SENT') {
            return;
        }

        $delivery->increment('attempts');
        Mail::send('emails.order-status', [
            'order' => $order,
            'template' => $this->template,
            'recoveryUrl' => $guestAccess->recoveryUrl($order),
        ], fn ($mail) => $mail->to($order->customer_email)->subject($this->subject($order)));

        $delivery->update(['status' => 'SENT', 'sent_at' => now(), 'last_error' => null]);
    }

    public function failed(Throwable $exception): void
    {
        EmailDelivery::where('order_id', $this->orderId)
            ->where('template', $this->template)
            ->update(['status' => 'FAILED', 'last_error' => mb_substr($exception->getMessage(), 0, 1000)]);
    }

    private function subject(Order $order): string
    {
        return match ($this->template) {
            'order_created' => "Pesanan {$order->order_number} menunggu pembayaran",
            'payment_success' => "Pembayaran {$order->order_number} berhasil",
            'payment_expired' => "Pembayaran {$order->order_number} kedaluwarsa",
            default => "Pembaruan pesanan {$order->order_number}",
        };
    }
}
