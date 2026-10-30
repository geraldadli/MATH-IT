import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.WIREFRAME_PLAYWRIGHT || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
await mkdir(path.join(root, 'screens'), {recursive:true});
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1120,height:850},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const url = new URL('frame.html',import.meta.url).href;
const screens=['welcome','casebook','clues','demo','hint','retry','success','data','profile'];
const manifest={};
for(const screen of screens){
  await page.goto(`${url}?screen=${screen}&capture=1`);
  await page.evaluate(()=>document.fonts.ready);
  const height=await page.locator('#app').evaluate(el=>Math.ceil(el.getBoundingClientRect().height));
  await page.setViewportSize({width:1120,height:Math.max(height,850)});
  await page.screenshot({path:path.join(root,'screens',`${screen}-desktop.png`),clip:{x:0,y:0,width:1120,height:Math.max(height,850)}});
  manifest[screen]={width:1120,height:Math.max(height,850)};
  await page.setViewportSize({width:1120,height:850});
}
for(const screen of ['welcome','casebook','clues','data']){
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${url}?screen=${screen}&capture=1`);
  const height=await page.locator('#app').evaluate(el=>Math.ceil(el.getBoundingClientRect().height));
  // Capture full mobile pages with the destination dock at the page's end.
  await page.setViewportSize({width:390,height:Math.max(height,844)});
  await page.screenshot({path:path.join(root,'screens',`${screen}-mobile.png`),fullPage:true});
  manifest[`${screen}-mobile`]={width:390,height:Math.max(height,844)};
}
await page.setViewportSize({width:1600,height:1200});
await page.goto(new URL('index.html',import.meta.url).href);
await page.locator('#prototype').waitFor();
await page.screenshot({path:path.join(root,'screens','proposal-preview.png'),fullPage:true});
await writeFile(path.join(root,'screens','screen-notes.json'),JSON.stringify(await page.evaluate(()=>window.wireframeScreens),null,2));

function assert(ok,message){if(!ok)throw new Error(message);}
await page.setViewportSize({width:1120,height:850});
await page.goto(`${url}?screen=welcome&capture=1`);
await page.locator('#detective-name').fill('Jamie');
await page.locator('input[name="animal"][value="Cat"]').check();
await page.locator('#detective-form button[type="submit"]').click();
assert((await page.locator('h1').innerText()).includes('Jamie'),'Onboarding name missing');
await page.locator('[data-action="open"]').click();
for(let i=0;i<12;i++){
  await page.locator(`[data-token="${i}"]`).click();
  await page.locator(`.group [data-zone="${['a','b','c'][i%3]}"]`).click();
}
await page.locator('[data-action="undo"]').click();
assert((await page.evaluate(()=>window.prototypeApi.getState().board)).filter(z=>z==='tray').length===1,'Undo failed');
await page.locator('[data-token="11"]').click();
await page.locator('.group [data-zone="c"]').click();
await page.locator('[data-action="check"]').click();
assert((await page.evaluate(()=>window.prototypeApi.getState())).feedback==='success','Equal sharing did not solve');
await page.locator('[data-action="next"]').click();
assert((await page.locator('.briefing h2').innerText()).includes('secret'),'Next case did not open');
await page.locator('[data-action="hint"]').click();
await page.locator('[data-action="hintnext"]').click();
assert((await page.locator('dialog .eyebrow').innerText()).includes('2 / 3'),'Hint step failed');
await page.keyboard.press('Escape');
await page.locator('dialog').waitFor({state:'detached'});
assert(await page.locator('dialog').count()===0,'Hint did not dismiss');
await page.goto(`${url}?screen=retry&capture=1`);
assert(await page.locator('.needs-review').count()===2,'Retry must flag only two incorrect groups');
await page.goto(`${url}?screen=data&capture=1`);
await page.locator('#tool-group').selectOption('Event');
await page.locator('#tool-filter').selectOption('Blue');
await page.locator('#tool-sort').selectOption('Most first');
await page.locator('#tool-view').selectOption('Table');
await page.locator('[data-pick="Sack race"]').click();
await page.locator('[data-action="checkdata"]').click();
assert((await page.evaluate(()=>window.prototypeApi.getState())).feedback==='success','Data tools and answer failed');
await page.goto(`${url}?screen=welcome&capture=1`);
await page.locator('[data-lang="id"]').click();
assert((await page.locator('h1').innerText()).includes('Pecahkan'),'Indonesian toggle failed');

const layoutChecks=[];
for(const width of [320,390,650,850,1120]){
 await page.setViewportSize({width,height:850});
 for(const screen of screens){
  await page.goto(`${url}?screen=${screen}&capture=1`);
  const check=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflows:[...document.querySelectorAll('button,input,select,h1,h2,h3')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.right>innerWidth+.5)}).map(e=>e.outerHTML.slice(0,90))}));
  assert(check.scroll<=width,`Horizontal overflow at ${width}: ${screen}`);
  assert(!check.overflows.length,`Control outside screen at ${width}: ${screen}: ${check.overflows.join(',')}`);
  layoutChecks.push(`${screen}@${width}`);
 }
}
assert(errors.length===0,'Browser errors: '+errors.join('; '));
await writeFile(path.join(root,'screens','manifest.json'),JSON.stringify(manifest,null,2));
await writeFile(path.join(root,'screens','verification.json'),JSON.stringify({status:'passed',runtimeErrors:errors,interactions:['onboarding','partner selection','clue placement','undo','check','next case','hint navigation','Escape dismissal','targeted retry feedback','data filtering','data sorting','table view','data answer validation','Indonesian toggle'],layoutChecks},null,2));
console.log(JSON.stringify({screens:Object.keys(manifest).length,layoutChecks:layoutChecks.length,errors}));
await browser.close();
