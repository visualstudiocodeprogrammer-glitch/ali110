import { el, formatClock } from '../util.js';
import { t, tr, localizeDigits } from '../i18n.js';
import { asset } from '../router.js';
import { icon } from './ui.js';

let playing = null; // only one track plays at a time

/** Lightweight custom player: play/pause, seek bar, times, volume. Never autoplays. */
export function audioPlayer(track) {
  const src = /^https?:/.test(track.src) ? track.src : asset(track.src);
  const audio = el('audio', { preload: 'none', src });
  const title = tr(track.title);

  const playBtn = el('button', { class: 'player__play', type: 'button', 'aria-label': `${t('audio.play')}: ${title}` }, icon('play', 22));
  const seek = el('input', { class: 'player__range player__seek', type: 'range', min: '0', max: '1000', value: '0', step: '1', 'aria-label': t('audio.seek'), disabled: true });
  const cur = el('span', { class: 'player__time' }, localizeDigits('0:00'));
  const dur = el('span', { class: 'player__time' }, track.duration ? localizeDigits(formatClock(track.duration)) : '--:--');
  const muteBtn = el('button', { class: 'icon-btn icon-btn--sm', type: 'button', 'aria-label': t('audio.mute') }, icon('volume', 18));
  const vol = el('input', { class: 'player__range player__vol', type: 'range', min: '0', max: '100', value: '100', 'aria-label': t('audio.volume') });
  const msg = el('p', { class: 'player__msg', role: 'status' });

  const fill = (input, pct) => input.style.setProperty('--p', `${pct}%`);
  const setPlayingUi = (on) => {
    playBtn.replaceChildren(icon(on ? 'pause' : 'play', 22));
    playBtn.setAttribute('aria-label', `${on ? t('audio.pause') : t('audio.play')}: ${title}`);
    playBtn.classList.toggle('is-playing', on);
  };

  let scrubbing = false;
  const sync = () => {
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0) {
      dur.textContent = localizeDigits(formatClock(d));
      seek.disabled = false;
      if (!scrubbing) {
        const pct = (audio.currentTime / d) * 100;
        seek.value = String(Math.round(pct * 10));
        fill(seek, pct);
      }
    }
    cur.textContent = localizeDigits(formatClock(audio.currentTime));
    seek.setAttribute('aria-valuetext', `${cur.textContent} / ${dur.textContent}`);
  };

  playBtn.addEventListener('click', async () => {
    msg.textContent = '';
    if (audio.paused) {
      if (playing && playing !== audio) playing.pause();
      try { await audio.play(); } catch { msg.textContent = t('audio.error'); }
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('play', () => { playing = audio; setPlayingUi(true); });
  audio.addEventListener('pause', () => { if (playing === audio) playing = null; setPlayingUi(false); });
  audio.addEventListener('ended', () => { audio.currentTime = 0; setPlayingUi(false); sync(); });
  audio.addEventListener('error', () => { msg.textContent = t('audio.error'); setPlayingUi(false); });
  ['loadedmetadata', 'timeupdate', 'durationchange'].forEach((ev) => audio.addEventListener(ev, sync));

  seek.addEventListener('input', () => {
    scrubbing = true;
    const d = audio.duration;
    fill(seek, Number(seek.value) / 10);
    if (Number.isFinite(d)) cur.textContent = localizeDigits(formatClock((Number(seek.value) / 1000) * d));
  });
  seek.addEventListener('change', () => {
    const d = audio.duration;
    if (Number.isFinite(d)) audio.currentTime = (Number(seek.value) / 1000) * d;
    scrubbing = false;
  });

  vol.addEventListener('input', () => {
    audio.volume = Number(vol.value) / 100;
    audio.muted = audio.volume === 0;
    fill(vol, Number(vol.value));
  });
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.replaceChildren(icon(audio.muted ? 'mute' : 'volume', 18));
    muteBtn.setAttribute('aria-label', audio.muted ? t('audio.unmute') : t('audio.mute'));
  });
  fill(seek, 0);
  fill(vol, 100);

  return el('div', { class: 'player', role: 'group', 'aria-label': title },
    audio,
    el('div', { class: 'player__row' },
      playBtn,
      el('div', { class: 'player__main' },
        el('p', { class: 'player__title' }, title),
        el('div', { class: 'player__track', dir: 'ltr' }, cur, seek, dur)),
      el('div', { class: 'player__volume', dir: 'ltr' }, muteBtn, vol)),
    msg);
}
