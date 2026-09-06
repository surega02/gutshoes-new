<?php

namespace App\Domain\Shipping;

use DomainException;
use Illuminate\Support\Facades\DB;

class RegionAddressResolver
{
    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    public function resolve(array $data): array
    {
        $p = DB::table('region_provinces')->where('code', $data['province_code'])->first();
        $r = DB::table('region_regencies')->where('code', $data['regency_code'])->where('province_code', $p?->code)->first();
        $d = DB::table('region_districts')->where('code', $data['district_code'])->where('regency_code', $r?->code)->first();
        $v = DB::table('region_villages')->where('code', $data['village_code'])->where('district_code', $d?->code)->first();
        if (! $p || ! $r || ! $d || ! $v) {
            throw new DomainException('Kombinasi wilayah alamat tidak valid. Pilih ulang wilayah secara berurutan.');
        }

        return $data + ['province' => $p->name, 'city' => $r->name, 'district' => $d->name, 'village' => $v->name, 'postal_code' => $v->postal_code ?: ($data['postal_code'] ?? ''), 'provider_area_id' => $data['provider_area_id'] ?? $v->code];
    }
}
