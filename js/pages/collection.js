/**
 * One module renders every collection page (list + detail), driven by CONFIG.
 * Detail views use ?id=<item id>, which works on any static host.
 */
import { el, clear } from '../util.js';
import { t, tr, trList, fmtDate, fmtNumber } from '../i18n.js';
import { PAGE, url, asset, absoluteUrl, query } from '../router.js';
import { loadMany, byId } from '../data-loader.js';
import { setMeta } from '../meta.js';
import { hadithCard, hadithQuote } from '../components/hadith-card.js';
import { virtueCard, articleCard, narrationCard, typographyCard, typographyPlate, galleryItem, audioCard } from '../components/cards.js';
import { openLightbox } from '../components/lightbox.js';
import { icon, arrow, emptyState, errorState, categoryLabel, sourceList, checkedLine, verificationBadge } from '../components/ui.js';
import { observeReveals } from '../components/reveal.js';
import { pageHead } from './page-head.js';

const ALL = ['hadiths', 'articles', 'virtues', 'narrations', 'typography', 'gallery', 'audio'];

/* ---------- shared bits ---------- */

function backLink(page) {
  return el('a', { class: 'back-link', href: url(page) }, arrow(false, 16), t(`back.${page}`));
}

function chipsBar(options, active, onPick, labelOf) {
  return el('div', { class: 'chips', role: 'group', 'aria-label': t('filter') },
    ['all', ...options].map((o) => el('button', { class: 'chip', type: 'button', 'aria-pressed': String(o === active), onclick: () => onPick(o) },
      o === 'all' ? t('search.all') : labelOf(o))));
}

/** Filterable list: chips on top, grid below. */
function filterableList(items, keyOf, labelOf, renderItem, gridClass, emptyNode) {
  const options = [...new Set(items.map(keyOf))];
  let active = 'all';
  const wrap = el('div', {});
  const paint = () => {
    const shown = active === 'all' ? items : items.filter((i) => keyOf(i) === active);
    clear(wrap);
    if (options.length > 1) wrap.append(chipsBar(options, active, (o) => { active = o; paint(); }, labelOf));
    wrap.append(shown.length ? el('div', { class: gridClass }, shown.map(renderItem)) : emptyNode);
  };
  paint();
  return wrap;
}

function proseDetail({ page, item, metaRow, extra }) {
  return el('div', { class: 'container page page--narrow' },
    backLink(page),
    el('article', { class: 'prose-page' },
      el('header', { class: 'article-head' },
        metaRow,
        el('h1', { class: 'article-head__title' }, tr(item.title)),
        el('p', { class: 'article-head__summary' }, tr(item.summary))),
      el('div', { class: 'prose' }, trList(item.body).map((p) => el('p', {}, p))),
      extra));
}

/* ---------- per-collection configuration ---------- */

