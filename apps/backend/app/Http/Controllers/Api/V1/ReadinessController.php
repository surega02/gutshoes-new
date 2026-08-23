<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class ReadinessController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = ['database' => false, 'cache' => false];
        try {
            DB::select('select 1');
            $checks['database'] = true;
        } catch (Throwable) {
        }
        try {
            $key = 'health:'.bin2hex(random_bytes(8));
            Cache::put($key, 'ok', 5);
            $checks['cache'] = Cache::pull($key) === 'ok';
        } catch (Throwable) {
        }
        $ready = ! in_array(false, $checks, true);

        return response()->json(['data' => ['status' => $ready ? 'ready' : 'degraded', 'checks' => $checks, 'timestamp' => now()->utc()->toIso8601String()]], $ready ? 200 : 503);
    }
}
