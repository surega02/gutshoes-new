<?php

it('reports API health and propagates request ID', function () {
    $response = $this->withHeader('X-Request-ID', 'test-request-1234')
        ->getJson('/api/v1/health');

    $response->assertOk()
        ->assertHeader('X-Request-ID', 'test-request-1234')
        ->assertJsonPath('data.status', 'ok')
        ->assertJsonPath('data.service', 'gutshoes-api');
});

it('generates a request ID when none is supplied', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertHeader('X-Request-ID');
});

it('returns the standard API error envelope', function () {
    $this->getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertJsonStructure(['message', 'code', 'errors', 'request_id'])
        ->assertJsonPath('code', 'NOT_FOUND');
});
