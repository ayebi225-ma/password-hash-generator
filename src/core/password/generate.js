import crypto from 'node:crypto';

// Curated clean French wordlist for Diceware passphrases
const FRENCH_WORDS = [
  'abricot', 'abeille', 'abriter', 'absolu', 'accord', 'acier', 'action', 'adroit', 'agneau', 'aigle',
  'aimable', 'ajouter', 'alarme', 'album', 'alerte', 'algue', 'allier', 'allumer', 'ambre', 'amitié',
  'amorce', 'ananas', 'ancre', 'anneau', 'anodin', 'arcade', 'archipel', 'ardeur', 'argent', 'argile',
  'armoire', 'arome', 'arpent', 'artiste', 'asile', 'aspect', 'astuce', 'atelier', 'attache', 'auberge',
  'audace', 'aurore', 'automne', 'avatar', 'avenue', 'avocat', 'azimut', 'azur', 'bambou', 'banane',
  'banquise', 'barque', 'bassin', 'bastion', 'bateau', 'belette', 'berceau', 'berger', 'besace', 'bibelot',
  'bison', 'bivouac', 'blason', 'bleuet', 'bobine', 'bocage', 'bolide', 'bonheur', 'booster', 'bordure',
  'boucle', 'bouclier', 'bougie', 'boussole', 'bouton', 'branche', 'bravoure', 'brique', 'bronze', 'brume',
  'buisson', 'bulle', 'bureau', 'cabane', 'cacao', 'cadence', 'cadran', 'cahier', 'caillou', 'calepin',
  'calme', 'camion', 'canal', 'canard', 'canot', 'canton', 'capsule', 'capteur', 'caravane', 'carillon',
  'cascade', 'casque', 'caverne', 'cedre', 'ceinture', 'cerise', 'cerveau', 'chameau', 'champ', 'chanson',
  'chariot', 'chasse', 'chateau', 'chemise', 'chene', 'cheval', 'chevron', 'chimere', 'choc', 'chouette',
  'cigale', 'ciment', 'cinema', 'circuit', 'citron', 'clavier', 'clef', 'cloche', 'cobalt', 'coeur',
  'coffre', 'colline', 'colonne', 'combat', 'comete', 'compas', 'concert', 'corde', 'corsaire', 'cosmos',
  'couleur', 'courage', 'couronne', 'cousin', 'cratere', 'crayon', 'creatif', 'crique', 'cristal', 'croquis',
  'cuivre', 'curieux', 'cyclone', 'dague', 'dauphin', 'decouverte', 'defi', 'delice', 'demain', 'dentelle',
  'depart', 'desert', 'destin', 'diamant', 'dictame', 'diode', 'disque', 'domaine', 'dragon', 'drapeau',
  'dynamo', 'eclair', 'ecluse', 'ecole', 'ecorce', 'ecran', 'ecureuil', 'edifice', 'effort', 'eglantier',
  'elan', 'element', 'elfe', 'elixir', 'emeraude', 'empire', 'enclume', 'energie', 'enigme', 'envol',
  'epice', 'eponge', 'epoque', 'equipe', 'erable', 'escalier', 'espace', 'espoir', 'esprit', 'esquisse',
  'estuaire', 'etoile', 'etrave', 'evasion', 'examen', 'exploit', 'fabrique', 'faisceau', 'falaise', 'faucon',
  'faveur', 'feutre', 'ficelle', 'fidelite', 'figure', 'filon', 'flacon', 'flamme', 'fleche', 'fleuve',
  'flocon', 'foret', 'formule', 'fortune', 'foudre', 'fougere', 'foulard', 'fourmi', 'fractal', 'fregate',
  'frisson', 'fusee', 'galet', 'galaxie', 'garde', 'gazelle', 'geant', 'geode', 'glacier', 'glaive',
  'graine', 'granit', 'grenat', 'grillon', 'grotte', 'guepard', 'guide', 'guitare', 'halite', 'hameau',
  'harpe', 'hasard', 'havre', 'helium', 'heron', 'horizon', 'horloge', 'houblon', 'housse', 'hublot',
  'humour', 'ibis', 'iceberg', 'icone', 'idylle', 'iguane', 'illusion', 'ilot', 'image', 'impact',
  'indice', 'indigo', 'infini', 'iris', 'ivoire', 'jaguar', 'jardin', 'jaspe', 'javelot', 'joli',
  'jongleur', 'journal', 'joyau', 'jungle', 'jupon', 'kayak', 'kaki', 'kelvin', 'kiosque', 'kiwi',
  'koala', 'labyrinthe', 'lagon', 'laine', 'lampe', 'lance', 'lantern', 'laurier', 'lemurien', 'lentille',
  'levier', 'lezard', 'libellule', 'lichen', 'lierre', 'lievre', 'lilas', 'limon', 'lionceau', 'liseron',
  'lotus', 'luciole', 'lueur', 'lumiere', 'lunaire', 'lutin', 'lynx', 'macaron', 'machine', 'magie',
  'magnolia', 'maillon', 'maison', 'manoir', 'manthe', 'marbre', 'maree', 'mariage', 'marron', 'masque',
  'matin', 'meandre', 'medaille', 'melodie', 'memoire', 'menthe', 'merlan', 'mesure', 'meteore', 'metier',
  'mica', 'miel', 'mirage', 'miroir', 'module', 'moineau', 'moment', 'monolithe', 'montagne', 'moraillon',
  'mosaïque', 'moteur', 'mouette', 'moulin', 'muguet', 'murmure', 'muscle', 'musee', 'mutuel', 'mystere',
  'nacre', 'nageur', 'nappe', 'nature', 'navire', 'nectar', 'neptune', 'nervure', 'neutre', 'nimbus',
  'ninja', 'noblesse', 'nocturne', 'noisette', 'nomade', 'nordique', 'nourrice', 'nuage', 'nuance', 'nymphe',
  'oasis', 'obelisque', 'objet', 'ocean', 'octet', 'octroi', 'odeur', 'ogive', 'olive', 'ombre',
  'ondine', 'opale', 'optique', 'orbite', 'orchidee', 'organe', 'orgue', 'orion', 'orme', 'orque',
  'ouragan', 'outillage', 'paladin', 'palmier', 'panache', 'panthere', 'papier', 'papillon', 'papyros', 'paradis',
  'parchemin', 'parfum', 'particule', 'pastel', 'pastille', 'patrouille', 'pause', 'pave', 'pavillon', 'pelican',
  'pendule', 'perche', 'perle', 'pétale', 'peuplade', 'phare', 'phenix', 'phosphore', 'piano', 'pignon',
  'pilier', 'piment', 'pinceau', 'pivoine', 'planete', 'plasma', 'platine', 'plume', 'poeme', 'poire',
  'polarite', 'pomme', 'pont', 'porche', 'portique', 'posture', 'pouce', 'poutre', 'prairie', 'precieux',
  'prisme', 'prouesse', 'prunelle', 'pulsar', 'pyramide', 'quartz', 'quatuor', 'quille', 'radar', 'radeau',
  'rafale', 'rainure', 'raisin', 'ramure', 'rapide', 'rayon', 'recif', 'recolte', 'reflet', 'refuge',
  'relais', 'rempart', 'renard', 'repere', 'reseau', 'resine', 'ressort', 'reveil', 'richesse', 'rideau',
  'rivage', 'riviere', 'rocher', 'roseau', 'rosier', 'rotation', 'rouage', 'rubis', 'ruche', 'ruisseau',
  'sable', 'sablier', 'safari', 'saphir', 'satellite', 'saule', 'saumon', 'sauvage', 'savane', 'sculpteur',
  'secousse', 'secret', 'sensation', 'sentier', 'serment', 'serpent', 'serre', 'sillage', 'silence', 'silex',
  'sillon', 'simoun', 'sirene', 'sirop', 'smaragd', 'soleil', 'solution', 'sommet', 'sonate', 'sorbier',
  'sources', 'spatule', 'spectre', 'sphynx', 'spirale', 'station', 'stele', 'steppe', 'stratageme', 'sublime',
  'succes', 'sumac', 'survol', 'symbole', 'synapse', 'tactique', 'talon', 'tamis', 'tangram', 'tanin',
  'tapis', 'tarot', 'taureau', 'tempo', 'tempete', 'tenor', 'terrier', 'theatre', 'tigre', 'timbre',
  'tintement', 'titane', 'toison', 'topaze', 'torche', 'torrent', 'totem', 'toupie', 'tournesol', 'tresor',
  'tribord', 'trident', 'trottoir', 'tulipe', 'tunique', 'turbine', 'turquoise', 'typhon', 'univers', 'uranium',
  'usure', 'vallee', 'valseur', 'vapeur', 'vecteur', 'velours', 'vent', 'verdure', 'vernis', 'verrou',
  'versant', 'vestige', 'vibration', 'vignoble', 'village', 'violon', 'virage', 'virtuel', 'vision', 'vitesse',
  'vivier', 'voilier', 'volcan', 'voltage', 'voyage', 'vulcan', 'wagon', 'wombat', 'xyste', 'yacht',
  'zenith', 'zephyr', 'zibeline', 'zinc', 'zodiaque'
];

