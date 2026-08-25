#!/usr/bin/env node
// Asset 01 · webinar registration page builder.
// Template state:  node build.mjs             -> ../index.html   (all tiers + verdict labels shown)
// Prospect page:   node build.mjs prospects/<handle>.json -> ../<handle>/index.html
//                  (verdict labels stripped, unchosen proof tiers deleted, null blocks deleted)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

function merge(base, over) {
  if (over === null) return null;
  if (Array.isArray(base) || Array.isArray(over) || typeof over !== 'object') return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = k in out ? merge(out[k], over[k]) : over[k];
  return out;
}
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

const defaults = read(join(here, 'defaults.json'));
const arg = process.argv[2];
let data, outPath, label;

if (arg) {
  const prospect = read(arg);
  data = merge(defaults, prospect);
  data._template = false;
  const handle = prospect.handle || basename(arg, '.json');
  outPath = join(here, '..', handle, 'index.html');
  label = 'prospect: ' + handle;
  if (!data.meta || data.meta.title === defaults.meta.title)
    data.meta = { ...data.meta, title: (prospect.host && prospect.host.name ? prospect.host.name + ' — ' : '') + 'Live webinar' };
} else {
  data = merge(defaults, {});
  data._template = true;
  outPath = join(here, '..', 'index.html');
  label = 'template state';
}

// Block visibility. Template shows everything with its verdict label; a prospect page keeps
// only what the JSON filled. proof.tier: "A" | "B" | "C" picks one; template shows all three.
const tier = String((data.proof && data.proof.tier) || 'ALL').toUpperCase();
data.proof.showA = data._template || tier === 'A';
data.proof.showB = data._template || tier === 'B';
data.proof.showC = data._template || tier === 'C';
data.hasObjection = data._template || !!(data.objection && data.objection.head);
data.hasBonus = data._template || !!(data.bonus && data.bonus.head);
data.optclass = data._template ? "opt" : "card";

let html = readFileSync(join(here, 'index.html'), 'utf8');

// <!--IF:path--> a <!--ELSE:path--> b <!--END:path-->  — loop until no conditionals remain (handles nesting)
const cond = /<!--IF:([\w.]+)-->([\s\S]*?)(?:<!--ELSE:\1-->([\s\S]*?))?<!--END:\1-->/g;
let prev;
do { prev = html; html = html.replace(cond, (_, p, a, b = '') => (get(data, p) ? a : b)); } while (html !== prev);

// {{path}} tokens
html = html.replace(/\{\{([\w.]+)\}\}/g, (_, p) => { const v = get(data, p); return v == null ? '' : String(v); });

const leftover = html.match(/\{\{[\w.]+\}\}|<!--(?:IF|ELSE|END):/g);
if (leftover) { console.error('UNRESOLVED:', [...new Set(leftover)].join(' ')); process.exit(1); }

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);
console.log('built ' + label + ' -> ' + outPath);
