import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUPS, ITEM_COUNT, STORAGE_KEY, emptyState, normalizeState, loadState, saveState, isFirstRun, isChecked, toggleItem,
  uncheckAll, addCustom, removeCustom, moveCustom, progress, exportData, importData,
} from '../js/core.js';

const memoryStorage = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) };
};

test('catalogue : 34 articles, rayons non vides, identifiants uniques', () => {
  const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id));
  assert.equal(ITEM_COUNT, 34);
  assert.equal(GROUPS.length, 6);
  assert.ok(GROUPS.every((g) => g.items.length > 0));
  assert.equal(new Set(ids).size, ids.length);
});

test('la clé de stockage est celle de Muscu', () => {
  assert.equal(STORAGE_KEY, 'courses-v1');
});

test('coche, persiste, recharge, décoche tout en gardant les ajouts', () => {
  const storage = memoryStorage();
  let s = emptyState();
  s = toggleItem(s, 'lait');
  s = addCustom(s, '  Sel ', 'epicerie', 'perso-1');
  s = toggleItem(s, 'perso-1');
  assert.ok(isChecked(s, 'lait'));
  saveState(storage, s);
  const reloaded = loadState(storage);
  assert.deepEqual(reloaded, s);
  assert.deepEqual(reloaded.custom, [{ id: 'perso-1', name: 'Sel', group: 'epicerie' }]);
  const cleared = uncheckAll(reloaded);
  assert.deepEqual(cleared.checked, []);
  assert.equal(cleared.custom.length, 1);
  assert.deepEqual(removeCustom(toggleItem(cleared, 'perso-1'), 'perso-1'), { checked: [], custom: [], lastGroup: 'epicerie' });
  assert.deepEqual(toggleItem(toggleItem(emptyState(), 'riz'), 'riz').checked, []);
});

test('relit le format de Muscu : anciens ajouts sans rayon vers Divers, rayon inconnu aussi', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ checked: ['x'], custom: [{ id: 'perso-a', name: 'Sel' }, { id: 'perso-b', name: 'Eau', group: 'inconnu' }] }));
  let s = loadState(storage);
  assert.deepEqual(s.custom.map((c) => c.group), ['divers', 'divers']);
  assert.deepEqual(s.checked, ['x']);
  s = moveCustom(s, 'perso-a', 'viandes');
  s = addCustom(s, 'Thé', 'gras');
  assert.deepEqual(s.custom.map((c) => c.group), ['viandes', 'divers', 'gras']);
  assert.equal(s.lastGroup, 'gras');
});

test('stockage corrompu ou absent : liste vide, premier lancement détecté', () => {
  const storage = memoryStorage();
  assert.ok(isFirstRun(storage));
  assert.deepEqual(loadState(storage), emptyState());
  storage.setItem(STORAGE_KEY, '{pas du json');
  assert.deepEqual(loadState(storage), emptyState());
  saveState(storage, emptyState());
  assert.ok(!isFirstRun(storage));
  assert.deepEqual(normalizeState([1, 2]), emptyState());
});

test('le compteur ignore les cases orphelines', () => {
  const s = { ...emptyState(), checked: ['lait', 'disparu'], custom: [{ id: 'perso-1', name: 'Sel', group: 'divers' }] };
  assert.deepEqual(progress(s), { done: 1, total: 35 });
});

test('export puis import : même liste ; import refuse ce qui n’est pas une liste', () => {
  const s = addCustom(toggleItem(emptyState(), 'oeufs'), 'Café', 'epicerie', 'perso-9');
  assert.deepEqual(importData(exportData(s)), s);
  assert.deepEqual(importData(' {"checked":["lait"]} ').checked, ['lait']);
  assert.throws(() => importData('pas du json'), /JSON valide/);
  assert.throws(() => importData('[1,2]'), /ne ressemble pas/);
  assert.throws(() => importData('{"autre":1}'), /ne ressemble pas/);
});
