<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class HashController extends Controller
{
    public function index()
    {
        return view('hash.generator');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:4',
            'algorithm' => 'required|string|in:bcrypt,argon2i,argon2id'
        ]);

        $password = $request->password;
        $algorithm = $request->algorithm;
        $hash = null;
        $info = [];

        switch ($algorithm) {
            case 'bcrypt':
                $hash = Hash::make($password, ['rounds' => 10]);
                $info = [
                    'algorithm' => 'BCRYPT',
                    'cost' => 10,
                    'salt' => 'automatique'
                ];
                break;
            
            case 'argon2i':
                $hash = Hash::make($password, [
                    'memory' => 102400,
                    'time' => 2,
                    'threads' => 8,
                    'algorithm' => PASSWORD_ARGON2I
                ]);
                $info = [
                    'algorithm' => 'ARGON2I',
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8
                ];
                break;
            
            case 'argon2id':
                $hash = Hash::make($password, [
                    'memory' => 102400,
                    'time' => 2,
                    'threads' => 8
                ]);
                $info = [
                    'algorithm' => 'ARGON2ID',
                    'memory' => 102400,
                    'iterations' => 2,
                    'threads' => 8
                ];
                break;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'hash' => $hash,
                'length' => strlen($hash),
                ...$info
            ]
        ]);
    }
}