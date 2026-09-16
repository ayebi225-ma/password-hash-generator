<p align="center">
  <h1 align="center">🛡️ CoffrePass</h1>
  <p align="center"><strong>Suite Cryptographique & Sécurité de Mots de Passe — Package NPM, CLI Terminal & Application Web</strong></p>
  <p align="center">
    <img src="https://img.shields.io/badge/npm-coffrepass-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="NPM">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/PHP-8.2%2B%20Compat-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8.2+">
    <img src="https://img.shields.io/badge/Python-Compatible-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/Tests-Vitest%20%2B%20Pest-00D8A5?style=for-the-badge" alt="Tests">
    <img src="https://img.shields.io/badge/Herozion-100%2F100%20Grade%20A-success?style=for-the-badge" alt="Herozion">
    <img src="https://img.shields.io/badge/Licence-MIT-green?style=for-the-badge" alt="MIT License">
  </p>
</p>

---

## 📖 Présentation

**CoffrePass** est une suite cryptographique professionnelle utilisable :
1. 🖥️ **En ligne de commande (CLI)** via le binaire `coffrepass` (compatible terminal interactif, pipes stdin, et scripts CI/CD).
2. 📦 **En bibliothèque Node.js (ESM & TypeScript)** pour sécuriser vos backends et APIs.
3. 🌐 **En application Web interactive** développée sous Laravel 13 et Tailwind CSS.

Tous les hash générés sont **100% interopérables** avec **PHP >= 8.2** (`password_hash`, `password_verify` avec `$2y$` et `$argon2id$`) et **Python** (`bcrypt`, `argon2-cffi`).

---

## ⚡ Installation rapide

### CLI Global (Terminal)
```bash
npm install -g coffrepass
```

### Dépendance Projet (Bibliothèque Node.js)
```bash
npm install coffrepass
```

---

## 🚀 Utilisation CLI (`coffrepass`)

### Mode Interactif
Lancez simplement `coffrepass` sans argument dans votre terminal pour accéder au menu interactif :
```bash
coffrepass
```

### 1. Hacher un secret (`hash`)
Saisie masquée sans écho terminal (protection historique shell) ou passage par argument :
```bash
# Saisie masquée interactive
coffrepass hash

# Spécifier l'algorithme (argon2id par défaut)
coffrepass hash "MonSecret2026!" --algo argon2id

# Bcrypt avec préfixe PHP $2y$ et coût 12
coffrepass hash "MonSecret2026!" --algo bcrypt --prefix 2y --cost 12

# Format JSON pour intégrations
coffrepass hash "MonSecret2026!" --json

# Support des pipes stdin
echo "SecretEnPipe" | coffrepass hash --algo argon2id
```

### 2. Vérifier un hash (`verify`)
Vérification en temps constant (`timingSafeEqual`) compatible PHP, Python et Node.js :
```bash
# Vérification interactive (le secret est masqué)
coffrepass verify '$2y$12$PMSuJjaVpXXX5FGdh5wujuRL82.gR7E2Yy8TXauRQnc27o6v/qQe.'

# Vérification directe
coffrepass verify "MonSecret2026!" '$argon2id$v=19$m=65536,t=3,p=1$...'
```
> **Code retour :** `0` en cas de correspondance, `3` en cas de non-concordance.

### 3. Générateur CSPRNG & Passphrases Diceware (`generate` / `gen`)
```bash
# Mot de passe aléatoire CSPRNG (16 caractères)
coffrepass gen

# Mot de passe 24 caractères sans caractères ambigus (0, O, 1, l)
coffrepass gen -l 24 --avoid-ambiguous

# Passphrase Diceware (mots français, style XKCD)
coffrepass gen --passphrase --words 5 --separator '-' --capitalize --number
# Exemple : Torrent8-Richesse-Tulipe-Fractal-Ouragan (210 bits d'entropie)

# Clé secrète d'API / HMAC (Hex, Base64, UUID)
coffrepass gen --secret --format base64url --bytes 32
```

### 4. Inspection approfondie (`inspect`)
Dissection complète des paramètres internes, sel extrait, et analyse de robustesse :
```bash
coffrepass inspect '$argon2id$v=19$m=65536,t=3,p=1$py7izh+4gG1+Qn2fY0mc+w$XtHNhmwc22cnK+uboF+MgzlhlsXWCbKv1JYadfsUEBQ'
```

