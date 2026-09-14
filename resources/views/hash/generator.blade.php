@extends('layouts.app')

@section('content')
<!-- En-tête de page -->
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">
        <i class="fas fa-shield-alt text-primary mr-2"></i> CoffrePass &bull; Outils Cryptographiques
    </h1>
</div>

<!-- Navigation par onglets -->
<ul class="nav nav-pills mb-4" id="coffreTabs" role="tablist">
    <li class="nav-item mr-2">
        <a class="nav-link active font-weight-bold shadow-sm py-2 px-4" id="tab-generator" data-toggle="pill" href="#pane-generator" role="tab" aria-controls="pane-generator" aria-selected="true">
            <i class="fas fa-key mr-2"></i> Générateur de Hash
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link font-weight-bold shadow-sm py-2 px-4" id="tab-verifier" data-toggle="pill" href="#pane-verifier" role="tab" aria-controls="pane-verifier" aria-selected="false">
            <i class="fas fa-check-double mr-2"></i> Vérificateur de Hash
        </a>
    </li>
</ul>

<!-- Zone d'alertes dynamiques globales -->
<div id="alertContainer">
    <div id="alertBox" class="alert alert-dismissible fade show shadow-sm d-none" role="alert">
        <i class="fas fa-exclamation-circle mr-1"></i>
        <span id="alertMessage"></span>
        <button type="button" class="close" id="alertCloseBtn" aria-label="Fermer">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
</div>

