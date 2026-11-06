import { el } from '../util.js';
import { t, tr } from '../i18n.js';
import { url, asset } from '../router.js';
import { loadMany, loadDaily, byId } from '../data-loader.js';
import { buildTimeline } from '../daily.js';
import { setMeta } from '../meta.js';
import { hero } from '../components/hero.js';
import { dailyHadithSection } from '../components/daily-hadith.js';
import { virtueCard, articleCard, narrationCard, typographyCard, typographyPlate, galleryItem, audioCard } from '../components/cards.js';
import { hadithQuote } from '../components/hadith-card.js';
import { openLightbox } from '../components/lightbox.js';
import { sectionHead, emptyState, errorState } from '../components/ui.js';
import { observeReveals } from '../components/reveal.js';

const pick = (items, n) => {
  const featured = items.filter((i) => i.featured);
  return (featured.length >= n ? featured : [...featured, ...items.filter((i) => !i.featured)]).slice(0, n);
};
const newest = (items, key) => [...items].sort((a, b) => (a[key] < b[key] ? 1 : -1));

export async function render(main) {
  setMeta({ title: '', description: t('site.description') });
  main.replaceChildren(hero());

  const [{ data, failed }, daily] = await Promise.all([
    loadMany(['hadiths', 'virtues', 'articles', 'narrations', 'typography', 'gallery', 'audio']),
    loadDaily()
  ]);
  if (failed.length === 7) {
    main.append(el('div', { class: 'container section' }, errorState(() => render(main))));
    return;
  }
  const { hadiths, virtues, articles, narrations, typography, gallery, audio } = data;

  // 2. Daily hadith, overlapping the hero edge.
  main.append(el('div', { class: 'container daily-wrap' }, dailyHadithSection(buildTimeline(hadiths, daily))));

  // 3. Virtues
  if (virtues.length) {
    main.append(el('section', { class: 'section container reveal', 'aria-labelledby': 'virtues-h' },
      sectionHead({ id: 'virtues-h', title: t('home.virtues.title'), intro: t('home.virtues.intro'), href: url('virtues'), linkText: t('viewAll') }),
      el('div', { class: 'grid grid--virtues' }, pick(virtues, 6).map(virtueCard))));
  }

  // 4. Featured content (mixed)
  const featured = [
    ...pick(articles, 2).map(articleCard),
    ...pick(narrations, 2).map(narrationCard),
    ...pick(hadiths, 2).map(hadithQuote)
  ];
  if (featured.length) {
    main.append(el('section', { class: 'section container reveal', 'aria-labelledby': 'featured-h' },
      sectionHead({ id: 'featured-h', title: t('home.featured.title'), intro: t('home.featured.intro') }),
      el('div', { class: 'grid grid--3' }, featured)));
  }

  // 5. Typography and gallery
  const byHadith = (item) => byId(hadiths, item.hadithId);
  const typoItems = typography.filter(byHadith);
  const openTypo = (item) => openLightbox({
    items: typoItems, index: typoItems.findIndex((x) => x.id === item.id),
    render: (it) => typographyPlate(it, byHadith(it))
  });
  const latestGallery = newest(gallery, 'addedAt').slice(0, 6);
  const openGallery = (g) => openLightbox({
    items: latestGallery, index: latestGallery.findIndex((x) => x.id === g.id),
    render: (it) => el('figure', { class: 'lightbox__fig' }, el('img', { src: asset(it.src), alt: tr(it.alt) }), it.caption && el('figcaption', {}, tr(it.caption)))
  });
  if (typoItems.length || latestGallery.length) {
    main.append(el('section', { class: 'section container reveal', 'aria-labelledby': 'art-h' },
      sectionHead({ id: 'art-h', title: t('home.art.title'), intro: t('home.art.intro'), href: url('typography'), linkText: t('viewAll') }),
      typoItems.length > 0 && el('div', { class: 'grid grid--typo' }, pick(typoItems, 4).map((it) => typographyCard(it, byHadith(it), openTypo))),
      latestGallery.length > 0 && el('div', { class: 'grid grid--gallery' }, latestGallery.map((g) => galleryItem(g, openGallery)))));
  }

  // 6. Audio
  const audioItems = pick(audio, 3);
  main.append(el('section', { class: 'section container reveal', 'aria-labelledby': 'audio-h' },
    sectionHead({ id: 'audio-h', title: t('home.audio.title'), intro: t('home.audio.intro'), href: url('audio'), linkText: t('viewAll') }),
    audioItems.length
      ? el('div', { class: 'grid grid--audio' }, audioItems.map(audioCard))
      : emptyState({ title: t('audio.empty.title'), text: t('audio.empty.text'), iconName: 'mic' })));

  // 7. Latest articles
  if (articles.length) {
    main.append(el('section', { class: 'section container reveal', 'aria-labelledby': 'latest-h' },
      sectionHead({ id: 'latest-h', title: t('home.latest.title'), intro: t('home.latest.intro'), href: url('articles'), linkText: t('viewAll') }),
      el('div', { class: 'grid grid--3' }, newest(articles, 'publishedAt').slice(0, 3).map(articleCard))));
  }

  observeReveals(main);
}
