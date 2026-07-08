<?php

namespace App\Http\Controllers;

trait ApiResponseTrait
{
    protected function successResponse($data = null, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => (object) [],
        ], $code);
    }

    protected function errorResponse($message = 'Error', $errors = [], $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => empty($errors) ? (object) [] : $errors,
        ], $code);
    }
}
