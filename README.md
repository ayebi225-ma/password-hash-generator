<p align="center">
  <h1 align="center"><i class="fas fa-lock"></i> CoffrePass</h1>
  <p align="center"><strong>Générateur, vérificateur et comparateur de hash de mots de passe hautement sécurisé.</strong></p>
  <p align="center">
    <img src="https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 13">
    <img src="https://img.shields.io/badge/PHP-8.3%2B-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8.3">
    <img src="https://img.shields.io/badge/Tests-Pest%20PHP-00D8A5?style=for-the-badge" alt="Pest">
    <img src="https://img.shields.io/badge/Conformit%C3%A9-OWASP-blue?style=for-the-badge" alt="OWASP">
    <img src="https://img.shields.io/badge/Licence-MIT-green?style=for-the-badge" alt="MIT License">
  </p>
</p>

---

## Présentation

**CoffrePass** est une application web et une API cryptographique développées avec **Laravel 13** et **PHP 8.3**, conçues pour générer, analyser et vérifier des empreintes de mots de passe en appliquant les recommandations cryptographiques les plus strictes de l'**OWASP** et de l'**ANSSI**.

L'application privilégie les fonctions de dérivation de clés modernes (**Argon2id**, **Bcrypt**, **Argon2i**) conçues pour résister aux attaques massives par force brute et exclut volontairement les algorithmes obsolètes et inadaptés aux mots de passe (MD5, SHA-1, SHA-256, SHA-512).

---

## Fonctionnalités Clés

* **Algorithmes de Pointe (KDF) :**
  * **Argon2id** (Standard par défaut recommandé par l'OWASP — protection hybride GPU/ASIC et canal auxiliaire).
  * **Bcrypt** (Standard éprouvé de l'industrie avec sel aléatoire automatique).
  * **Argon2i** (Optimisé pour contrer les attaques temporelles et canaux auxiliaires).
* **Jauge de Robustesse & Entropie en direct :**
  * Estimation mathématique de l'**entropie de Shannon** en bits ($E = L \times \log_2(R)$).
  * Barre de progression dynamique (Très faible &rarr; Faible &rarr; Moyen &rarr; Fort &rarr; Très fort).
  * Badges interactifs de validation des critères (8+ caractères, majuscules, chiffres, symboles).
* **Benchmark & Temps de Calcul CPU :**
  * Mesure au millième de milliseconde (`duration_ms`) du travail processeur nécessaire pour générer le hash.
* **Vérificateur de Hash (`/hash/verify`) :**
  * Vérification instantanée et sécurisée de la concordance entre un mot de passe en clair et un hash (compatible avec tous les algorithmes).
  * Détection automatique des métadonnées du hash (algorithme, coût, mémoire, itérations).
* **Génération Comparative Simultanée (`/hash/generate-all`) :**
  * Génère simultanément les hash Bcrypt, Argon2i et Argon2id pour comparer leurs longueurs et leurs temps d'exécution.
* **Simulateur de Coût Bcrypt (`/hash/bcrypt-custom`) :**
  * Curseur interactif de rounds (de 4 à 14) pour observer la croissance exponentielle du temps de calcul ($2^{\text{coût}}$).
* **Avertissement de Troncature Bcrypt :**
  * Détection en temps réel et avertissement dès que le mot de passe dépasse la limite native de 72 octets imposée par Bcrypt.
* **Protection Anti-Déni de Service (DoS) :**
  * Limitation de débit (`throttle:60,1`) sur toutes les requêtes de hachage afin de préserver les ressources CPU/RAM du serveur.

---

## Comprendre la Structure d'un Hash

Les algorithmes modernes utilisent le format standardisé **PHC String Format** qui encode toutes les métadonnées dans la chaîne finale :

```text
$argon2id$v=19$m=102400,t=2,p=8$dC9TRG12a1E5S2JER2wvUQ$PW+ttXm1g/oPiIThzpzDzALM/x+0cGfq0uveikRgMto
└──┬────┘ └─┬─┘ └──────┬──────┘ └──────────┬─────────┘ └──────────────────┬─────────────────┘
   │        │          │                   │                              │
   1        2          3                   4                              5
```

1. **Algorithme (`$argon2id$`)** : Identifie la fonction cryptographique.
2. **Version (`$v=19$`)** : Version du standard Argon2 (19 = v1.3).
3. **Paramètres de coût (`m=102400,t=2,p=8`)** : Mémoire allouée (100 Mo), nombre d'itérations (2), et parallélisme (8 threads).
4. **Sel (`$dC9TRG1...$`)** : Sel cryptographique unique aléatoire généré automatiquement pour contrer les tables arc-en-ciel.
5. **Empreinte finale (`PW+ttXm...`)** : Résultat mathématique de la dérivation.

---

## Installation & Démarrage

### Prérequis
* **PHP 8.3** ou supérieur avec les extensions : `sodium`, `pdo`, `mbstring`, `openssl`.
* **Composer** (v2.x).
* **Node.js & npm** (optionnel pour la compilation des assets Vite).

### Installation pas à pas

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/ayebi225-ma/password-hash-generator.git
   cd password-hash-generator
   ```

2. **Installer les dépendances PHP :**
   ```bash
   composer install
   ```

3. **Configurer l'environnement :**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Lancer le serveur de développement :**
   ```bash
   php artisan serve
   ```
   L'application est disponible sur [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

### 1. Générer un Hash
* **Route :** `POST /hash/generate`
* **Corps :**
  ```json
  {
    "password": "MonMotDePasseSecret123!",
    "algorithm": "argon2id"
  }
  ```
* **Réponse (200 OK) :**
  ```json
  {
    "success": true,
    "data": {
      "hash": "$argon2id$v=19$m=102400,t=2,p=8$...",
      "length": 97,
      "duration_ms": 14.52,
      "algorithm": "ARGON2ID",
      "memory": 102400,
      "iterations": 2,
      "threads": 8
    }
  }
  ```

### 2. Comparer Tous les Algorithmes
* **Route :** `POST /hash/generate-all`
* **Corps :**
  ```json
  {
    "password": "MonMotDePasseSecret123!"
  }
  ```
* **Réponse (200 OK) :**
  Retourne les hash Bcrypt, Argon2i et Argon2id accompagnés de leurs temps d'exécution respectifs.

### 3. Vérifier un Mot de Passe
* **Route :** `POST /hash/verify`
* **Corps :**
  ```json
  {
    "password": "MonMotDePasseSecret123!",
    "hash": "$argon2id$v=19$m=102400,t=2,p=8$..."
  }
  ```
* **Réponse (200 OK) :**
  ```json
  {
    "success": true,
    "match": true,
    "info": {
      "algo": "argon2id",
      "options": {
        "memory_cost": 102400,
        "time_cost": 2,
        "threads": 8
      }
    }
  }
  ```

### 4. Hachage Bcrypt avec Coût Personnalisé
* **Route :** `POST /hash/bcrypt-custom`
* **Corps :**
  ```json
  {
    "password": "MonMotDePasseSecret123!",
    "rounds": 12
  }
  ```

---

## Tests & Qualité du Code

Le projet est testé avec **Pest PHP** et respecte les standards PSR-12 vérifiés par **Laravel Pint**.

### Lancer la suite de tests
```bash
php artisan test
```

### Vérifier le style du code (Laravel Pint)
```bash
./vendor/bin/pint --test
```

---

## Auteur & Licence

* **Développeur :** Christian Ayébi Manouan
* **Licence :** Ce projet est distribué sous licence open source [MIT](LICENSE).
