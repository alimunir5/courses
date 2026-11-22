// Interface de Courses : deux écrans (liste, réglages) rendus dans #app selon le hash.
import {
  ALL_GROUPS, BUDGET, loadState, saveState, isFirstRun, isChecked, toggleItem, uncheckAll, addCustom, removeCustom,
  moveCustom, progress, exportData, importData, emptyState,
} from './core.js';

const APP_VERSION = '1.0.0';

const app = document.getElementById('app');
const confirmDialog = document.getElementById('confirm-dialog');
const toastEl = document.getElementById('toast');

let state = loadState(localStorage);
let firstRun = isFirstRun(localStorage);
// Brouillon du formulaire d'ajout : survit aux rendus (cocher un article ne doit pas effacer ce qu'on tape).
let draftName = '';
let draftGroup = state.lastGroup;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const LOGO = '<svg viewBox="0 0 1200 1200" aria-hidden="true"><rect width="1200" height="1200" fill="#000"/><path d="M420 480H500L560 690H720L770 530H525" fill="none" stroke="#D4AF37" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/><g fill="#D4AF37"><circle cx="590" cy="770" r="40"/><circle cx="700" cy="770" r="40"/></g></svg>';

function commit(next) {
  state = next;
  firstRun = false;
  try {
    saveState(localStorage, state);
  } catch {
    toast('Impossible d’enregistrer : stockage plein ou bloqué.');
  }
  render();
}

let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2800);
}

function ask(title, text, okLabel) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-ok').textContent = okLabel;
  return new Promise((resolve) => {
    confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue === 'ok'), { once: true });
    confirmDialog.returnValue = 'cancel';
    confirmDialog.showModal();
  });
}

const vibrate = () => navigator.vibrate?.(10);
const groupOptions = (selected) => ALL_GROUPS.map((g) => `<option value="${g.id}"${g.id === selected ? ' selected' : ''}>${g.emoji} ${esc(g.label)}</option>`).join('');

function row({ id, name, qty, stock, group, perso }) {
  const done = isChecked(state, id);
  return `<li class="item${done ? ' checked' : ''}">
    <button class="item-main" data-action="toggle" data-id="${esc(id)}" role="checkbox" aria-checked="${done}">
      <span class="box">${CHECK}</span>
      <span class="name">${esc(name)}${qty ? `<strong class="qty"> · ${esc(qty)}</strong>` : ''}${stock ? '<span class="tag" title="Produit de stock : dure 2 à 4 semaines">stock</span>' : ''}${perso ? '<span class="tag">perso</span>' : ''}</span>
    </button>
    ${perso ? `<select class="move" data-action="move" data-id="${esc(id)}" aria-label="Rayon de ${esc(name)}">${groupOptions(group)}</select>
    <button class="icon-btn small" data-action="remove" data-id="${esc(id)}" aria-label="Supprimer ${esc(name)}">✕</button>` : ''}
  </li>`;
}

function renderHome() {
  const { done, total } = progress(state);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const left = total - done;
  const sections = ALL_GROUPS.map((g) => {
    const mine = state.custom.filter((c) => c.group === g.id);
    if (g.items.length + mine.length === 0) return '';
    const doneHere = g.items.filter((i) => isChecked(state, i.id)).length + mine.filter((c) => isChecked(state, c.id)).length;
    return `<section class="group">
      <h2><span aria-hidden="true">${g.emoji}</span> ${esc(g.label)}<small>${doneHere}/${g.items.length + mine.length}</small></h2>
      <ul class="list">${g.items.map((i) => row(i)).join('')}${mine.map((c) => row({ ...c, perso: true })).join('')}</ul>
    </section>`;
  }).join('');

  app.innerHTML = `
    <div class="head">
      <header class="topbar">
        <h1 class="brand">${LOGO}Courses</h1>
        <button class="icon-btn" data-action="go" data-hash="#reglages" aria-label="Réglages">⚙︎</button>
      </header>
      <section class="progress" aria-label="Avancement">
        <div class="progress-head">
          <span class="progress-count">${done}<small> / ${total}</small></span>
          <span class="progress-label${total && !left ? ' done' : ''}">${total && !left ? 'Tout est dans le caddie ✓' : `encore ${left}`}</span>
          <button class="btn small" data-action="reset" ${done ? '' : 'disabled'}>Tout décocher</button>
        </div>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="Articles cochés"><span style="width:${pct}%"></span></div>
      </section>
    </div>
    ${firstRun ? `<aside class="notice">
      <strong>Liste vide ?</strong> Si tu utilisais la liste dans Muscu et qu’elle n’apparaît pas ici, ouvre Muscu → Recettes → « Copier ma liste », puis ici ⚙︎ Réglages → Importer.
      <button class="link" data-action="dismiss-notice">Compris</button>
    </aside>` : ''}
    <form class="add" id="add-form" autocomplete="off">
      <input id="add-name" name="name" maxlength="80" enterkeyhint="done" placeholder="Ajouter un article" aria-label="Nom de l’article" value="${esc(draftName)}">
      <select id="add-group" aria-label="Rayon">${groupOptions(draftGroup)}</select>
      <button type="submit" class="btn primary" id="add-btn" ${draftName.trim() ? '' : 'disabled'}>＋ Ajouter</button>
    </form>
    <p class="hint">Liste type pour 1 semaine du programme. « stock » : produit qui dure 2 à 4 semaines.</p>
    ${sections}
    <section class="group budget">
      <h2>Budget indicatif</h2>
      <ul class="budget-list">${BUDGET.map((b) => `<li><strong>${esc(b.value)}</strong> · ${esc(b.label)}</li>`).join('')}</ul>
    </section>
  `;
}