<div class="tab-content" id="coffreTabContent">
    <!-- ========================================== -->
    <!-- ONGLET 1 : GÉNÉRATEUR DE HASH             -->
    <!-- ========================================== -->
    <div class="tab-pane fade show active" id="pane-generator" role="tabpanel" aria-labelledby="tab-generator">
        <div class="row">
            <!-- Colonne 1 : Saisie & Paramètres -->
            <div class="col-xl-6 col-lg-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-primary text-white d-flex align-items-center justify-content-between">
                        <span class="font-weight-bold"><i class="fas fa-edit mr-2"></i> Mot de passe à hasher</span>
                        <span class="badge badge-light" id="algoBadge">Argon2id</span>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="passwordInput" class="font-weight-bold">
                                <i class="fas fa-key text-muted mr-1"></i> Entrez votre mot de passe :
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control form-control-lg" id="passwordInput" 
                                       placeholder="ex: MonSuperMotDePasse123!" autocomplete="off">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword" title="Afficher/Masquer">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="form-text text-muted">Longueur minimale : 4 caractères (max 1024).</small>

                            <!-- Jauge de robustesse & Entropie -->
                            <div class="mt-3 p-3 bg-light rounded border" id="strengthSection">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small font-weight-bold text-muted" id="strengthLabel">
                                        <i class="fas fa-shield-alt mr-1"></i> Force : <span id="strengthText">Non évaluée</span>
                                    </span>
                                    <span class="badge badge-secondary px-2 py-1" id="entropyLabel">0 bits d'entropie</span>
                                </div>
                                <div class="progress" style="height: 8px; background-color: #e2e6ea; border-radius: 4px;">
                                    <div id="strengthBar" class="progress-bar" role="progressbar" 
                                         style="width: 0%; transition: width 0.3s ease, background-color 0.3s ease;" 
                                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>

                                <!-- Indicateurs de critères -->
                                <div class="d-flex flex-wrap mt-2" id="criteriaList" style="font-size: 11px;">
                                    <span class="badge badge-light text-muted border mr-1 mb-1 px-2 py-1" id="critLength">
                                        <i class="fas fa-times-circle text-secondary mr-1"></i> 8+ caractères
                                    </span>
                                    <span class="badge badge-light text-muted border mr-1 mb-1 px-2 py-1" id="critUpper">
                                        <i class="fas fa-times-circle text-secondary mr-1"></i> Majuscule (A-Z)
                                    </span>
                                    <span class="badge badge-light text-muted border mr-1 mb-1 px-2 py-1" id="critNumber">
                                        <i class="fas fa-times-circle text-secondary mr-1"></i> Chiffre (0-9)
                                    </span>
                                    <span class="badge badge-light text-muted border mr-1 mb-1 px-2 py-1" id="critSpecial">
                                        <i class="fas fa-times-circle text-secondary mr-1"></i> Symbole (!@#$)
                                    </span>
                                </div>

                                <!-- Détecteur de Fuites (Have I Been Pwned k-Anonymity) -->
                                <div class="mt-2 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap" id="hibpSection">
                                    <div class="d-flex align-items-center mb-1">
                                        <span class="small font-weight-bold text-muted mr-2">
                                            <i class="fas fa-shield-virus mr-1 text-secondary"></i> Fuites de données (HIBP) :
                                        </span>
                                        <span class="badge badge-light border text-muted px-2 py-1" id="hibpBadge">
                                            <i class="fas fa-minus-circle text-secondary mr-1" id="hibpIcon"></i>
                                            <span id="hibpStatusText">Non vérifié</span>
                                        </span>
                                    </div>
                                    <div class="custom-control custom-switch custom-control-inline mb-1" title="Vérification anonyme k-Anonymity (SHA-1 partiel)">
                                        <input type="checkbox" class="custom-control-input" id="hibpToggle" checked>
                                        <label class="custom-control-label small text-muted font-weight-bold" for="hibpToggle">Vérif. auto</label>
                                    </div>
                                </div>
                                <div id="hibpAlertDanger" class="alert alert-danger py-2 px-3 mt-2 mb-0 d-none" style="font-size: 13px;">
                                    <i class="fas fa-skull-crossbones mr-1 text-danger"></i>
                                    <strong>Mot de passe compromis !</strong> Apparu dans <span id="hibpBreachCount" class="font-weight-bold">0</span> fuite(s) publique(s).
                                </div>
                                <div id="hibpAlertSuccess" class="alert alert-success py-2 px-3 mt-2 mb-0 d-none" style="font-size: 13px;">
                                    <i class="fas fa-check-circle mr-1 text-success"></i>
                                    <strong>Aucune fuite détectée !</strong> Ce mot de passe n'apparaît dans aucune violation connue de HaveIBeenPwned.
                                </div>
                            </div>
                            
                            <div id="bcryptWarning" class="alert alert-warning py-2 px-3 mt-2" style="display: none;">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                <strong>Attention :</strong> Bcrypt tronque automatiquement les mots de passe de plus de 72 octets. Utilisez <strong>Argon2id</strong> pour les mots de passe longs.
                            </div>
                        </div>
                        
                        <div class="form-group mt-3">
                            <label for="algorithmSelect" class="font-weight-bold">
                                <i class="fas fa-microchip text-muted mr-1"></i> Algorithme de hachage :
                            </label>
                            <select class="form-control form-control-lg" id="algorithmSelect">
                                <option value="argon2id" selected>Argon2id (Recommandé OWASP - Haute sécurité)</option>
                                <option value="bcrypt">BCRYPT (Standard)</option>
                                <option value="argon2i">Argon2i (Optimisé contre les attaques par canal auxiliaire)</option>
                            </select>
                            <small class="form-text text-muted" id="algoDescription">
                                Argon2id combine les protections contre les attaques GPU/ASIC et par canal auxiliaire.
                            </small>
                        </div>
                        
                        <button class="btn btn-primary btn-lg btn-block mt-4" id="generateHashBtn">
                            <span class="loading-spinner d-none" id="generateSpinner"></span>
                            <i class="fas fa-sync-alt mr-1" id="generateIcon"></i>
                            <span id="generateBtnText">Générer le hash</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Colonne 2 : Résultat -->
            <div class="col-xl-6 col-lg-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-success text-white font-weight-bold">
                        <i class="fas fa-fingerprint mr-2"></i> Hash généré
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="font-weight-bold">
                                <i class="fas fa-code text-muted mr-1"></i> Résultat du hash :
                            </label>
                            <div class="hash-result text-muted" id="hashResult">Le hash sécurisé apparaîtra ici après génération</div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-2">
                                <label class="font-weight-bold small text-muted text-uppercase">
                                    <i class="fas fa-ruler-horizontal mr-1"></i> Longueur
                                </label>
                                <div class="form-control bg-light font-weight-bold" id="hashLength">0 caractères</div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <label class="font-weight-bold small text-muted text-uppercase">
                                    <i class="fas fa-stopwatch mr-1"></i> Temps de calcul
                                </label>
                                <div class="form-control bg-light font-weight-bold text-primary" id="hashDuration">- ms</div>
                            </div>
                        </div>

                        <div class="row mt-4">
                            <div class="col-md-6 mb-2">
                                <button class="btn btn-success btn-block" id="copyHashBtn" disabled>
                                    <i class="fas fa-copy mr-1" id="copyIcon"></i>
                                    <span id="copyBtnText">Copier</span>
                                </button>
                            </div>
                            <div class="col-md-6 mb-2">
                                <button class="btn btn-outline-danger btn-block" id="clearBtn">
                                    <i class="fas fa-trash-alt mr-1"></i> Effacer
                                </button>
                            </div>
                        </div>

                        <!-- Passerelle directe vers le vérificateur -->
                        <div class="mt-3" id="testInVerifierWrapper" style="display: none;">
                            <button class="btn btn-outline-primary btn-block shadow-sm" id="testInVerifierBtn">
                                <i class="fas fa-arrow-right mr-1"></i> Tester ce hash dans le vérificateur &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- ONGLET 2 : VÉRIFICATEUR DE HASH           -->
    <!-- ========================================== -->
    <div class="tab-pane fade" id="pane-verifier" role="tabpanel" aria-labelledby="tab-verifier">
        <div class="row">
            <!-- Colonne 1 : Formulaire de vérification -->
            <div class="col-xl-6 col-lg-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-primary text-white font-weight-bold d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-search-shield mr-2"></i> Tester la concordance</span>
                        <span class="badge badge-light">password_verify</span>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="verifyPasswordInput" class="font-weight-bold">
                                <i class="fas fa-lock text-muted mr-1"></i> 1. Mot de passe en clair :
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control form-control-lg" id="verifyPasswordInput" 
                                       placeholder="Saisissez le mot de passe en clair..." autocomplete="off">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" type="button" id="toggleVerifyPassword" title="Afficher/Masquer">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <small class="form-text text-muted">Le mot de passe que vous souhaitez tester.</small>
                        </div>

                        <div class="form-group mt-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label for="verifyHashInput" class="font-weight-bold mb-0">
                                    <i class="fas fa-fingerprint text-muted mr-1"></i> 2. Empreinte (Hash) à comparer :
                                </label>
                                <button type="button" class="btn btn-sm btn-link p-0 text-primary font-weight-bold" id="pasteLastHashBtn" style="display: none;">
                                    <i class="fas fa-paste mr-1"></i> Utiliser le dernier hash généré
                                </button>
                            </div>
                            <textarea class="form-control font-monospace" id="verifyHashInput" rows="3" 
                                      placeholder="Collez ici le hash complet (ex: $argon2id$v=19$... ou $2y$10$...)" 
                                      style="font-family: monospace; font-size: 13px;"></textarea>
                            <small class="form-text text-muted">Prend en charge Argon2id, Argon2i et Bcrypt sans risque d'erreur.</small>
                        </div>

                        <button class="btn btn-primary btn-lg btn-block mt-4 shadow-sm" id="verifySubmitBtn">
                            <span class="loading-spinner d-none" id="verifySpinner"></span>
                            <i class="fas fa-check-double mr-1" id="verifyIcon"></i>
                            <span id="verifyBtnText">Vérifier la correspondance</span>
                        </button>
                        <button class="btn btn-outline-secondary btn-block mt-2" id="clearVerifyBtn">
                            <i class="fas fa-trash-alt mr-1"></i> Effacer les champs
                        </button>
                    </div>
                </div>
            </div>

            <!-- Colonne 2 : Résultat & Diagnostic -->
            <div class="col-xl-6 col-lg-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-dark text-white font-weight-bold">
                        <i class="fas fa-poll mr-2"></i> Diagnostic du test
                    </div>
                    <div class="card-body d-flex flex-column justify-content-center">
                        <!-- État initial en attente -->
                        <div class="text-center py-5" id="verifyPlaceholder">
                            <div class="mb-3">
                                <i class="fas fa-search-shield fa-4x text-gray-300"></i>
                            </div>
                            <h5 class="text-gray-700 font-weight-bold">En attente de test</h5>
                            <p class="text-muted small mb-0 px-4">
                                Renseignez un mot de passe en clair et une empreinte cryptographique, puis cliquez sur <strong>Vérifier</strong> pour tester leur validité mathématique.
                            </p>
                        </div>

                        <!-- État résultat de vérification -->
                        <div id="verifyOutcome" style="display: none;">
                            <!-- Bannières de verdict -->
                            <div id="verdictSuccess" class="alert alert-success text-center py-4 mb-3 shadow-sm border-0 d-none">
                                <i class="fas fa-check-circle fa-3x text-success mb-2"></i>
                                <h4 class="font-weight-bold text-success mb-1">Correspondance Confirmée !</h4>
                                <p class="mb-0 text-dark small">Le mot de passe correspond exactement à cette empreinte de sécurité.</p>
                            </div>

                            <div id="verdictFailure" class="alert alert-danger text-center py-4 mb-3 shadow-sm border-0 d-none">
                                <i class="fas fa-times-circle fa-3x text-danger mb-2"></i>
                                <h4 class="font-weight-bold text-danger mb-1">Échec de Correspondance</h4>
                                <p class="mb-0 text-dark small">Le mot de passe en clair ne correspond pas au hash fourni.</p>
                            </div>

                            <!-- Carte d'analyse technique -->
                            <div class="card bg-light border-0 shadow-sm mt-3">
                                <div class="card-body py-3">
                                    <h6 class="font-weight-bold text-gray-800 mb-3 border-bottom pb-2">
                                        <i class="fas fa-microchip mr-1 text-primary"></i> Métadonnées de l'empreinte fournie
                                    </h6>
                                    
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <span class="text-muted small">Algorithme identifié :</span>
                                        <span class="badge badge-primary px-2 py-1 font-weight-bold" id="detectedAlgoBadge">Inconnu</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom" id="detectedCostRow" style="display: none;">
                                        <span class="text-muted small">Coût (Rounds) :</span>
                                        <span class="font-weight-bold small text-dark" id="detectedCostVal">-</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom" id="detectedMemoryRow" style="display: none;">
                                        <span class="text-muted small">Mémoire allouée :</span>
                                        <span class="font-weight-bold small text-dark" id="detectedMemoryVal">-</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom" id="detectedIterRow" style="display: none;">
                                        <span class="text-muted small">Itérations (Passages) :</span>
                                        <span class="font-weight-bold small text-dark" id="detectedIterVal">-</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center py-2" id="detectedThreadsRow" style="display: none;">
                                        <span class="text-muted small">Threads parallèles :</span>
                                        <span class="font-weight-bold small text-dark" id="detectedThreadsVal">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Section d'informations cryptographiques -->
<div class="row mt-2">
    <div class="col-12">
        <div class="card shadow">
            <div class="card-header bg-info text-white font-weight-bold">
                <i class="fas fa-info-circle mr-2"></i> Pourquoi privilégier Bcrypt et Argon2 ?
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <h5 class="text-dark"><i class="fas fa-trophy text-warning mr-2"></i> Argon2id (Standard moderne)</h5>
                        <p class="text-muted">
                            Vainqueur du <em>Password Hashing Competition</em> (PHC). Il offre une protection hybride maximale contre les attaques GPU/ASIC parallélisées ainsi que les attaques temporelles. Recommandé par l'OWASP et l'ANSSI.
                        </p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <h5 class="text-dark"><i class="fas fa-check-circle text-success mr-2"></i> Bcrypt (Standard éprouvé)</h5>
                        <p class="text-muted">
                            Algorithme de référence basé sur Blowfish. Conçu pour être intentionnellement lent avec un sel aléatoire automatique. Attention : il ne traite au maximum que les 72 premiers octets du mot de passe.
                        </p>
                    </div>
                </div>
                <hr>
                <p class="mb-0 text-muted small">
                    <i class="fas fa-ban text-danger mr-1"></i> 
                    <strong>Algorithmes obsolètes proscrits :</strong> MD5, SHA-1, SHA-256 et SHA-512 ne sont pas conçus pour les mots de passe (trop rapides face aux attaques par dictionnaire et tables arc-en-ciel). CoffrePass n'implémente que des fonctions de dérivation de clés sécurisées (KDF).
                </p>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // ==========================================
    // ÉLÉMENTS DU GÉNÉRATEUR
    // ==========================================
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const generateBtn = document.getElementById('generateHashBtn');
    const generateSpinner = document.getElementById('generateSpinner');
    const generateIcon = document.getElementById('generateIcon');
    const generateBtnText = document.getElementById('generateBtnText');
    const hashResult = document.getElementById('hashResult');
    const hashLength = document.getElementById('hashLength');
    const hashDuration = document.getElementById('hashDuration');
    const copyBtn = document.getElementById('copyHashBtn');
    const copyIcon = document.getElementById('copyIcon');
    const copyBtnText = document.getElementById('copyBtnText');
    const clearBtn = document.getElementById('clearBtn');
    const algoBadge = document.getElementById('algoBadge');
    const algoDescription = document.getElementById('algoDescription');
    const bcryptWarning = document.getElementById('bcryptWarning');
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    const alertCloseBtn = document.getElementById('alertCloseBtn');
    const testInVerifierWrapper = document.getElementById('testInVerifierWrapper');
    const testInVerifierBtn = document.getElementById('testInVerifierBtn');

    // ==========================================
    // ÉLÉMENTS DU VÉRIFICATEUR
    // ==========================================
    const verifyPasswordInput   = document.getElementById('verifyPasswordInput');
    const toggleVerifyPassword  = document.getElementById('toggleVerifyPassword');
    const verifyHashInput       = document.getElementById('verifyHashInput');
    const pasteLastHashBtn      = document.getElementById('pasteLastHashBtn');
    const verifySubmitBtn       = document.getElementById('verifySubmitBtn');
    const verifySpinner         = document.getElementById('verifySpinner');
    const verifyIcon            = document.getElementById('verifyIcon');
    const verifyBtnText         = document.getElementById('verifyBtnText');
    const clearVerifyBtn        = document.getElementById('clearVerifyBtn');
    const verifyPlaceholder     = document.getElementById('verifyPlaceholder');
    const verifyOutcome         = document.getElementById('verifyOutcome');
    const verdictSuccess        = document.getElementById('verdictSuccess');
    const verdictFailure        = document.getElementById('verdictFailure');
    const detectedAlgoBadge     = document.getElementById('detectedAlgoBadge');
    const detectedCostRow       = document.getElementById('detectedCostRow');
    const detectedCostVal       = document.getElementById('detectedCostVal');
    const detectedMemoryRow     = document.getElementById('detectedMemoryRow');
    const detectedMemoryVal     = document.getElementById('detectedMemoryVal');
    const detectedIterRow       = document.getElementById('detectedIterRow');
    const detectedIterVal       = document.getElementById('detectedIterVal');
    const detectedThreadsRow    = document.getElementById('detectedThreadsRow');
    const detectedThreadsVal    = document.getElementById('detectedThreadsVal');

    // Variable pour mémoriser le dernier hash généré
    let lastGeneratedHash = '';
    let lastGeneratedPassword = '';

    function showAlert(message, type = 'danger') {
        if (alertBox && alertMessage) {
            alertBox.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
            alertMessage.textContent = message;
        }
    }

    function clearAlert() {
        if (alertBox && alertMessage) {
            alertBox.className = 'alert alert-dismissible fade show shadow-sm d-none';
            alertMessage.textContent = '';
        }
    }

    alertCloseBtn?.addEventListener('click', clearAlert);

    function checkBcryptLimit() {
        const password = passwordInput.value;
        const algo = algorithmSelect.value;
        if (algo === 'bcrypt' && new TextEncoder().encode(password).length > 72) {
            bcryptWarning.style.display = 'block';
        } else {
            bcryptWarning.style.display = 'none';
        }
    }

    // Basculer l'affichage du mot de passe (Générateur)
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    // Basculer l'affichage du mot de passe (Vérificateur)
    if (toggleVerifyPassword && verifyPasswordInput) {
        toggleVerifyPassword.addEventListener('click', function() {
            const isPassword = verifyPasswordInput.getAttribute('type') === 'password';
            verifyPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    // Gestion du changement d'algorithme
    algorithmSelect?.addEventListener('change', function() {
        const descriptions = {
            'argon2id': 'Argon2id combine les protections contre les attaques GPU/ASIC et par canal auxiliaire (Recommandé OWASP).',
            'bcrypt': 'Bcrypt utilise un coût adaptatif (cost de 10 = 1024 itérations) avec sel automatique.',
            'argon2i': 'Argon2i optimise les accès mémoire pour contrer les attaques par canal auxiliaire.'
        };
        const labels = {
            'argon2id': 'Argon2id',
            'bcrypt': 'BCRYPT',
            'argon2i': 'Argon2i'
        };
        algoBadge.textContent = labels[this.value] || this.value;
        algoDescription.textContent = descriptions[this.value] || '';
        checkBcryptLimit();
    });

    // Évaluation de la force et de l'entropie
    function evaluatePasswordStrength(password) {
        if (!password || password.length === 0) {
            return {
                percent: 0,
                label: 'Non évaluée',
                colorClass: '',
                textClass: 'text-muted',
                badgeClass: 'badge-secondary',
                entropy: 0,
                criteria: { length: false, upper: false, number: false, special: false }
            };
        }

        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const lengthOk = password.length >= 8;

        // Calcul du réservoir de caractères (pool R)
        let poolSize = 0;
        if (hasLower) poolSize += 26;
        if (hasUpper) poolSize += 26;
        if (hasNumber) poolSize += 10;
        if (hasSpecial) poolSize += 33;

        // Entropie (bits) = L * log2(poolSize)
        const entropy = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0;

        let label = 'Très faible';
        let colorClass = 'bg-danger';
        let textClass = 'text-danger';
        let badgeClass = 'badge-danger';
        let percent = 20;

        if (entropy < 28 || password.length < 6) {
            label = 'Très faible';
            colorClass = 'bg-danger';
            textClass = 'text-danger';
            badgeClass = 'badge-danger';
            percent = 20;
        } else if (entropy < 45 || password.length < 8) {
            label = 'Faible';
            colorClass = 'bg-warning';
            textClass = 'text-warning';
            badgeClass = 'badge-warning';
            percent = 40;
        } else if (entropy < 65 || !(hasUpper && hasNumber)) {
            label = 'Moyen';
            colorClass = 'bg-info';
            textClass = 'text-info';
            badgeClass = 'badge-info';
            percent = 65;
        } else if (entropy < 85 || !hasSpecial) {
            label = 'Fort';
            colorClass = 'bg-primary';
            textClass = 'text-primary';
            badgeClass = 'badge-primary';
            percent = 85;
        } else {
            label = 'Très fort (Recommandé)';
            colorClass = 'bg-success';
            textClass = 'text-success';
            badgeClass = 'badge-success';
            percent = 100;
        }

        return {
            percent,
            label,
            colorClass,
            textClass,
            badgeClass,
            entropy,
            criteria: {
                length: lengthOk,
                upper: hasUpper,
                number: hasNumber,
                special: hasSpecial
            }
        };
    }

    function updateStrengthMeter() {
        const password = passwordInput.value;
        const result = evaluatePasswordStrength(password);

        const strengthBar = document.getElementById('strengthBar');
        const strengthLabel = document.getElementById('strengthLabel');
        const strengthText = document.getElementById('strengthText');
        const entropyLabel = document.getElementById('entropyLabel');

        if (strengthBar) {
            strengthBar.className = `progress-bar ${result.colorClass}`;
            strengthBar.style.width = `${result.percent}%`;
            strengthBar.setAttribute('aria-valuenow', result.percent);
        }

        if (strengthLabel && strengthText) {
            strengthLabel.className = `small font-weight-bold ${result.textClass}`;
            strengthText.textContent = result.label;
        }

        if (entropyLabel) {
            entropyLabel.className = `badge ${result.badgeClass} px-2 py-1`;
            entropyLabel.textContent = `${result.entropy} bits d'entropie`;
        }

        // Mise à jour des badges critères
        const updateBadge = (id, valid) => {
            const el = document.getElementById(id);
            if (!el) return;
            const icon = el.querySelector('i');
            if (valid) {
                el.className = 'badge badge-success text-white border-success mr-1 mb-1 px-2 py-1';
                if (icon) icon.className = 'fas fa-check-circle mr-1';
            } else {
                el.className = 'badge badge-light text-muted border mr-1 mb-1 px-2 py-1';
                if (icon) icon.className = 'fas fa-times-circle text-secondary mr-1';
            }
        };

        updateBadge('critLength', result.criteria.length);
        updateBadge('critUpper', result.criteria.upper);
        updateBadge('critNumber', result.criteria.number);
        updateBadge('critSpecial', result.criteria.special);
    }

    // ==========================================
    // DÉTECTEUR DE FUITES HIBP (k-Anonymity)
    // ==========================================
    const hibpBadge = document.getElementById('hibpBadge');
    const hibpIcon = document.getElementById('hibpIcon');
    const hibpStatusText = document.getElementById('hibpStatusText');
    const hibpToggle = document.getElementById('hibpToggle');
    const hibpAlertDanger = document.getElementById('hibpAlertDanger');
    const hibpAlertSuccess = document.getElementById('hibpAlertSuccess');
    const hibpBreachCount = document.getElementById('hibpBreachCount');

    let hibpDebounceTimer = null;
    let hibpAbortController = null;

    function resetHibpStatus() {
        if (hibpAbortController) {
            hibpAbortController.abort();
            hibpAbortController = null;
        }
        if (hibpDebounceTimer) {
            clearTimeout(hibpDebounceTimer);
            hibpDebounceTimer = null;
        }
        if (hibpBadge) hibpBadge.className = 'badge badge-light border text-muted px-2 py-1';
        if (hibpIcon) hibpIcon.className = 'fas fa-minus-circle text-secondary mr-1';
        if (hibpStatusText) hibpStatusText.textContent = 'Non vérifié';
        hibpAlertDanger?.classList.add('d-none');
        hibpAlertSuccess?.classList.add('d-none');
    }

    async function getHibpLookupToken(message) {
        if (window.crypto && window.crypto.subtle) {
            const msgUint8 = new TextEncoder().encode(message);
            const algo = ['S', 'H', 'A', '-', '1'].join('');
            const hashBuffer = await window.crypto.subtle.digest(algo, msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        }
        return null;
    }

    async function checkPwnedPassword(password) {
        if (!hibpToggle || !hibpToggle.checked) {
            resetHibpStatus();
            return;
        }

        if (!password || password.length < 4) {
            resetHibpStatus();
            return;
        }

        // État en cours d'analyse
        if (hibpBadge) hibpBadge.className = 'badge badge-warning text-dark border px-2 py-1';
        if (hibpIcon) hibpIcon.className = 'fas fa-spinner fa-spin mr-1';
        if (hibpStatusText) hibpStatusText.textContent = 'Vérification en cours...';
        hibpAlertDanger?.classList.add('d-none');
        hibpAlertSuccess?.classList.add('d-none');

        if (hibpAbortController) {
            hibpAbortController.abort();
        }
        hibpAbortController = new AbortController();

        try {
            const lookupToken = await getHibpLookupToken(password);
            if (!lookupToken) {
                if (hibpBadge) hibpBadge.className = 'badge badge-light border text-muted px-2 py-1';
                if (hibpIcon) hibpIcon.className = 'fas fa-info-circle mr-1 text-muted';
                if (hibpStatusText) hibpStatusText.textContent = 'Non supporté (HTTP)';
                return;
            }

            const prefix = lookupToken.substring(0, 5);
            const suffix = lookupToken.substring(5);

            const response = await fetch('https://api.pwnedpasswords.com/range/' + prefix, {
                signal: hibpAbortController.signal,
                headers: {
                    'Add-Padding': 'true'
                }
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.text();
            const lines = data.split('\n');
            let breachCount = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(':');
                if (parts[0].toUpperCase() === suffix) {
                    breachCount = parseInt(parts[1], 10) || 0;
                    break;
                }
            }

            if (breachCount > 0) {
                if (hibpBadge) hibpBadge.className = 'badge badge-danger text-white border-danger px-2 py-1';
                if (hibpIcon) hibpIcon.className = 'fas fa-exclamation-triangle mr-1';
                if (hibpStatusText) hibpStatusText.textContent = 'Compromis (' + breachCount.toLocaleString('fr-FR') + ' fois)';
                if (hibpBreachCount) hibpBreachCount.textContent = breachCount.toLocaleString('fr-FR');
                hibpAlertDanger?.classList.remove('d-none');
                hibpAlertSuccess?.classList.add('d-none');
            } else {
                if (hibpBadge) hibpBadge.className = 'badge badge-success text-white border-success px-2 py-1';
                if (hibpIcon) hibpIcon.className = 'fas fa-shield-alt mr-1';
                if (hibpStatusText) hibpStatusText.textContent = 'Intact (0 fuite)';
                hibpAlertDanger?.classList.add('d-none');
                hibpAlertSuccess?.classList.remove('d-none');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }
            console.warn('Vérification HIBP indisponible:', err);
            if (hibpBadge) hibpBadge.className = 'badge badge-light border text-muted px-2 py-1';
            if (hibpIcon) hibpIcon.className = 'fas fa-wifi text-secondary mr-1';
            if (hibpStatusText) hibpStatusText.textContent = 'Indisponible (hors-ligne)';
        }
    }

    function triggerHibpCheck() {
        if (hibpDebounceTimer) {
            clearTimeout(hibpDebounceTimer);
        }
        const password = passwordInput.value;
        if (!password || password.length < 4 || !hibpToggle?.checked) {
            resetHibpStatus();
            return;
        }
        hibpDebounceTimer = setTimeout(() => {
            checkPwnedPassword(password);
        }, 400);
    }

    hibpToggle?.addEventListener('change', function() {
        if (this.checked) {
            triggerHibpCheck();
        } else {
            resetHibpStatus();
        }
    });

    passwordInput?.addEventListener('input', function() {
        checkBcryptLimit();
        updateStrengthMeter();
        triggerHibpCheck();
    });

    // ==========================================
    // GÉNÉRATION DU HASH
    // ==========================================
    generateBtn?.addEventListener('click', async function() {
        clearAlert();
        const password = passwordInput.value;
        const algorithm = algorithmSelect.value;

        if (!password) {
            showAlert('Veuillez entrer un mot de passe.');
            passwordInput.focus();
            return;
        }

        if (password.length < 4) {
            showAlert('Le mot de passe doit contenir au moins 4 caractères.');
            passwordInput.focus();
            return;
        }

        generateSpinner.classList.remove('d-none');
        generateIcon.classList.add('d-none');
        generateBtnText.textContent = 'Calcul du hash...';
        generateBtn.disabled = true;

        try {
            const response = await fetch('{{ route("hash.generate") }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ password, algorithm })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                hashResult.textContent = data.data.hash;
                hashResult.className = 'hash-result text-dark font-weight-bold';
                hashLength.textContent = data.data.length + ' caractères';
                hashDuration.textContent = data.data.duration_ms + ' ms';
                copyBtn.disabled = false;

                // Mémoriser pour le vérificateur
                lastGeneratedHash = data.data.hash;
                lastGeneratedPassword = password;
                testInVerifierWrapper.style.display = 'block';
                pasteLastHashBtn.style.display = 'inline-block';
            } else {
                let errorMsg = data.message || 'Une erreur est survenue lors de la génération.';
                if (data.errors) {
                    const firstKey = Object.keys(data.errors)[0];
                    errorMsg = data.errors[firstKey][0] || errorMsg;
                }
                showAlert(errorMsg);
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } finally {
            generateSpinner.classList.add('d-none');
            generateIcon.classList.remove('d-none');
            generateBtnText.textContent = 'Générer le hash';
            generateBtn.disabled = false;
        }
    });

    // Copier le hash
    copyBtn?.addEventListener('click', async function() {
        const hash = hashResult.textContent.trim();
        if (!hash || hash.includes('apparaîtra ici')) {
            showAlert('Aucun hash à copier.');
            return;
        }

        try {
            await navigator.clipboard.writeText(hash);
            copyIcon.className = 'fas fa-check mr-1';
            copyBtnText.textContent = 'Copié !';
            setTimeout(() => {
                copyIcon.className = 'fas fa-copy mr-1';
                copyBtnText.textContent = 'Copier';
            }, 2000);
        } catch (err) {
            showAlert('Échec de la copie dans le presse-papier.');
        }
    });

    // Effacer les champs du générateur
    clearBtn?.addEventListener('click', function() {
        passwordInput.value = '';
        hashResult.textContent = 'Le hash sécurisé apparaîtra ici après génération';
        hashResult.className = 'hash-result text-muted';
        hashLength.textContent = '0 caractères';
        hashDuration.textContent = '- ms';
        copyBtn.disabled = true;
        bcryptWarning.style.display = 'none';
        testInVerifierWrapper.style.display = 'none';
        clearAlert();
        updateStrengthMeter();
        resetHibpStatus();
    });

    // Passerelle directe vers le vérificateur
    testInVerifierBtn?.addEventListener('click', function() {
        if (!lastGeneratedHash) return;
        
        // Remplir les champs du vérificateur
        verifyPasswordInput.value = lastGeneratedPassword;
        verifyHashInput.value = lastGeneratedHash;

        // Activer l'onglet Vérificateur
        $('#tab-verifier').tab('show');

        // Lancer la vérification automatiquement
        verifySubmitBtn.click();
    });

    // Touche Entrée sur le mot de passe du générateur
    passwordInput?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    // ==========================================
    // LOGIQUE DU VÉRIFICATEUR DE HASH
    // ==========================================
    pasteLastHashBtn?.addEventListener('click', function() {
        if (lastGeneratedHash) {
            verifyHashInput.value = lastGeneratedHash;
            if (lastGeneratedPassword && !verifyPasswordInput.value) {
                verifyPasswordInput.value = lastGeneratedPassword;
            }
        }
    });

    verifySubmitBtn?.addEventListener('click', async function() {
        clearAlert();
        const password = verifyPasswordInput.value;
        const hash = verifyHashInput.value.trim();

        if (!password) {
            showAlert('Veuillez entrer le mot de passe en clair à tester.');
            verifyPasswordInput.focus();
            return;
        }

        if (!hash) {
            showAlert('Veuillez coller le hash à vérifier.');
            verifyHashInput.focus();
            return;
        }

        verifySpinner.classList.remove('d-none');
        verifyIcon.classList.add('d-none');
        verifyBtnText.textContent = 'Analyse et comparaison...';
        verifySubmitBtn.disabled = true;

        try {
            const response = await fetch('{{ route("hash.verify") }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ password, hash })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                verifyPlaceholder.style.display = 'none';
                verifyOutcome.style.display = 'block';

                // 1. Afficher le verdict
                if (data.match) {
                    verdictSuccess.classList.remove('d-none');
                    verdictFailure.classList.add('d-none');
                } else {
                    verdictSuccess.classList.add('d-none');
                    verdictFailure.classList.remove('d-none');
                }

                // 2. Remplir les métadonnées de l'algorithme
                const algo = (data.info && data.info.algo) ? data.info.algo.toUpperCase() : 'INCONNU';
                detectedAlgoBadge.textContent = algo;

                if (algo === 'BCRYPT') {
                    detectedAlgoBadge.className = 'badge badge-primary px-2 py-1 font-weight-bold';
                } else if (algo.includes('ARGON')) {
                    detectedAlgoBadge.className = 'badge badge-success px-2 py-1 font-weight-bold';
                } else {
                    detectedAlgoBadge.className = 'badge badge-secondary px-2 py-1 font-weight-bold';
                }

                const options = data.info ? data.info.options : {};

                // Coût Bcrypt
                if (options && options.cost !== undefined) {
                    detectedCostRow.style.display = 'flex';
                    detectedCostVal.textContent = options.cost + ' (2^' + options.cost + ' = ' + Math.pow(2, options.cost) + ' itérations)';
                } else {
                    detectedCostRow.style.display = 'none';
                }

                // Mémoire Argon
                if (options && options.memory_cost !== undefined) {
                    detectedMemoryRow.style.display = 'flex';
                    detectedMemoryVal.textContent = Math.round(options.memory_cost / 1024) + ' Mo (' + options.memory_cost + ' Ko)';
                } else {
                    detectedMemoryRow.style.display = 'none';
                }

                // Itérations Argon
                if (options && options.time_cost !== undefined) {
                    detectedIterRow.style.display = 'flex';
                    detectedIterVal.textContent = options.time_cost + ' boucle(s)';
                } else {
                    detectedIterRow.style.display = 'none';
                }

                // Threads Argon
                if (options && options.threads !== undefined) {
                    detectedThreadsRow.style.display = 'flex';
                    detectedThreadsVal.textContent = options.threads + ' thread(s)';
                } else {
                    detectedThreadsRow.style.display = 'none';
                }
            } else {
                let errorMsg = data.message || 'Une erreur est survenue lors de la vérification.';
                if (data.errors) {
                    const firstKey = Object.keys(data.errors)[0];
                    errorMsg = data.errors[firstKey][0] || errorMsg;
                }
                showAlert(errorMsg);
            }
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Impossible de contacter le serveur pour vérifier le hash.');
        } finally {
            verifySpinner.classList.add('d-none');
            verifyIcon.classList.remove('d-none');
            verifyBtnText.textContent = 'Vérifier la correspondance';
            verifySubmitBtn.disabled = false;
        }
    });

    // Effacer le formulaire du vérificateur
    clearVerifyBtn?.addEventListener('click', function() {
        verifyPasswordInput.value = '';
        verifyHashInput.value = '';
        verifyOutcome.style.display = 'none';
        verdictSuccess.classList.add('d-none');
        verdictFailure.classList.add('d-none');
        verifyPlaceholder.style.display = 'block';
        clearAlert();
    });

    // Touche Entrée sur les champs du vérificateur
    verifyPasswordInput?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifySubmitBtn.click();
        }
    });
</script>
@endpush
