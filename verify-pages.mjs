import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile('_site/index.html','utf8');
assert.ok(html.includes("fetch('./data/'+group+'.json"));
assert.ok(html.includes("fetch('./data/brief.json"));
assert.ok(!html.includes("fetch('/api/"));
new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for(const group of ['taiwan','global','macro','tech','company','finance']){const d=JSON.parse(await fs.readFile('_site/data/'+group+'.json','utf8'));assert.ok(Array.isArray(d.items));}
const brief=JSON.parse(await fs.readFile('_site/data/brief.json','utf8'));assert.ok(Array.isArray(brief.items));
assert.ok(!html.includes('OAI-Sites-Authorization'));
console.log('PASS: project-relative paths, static data, browser syntax, no private service credential');
