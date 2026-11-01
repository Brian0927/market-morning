import fs from 'node:fs/promises';
const research=JSON.parse(await fs.readFile('research.json','utf8'));
const guide=JSON.parse(await fs.readFile('guide.json','utf8'));
const template=await fs.readFile('worker/market.mjs','utf8');
await fs.mkdir('dist/server',{recursive:true});
await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js',template.replace('/*RESEARCH*/null',JSON.stringify(research)).replace('/*GUIDE*/null',JSON.stringify(guide)));
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built market Worker with dated research and guide');
