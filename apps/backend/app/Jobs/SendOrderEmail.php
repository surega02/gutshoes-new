<?php

namespace App\Jobs;

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

    public function handle(): void
    {
        $order = Order::findOrFail($this->orderId);
        $delivery = EmailDelivery::firstOrCreate(['order_id' => $order->id, 'recipient' => $order->customer_email, 'template' => $this->template], ['status' => 'QUEUED']);
        if ($delivery->status === 'SENT') {
            return;
        }
        $delivery->increment('attempts');
        Mail::raw("GutShoes order {$order->order_number}: {$this->template}", fn ($mail) => $mail->to($order->customer_email)->subject("GutShoes {$order->order_number}"));
        $delivery->update(['status' => 'SENT', 'sent_at' => now(), 'last_error' => null]);
    }

    public function failed(Throwable $exception): void
    {
        EmailDelivery::where('order_id', $this->orderId)->where('template', $this->template)->update(['status' => 'FAILED', 'last_error' => mb_substr($exception->getMessage(), 0, 1000)]);
    }
}
