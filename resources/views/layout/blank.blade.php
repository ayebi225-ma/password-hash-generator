<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="theme-color" content="#2e59d9">
    <meta name="author" content="Christian Ayébi">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>CoffrePass | Générateur de Hash Sécurisé</title>

    <!-- Custom fonts for this template-->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">
    
    <!-- Custom styles for this template-->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/startbootstrap-sb-admin-2/4.1.4/css/sb-admin-2.min.css" rel="stylesheet">

    <style>
        .loader {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border: 8px solid #f3f3f3;
            border-top: 8px solid #4e73df;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
            z-index: 9999;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .hash-result {
            word-break: break-all;
            font-family: monospace;
            background-color: #f8f9fc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e3e6f0;
            font-size: 14px;
            min-height: 80px;
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4e73df;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        .security-badge {
            position: absolute;
            top: 10px;
            right: 10px;
        }
    </style>
</head>

<body id="page-top" class="">
    
    <div id="loader" class="loader"></div>
    <div id="page" style="display: none;">
        <div id="wrapper">
            <div id="content-wrapper" class="d-flex flex-column">
                <div id="content">

                    <!-- Topbar -->
                    <nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow justify-content-between">
                        <h2 class="text-primary">
                            <i class="fas fa-lock"></i> CoffrePass
                        </h2>
                        <div>
                            <span class="mr-2 text-gray-600 small">Bienvenue, {{ Auth::user()->name ?? 'Utilisateur' }}</span>
                            <i class="fas fa-user-circle fa-2x text-gray-300"></i>
                        </div>
                    </nav>

                    <!-- Begin Page Content -->
                    <div class="container-fluid">

                        <!-- Page Heading -->
                        <div class="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 class="h3 mb-0 text-gray-800">
                                <i class="fas fa-shield-alt"></i> Générateur de Hash Sécurisé
                            </h1>
                        </div>

                        <div class="row">
                            
                            <!-- Card 1 : Saisie -->
                            <div class="col-xl-6 col-lg-6 mb-4">
                                <div class="card shadow h-100">
                                    <div class="card-header bg-primary text-white">
                                        <i class="fas fa-edit"></i> Mot de passe à hasher
                                        <span class="security-badge badge bg-light text-dark">Sécurisé</span>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label for="passwordInput" class="font-weight-bold">
                                                <i class="fas fa-lock"></i> Entrez votre mot de passe :
                                            </label>
                                            <div class="input-group">
                                                <input type="password" class="form-control form-control-lg" id="passwordInput" 
                                                       placeholder="ex: MonSuperMotDePasse123!">
                                                <div class="input-group-append">
                                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <small class="form-text text-muted">
                                                <i class="fas fa-info-circle"></i> Minimum 8 caractères
                                            </small>
                                        </div>
                                        
                                        <div class="form-group mt-3">
                                            <label class="font-weight-bold">
                                                <i class="fas fa-microchip"></i> Algorithme sécurisé :
                                            </label>
                                            <select class="form-control" id="algorithmSelect">
                                                <option value="bcrypt">BCRYPT (Recommandé - 60 caractères)</option>
                                                <option value="argon2i">Argon2i (Résistant aux attaques par timing)</option>
                                                <option value="argon2id" selected>Argon2id (Très sécurisé - Recommandé)</option>
                                            </select>
                                        </div>

                                        <div class="form-group mt-3" id="costGroup">
                                            <label class="font-weight-bold">
                                                <i class="fas fa-chart-line"></i> Coût / mémoire :
                                            </label>
                                            <div id="costInfo" class="alert alert-info small">
                                                <i class="fas fa-info-circle"></i> 
                                                <span id="costDescription">Argon2id utilise 102400 Ko de mémoire, 2 itérations, 8 threads</span>
                                            </div>
                                        </div>
                                        
                                        <button class="btn btn-primary btn-lg btn-block mt-3" id="generateHashBtn">
                                            <i class="fas fa-sync-alt"></i> Générer le hash sécurisé
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Card 2 : Résultat -->
                            <div class="col-xl-6 col-lg-6 mb-4">
                                <div class="card shadow h-100">
                                    <div class="card-header bg-success text-white">
                                        <i class="fas fa-code"></i> Hash sécurisé généré
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-bold">
                                                <i class="fas fa-fingerprint"></i> Résultat (hash) :
                                            </label>
                                            <div class="hash-result" id="hashResult">
                                                <span class="text-muted">Le hash apparaîtra ici après génération</span>
                                            </div>
                                        </div>
                                        
                                        <div class="form-group mt-3">
                                            <label class="font-weight-bold">
                                                <i class="fas fa-clock"></i> Longueur du hash :
                                            </label>
                                            <div class="form-control bg-light" id="hashLength" readonly>0 caractères</div>
                                        </div>

                                        <div class="form-group mt-3" id="hashInfoGroup" style="display: none;">
                                            <label class="font-weight-bold">
                                                <i class="fas fa-info-circle"></i> Information sécurité :
                                            </label>
                                            <div class="form-control bg-light" id="hashInfo" readonly></div>
                                        </div>

                                        <div class="form-group mt-3" id="securityNote" style="display: none;">
                                            <div class="alert alert-success">
                                                <i class="fas fa-check-circle"></i> 
                                                <span id="securityMessage"></span>
                                            </div>
                                        </div>
                                        
                                        <div class="row mt-4">
                                            <div class="col-md-6">
                                                <button class="btn btn-outline-success btn-block" id="copyHashBtn" disabled>
                                                    <i class="fas fa-copy"></i> Copier le hash
                                                </button>
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-outline-danger btn-block" id="clearBtn">
                                                    <i class="fas fa-trash-alt"></i> Effacer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section information sécurité -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card shadow">
                                    <div class="card-header bg-info text-white">
                                        <i class="fas fa-shield-alt"></i> Pourquoi bcrypt et Argon2 ?
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h5><i class="fas fa-check-circle text-success"></i> bcrypt</h5>
                                                <p>Standard de l'industrie, intégré nativement dans Laravel. Lent par conception (résiste aux attaques brute-force). Inclut un sel automatique.</p>
                                            </div>
                                            <div class="col-md-6">
                                                <h5><i class="fas fa-trophy text-warning"></i> Argon2id</h5>
                                                <p>Vainqueur du concours PHC (2015). Le plus sécurisé actuellement. Résiste aux attaques GPU et ASIC. Recommandé par l'OWASP.</p>
                                            </div>
                                        </div>
                                        <hr>
                                        <p class="mb-0 text-muted">
                                            <i class="fas fa-ban text-danger"></i> 
                                            <strong>MD5, SHA-1, SHA-256, SHA-512 ont été abandonnés</strong> car ils sont trop rapides et non adaptés aux mots de passe.
                                            Ces algorithmes ne sont plus disponibles dans cet outil pour des raisons de sécurité.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                <!-- Footer -->
                <footer class="sticky-footer bg-white">
                    <div class="container my-auto">
                        <div class="copyright text-center my-auto">
                            <span>Copyright &copy; 2025 CoffrePass - Sécurité maximale avec bcrypt & Argon2</span>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/startbootstrap-sb-admin-2/4.1.4/js/sb-admin-2.min.js"></script>

    <script>
        // Loader
        window.onload = function() {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('page').style.display = 'block';
        };

        // Toggle password
        const togglePasswordBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('passwordInput');
        
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }

        // Mettre à jour les infos selon l'algorithme
        const algorithmSelect = document.getElementById('algorithmSelect');
        const costDescription = document.getElementById('costDescription');
        
        algorithmSelect.addEventListener('change', function() {
            const algorithm = this.value;
            if (algorithm === 'bcrypt') {
                costDescription.innerHTML = 'bcrypt utilise un coût de 10 (2^10 = 1024 itérations)';
            } else if (algorithm === 'argon2i') {
                costDescription.innerHTML = 'Argon2i utilise 102400 Ko de mémoire, 2 itérations, 8 threads (résiste aux attaques par timing)';
            } else if (algorithm === 'argon2id') {
                costDescription.innerHTML = 'Argon2id utilise 102400 Ko de mémoire, 2 itérations, 8 threads (recommandé par l\'OWASP)';
            }
        });

        // Générer le hash
        document.getElementById('generateHashBtn')?.addEventListener('click', async function() {
            const password = document.getElementById('passwordInput').value;
            const algorithm = document.getElementById('algorithmSelect').value;
            const generateBtn = this;
            const originalText = generateBtn.innerHTML;
            
            if (!password) {
                alert('Veuillez entrer un mot de passe');
                return;
            }
            
            if (password.length < 4) {
                alert('Le mot de passe doit contenir au moins 4 caractères');
                return;
            }
            
            generateBtn.innerHTML = '<span class="loading-spinner"></span> Génération en cours...';
            generateBtn.disabled = true;
            
            try {
                const response = await fetch('{{ route("hash.generate") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({ password, algorithm })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('hashResult').innerHTML = data.data.hash;
                    document.getElementById('hashLength').textContent = data.data.length + ' caractères';
                    document.getElementById('copyHashBtn').disabled = false;
                    
                    // Afficher les infos
                    document.getElementById('hashInfoGroup').style.display = 'block';
                    document.getElementById('securityNote').style.display = 'block';
                    
                    let infoText = '';
                    let securityText = '';
                    
                    if (algorithm === 'bcrypt') {
                        infoText = `Algorithme: bcrypt | Coût: ${data.data.cost || 10} | Sel inclus automatiquement`;
                        securityText = 'bcrypt est un standard sécurisé, résistant aux attaques brute-force';
                    } else if (algorithm === 'argon2i') {
                        infoText = `Algorithme: Argon2i | Mémoire: ${data.data.memory || 102400} Ko | Itérations: ${data.data.iterations || 2} | Threads: ${data.data.threads || 8}`;
                        securityText = 'Argon2i protège contre les attaques par timing';
                    } else if (algorithm === 'argon2id') {
                        infoText = `Algorithme: Argon2id | Mémoire: ${data.data.memory || 102400} Ko | Itérations: ${data.data.iterations || 2} | Threads: ${data.data.threads || 8}`;
                        securityText = 'Argon2id est l\'algorithme recommandé par l\'OWASP - Sécurité maximale';
                    }
                    
                    document.getElementById('hashInfo').innerHTML = infoText;
                    document.getElementById('securityMessage').innerHTML = securityText;
                } else {
                    alert('Erreur: ' + data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la génération du hash');
            } finally {
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
            }
        });

        // Copier
        document.getElementById('copyHashBtn')?.addEventListener('click', async function() {
            const hash = document.getElementById('hashResult').textContent;
            
            if (!hash || hash.includes('Le hash apparaîtra')) {
                alert('Aucun hash à copier');
                return;
            }
            
            try {
                await navigator.clipboard.writeText(hash);
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Copié !';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                alert('Impossible de copier le hash');
            }
        });

        // Effacer
        document.getElementById('clearBtn')?.addEventListener('click', function() {
            document.getElementById('passwordInput').value = '';
            document.getElementById('hashResult').innerHTML = '<span class="text-muted">Le hash apparaîtra ici après génération</span>';
            document.getElementById('hashLength').textContent = '0 caractères';
            document.getElementById('copyHashBtn').disabled = true;
            document.getElementById('hashInfoGroup').style.display = 'none';
            document.getElementById('securityNote').style.display = 'none';
        });

        // Entrée pour générer
        passwordInput?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('generateHashBtn').click();
            }
        });
    </script>
</body>

</html>