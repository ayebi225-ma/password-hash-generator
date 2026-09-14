<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// 1. Charger l'autoload depuis ../coffrepass/
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

// 2. Démarrer Laravel depuis ../coffrepass/
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
