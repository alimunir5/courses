// Logique pure de Courses : catalogue, état (cases cochées, ajouts perso), persistance, import / export.
// Le format stocké est celui de l'ancien onglet de Muscu : { checked: string[], custom: [{ id, name, group }], lastGroup }
// sous la clé `courses-v1`, pour reprendre la liste existante sans migration.

export const STORAGE_KEY = 'courses-v1';

/** « Ta liste de courses type pour 1 semaine » du programme « Prise de masse », par rayon. */
export const GROUPS = [
  {
    id: 'viandes', label: 'Viandes et poissons', emoji: '🥩', items: [
      { id: 'boeuf-hache', name: 'Bœuf haché 15 % halal', qty: '500 g' },
      { id: 'filets-poulet', name: 'Filets de poulet halal', qty: '1 kg' },
      { id: 'saumon', name: 'Saumon surgelé (pavés)', qty: '2 pavés' },
      { id: 'thon', name: 'Thon au naturel (boîtes)', qty: '×2' },
    ],
  },
  {
    id: 'cremerie', label: 'Œufs et produits laitiers', emoji: '🥛', items: [
      { id: 'lait', name: 'Lait entier', qty: '6 L' },
      { id: 'oeufs', name: 'Œufs', qty: '×18' },
      { id: 'fromage-blanc', name: 'Fromage blanc', qty: '1 kg' },
      { id: 'skyr', name: 'Skyr', qty: '450 g' },
      { id: 'emmental', name: 'Emmental râpé', qty: '200 g' },
      { id: 'lait-poudre', name: 'Lait en poudre', qty: '300 g', stock: true },
    ],
  },
  {
    id: 'feculents', label: 'Féculents et céréales', emoji: '🍚', items: [
      { id: 'avoine', name: "Flocons d'avoine", qty: '1 kg' },
      { id: 'riz', name: 'Riz long', qty: '1 kg' },
      { id: 'pates', name: 'Pâtes', qty: '1 kg' },
      { id: 'pain', name: 'Pain complet tranché', qty: '×2' },
      { id: 'tortillas', name: 'Tortillas de blé', qty: '×8' },
      { id: 'granola', name: 'Granola', stock: true },
    ],
  },
  {
    id: 'fruits-legumes', label: 'Fruits et légumes', emoji: '🥦', items: [
      { id: 'bananes', name: 'Bananes', qty: '2 kg' },
      { id: 'pommes', name: 'Pommes', qty: '1 kg' },
      { id: 'dattes', name: 'Dattes', qty: '250 g' },
      { id: 'avocats', name: 'Avocats', qty: '×2' },
      { id: 'oignons', name: 'Oignons' },
      { id: 'ail', name: 'Ail' },
      { id: 'poivrons', name: 'Poivrons', qty: '×2' },
      { id: 'brocoli', name: 'Brocoli surgelé' },
      { id: 'poelee', name: 'Poêlée de légumes surgelée' },
      { id: 'fruits-rouges', name: 'Fruits rouges surgelés', qty: '500 g' },
    ],
  },
  {
    id: 'gras', label: 'Oléagineux et matières grasses', emoji: '🥜', items: [
      { id: 'beurre-cacahuete', name: 'Beurre de cacahuète', qty: '500 g', stock: true },
      { id: 'cacahuetes', name: 'Cacahuètes', qty: '200 g' },
      { id: 'huile', name: 'Huile (colza / olive)', stock: true },
    ],
  },
  {
    id: 'epicerie', label: 'Épicerie et compléments', emoji: '🥫', items: [
      { id: 'tomates', name: 'Tomates concassées', qty: '×3' },
      { id: 'coco', name: 'Lait de coco', qty: '×1' },
      { id: 'miel', name: 'Miel', stock: true },
      { id: 'cacao', name: 'Cacao non sucré', stock: true },
      { id: 'creatine', name: 'Créatine monohydrate', qty: '5 g / jour', stock: true },
    ],
  },
];

