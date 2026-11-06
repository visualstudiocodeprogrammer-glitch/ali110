import { el } from '../util.js';
import { t, getLang, otherLang, setLang } from '../i18n.js';
import { getTheme, toggleTheme } from '../theme.js';
import { url, asset, PAGE } from '../router.js';
import { PAGES } from '../site-config.js';
import { icon } from './ui.js';

let globalsBound = false;

function logo() {
  return el('img', {
    class: 'brand__logo',
    src: asset('assets/logo/ali110-logo-480.webp'),
    srcset: `${asset('assets/logo/ali110-logo-480.webp')} 480w, ${asset('assets/logo/ali110-logo-960.webp')} 960w`,
    sizes: '96px',
    width: '1188', height: '639',
    alt: 'ali110'
  });
}

function navLink(page) {
  return el('a', { class: 'nav__link', href: url(page.id), 'aria-current': page.id === PAGE ? 'page' : false }, t(`nav.${page.id}`));
}

export function renderHeader(host) {
  const main = PAGES.filter((p) => p.nav === 'main');
  const media = PAGES.filter((p) => p.nav === 'media');
  const mediaActive = media.some((p) => p.id === PAGE);

  const groupBtn = el('button', { class: 'nav__link nav__group-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-media', 'data-active': mediaActive || false },
    t('nav.media'), icon('chevronDown', 16));
  const group = el('li', { class: 'nav__group' }, groupBtn,
    el('ul', { class: 'nav__sub', id: 'nav-media' }, media.map((p) => el('li', {}, navLink(p)))));

  // Order in the bar: Home, About, Virtues, Hadiths, Narrations, Media ▾, Articles
  const items = main.map((p) => el('li', {}, navLink(p)));
  items.splice(items.length - 1, 0, group);

  const nav = el('nav', { class: 'nav', id: 'site-nav', 'aria-label': t('nav.label') }, el('ul', { class: 'nav__list' }, items));

  const menuBtn = el('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-nav', 'aria-label': t('menu') }, icon('menu', 22));
  const other = otherLang();
  // The visible text is the accessible name (it is in the target language, hence the lang attribute).
  const langBtn = el('button', { class: 'tool-btn', type: 'button', lang: other, title: t('lang.switch'), onclick: () => setLang(other) },
    icon('globe', 18), el('span', {}, other === 'en' ? 'English' : 'فارسی'));
  const dark = getTheme() === 'dark';
  const themeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': dark ? t('theme.toLight') : t('theme.toDark') }, icon(dark ? 'sun' : 'moon', 20));
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    const d = getTheme() === 'dark';
    themeBtn.replaceChildren(icon(d ? 'sun' : 'moon', 20));
    themeBtn.setAttribute('aria-label', d ? t('theme.toLight') : t('theme.toDark'));
  });
  const searchLink = el('a', { class: 'icon-btn', href: url('search'), 'aria-label': t('nav.search'), 'aria-current': PAGE === 'search' ? 'page' : false }, icon('search', 20));

  const header = el('header', { class: 'site-header' },
    el('div', { class: 'container header__inner' },
      el('a', { class: 'brand', href: url('home'), 'aria-label': `ali110, ${t('nav.home')}` }, logo()),
      nav,
      el('div', { class: 'header__tools' }, searchLink, langBtn, themeBtn, menuBtn)));

  const setMenu = (open) => {
    header.classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.replaceChildren(icon(open ? 'close' : 'menu', 22));
  };
  const setGroup = (open) => {
    groupBtn.setAttribute('aria-expanded', String(open));
    group.classList.toggle('is-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('is-menu-open')));
  groupBtn.addEventListener('click', () => setGroup(groupBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  header.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (groupBtn.getAttribute('aria-expanded') === 'true') { setGroup(false); groupBtn.focus(); }
    else if (header.classList.contains('is-menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  group.addEventListener('focusout', (e) => { if (!group.contains(e.relatedTarget)) setGroup(false); });

  if (!globalsBound) {
    globalsBound = true;
    document.addEventListener('click', (e) => {
      const g = document.querySelector('.nav__group');
      if (g && !g.contains(e.target)) {
        g.classList.remove('is-open');
        g.querySelector('.nav__group-btn')?.setAttribute('aria-expanded', 'false');
      }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
      if (e.matches) document.querySelector('.site-header')?.classList.remove('is-menu-open');
    });
  }

  host.replaceChildren(header);
}
