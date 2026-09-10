<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="CoffrePass - Générateur et vérificateur de hash de mots de passe sécurisés (Bcrypt, Argon2id, Argon2i)">
    <meta name="theme-color" content="#2e59d9">
    <meta name="author" content="Christian Ayébi">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>CoffrePass | Générateur de Hash Sécurisé</title>

    <!-- Polices -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">
    
    <!-- Styles SB Admin 2 -->
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
            animation: spin 1s linear infinite;
            z-index: 9999;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .hash-result {
            word-break: break-all;
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            background-color: #f8f9fc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e3e6f0;
            font-size: 14px;
            min-height: 80px;
        }

        .loading-spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
    </style>
    @yield('styles')
</head>

<body id="page-top">
    <div id="loader" class="loader"></div>
    
    <div id="page" style="display: none;">
        <div id="wrapper">
            <div id="content-wrapper" class="d-flex flex-column min-vh-100">
                <div id="content">
                    <!-- Topbar -->
                    <nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow justify-content-between">
                        <a class="navbar-brand text-primary font-weight-bold" href="{{ route('hash.index') }}">
                            <i class="fas fa-lock mr-2"></i> CoffrePass
                        </a>
                        <span class="badge badge-primary px-3 py-2">
                            <i class="fas fa-shield-alt mr-1"></i> Sécurité OWASP
                        </span>
                    </nav>

                    <!-- Page Content -->
                    <div class="container-fluid">
                        @yield('content')
                    </div>
                </div>

                <!-- Footer -->
                <footer class="sticky-footer bg-white mt-auto py-3">
                    <div class="container my-auto">
                        <div class="copyright text-center my-auto">
                            <span>Copyright &copy; {{ date('Y') }} Christian Ayébi &bull; CoffrePass</span>
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
        window.addEventListener('load', function() {
            const loader = document.getElementById('loader');
            const page = document.getElementById('page');
            if (loader) loader.style.display = 'none';
            if (page) page.style.display = 'block';
        });
    </script>
    @stack('scripts')
</body>

</html>
