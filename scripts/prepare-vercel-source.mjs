// Package only deployment source. File lists and the historical comparison
// input are local, ignored outputs; neither is sent to the hosting service.
import fs from 'node:fs';
import crypto from 'node:crypto';

const tracked = fs.readFileSync('outputs/vercel-filelist.txt', 'utf8').trim().split(/\r?\n/).map((path) => path.trim());
const paths = [...new Set([...tracked, 'lib/attendance.ts'])].filter((path) =>
  !path.startsWith('.openai/apk-analysis/') && !path.startsWith('.impeccable/') &&
  !path.endsWith('.tar.gz') && !path.endsWith('.tsbuildinfo') &&
  !(path.endsWith('.md') && !path.includes('LICENSE')) &&
  !path.startsWith('scripts/attendance') && !path.startsWith('outputs/'));
const files = paths.map((file) => ({ file, data: fs.readFileSync(file, 'utf8'), encoding: 'utf-8' }));
const baseline = fs.readFileSync('outputs/privacy-baseline-page.txt', 'utf8');
const presetBlock = baseline.slice(baseline.indexOf('export const PRESET_PROFILES:'), baseline.indexOf('export const DEFAULT_PROFILES_LIST:'));
const personalLiterals = [...presetBlock.matchAll(/(?:name|nid|udid):\s*"([^"]+)"/g)].map((match) => match[1]);
if (personalLiterals.length < 4) throw new Error('Historical privacy comparison input is incomplete');
const leaks = files.filter(({ data }) => personalLiterals.some((value) => data.includes(value)) || /\b\d{13}\b/.test(data));
if (leaks.length) throw new Error('Personal identifier audit failed in: ' + leaks.map(({ file }) => file).join(', '));
const page = files.find(({ file }) => file === 'app/page.tsx')?.data;
if (!page?.includes('const DEFAULT_PROFILES_LIST: UserProfile[] = [];') || page.includes('PRESET_PROFILES')) {
  throw new Error('Deployment must start with an empty personnel list');
}
const json = JSON.stringify(files);
const sha256 = crypto.createHash('sha256').update(json).digest('hex');
fs.writeFileSync('outputs/vercel-source-sanitized.json', json);
fs.writeFileSync('outputs/vercel-source-audit.json', JSON.stringify({ count: files.length, length: json.length, sha256, personalIdentifiersFound: 0, startsWithEmptyPersonnel: true }, null, 2));
console.log(fs.readFileSync('outputs/vercel-source-audit.json', 'utf8'));
