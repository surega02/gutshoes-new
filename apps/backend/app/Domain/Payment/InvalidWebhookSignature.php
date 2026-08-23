<?php

namespace App\Domain\Payment;

use RuntimeException;

class InvalidWebhookSignature extends RuntimeException {}
