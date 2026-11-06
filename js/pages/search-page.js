import { el, debounce, clear } from '../util.js';
import { t, tr, fmtNumber } from '../i18n.js';
import { url, query } from '../router.js';
import { loadMany } from '../data-loader.js';
import { buildIndex, search, countByType } from '../search.js';
import { setMeta } from '../meta.js';
import { icon, emptyState, errorState } from '../components/ui.js';
import { pageHead } from './page-head.js';

const TYPES = ['hadiths', 'articles', 'virtues', 'narrations', 'typography', 'gallery', 'audio'];

export async function render(main) {
  setMeta({ title: t('meta.search.title'), description: t('meta.search.desc') });
  const { data, failed } = await loadMany(TYPES);
  if (failed.length === TYPES.length) {
    main.replaceChildren(el('div', { class: 'container page' }, errorState(() => render(main))));
    return;
  }
  const index = buildIndex(data);

  let q = query().get('q') || '';
  let type = 'all';

  const input = el('input', { class: 'search-box__input', id: 'q', type: 'search', name: 'q', value: q, autocomplete: 'off', enterkeyhint: 'search', placeholder: t('search.placeholder') });
  const clearBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('search.clear') }, icon('close', 18));
  const chips = el('div', { class: 'chips', role: 'group', 'aria-label': t('search.filter') });
  const status = el('p', { class: 'search-status', role: 'status', 'aria-live': 'polite' });
  const results = el('ul', { class: 'results' });

  const update = () => {
    const all = search(index, q, 'all');
    const counts = countByType(all);
    const list = type === 'all' ? all : all.filter((d) => d.type === type);

    clear(chips);
    if (q.trim()) {
      for (const k of ['all', ...TYPES.filter((x) => counts[x])]) {
        const n = k === 'all' ? all.length : counts[k];
        chips.append(el('button', { class: 'chip', type: 'button', 'aria-pressed': String(type === k), onclick: () => { type = k; update(); } },
          t(k === 'all' ? 'search.all' : `nav.${k}`), el('span', { class: 'chip__n' }, fmtNumber(n))));
      }
    }
    clearBtn.hidden = !q;

    clear(results);
    if (!q.trim()) {
      status.textContent = '';
      results.append(el('li', {}, emptyState({ title: t('search.start.title'), text: t('search.start.text'), iconName: 'search' })));
    } else if (!list.length) {
      status.textContent = t('search.none', { q });
      results.append(el('li', {}, emptyState({ title: t('search.none', { q }), text: t('search.none.hint'), iconName: 'search' })));
    } else {
      status.textContent = t('search.count', { n: fmtNumber(list.length) });
      for (const d of list) {
        results.append(el('li', {}, el('a', { class: 'result', href: url(d.type, { id: d.id }) },
          el('span', { class: 'result__type' }, t(`nav.${d.type}`)),
          el('span', { class: 'result__title' }, tr(d.title)))));
      }
    }
    const next = new URL(location.href);
    if (q) next.searchParams.set('q', q); else next.searchParams.delete('q');
    history.replaceState(null, '', next);
  };

  input.addEventListener('input', debounce(() => { q = input.value; update(); }, 120));
  clearBtn.addEventListener('click', () => { q = ''; type = 'all'; input.value = ''; update(); input.focus(); });

  main.replaceChildren(el('div', { class: 'container page page--narrow' },
    pageHead(t('nav.search'), t('search.intro')),
    el('form', { class: 'search-box', role: 'search', onsubmit: (e) => { e.preventDefault(); q = input.value; update(); } },
      el('label', { class: 'sr-only', for: 'q' }, t('search.label')),
      icon('search', 20), input, clearBtn),
    el('h2', { class: 'sr-only' }, t('search.results')),
    chips, status, results));
  update();
  if (!q) input.focus({ preventScroll: true });
}
