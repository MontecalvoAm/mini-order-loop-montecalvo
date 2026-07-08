<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $code = $e->getCode();
                if (!is_numeric($code)) {
                    $code = 500;
                } else {
                    $code = (int) $code;
                }
                
                if ($code === 0) {
                    $code = 400;
                }

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $code = 422;
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $code = $e->getStatusCode();
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $code = 401;
                }
                
                if ($code < 100 || $code > 599) {
                    $code = 500;
                }

                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'An error occurred',
                    'data' => null,
                    'errors' => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : (object) [],
                ], (int) $code);
            }
        });
    })->create();
