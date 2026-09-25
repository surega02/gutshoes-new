<?php

return [
    'storefront' => ['url' => env('STOREFRONT_URL', 'http://localhost:5173')],
    'midtrans' => [
        'driver' => env('MIDTRANS_DRIVER', 'fake'),
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'snap_url' => env('MIDTRANS_SNAP_URL', 'https://app.sandbox.midtrans.com/snap/v1/transactions'),
        'api_url' => env('MIDTRANS_API_URL', 'https://api.sandbox.midtrans.com/v2'),
        'redirect_base_url' => env('MIDTRANS_REDIRECT_BASE_URL', 'https://app.sandbox.midtrans.com/snap/v4/redirection'),
    ],
    'biteship' => [
        'url' => env('BITESHIP_URL', 'https://api.biteship.com'),
        'api_key' => env('BITESHIP_API_KEY'),
    ],

    'rajaongkir' => [
        'url' => env('RAJAONGKIR_URL', 'https://rajaongkir.komerce.id/api/v1'),
        'api_key' => env('RAJAONGKIR_API_KEY'),
        'couriers' => env('RAJAONGKIR_COURIERS', 'jne:sicepat:jnt:ninja:tiki:anteraja:pos'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
    'postmark' => ['key' => env('POSTMARK_API_KEY')],
    'resend' => ['key' => env('RESEND_API_KEY')],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
];
