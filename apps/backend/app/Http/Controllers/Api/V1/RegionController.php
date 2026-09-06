<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegionController extends Controller
{
    public function provinces(): JsonResponse
    {
        return $this->list('region_provinces');
    }

    public function regencies(Request $r): JsonResponse
    {
        $r->validate(['province_code' => ['required', 'exists:region_provinces,code']]);

        return $this->list('region_regencies', ['province_code' => $r->string('province_code')]);
    }

    public function districts(Request $r): JsonResponse
    {
        $r->validate(['regency_code' => ['required', 'exists:region_regencies,code']]);

        return $this->list('region_districts', ['regency_code' => $r->string('regency_code')]);
    }

    public function villages(Request $r): JsonResponse
    {
        $r->validate(['district_code' => ['required', 'exists:region_districts,code']]);

        return $this->list('region_villages', ['district_code' => $r->string('district_code')], true);
    }

    /** @param array<string,mixed> $where */
    private function list(string $table, array $where = [], bool $postal = false): JsonResponse
    {
        $q = DB::table($table)->select($postal ? ['code', 'name', 'postal_code'] : ['code', 'name']);
        foreach ($where as $k => $v) {
            $q->where($k, $v);
        }

        return response()->json(['data' => $q->orderBy('name')->get()]);
    }
}