function renderSettings() {
  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go" data-hash="#" aria-label="Retour">‹</button>
      <h1>Réglages</h1>
    </header>

    <section class="panel">
      <h2>Copier ma liste</h2>
      <p>Cases cochées et articles ajoutés, en JSON. Pour la sauvegarder ou la transférer vers une autre installation de l’app.</p>
      <textarea id="export-text" readonly rows="3" aria-label="Ma liste en JSON">${esc(exportData(state))}</textarea>
      <button class="btn" data-action="copy">Copier ma liste</button>
    </section>

    <section class="panel">
      <h2>Importer une liste</h2>
      <p>Colle ici le JSON copié depuis Muscu (Recettes → « Copier ma liste ») ou depuis cette app. Il remplace la liste actuelle.</p>
      <textarea id="import-text" rows="3" placeholder='{"checked":[…],"custom":[…]}' aria-label="JSON à importer" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
      <div class="two">
        <button class="btn" data-action="paste">Coller</button>
        <button class="btn primary" data-action="import">Importer</button>
      </div>
    </section>

    <section class="panel">
      <h2>Installer sur l’iPhone</h2>
      <p>Dans Safari : bouton Partager → « Sur l’écran d’accueil ». L’app fonctionne ensuite hors ligne.</p>
      <p>Sur iOS, l’app installée a un stockage séparé de Safari : si ta liste n’y apparaît pas, utilise Copier / Importer ci-dessus.</p>
    </section>

    <section class="panel">
      <h2>Tout effacer</h2>
      <p>Décoche tout et supprime les articles ajoutés à la main.</p>
      <button class="btn danger" data-action="wipe">Effacer ma liste</button>
    </section>

    <p class="version">Courses ${APP_VERSION} · données uniquement sur cet appareil (clé courses-v1)</p>
  `;
}

const isSettings = () => location.hash === '#reglages';

function render() {
  if (isSettings()) renderSettings();
  else renderHome();
}

function addFromForm() {
  const name = draftName.trim();
  if (!name) return;
  draftName = '';
  commit(addCustom(state, name, draftGroup));
  vibrate();
  document.getElementById('add-name')?.focus();
}

async function copyList() {
  const text = exportData(state);
  try {
    await navigator.clipboard.writeText(text);
    toast('Liste copiée ✓');
  } catch {
    const box = document.getElementById('export-text');
    box?.focus();
    box?.select();
    toast('Copie impossible : sélectionne le texte et copie-le à la main.');
  }
}

app.addEventListener('click', async (event) => {
  const el = event.target.closest('[data-action]');
  if (!el || el.tagName === 'SELECT') return;
  const { action, id } = el.dataset;
  switch (action) {
    case 'toggle':
      vibrate();
      commit(toggleItem(state, id));
      break;
    case 'remove':
      commit(removeCustom(state, id));
      break;
    case 'go':
      location.hash = el.dataset.hash;
      break;
    case 'dismiss-notice':
      commit(state);
      break;
    case 'reset':
      if (await ask('Nouvelle liste ?', 'Toutes les cases seront décochées (tes articles ajoutés sont conservés).', 'Tout décocher')) commit(uncheckAll(state));
      break;
    case 'copy':
      await copyList();
      break;
    case 'paste':
      try {
        document.getElementById('import-text').value = await navigator.clipboard.readText();
      } catch {
        toast('Collage impossible : appuie longuement dans la zone et choisis « Coller ».');
      }
      break;
    case 'import': {
      let next;
      try {
        next = importData(document.getElementById('import-text').value);
      } catch (error) {
        toast(error.message);
        break;
      }
      const hasData = state.checked.length || state.custom.length;
      if (hasData && !(await ask('Remplacer la liste ?', 'La liste actuelle de cette app sera remplacée par celle collée.', 'Remplacer'))) break;
      commit(next);
      toast('Liste importée ✓');
      location.hash = '#';
      break;
    }
    case 'wipe':
      if (await ask('Tout effacer ?', 'Les cases cochées et les articles ajoutés seront supprimés.', 'Effacer')) {
        commit({ ...emptyState() });
        toast('Liste remise à zéro.');
      }
      break;
  }
});

app.addEventListener('change', (event) => {
  const el = event.target;
  if (el.dataset.action === 'move') commit(moveCustom(state, el.dataset.id, el.value));
  else if (el.id === 'add-group') draftGroup = el.value;
});

app.addEventListener('input', (event) => {
  if (event.target.id !== 'add-name') return;
  draftName = event.target.value;
  document.getElementById('add-btn').disabled = !draftName.trim();
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  addFromForm();
});

window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  render();
});

render();

// Hors ligne : service worker + demande de stockage persistant (évite l'effacement automatique).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
navigator.storage?.persist?.().catch(() => {});
