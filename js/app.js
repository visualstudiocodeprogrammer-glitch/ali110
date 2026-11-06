import { initTheme } from './theme.js';
import { initLang, t } from './i18n.js';
import { PAGE, ROOT } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

const PAGE_MODULES = {
  home: () => import('./pages/home.js'),
  about: () => import('./pages/about.js'),
  search: () => import('./pages/search-page.js')
};
const loadPage = PAGE_MODULES[PAGE] || (() => import('./pages/collection.js'));

const $ = (id) => document.getElementById(id);

async function mountPage() {
  const main = $('main');
  const { render } = await loadPage();
  await render(main);
}

function chrome() {
  renderHeader($('app-header'));
  renderFooter($('app-footer'));
  document.querySelector('.skip-link').textContent = t('skip');
}

async function boot() {
  initTheme();
  initLang();
  chrome();
  document.documentElement.classList.add('js-ready');
  try {
    await mountPage();
  } catch (err) {
    console.error('[ali110] page failed to render', err);
    $('main').textContent = t('error.title');
  }

  document.addEventListener('langchange', async () => {
    const y = window.scrollY;
    chrome();
    await mountPage();
    window.scrollTo(0, y);
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // The load event may already have fired while the page was rendering.
    const register = () => navigator.serviceWorker.register(`${ROOT}sw.js`)
      .catch((e) => console.warn('[ali110] service worker not registered', e));
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}

boot();
