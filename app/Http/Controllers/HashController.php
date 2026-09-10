<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class HashController extends Controller
{
    /**
     * Affiche l'interface du générateur de hash.
     */
    public function index(): View
    {
        return view('hash.generator');
    }

    /**
     * Génère un hash selon l'algorithme choisi.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:4|max:1024',
            'algorithm' => 'required|string|in:bcrypt,argon2i,argon2id',
        ]);

        $password = $validated['password'];
        $algorithm = $validated['algorithm'];
        $start = microtime(true);
        $hash = null;
        $info = [];

        switch ($algorithm) {
            case 'bcrypt':
                $hash = Hash::driver('bcrypt')->make($password, ['rounds' => 10]);
                $info = [
                    'algorithm' => 'BCRYPT',
                    'cost' => 10,
                    'salt' => 'automatique',
                ];
                break;

            case 'argon2i':
                $hash = Hash::driver('argon')->make($password, [
                    'memory' => 102400,
                    'time' => 2,
                    'threads' => 8,
                ]);
                $info = [
                    'algorithm' => 'ARGON2I',
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8,
                ];
                break;

            case 'argon2id':
                $hash = Hash::driver('argon2id')->make($password, [
                    'memory' => 102400,
                    'time' => 2,
                    'threads' => 8,
                ]);
                $info = [
                    'algorithm' => 'ARGON2ID',
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8,
                ];
                break;
        }

        $durationMs = round((microtime(true) - $start) * 1000, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'hash' => $hash,
                'length' => strlen($hash),
                'duration_ms' => $durationMs,
                ...$info,
            ],
        ]);
    }

    /**
     * Génère simultanément les hash Bcrypt, Argon2i et Argon2id pour comparaison.
     */
    public function generateAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:4|max:1024',
        ]);

        $password = $validated['password'];

        // Bcrypt
        $startBcrypt = microtime(true);
        $bcryptHash = Hash::driver('bcrypt')->make($password, ['rounds' => 10]);
        $bcryptTime = round((microtime(true) - $startBcrypt) * 1000, 2);

        // Argon2i
        $startArgon2i = microtime(true);
        $argon2iHash = Hash::driver('argon')->make($password, [
            'memory' => 102400,
            'time' => 2,
            'threads' => 8,
        ]);
        $argon2iTime = round((microtime(true) - $startArgon2i) * 1000, 2);

        // Argon2id
        $startArgon2id = microtime(true);
        $argon2idHash = Hash::driver('argon2id')->make($password, [
            'memory' => 102400,
            'time' => 2,
            'threads' => 8,
        ]);
        $argon2idTime = round((microtime(true) - $startArgon2id) * 1000, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'bcrypt' => [
                    'hash' => $bcryptHash,
                    'length' => strlen($bcryptHash),
                    'duration_ms' => $bcryptTime,
                    'cost' => 10,
                ],
                'argon2i' => [
                    'hash' => $argon2iHash,
                    'length' => strlen($argon2iHash),
                    'duration_ms' => $argon2iTime,
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8,
                ],
                'argon2id' => [
                    'hash' => $argon2idHash,
                    'length' => strlen($argon2idHash),
                    'duration_ms' => $argon2idTime,
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8,
                ],
            ],
        ]);
    }

    /**
     * Vérifie si un mot de passe en clair correspond à un hash donné.
     * Prend en charge nativement Bcrypt, Argon2i et Argon2id.
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|max:1024',
            'hash' => 'required|string',
        ]);

        $password = $validated['password'];
        $hash = trim($validated['hash']);
        $matches = false;
        $info = password_get_info($hash);

        try {
            $matches = password_verify($password, $hash);
        } catch (\Throwable) {
            $matches = false;
        }

        return response()->json([
            'success' => true,
            'match' => $matches,
            'info' => [
                'algo' => $info['algoName'] ?? 'unknown',
                'options' => $info['options'] ?? [],
            ],
        ]);
    }

    /**
     * Génère un hash Bcrypt avec un nombre de rounds (coût) personnalisé.
     */
    public function generateCustomBcrypt(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:4|max:1024',
            'rounds' => 'required|integer|min:4|max:14',
        ]);

        $rounds = (int) $validated['rounds'];
        $start = microtime(true);
        $hash = Hash::driver('bcrypt')->make($validated['password'], ['rounds' => $rounds]);
        $durationMs = round((microtime(true) - $start) * 1000, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'algorithm' => 'BCRYPT',
                'hash' => $hash,
                'length' => strlen($hash),
                'cost' => $rounds,
                'duration_ms' => $durationMs,
            ],
        ]);
    }
}
