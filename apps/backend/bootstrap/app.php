<?php

use App\Domain\Order\IdempotencyConflict;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->alias(['admin' => EnsureAdmin::class]);
        $middleware->append(AssignRequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            $status = match (true) {
                $exception instanceof AuthenticationException => 401,
                $exception instanceof AuthorizationException => 403,
                $exception instanceof NotFoundHttpException => 404,
                $exception instanceof TokenMismatchException => 419,
                $exception instanceof ValidationException => 422,
                $exception instanceof IdempotencyConflict => 409,
                $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
                default => 500,
            };

            $message = match ($status) {
                401 => 'Unauthenticated.',
                403 => 'This action is unauthorized.',
                404 => 'Resource not found.',
                409 => 'Request conflicts with an existing resource.',
                419 => 'CSRF token mismatch.',
                422 => 'The given data was invalid.',
                429 => 'Too many requests.',
                default => config('app.debug') ? $exception->getMessage() : 'Internal server error.',
            };

            return response()->json([
                'message' => $message,
                'code' => match ($status) {
                    401 => 'UNAUTHENTICATED', 403 => 'FORBIDDEN', 404 => 'NOT_FOUND',
                    409 => 'IDEMPOTENCY_CONFLICT', 419 => 'CSRF_TOKEN_MISMATCH', 422 => 'VALIDATION_FAILED',
                    429 => 'RATE_LIMIT_EXCEEDED', default => 'INTERNAL_ERROR',
                },
                'errors' => $exception instanceof ValidationException ? $exception->errors() : (object) [],
                'request_id' => $request->attributes->get('request_id'),
            ], $status);
        });
    })->create();