const CHAR_SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: '0O1lI|',
};

/**
 * Generate a cryptographically secure random password (CSPRNG)
 *
 * @param {Object} [options={}]
 * @param {number} [options.length=16] - Password length (8 - 256)
 * @param {boolean} [options.uppercase=true] - Include uppercase letters
 * @param {boolean} [options.lowercase=true] - Include lowercase letters
 * @param {boolean} [options.numbers=true] - Include digits
 * @param {boolean} [options.symbols=true] - Include symbols
 * @param {boolean} [options.avoidAmbiguous=false] - Exclude ambiguous characters (0, O, 1, l, I)
 * @returns {string} The generated password
 */
export function generatePassword(options = {}) {
  const length = Math.max(8, Math.min(256, Number(options.length ?? 16)));
  const useUpper = options.uppercase !== false;
  const useLower = options.lowercase !== false;
  const useDigits = options.numbers !== false;
  const useSymbols = options.symbols !== false;
  const avoidAmbiguous = Boolean(options.avoidAmbiguous);

  let pool = '';
  const requiredChars = [];

  const filterPool = (chars) => {
    if (!avoidAmbiguous) return chars;
    return chars.split('').filter((c) => !CHAR_SETS.ambiguous.includes(c)).join('');
  };

  if (useLower) {
    const chars = filterPool(CHAR_SETS.lower);
    pool += chars;
    requiredChars.push(chars[crypto.randomInt(0, chars.length)]);
  }
  if (useUpper) {
    const chars = filterPool(CHAR_SETS.upper);
    pool += chars;
    requiredChars.push(chars[crypto.randomInt(0, chars.length)]);
  }
  if (useDigits) {
    const chars = filterPool(CHAR_SETS.digits);
    pool += chars;
    requiredChars.push(chars[crypto.randomInt(0, chars.length)]);
  }
  if (useSymbols) {
    const chars = filterPool(CHAR_SETS.symbols);
    pool += chars;
    requiredChars.push(chars[crypto.randomInt(0, chars.length)]);
  }

  if (pool.length === 0) {
    throw new Error('At least one character set must be enabled');
  }

  const result = [...requiredChars];
  while (result.length < length) {
    const idx = crypto.randomInt(0, pool.length);
    result.push(pool[idx]);
  }

  // Fisher-Yates shuffle using CSPRNG
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Generate a Diceware passphrase using CSPRNG
 *
 * @param {Object} [options={}]
 * @param {number} [options.words=4] - Number of words (3 - 12)
 * @param {string} [options.separator='-'] - Word separator (e.g. '-', '_', ' ')
 * @param {boolean} [options.capitalize=false] - Capitalize each word
 * @param {boolean} [options.includeNumber=false] - Append a random digit
 * @returns {string} The generated passphrase
 */
export function generatePassphrase(options = {}) {
  const wordCount = Math.max(3, Math.min(12, Number(options.words ?? 4)));
  const separator = options.separator ?? '-';
  const capitalize = Boolean(options.capitalize);
  const includeNumber = Boolean(options.includeNumber);

  const selected = [];
  for (let i = 0; i < wordCount; i++) {
    const idx = crypto.randomInt(0, FRENCH_WORDS.length);
    let word = FRENCH_WORDS[idx];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    selected.push(word);
  }

  if (includeNumber) {
    const num = crypto.randomInt(0, 10);
    const insertIdx = crypto.randomInt(0, selected.length);
    selected[insertIdx] = `${selected[insertIdx]}${num}`;
  }

  return selected.join(separator);
}
