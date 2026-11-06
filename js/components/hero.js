import { el } from '../util.js';
import { t } from '../i18n.js';
import { url, asset } from '../router.js';
import { arrow } from './ui.js';

export function hero() {
  return el('section', { class: 'hero', 'aria-labelledby': 'hero-h' },
    el('div', { class: 'hero__pattern', 'aria-hidden': 'true' }),
    el('div', { class: 'container hero__inner' },
      el('div', { class: 'hero__logo-wrap' },
        el('img', {
          class: 'hero__logo',
          src: asset('assets/logo/ali110-logo-960.webp'),
          srcset: `${asset('assets/logo/ali110-logo-480.webp')} 480w, ${asset('assets/logo/ali110-logo-960.webp')} 960w`,
          sizes: '(min-width: 900px) 440px, 70vw',
          width: '1188', height: '639', alt: 'ali110', fetchpriority: 'high'
        })),
      el('div', { class: 'hero__copy' },
        el('h1', { id: 'hero-h', class: 'hero__title' }, t('hero.title')),
        el('p', { class: 'hero__desc' }, t('hero.desc')),
        el('div', { class: 'hero__cta' },
          el('a', { class: 'btn btn--gold', href: url('hadiths') }, t('hero.cta'), arrow(true, 18)),
          el('a', { class: 'btn btn--outline-light', href: url('search') }, t('hero.search'))))));
}