### 5. Détecteur de format de hash (`detect`)
Identification heuristique des algorithmes (Argon2, Bcrypt, Scrypt, PBKDF2, MD5, SHA-256, NTLM...) :
```bash
coffrepass detect '5d41402abc4b2a76b9719d911017c592'
```

### 6. Analyseur de force & simulateur de cassage (`strength`)
Calcul de l'entropie de Shannon et estimation du temps d'attaque brute-force :
```bash
coffrepass strength
```

### 7. Vérificateur de politique de mot de passe (`policy`)
Vérification des critères de sécurité (longueur minimale, entropie, classes de caractères) :
```bash
coffrepass policy "MonMotDePasse123!" --min-length 14 --min-entropy 60
```
> **Code retour :** `0` si conforme, `4` si non-conforme.

### 8. Benchmark matériel (`benchmark`)
Mesure des performances du CPU local sur Argon2id, Bcrypt et Scrypt :
```bash
coffrepass benchmark --rounds 3
```

---

## 💻 Utilisation Programmatique (SDK Node.js)

```javascript
import {
  hash,
  verify,
  generatePassword,
  generatePassphrase,
  generateSecret,
  inspectHash,
  analyzeStrength,
  validatePolicy,
  runBenchmark
} from 'coffrepass';

// 1. Hachage Argon2id / Bcrypt
const { hash: hashString } = await hash('MonMotDePasse!', {
  algorithm: 'argon2id',
  memoryCost: 65536,
  timeCost: 3
});

// 2. Vérification
const isValid = await verify('MonMotDePasse!', hashString);

// 3. Génération Diceware
const phrase = generatePassphrase({ words: 5, separator: '-', capitalize: true });

// 4. Force et entropie
const analysis = analyzeStrength('MotDePasseTresRobuste#2026');
console.log(analysis.entropyBits, analysis.crackTimes.offlineSlowKdf);
```

---

## 🔄 Interopérabilité PHP >= 8.2 & Python

### PHP (Vérification et Hachage)
Les hash générés par `coffrepass` sont natifs pour PHP :
```php
// Vérifier un hash généré par coffrepass (Argon2id ou Bcrypt)
$hash = '$argon2id$v=19$m=65536,t=3,p=1$...';
$valid = password_verify('MonSecret!', $hash); // true

// Générer en PHP et vérifier dans coffrepass
$phpHash = password_hash('MonSecret!', PASSWORD_BCRYPT, ['cost' => 12]);
```

### Python
```python
import bcrypt

# Vérifier un hash Bcrypt généré par coffrepass
h = b"$2b$12$..."
assert bcrypt.checkpw(b"MonSecret!", h) is True
```

---

## 🚦 Codes de Sortie Standard (CLI)

| Code | Signification |
|:---:|---|
| `0` | **Succès** (Opération réussie / Mot de passe conforme ou vérifié) |
| `1` | **Erreur générale** / Exception non gérée |
| `2` | **Erreur d'usage** / Arguments invalides |
| `3` | **Non-concordance** (`verify` : le mot de passe ne correspond pas au hash) |
| `4` | **Violation de politique** (`policy` : mot de passe non conforme) |

---

## 🌐 Application Web (Laravel 13)

Pour lancer l'interface Web locale :

```bash
composer install
npm install
npm run build
php artisan serve
```
L'interface est accessible sur `http://127.0.0.1:8000`.

---

## 🛡️ Tests & Audit de Sécurité

- **Vitest (Suite Node.js & CLI) :** 24 tests réussis (100% passing)
- **Pest (Suite Laravel PHP) :** 14 tests réussis (89 assertions, 100% passing)
- **Audit Herozion :** **Score 100/100 Grade A** (0 vulnérabilité détectée)

```bash
# Lancer les tests JS / CLI
npm test

# Lancer les tests PHP
php artisan test

# Audit de sécurité statique
herozion scan --offline
```

---

## 👤 Auteur & Licence

- **Auteur :** Christian Ayébi Manouan
- **Licence :** Open-Source [MIT](LICENSE)