/** Rayon des ajouts perso sans rayon valide (affiché seulement s'il contient des ajouts). */
export const DIVERS = { id: 'divers', label: 'Divers', emoji: '🛍️', items: [] };

/** Tous les rayons dans l'ordre d'affichage, « Divers » en dernier. */
export const ALL_GROUPS = [...GROUPS, DIVERS];

/** Budget indicatif donné par le programme. */
export const BUDGET = [
  { value: '≈ 85-90 €', label: '1re semaine, avec les produits de stock (*)' },
  { value: '≈ 65-75 €', label: 'semaines suivantes, stock déjà fait' },
  { value: '≈ 50-55 €', label: 'version éco : marque distributeur, viande surgelée, + œufs / lentilles / sardines, − saumon' },
];

export const ITEM_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0);

const GROUP_IDS = ALL_GROUPS.map((g) => g.id);
const CATALOG_IDS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.id)));

export const validGroup = (g) => (typeof g === 'string' && GROUP_IDS.includes(g) ? g : DIVERS.id);

export const emptyState = () => ({ checked: [], custom: [], lastGroup: DIVERS.id });

/** Remet n'importe quelle valeur lue (ancienne version, JSON douteux) au format attendu. */
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyState();
  return {
    checked: Array.isArray(raw.checked) ? [...new Set(raw.checked.filter((x) => typeof x === 'string'))] : [],
    // Anciens ajouts sans rayon → « Divers ».
    custom: Array.isArray(raw.custom)
      ? raw.custom
        .filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim())
        .map((c) => ({ id: c.id, name: c.name, group: validGroup(c.group) }))
      : [],
    lastGroup: validGroup(raw.lastGroup),
  };
}

export function loadState(storage) {
  try {
    return normalizeState(JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return emptyState();
  }
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Vrai si l'app n'a encore jamais enregistré de liste (premier lancement ou stockage vide). */
export function isFirstRun(storage) {
  try {
    return storage.getItem(STORAGE_KEY) === null;
  } catch {
    return true;
  }
}

export const isChecked = (state, id) => state.checked.includes(id);

export function toggleItem(state, id) {
  return { ...state, checked: isChecked(state, id) ? state.checked.filter((x) => x !== id) : [...state.checked, id] };
}

/** Nouvelle liste : tout décoché, les articles ajoutés à la main sont conservés. */
export function uncheckAll(state) {
  return { ...state, checked: [] };
}

export function addCustom(state, name, group, id = `perso-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`) {
  const g = validGroup(group);
  return { ...state, lastGroup: g, custom: [...state.custom, { id, name: String(name).trim(), group: g }] };
}

export function removeCustom(state, id) {
  return { ...state, checked: state.checked.filter((x) => x !== id), custom: state.custom.filter((c) => c.id !== id) };
}

export function moveCustom(state, id, group) {
  return { ...state, custom: state.custom.map((c) => (c.id === id ? { ...c, group: validGroup(group) } : c)) };
}

/** Articles cochés qui existent vraiment (catalogue ou ajout perso) : base du compteur. */
export function progress(state) {
  const known = new Set([...CATALOG_IDS, ...state.custom.map((c) => c.id)]);
  return { done: state.checked.filter((id) => known.has(id)).length, total: ITEM_COUNT + state.custom.length };
}

/** Texte à copier / coller : exactement la valeur stockée sous `courses-v1`. */
export function exportData(state) {
  return JSON.stringify(state);
}

/** Lit un texte collé (JSON de `courses-v1`). Lance une Error lisible s'il ne ressemble pas à une liste. */
export function importData(text) {
  let raw;
  try {
    raw = JSON.parse(String(text).trim());
  } catch {
    throw new Error('Ce texte n’est pas un JSON valide.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || (!Array.isArray(raw.checked) && !Array.isArray(raw.custom))) {
    throw new Error('Ce JSON ne ressemble pas à une liste de courses.');
  }
  return normalizeState(raw);
}
