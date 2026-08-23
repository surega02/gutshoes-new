<?php

namespace App\Domain\Order;

use RuntimeException;

class IdempotencyConflict extends RuntimeException {}