const CONFIG = {
  virtues: {
    needs: ['virtues', 'hadiths', 'articles', 'narrations'],
    list: ({ virtues }) => el('div', { class: 'grid grid--virtues' }, virtues.map(virtueCard)),
    detail(v, d) {
      setMeta({ title: tr(v.title), description: tr(v.summary) });
      const linked = { hadiths: [], articles: [], narrations: [] };
      for (const l of v.links || []) {
        const found = byId(d[l.type] || [], l.id);
        if (found && linked[l.type]) linked[l.type].push(found);
      }
      const group = (key, nodes, titleKey, cls) => nodes.length > 0 && el('section', { class: 'related', 'aria-labelledby': `rel-${key}` },
        el('h2', { id: `rel-${key}`, class: 'related__title' }, t(titleKey)), el('div', { class: cls }, nodes));
      return el('div', { class: 'container page' },
        backLink('virtues'),
        el('header', { class: 'article-head article-head--center' },
          el('span', { class: 'medallion medallion--lg', 'aria-hidden': 'true' }, icon(v.icon, 34)),
          el('h1', { class: 'article-head__title' }, tr(v.title)),
          el('p', { class: 'article-head__summary' }, tr(v.summary))),
        group('hadiths', linked.hadiths.map(hadithQuote), 'related.hadiths', 'grid grid--3'),
        group('narrations', linked.narrations.map(narrationCard), 'related.narrations', 'grid grid--3'),
        group('articles', linked.articles.map(articleCard), 'related.articles', 'grid grid--3'),
        !linked.hadiths.length && !linked.narrations.length && !linked.articles.length && emptyState({ title: t('related.none') }));
    }
  },

  hadiths: {
    needs: ['hadiths', 'virtues'],
    list: ({ hadiths }) => filterableList(hadiths, (h) => h.category, categoryLabel, (h) => hadithCard(h), 'stack', emptyState({ title: t('empty.title') })),
    detail(h, d) {
      const ref = tr(h.source?.reference);
      setMeta({ title: ref || 'Hadith', description: (h.translation?.fa && PAGE && tr(h.translation)) || h.arabic });
      const virtues = d.virtues.filter((v) => (v.links || []).some((l) => l.type === 'hadiths' && l.id === h.id));
      return el('div', { class: 'container page page--narrow' },
        backLink('hadiths'),
        el('h1', { class: 'article-head__title hadith-title' }, ref || tr(h.source?.work)),
        hadithCard(h),
        virtues.length > 0 && el('section', { class: 'related', 'aria-labelledby': 'rel-v' },
          el('h2', { id: 'rel-v', class: 'related__title' }, t('related.virtues')),
          el('div', { class: 'chips' }, virtues.map((v) => el('a', { class: 'chip chip--link', href: url('virtues', { id: v.id }) }, tr(v.title))))));
    }
  },

  narrations: {
    needs: ['narrations'],
    list: ({ narrations }) => el('div', { class: 'grid grid--3' }, narrations.map(narrationCard)),
    detail(n) {
      setMeta({ title: tr(n.title), description: tr(n.summary) });
      return proseDetail({
        page: 'narrations', item: n,
        metaRow: n.period && el('div', { class: 'meta-row' }, el('span', { class: 'period' }, tr(n.period))),
        extra: [sourceList(n.sources), checkedLine(n.verification)]
      });
    }
  },

  articles: {
    needs: ['articles'],
    list: ({ articles }) => filterableList(
      [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)),
      (a) => a.category, categoryLabel, articleCard, 'grid grid--3', emptyState({ title: t('empty.title') })),
    detail(a) {
      setMeta({
        title: tr(a.title), description: tr(a.summary),
        jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: tr(a.title), description: tr(a.summary), datePublished: a.publishedAt, inLanguage: document.documentElement.lang, mainEntityOfPage: absoluteUrl('articles', { id: a.id }) }
      });
      return proseDetail({
        page: 'articles', item: a,
        metaRow: el('div', { class: 'meta-row' },
          el('span', { class: 'meta-row__cat' }, categoryLabel(a.category)),
          el('time', { datetime: a.publishedAt }, fmtDate(a.publishedAt)),
          a.readingMinutes && el('span', {}, t('minRead', { n: fmtNumber(a.readingMinutes) }))),
        extra: [sourceList(a.sources), checkedLine(a.verification)]
      });
    }
  },

  typography: {
    needs: ['typography', 'hadiths'],
    list(d, main) {
      const items = d.typography.filter((x) => byId(d.hadiths, x.hadithId));
      if (!items.length) return emptyState({ title: t('typography.empty'), iconName: 'pen' });
      const plate = (it) => typographyPlate(it, byId(d.hadiths, it.hadithId));
      const syncUrl = (it) => {
        const u = new URL(location.href);
        if (it) u.searchParams.set('id', it.id); else u.searchParams.delete('id');
        history.replaceState(null, '', u);
      };
      const open = (item) => {
        syncUrl(item);
        openLightbox({ items, index: items.findIndex((x) => x.id === item.id), render: plate, onChange: syncUrl, onClose: () => syncUrl(null) });
      };
      const id = query().get('id');
      const initial = id && items.find((x) => x.id === id);
      if (initial) queueMicrotask(() => open(initial));
      return el('div', { class: 'grid grid--typo' }, items.map((it) => typographyCard(it, byId(d.hadiths, it.hadithId), open)));
    }
  },

  gallery: {
    needs: ['gallery'],
    list({ gallery }) {
      if (!gallery.length) return emptyState({ title: t('gallery.empty.title'), text: t('gallery.empty.text'), iconName: 'image' });
      const items = [...gallery].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
      const figure = (g) => el('figure', { class: 'lightbox__fig' },
        el('img', { src: asset(g.src), alt: tr(g.alt) }),
        (g.caption || g.credit) && el('figcaption', {}, tr(g.caption), g.credit && el('span', { class: 'credit' }, g.credit)));
      const open = (g) => openLightbox({ items, index: items.findIndex((x) => x.id === g.id), render: figure });
      const id = query().get('id');
      const initial = id && items.find((x) => x.id === id);
      if (initial) queueMicrotask(() => open(initial));
      return el('div', { class: 'grid grid--gallery' }, items.map((g) => galleryItem(g, open)));
    }
  },

  audio: {
    needs: ['audio'],
    list({ audio }) {
      if (!audio.length) return emptyState({ title: t('audio.empty.title'), text: t('audio.empty.text'), iconName: 'mic' });
      const node = filterableList(audio, (a) => a.kind, (k) => t(`audio.kind.${k}`), audioCard, 'grid grid--audio', emptyState({ title: t('empty.title') }));
      const id = query().get('id');
      if (id) queueMicrotask(() => document.getElementById(`a-${id}`)?.scrollIntoView({ block: 'center' }));
      return node;
    }
  }
};

/* ---------- entry point ---------- */

export async function render(main) {
  const cfg = CONFIG[PAGE];
  if (!cfg) { main.replaceChildren(emptyState({ title: t('empty.title') })); return; }

  const { data, failed } = await loadMany(cfg.needs);
  if (failed.includes(cfg.needs[0])) {
    main.replaceChildren(el('div', { class: 'container page' }, errorState(() => render(main))));
    return;
  }

  const id = query().get('id');
  const item = id && cfg.detail ? byId(data[cfg.needs[0]] || [], id) : null;
  if (item && ['hadiths', 'articles', 'virtues', 'narrations'].includes(PAGE)) {
    main.replaceChildren(cfg.detail(item, data));
    observeReveals(main);
    return;
  }

  setMeta({ title: t(`meta.${PAGE}.title`), description: t(`meta.${PAGE}.desc`) });
  const notFound = id && ['hadiths', 'articles', 'virtues', 'narrations'].includes(PAGE)
    ? el('p', { class: 'notice', role: 'status' }, t('notFound'))
    : null;
  main.replaceChildren(el('div', { class: 'container page' },
    pageHead(t(`nav.${PAGE}`), t(`intro.${PAGE}`)),
    notFound,
    el('h2', { class: 'sr-only' }, t('list.heading')), // keeps the heading outline h1 > h2 > h3 for card titles
    cfg.list(data, main)));
  observeReveals(main);
}
