@extends('layouts.app')

@section('content')
<!-- En-tête de page -->
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">
        <i class="fas fa-shield-alt text-primary mr-2"></i> Générateur de Hash Sécurisé
    </h1>
</div>

<!-- Zone d'alertes dynamiques -->
<div id="alertContainer"></div>

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
                                <i class="fas fa-shield-alt mr-1"></i> Force : Non évaluée
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
                    <i class="fas fa-sync-alt mr-1"></i> Générer le hash
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
                    <div class="hash-result" id="hashResult">
                        <span class="text-muted">Le hash sécurisé apparaîtra ici après génération</span>
                    </div>
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
                            <i class="fas fa-copy mr-1"></i> Copier
                        </button>
                    </div>
                    <div class="col-md-6 mb-2">
                        <button class="btn btn-outline-danger btn-block" id="clearBtn">
                            <i class="fas fa-trash-alt mr-1"></i> Effacer
                        </button>
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
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const generateBtn = document.getElementById('generateHashBtn');
    const hashResult = document.getElementById('hashResult');
    const hashLength = document.getElementById('hashLength');
    const hashDuration = document.getElementById('hashDuration');
    const copyBtn = document.getElementById('copyHashBtn');
    const clearBtn = document.getElementById('clearBtn');
    const algoBadge = document.getElementById('algoBadge');
    const algoDescription = document.getElementById('algoDescription');
    const bcryptWarning = document.getElementById('bcryptWarning');
    const alertContainer = document.getElementById('alertContainer');

    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle mr-1"></i> ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Fermer">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
    }

    function clearAlert() {
        alertContainer.innerHTML = '';
    }

    function checkBcryptLimit() {
        const password = passwordInput.value;
        const algo = algorithmSelect.value;
        if (algo === 'bcrypt' && new TextEncoder().encode(password).length > 72) {
            bcryptWarning.style.display = 'block';
        } else {
            bcryptWarning.style.display = 'none';
        }
    }

    // Basculer l'affichage du mot de passe
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
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
        const entropyLabel = document.getElementById('entropyLabel');

        if (strengthBar) {
            strengthBar.className = `progress-bar ${result.colorClass}`;
            strengthBar.style.width = `${result.percent}%`;
            strengthBar.setAttribute('aria-valuenow', result.percent);
        }

        if (strengthLabel) {
            strengthLabel.className = `small font-weight-bold ${result.textClass}`;
            strengthLabel.innerHTML = `<i class="fas fa-shield-alt mr-1"></i> Force : ${result.label}`;
        }

        if (entropyLabel) {
            entropyLabel.className = `badge ${result.badgeClass} px-2 py-1`;
            entropyLabel.textContent = `${result.entropy} bits d'entropie`;
        }

        // Mise à jour des badges critères
        const updateBadge = (id, valid) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (valid) {
                el.className = 'badge badge-success text-white border-success mr-1 mb-1 px-2 py-1';
                el.querySelector('i').className = 'fas fa-check-circle mr-1';
            } else {
                el.className = 'badge badge-light text-muted border mr-1 mb-1 px-2 py-1';
                el.querySelector('i').className = 'fas fa-times-circle text-secondary mr-1';
            }
        };

        updateBadge('critLength', result.criteria.length);
        updateBadge('critUpper', result.criteria.upper);
        updateBadge('critNumber', result.criteria.number);
        updateBadge('critSpecial', result.criteria.special);
    }

    passwordInput?.addEventListener('input', function() {
        checkBcryptLimit();
        updateStrengthMeter();
    });

    // Génération du hash
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

        const originalHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="loading-spinner"></span> Calcul du hash...';
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
                hashLength.textContent = data.data.length + ' caractères';
                hashDuration.textContent = data.data.duration_ms + ' ms';
                copyBtn.disabled = false;
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
            generateBtn.innerHTML = originalHtml;
            generateBtn.disabled = false;
        }
    });

    // Copier le hash
    copyBtn?.addEventListener('click', async function() {
        const hash = hashResult.textContent.trim();
        if (!hash || hash.includes('Le hash sécurisé apparaîtra')) {
            showAlert('Aucun hash à copier.');
            return;
        }

        try {
            await navigator.clipboard.writeText(hash);
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copié !';
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
            }, 2000);
        } catch (err) {
            showAlert('Échec de la copie dans le presse-papier.');
        }
    });

    // Effacer les champs
    clearBtn?.addEventListener('click', function() {
        passwordInput.value = '';
        hashResult.innerHTML = '<span class="text-muted">Le hash sécurisé apparaîtra ici après génération</span>';
        hashLength.textContent = '0 caractères';
        hashDuration.textContent = '- ms';
        copyBtn.disabled = true;
        bcryptWarning.style.display = 'none';
        clearAlert();
        updateStrengthMeter();
    });

    // Touche Entrée
    passwordInput?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });
</script>
@endpush
