// new-page.mjs: create a new landing page (and its success page) from the contracts.
//
//   node scripts/new-page.mjs <archive> <slug> [--goal <goal>] [--success <success-contract>] [--parent <parent-slug>]
//   node scripts/new-page.mjs --list
// Examples (archive ids are whatever this business's contracts/archives define):
//   node scripts/new-page.mjs guides pricing-checklist --success copy-paste
//   node scripts/new-page.mjs areas north-district
//   node scripts/new-page.mjs areas-services emergency-repair --parent north-district
//
// Every field starts as TODO. The build refuses the page until each TODO is
// replaced with a real fact, so nothing half-finished can be published.

import fs from 'node:fs';
import path from 'node:path';
import { loadContracts } from './contracts.mjs';

const argv = process.argv.slice(2);
const opt = k => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const { archives, success } = loadContracts();

if (!argv.length || argv[0] === '--list') {
  console.log('Archives:');
  for (const a of archives) console.log(`  ${a.id.padEnd(22)} ${a.path.padEnd(18)} ${a.purpose}  (success: ${a.goal.defaultSuccess})`);
  console.log('\nSuccess contracts:');
  for (const s of success) console.log(`  ${s.id.padEnd(22)} ${s.usedWhen}`);
  process.exit(0);
}

const [archiveId, slugRaw] = argv;
const slug = (slugRaw || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
const archive = archives.find(a => a.id === archiveId);
if (!archive || !slug) { console.error(`Usage: new-page.mjs <archive> <slug>. Archives: ${archives.map(a => a.id).join(', ')}`); process.exit(1); }
const successId = opt('success') || archive.goal.defaultSuccess;
const sc = success.find(s => s.id === successId);
if (!sc) { console.error(`No success contract "${successId}". Options: ${success.map(s => s.id).join(', ')}`); process.exit(1); }
if (archive.id === 'SET-PER-BUSINESS' || archive.path === 'SET-PER-BUSINESS') { console.error(`Archive "${archiveId}" still has template placeholders. Set its id, label and path first.`); process.exit(1); }
const parentArchive = archive.parentArchive ? archives.find(a => a.id === archive.parentArchive) : null;
if (archive.parentArchive && !parentArchive) { console.error(`Parent archive "${archive.parentArchive}" not found in contracts/archives.`); process.exit(1); }
const parent = opt('parent');
if (parentArchive && !parent) { console.error(`This archive sits under "${parentArchive.id}". Pass --parent <slug of the ${parentArchive.itemNoun} page>.`); process.exit(1); }
if (parentArchive && !fs.existsSync(path.join('content', parentArchive.id, `${parent}.md`))) { console.error(`No ${parentArchive.itemNoun} page "${parent}" yet. Create it first: node scripts/new-page.mjs ${parentArchive.id} ${parent}`); process.exit(1); }

const yamlValue = (k, spec) => {
  const help = spec.help ? `  # ${spec.help}` : '';
  switch (spec.type) {
    case 'list': return `${k}:${help}\n${Array.from({ length: Math.max(spec.min || 1, 1) }, () => '  - "TODO"').join('\n')}`;
    case 'faqs': return `${k}:${help}\n${Array.from({ length: spec.min || 3 }, () => '  - q: "TODO"\n    a: "TODO"').join('\n')}`;
    case 'testimonials': return `${k}:${help}\n${Array.from({ length: spec.min || 2 }, () => '  - name: "TODO"\n    town: "TODO"\n    quote: "TODO"').join('\n')}`;
    case 'boolean': return `${k}: TODO${help}`;
    case 'number': return `${k}: TODO${help}`;
    case 'enum': return `${k}: "TODO"  # one of: ${spec.values.join(', ')}${spec.help ? `. ${spec.help}` : ''}`;
    case 'text': return `${k}: |${help}\n  TODO`;
    default: return `${k}: "TODO"${help}`;
  }
};
const goal = opt('goal') || (archive.goal.defaultGoal || '{slug}').replace('{slug}', slug);
if (goal.includes('{shared}')) { console.error(`Pages in "${archive.id}" share one goal. Set goal.defaultGoal in contracts/archives/${archive.id}.json (for example "free-quote" or "book-call") or pass --goal.`); process.exit(1); }
const known = { goal: `"${goal}"`, success: `"${goal}"`, updated: new Date().toISOString().slice(0, 10) };
// Nested pages: fill the reference fields that point at the parent and at this offering.
if (parent) for (const [k, sp] of Object.entries(archive.fields)) {
  if (sp.type === 'ref' && /place|parent/i.test(sp.to || k)) known[k] = `"${parent}"`;
  else if (sp.type === 'ref' && /offering/i.test(sp.to || k)) known[k] = `"${slug}"`;
}

const write = (file, lines, body) => {
  if (fs.existsSync(file)) { console.error(`Already exists, not overwriting: ${file}`); process.exit(1); }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\n${lines.join('\n')}\n---\n\n${body}\n`);
  console.log(`created ${file}`);
};

const pageFile = path.join('content', archive.id, ...(parent ? [parent] : []), `${slug}.md`);
write(pageFile,
  Object.entries(archive.fields).map(([k, s]) => known[k] !== undefined ? `${k}: ${known[k]}` : (s.optional ? `# ${yamlValue(k, s).split('\n').join('\n# ')}` : yamlValue(k, s))),
  `<!-- Below-the-fold content, in this order: ${archive.sections.join(' > ')} -->\nTODO`);

// One success page per goal: pages that share a goal (every quote form) share it.
const successFile = path.join('content', 'success', `${goal}.md`);
if (fs.existsSync(successFile)) console.log(`reusing ${successFile} (pages with the goal "${goal}" share one success page)`);
else write(successFile,
  [`type: "${sc.id}"`, ...Object.entries(sc.fields).filter(([k]) => k !== 'type').map(([k, s]) => s.optional ? `# ${yamlValue(k, s).split('\n').join('\n# ')}` : yamlValue(k, s))],
  `<!-- Success page (${sc.label}). Must show: ${sc.mustShow.join('; ')}. ${sc.indexing}. -->`);

const url = parentArchive ? `${parentArchive.path}${parent}/${slug}/` : `${archive.path}${slug}/`;
console.log(`\nLanding page: ${url}  goal: ${goal}  ->  success page: /thanks/${goal}/ (${sc.id})`);
console.log('Next: replace every TODO with real facts, write the copy, then run: npm run check');
