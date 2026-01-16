<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', Rule::in([User::ROLE_BUYER, User::ROLE_SALES_AGENT])],
            'password' => ['required', 'string', 'min:6', 'max:255'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registracija uspešna.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Neispravni kredencijali.',
                'errors' => [
                    'auth' => ['Email ili lozinka nisu tačni.'],
                ],
            ], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Prijava uspešna.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Odjava uspešna.',
            'data' => null,
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Ulogovani korisnik.',
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ], 200);
    }
}
