<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSizeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Size::orderBy('system')->orderBy('value')->get()]);
    }

    public function store(Request $r): JsonResponse
    {
        return response()->json(['data' => Size::create($this->data($r))], 201);
    }

    public function update(Request $r, Size $size): JsonResponse
    {
        $size->update($this->data($r, $size));

        return response()->json(['data' => $size->refresh()]);
    }

    public function destroy(Size $size): JsonResponse
    {
        $size->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** @return array<string,mixed> */
    private function data(Request $r, ?Size $size = null): array
    {
        return $r->validate(['system' => ['required', 'string', 'max:16'], 'value' => ['required', 'string', 'max:16', 'unique:sizes,value,'.($size instanceof Size ? $size->id : 'NULL').',id,system,'.$r->input('system')], 'label' => ['required', 'string', 'max:32']]);
    }
}
