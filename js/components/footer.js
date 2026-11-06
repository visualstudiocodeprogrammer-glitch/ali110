import { el } from '../util.js';
import { t, localizeDigits } from '../i18n.js';
import { url, asset } from '../router.js';
import { PAGES, SITE } from '../site-config.js';

export function renderFooter(host) {
  const links = (nav) => PAGES.filter((p) => nav.includes(p.nav) && p.id !== 'home')
    .map((p) => el('li', {}, el('a', { href: url(p.id) }, t(`nav.${p.id}`))));

  host.replaceChildren(el('footer', { class: 'site-footer' },
    el('div', { class: 'container footer__grid' },
      el('div', { class: 'footer__brand' },
        el('a', { href: url('home'), 'aria-label': `ali110, ${t('nav.home')}` },
          el('img', { class: 'footer__logo', src: asset('assets/logo/ali110-logo-480.webp'), width: '1188', height: '639', alt: 'ali110', loading: 'lazy' })),
        el('p', { class: 'footer__about' }, t('footer.about'))),
      el('nav', { class: 'footer__col', 'aria-labelledby': 'f-explore' },
        el('h2', { id: 'f-explore', class: 'footer__title' }, t('footer.explore')),
        el('ul', {}, links(['main']))),
      el('nav', { class: 'footer__col', 'aria-labelledby': 'f-cats' },
        el('h2', { id: 'f-cats', class: 'footer__title' }, t('footer.categories')),
        el('ul', {}, [...links(['media']), el('li', {}, el('a', { href: url('search') }, t('nav.search')))])),
      SITE.social.length > 0 && el('nav', { class: 'footer__col', 'aria-labelledby': 'f-social' },
        el('h2', { id: 'f-social', class: 'footer__title' }, t('footer.social')),
        el('ul', {}, SITE.social.map((s) => el('li', {}, el('a', { href: s.url, rel: 'noopener noreferrer', target: '_blank' }, s.name)))))),
    el('div', { class: 'container footer__legal' },
      el('p', {}, t('footer.copyright', { year: localizeDigits(new Date().getFullYear()) })),
      el('p', { class: 'footer__note' }, t('footer.note')))));
}
