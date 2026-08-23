<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->customerProfile()->firstOrCreate();

        return response()->json(['data' => $profile]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:32'],
            'birth_date' => ['nullable', 'date', 'before:today'], 'gender' => ['nullable', 'in:MALE,FEMALE,OTHER']]);
        $request->user()->update(['name' => $data['name']]);
        $profileData = $data;
        unset($profileData['name']);
        $profile = $request->user()->customerProfile()->updateOrCreate([], $profileData);

        return response()->json(['data' => $profile->refresh()]);
    }
}
