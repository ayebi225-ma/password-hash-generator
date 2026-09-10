<?php

it('affiche la page du générateur sur / et /hash sans erreur avec la jauge de robustesse', function () {
    $responseHome = $this->get('/');
    $responseHome->assertStatus(200);
    $responseHome->assertSee('Générateur de Hash Sécurisé');
    $responseHome->assertSee('strengthSection');
    $responseHome->assertSee('strengthBar');
    $responseHome->assertSee('bits d\'entropie', false);

    $responseHash = $this->get('/hash');
    $responseHash->assertStatus(200);
    $responseHash->assertSee('Générateur de Hash Sécurisé');
    $responseHash->assertSee('strengthSection');
});

it('génère un hash bcrypt valide commençant par $2y$', function () {
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

it('génère un hash argon2id valide commençant par $argon2id$ et non bcrypt', function () {
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

it('génère un hash argon2i valide commençant par $argon2i$', function () {
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

it('prend en charge les mots de passe utf-8 complexes avec accents et emojis', function () {
    $complexPassword = 'P@sswørd-Élégant!';

    $response = $this->postJson('/hash/generate', [
        'password' => $complexPassword,
        'algorithm' => 'argon2id',
    ]);

    $response->assertStatus(200);
    $hash = $response->json('data.hash');

    $verifyResponse = $this->postJson('/hash/verify', [
        'password' => $complexPassword,
        'hash' => $hash,
    ]);

    $verifyResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'match' => true,
        ]);
});

it('retourne une erreur de validation 422 en JSON si le mot de passe est trop court', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => '123',
        'algorithm' => 'bcrypt',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('retourne une erreur de validation 422 en JSON si le mot de passe dépasse 1024 caractères', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => str_repeat('a', 1025),
        'algorithm' => 'bcrypt',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('retourne une erreur de validation 422 en JSON si l algorithme est invalide ou obsolète (ex: md5)', function () {
    $response = $this->postJson('/hash/generate', [
        'password' => 'ValidPassword123!',
        'algorithm' => 'md5',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['algorithm']);
});

it('génère simultanément bcrypt, argon2i et argon2id via generate-all', function () {
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

it('vérifie la concordance et non-concordance des mots de passe via la route verify', function () {
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

it('gère les hash corrompus ou malformés en toute sécurité sans erreur 500 sur la route verify', function () {
    $response = $this->postJson('/hash/verify', [
        'password' => 'Password123!',
        'hash' => 'invalid_or_corrupted_hash_string',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'match' => false,
        ]);
});

it('valide les champs obligatoires pour la route verify', function () {
    $response = $this->postJson('/hash/verify', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password', 'hash']);
});

it('prend en charge les rounds bcrypt personnalisés avec les bornes autorisées', function () {
    // Round 4 (minimum autorisé)
    $responseMin = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 4,
    ]);
    $responseMin->assertStatus(200)
        ->assertJson(['data' => ['cost' => 4]]);
    expect($responseMin->json('data.hash'))->toStartWith('$2y$04$');

    // Round 14 (maximum autorisé)
    $responseMax = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 14,
    ]);
    $responseMax->assertStatus(200)
        ->assertJson(['data' => ['cost' => 14]]);
    expect($responseMax->json('data.hash'))->toStartWith('$2y$14$');
});

it('valide strictement les limites de rounds pour le bcrypt personnalisé', function () {
    // Moins que le minimum (< 4)
    $responseUnder = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 3,
    ]);
    $responseUnder->assertStatus(422)
        ->assertJsonValidationErrors(['rounds']);

    // Plus que le maximum (> 14)
    $responseOver = $this->postJson('/hash/bcrypt-custom', [
        'password' => 'CustomBcryptTest!',
        'rounds' => 15,
    ]);
    $responseOver->assertStatus(422)
        ->assertJsonValidationErrors(['rounds']);
});
