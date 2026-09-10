<?php

it('displays the generator page on / and /hash without errors', function () {
    $responseHome = $this->get('/');
    $responseHome->assertStatus(200);
    $responseHome->assertSee('Générateur de Hash Sécurisé');

    $responseHash = $this->get('/hash');
    $responseHash->assertStatus(200);
    $responseHash->assertSee('Générateur de Hash Sécurisé');
});

it('generates a valid bcrypt hash starting with $2y$', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => 'MonSuperSecret123!',
        'algorithm' => 'bcrypt',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'algorithm' => 'BCRYPT',
                'cost' => 10,
            ],
        ]);

    $data = $response->json('data');
    expect($data['hash'])->toStartWith('$2y$')
        ->and($data['length'])->toBe(60)
        ->and($data['duration_ms'])->toBeGreaterThanOrEqual(0);
});

it('generates a valid argon2id hash starting with $argon2id$ and not bcrypt', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => 'MonSuperSecret123!',
        'algorithm' => 'argon2id',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'algorithm' => 'ARGON2ID',
            ],
        ]);

    $data = $response->json('data');
    expect($data['hash'])->toStartWith('$argon2id$')
        ->and($data['hash'])->not->toStartWith('$2y$')
        ->and($data['duration_ms'])->toBeGreaterThanOrEqual(0);
});

it('generates a valid argon2i hash starting with $argon2i$', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => 'MonSuperSecret123!',
        'algorithm' => 'argon2i',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'algorithm' => 'ARGON2I',
            ],
        ]);

    $data = $response->json('data');
    expect($data['hash'])->toStartWith('$argon2i$')
        ->and($data['hash'])->not->toStartWith('$2y$');
});

it('returns 422 JSON validation error when password is too short', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => '123',
        'algorithm' => 'bcrypt',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('returns 422 JSON validation error when algorithm is invalid or deprecated (e.g. md5)', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => 'ValidPassword123!',
        'algorithm' => 'md5',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['algorithm']);
});

it('generates bcrypt, argon2i and argon2id in one call via generate-all', function () {
    $response = $this->postJson('/hash/generate-all', [
        'password' => 'SecretComparatif123!',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'bcrypt' => ['hash', 'length', 'duration_ms', 'cost'],
                'argon2i' => ['hash', 'length', 'duration_ms', 'memory', 'iterations', 'threads'],
                'argon2id' => ['hash', 'length', 'duration_ms', 'memory', 'iterations', 'threads'],
            ],
        ]);

    $data = $response->json('data');
    expect($data['bcrypt']['hash'])->toStartWith('$2y$')
        ->and($data['argon2i']['hash'])->toStartWith('$argon2i$')
        ->and($data['argon2id']['hash'])->toStartWith('$argon2id$');
});

it('verifies matching and non-matching passwords via verify route', function () {
    $password = 'SecretAVerifier!';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Correspondance exacte
    $matchResponse = $this->postJson('/hash/verify', [
        'password' => $password,
        'hash' => $hash,
    ]);

    $matchResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'match' => true,
        ]);

    // Mauvais mot de passe
    $noMatchResponse = $this->postJson('/hash/verify', [
        'password' => 'MauvaisMotDePasse',
        'hash' => $hash,
    ]);

    $noMatchResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'match' => false,
        ]);
});

it('supports custom bcrypt rounds', function () {
    $response = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 8,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'algorithm' => 'BCRYPT',
                'cost' => 8,
            ],
        ]);

    $hash = $response->json('data.hash');
    expect($hash)->toStartWith('$2y$08$');
});

it('validates bounds for custom bcrypt rounds', function () {
    $response = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 20, // max is 14
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['rounds']);
});
