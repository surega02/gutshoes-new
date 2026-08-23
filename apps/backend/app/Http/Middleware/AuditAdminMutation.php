<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminMutation
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && $response->getStatusCode() < 400) {
            $excluded = array_merge(['password', 'password_confirmation', 'token', 'secret', 'api_key'], array_keys($request->allFiles()));
            $metadata = array_diff_key($request->all(), array_flip($excluded));
            AuditLog::create(['admin_id' => $request->user()?->id, 'action' => strtolower($request->method()), 'entity_type' => (string) $request->route()?->getName(),
                'entity_id' => is_numeric($request->route('order') ?? $request->route('refund')) ? (int) ($request->route('order') ?? $request->route('refund')) : null,
                'description' => $request->method().' '.$request->path(), 'metadata' => $metadata, 'request_id' => $request->attributes->get('request_id'), 'ip_address' => $request->ip()]);
        }

        return $response;
    }
}
