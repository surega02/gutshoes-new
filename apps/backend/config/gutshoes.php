<?php

return [
    'shipping_driver' => env('SHIPPING_DRIVER', 'fake'),

    'bootstrap_admin' => [
        'email' => env('GUTSHOES_ADMIN_EMAIL'),
        'name' => env('GUTSHOES_ADMIN_NAME'),
        'password' => env('GUTSHOES_ADMIN_PASSWORD'),
    ],
];
