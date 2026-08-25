#!/usr/bin/env node
// THE one command for the whole lead magnet.
//   node build.mjs prospects/<handle>.json
// Builds every asset the prospect JSON carries a section for:
//   hub          -> os/<handle>/index.html            (always)
//   registration -> webinar/registration/<handle>/    (when a `registration` section exists;
//                                                      hub gift 01 auto-links to it)
// No arg -> rebuilds the registration template state only (the public gift page).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

function merge(base, over) {
  if (over === null) return null;
  if (Array.isArray(base) || Array.isArray(over) || typeof over !== 'object') return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = k in out ? merge(out[k], over[k]) : over[k];
  return out;
}
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

function render(masterDir, data, outPath) {
  let html = readFileSync(join(masterDir, 'index.html'), 'utf8');
  const cond = /<!--IF:([\w.]+)-->([\s\S]*?)(?:<!--ELSE:\1-->([\s\S]*?))?<!--END:\1-->/g;
  let prev;
  do { prev = html; html = html.replace(cond, (_, p, a, b = '') => (get(data, p) ? a : b)); } while (html !== prev);
  html = html.replace(/\{\{([\w.]+)\}\}/g, (_, p) => { const v = get(data, p); return v == null ? '' : String(v); });
  const left = html.match(/\{\{[\w.]+\}\}|<!--(?:IF|ELSE|END):/g);
  if (left) { console.error('UNRESOLVED in ' + outPath + ':', [...new Set(left)].join(' ')); process.exit(1); }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  console.log('built ' + outPath.replace(root + '/', ''));
}

// ---- registration data prep (flags shared by template + prospect modes) ----
function regData(section, shared, isTemplate) {
  const defaults = read(join(root, 'webinar/registration/_master/defaults.json'));
  const d = merge(defaults, { ...(section || {}), accent: shared.accent ?? defaults.accent });
  d._template = isTemplate;
  const tier = String((d.proof && d.proof.tier) || 'ALL').toUpperCase();
  d.proof.showA = isTemplate || tier === 'A';
  d.proof.showB = isTemplate || tier === 'B';
  d.proof.showC = isTemplate || tier === 'C';
  d.hasObjection = isTemplate || !!(d.objection && d.objection.head);
  d.hasBonus = isTemplate || !!(d.bonus && d.bonus.head);
  d.hasVideo = isTemplate || !!(d.video && d.video.id);
  d.optclass = isTemplate ? 'opt' : 'card';
  return d;
}

const arg = process.argv[2];
if (!arg) {
  const d = regData(null, {}, true);
  render(join(root, 'webinar/registration/_master'), d, join(root, 'webinar/registration/index.html'));
  process.exit(0);
}

const p = read(arg);
const handle = p.handle;
if (!handle) { console.error('prospect JSON needs a "handle"'); process.exit(1); }

// registration first, so the hub can link to it
if (p.registration) {
  const d = regData(p.registration, p, false);
  if (!d.meta || !p.registration.meta)
    d.meta = { title: ((d.host && d.host.name) ? d.host.name + ' — ' : '') + 'Live webinar' };
  render(join(root, 'webinar/registration/_master'), d, join(root, 'webinar/registration', handle, 'index.html'));
}

// hub (the lead magnet itself)
{
  const defaults = read(join(root, 'os/_master/defaults.json'));
  const d = merge(defaults, { ...(p.hub || {}), accent: p.accent ?? defaults.accent });
  const ig = d.igHandle, wa = d.waNumber;
  d.instagramUrl = 'https://instagram.com/' + ig;
  d.instagramLabel = '@' + ig;
  d.whatsappUrl = 'https://wa.me/' + wa;
  d.whatsappLabel = '+' + wa.slice(0, 2) + ' ' + wa.slice(2);
  d.hasMessage = d.videoQuote != null || (d.video && d.video.id);
  if (p.registration && d.gifts && d.gifts[0] && !d.gifts[0].url)
    d.gifts[0].url = '../../webinar/registration/' + handle + '/';
  render(join(root, 'os/_master'), d, join(root, 'os', handle, 'index.html'));
}
