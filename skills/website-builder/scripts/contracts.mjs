// contracts.mjs: turns the JSON contracts in /contracts into build-time rules.
// Used from src/content.config.ts so `astro build` refuses any page that breaks
// its contract (missing facts, too-long titles, leftover TODOs).
//
//   import { defineCollection } from 'astro:content';
//   import { glob } from 'astro/loaders';
//   import { z } from 'astro/zod';
//   import { loadContracts, schemaFor } from '../scripts/contracts.mjs';
//   const { archives, success } = loadContracts();
//   export const collections = Object.fromEntries([
//     ...archives.map(c => [c.id, defineCollection({
//       loader: glob({ pattern: '**/*.md', base: `./content/${c.id}` }), schema: schemaFor(c, z) })]),
//     ['success', defineCollection({
//       loader: glob({ pattern: '**/*.md', base: './content/success' }),
//       schema: z.discriminatedUnion('type', success.map(c => schemaFor(c, z, { type: c.id }))) })],
//   ]);

import fs from 'node:fs';
import path from 'node:path';

export function loadContracts(root = 'contracts') {
  const read = dir => fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    : [];
  return { archives: read(path.join(root, 'archives')), success: read(path.join(root, 'success')) };
}

const noTodo = v => !/\bTODO\b/.test(typeof v === 'string' ? v : JSON.stringify(v));
const todoMsg = 'Still says TODO. Fill in the real fact (never invent one) or remove the field if it is optional.';

function fieldSchema(spec, z) {
  let s;
  switch (spec.type) {
    case 'string': case 'ref':
      s = z.string().trim().min(spec.min ?? 1);
      if (spec.max) s = s.max(spec.max, `Keep this under ${spec.max} characters.`);
      break;
    case 'text': s = z.string().min(1); break;
    case 'url': s = z.string().url(); break;
    case 'number': s = z.number(); break;
    case 'boolean': s = z.boolean(); break;
    case 'date': case 'datetime': s = z.coerce.date(); break;
    case 'enum': s = z.enum(spec.values); break;
    case 'list': s = z.array(z.string().min(1)).min(spec.min ?? 0, `Needs at least ${spec.min} items.`); break;
    case 'faqs': s = z.array(z.object({ q: z.string().min(5), a: z.string().min(20) })).min(spec.min ?? 0, `Needs at least ${spec.min} FAQs.`); break;
    case 'testimonials': s = z.array(z.object({ name: z.string(), town: z.string().optional(), quote: z.string().min(10) })).min(spec.min ?? 0, `Needs at least ${spec.min} real testimonials.`); break;
    default: throw new Error(`Unknown field type "${spec.type}" in a contract.`);
  }
  s = s.refine(noTodo, todoMsg);
  return spec.optional || spec.requiredIf ? s.optional() : s;
}

// extra: fixed literal fields, e.g. { type: 'file-delivery' } for success pages
export function schemaFor(contract, z, extra = {}) {
  const shape = {};
  for (const [k, spec] of Object.entries(contract.fields)) shape[k] = fieldSchema(spec, z);
  for (const [k, v] of Object.entries(extra)) shape[k] = z.literal(v);
  const conditional = Object.entries(contract.fields).filter(([, s]) => s.requiredIf);
  const obj = z.object(shape);
  if (!conditional.length) return obj;
  return obj.superRefine((data, ctx) => {
    for (const [k, s] of conditional) {
      const [dep, val] = Object.entries(s.requiredIf)[0];
      if (data[dep] === val && (data[k] === undefined || data[k] === '')) {
        ctx.addIssue({ code: 'custom', path: [k], message: `Required when ${dep} is "${val}".` });
      }
    }
  });
}

// Lightweight check without Astro, for routines: node scripts/contracts.mjs check
// Reports leftover TODOs and missing required fields in every content file.
if (process.argv[1] && process.argv[1].endsWith('contracts.mjs') && process.argv[2] === 'check') {
  const { archives, success } = loadContracts();
  const front = f => (fs.readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
  let problems = 0;
  const scan = (dir, contract) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir, { recursive: true }).filter(f => String(f).endsWith('.md'))) {
      const file = path.join(dir, String(f)); const fm = front(file);
      if (/\bTODO\b/.test(fm)) { problems++; console.log(`TODO left   ${file}`); }
      const c = contract || success.find(s => new RegExp(`^type:\\s*["']?${s.id}["']?\\s*$`, 'm').test(fm));
      if (!c) { problems++; console.log(`no contract ${file} (success pages need "type: <success contract id>")`); continue; }
      for (const [k, s] of Object.entries(c.fields)) {
        if (s.optional || s.requiredIf) continue;
        if (!new RegExp(`^${k}:`, 'm').test(fm)) { problems++; console.log(`missing     ${file}: ${k}${s.help ? ` (${s.help})` : ''}`); }
      }
    }
  };
  for (const a of archives) scan(path.join('content', a.id), a);
  scan(path.join('content', 'success'), null);
  console.log(problems ? `\n${problems} contract problem(s).` : 'All content files meet their contracts.');
  process.exit(problems ? 1 : 0);
}
