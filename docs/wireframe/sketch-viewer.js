const items=[['welcome','01 Welcome'],['casebook','02 Casebook'],['clues','03 Clue activity'],['demo','04 Movement guide'],['hint','05 Hint'],['retry','06 Retry'],['success','07 Success'],['data','08 Data activity'],['profile','09 Profile']];
const mobileScreens=new Set(['welcome','casebook','clues','data']);
const frame=document.getElementById('drawing');let current='welcome';let mobile=false;
document.getElementById('screens').innerHTML=items.map(([id,label])=>`<a href="#${id}" data-screen="${id}">${label}</a>`).join('');
function mark(){document.querySelectorAll('[data-screen]').forEach(a=>{if(a.dataset.screen===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.querySelector('main').classList.toggle('mobile',mobile);document.getElementById('desktop').setAttribute('aria-pressed',String(!mobile));document.getElementById('mobile').setAttribute('aria-pressed',String(mobile));document.getElementById('status').textContent=(mobile?'Mobile':'Desktop')+' / '+items.find(i=>i[0]===current)?.[1];}
function load(id){current=items.some(i=>i[0]===id)?id:'welcome';if(mobile&&!mobileScreens.has(current))mobile=false;frame.src=`sketches/${current}${mobile?'-mobile':''}.html`;mark();}
document.getElementById('desktop').onclick=()=>{mobile=false;load(current);};document.getElementById('mobile').onclick=()=>{mobile=true;if(!mobileScreens.has(current))current='clues';load(current);};
window.addEventListener('hashchange',()=>load(location.hash.slice(1)));
window.addEventListener('message',e=>{if(e.source!==frame.contentWindow)return;if(e.data?.type==='sketch-size'&&Number.isFinite(e.data.height))frame.style.height=Math.ceil(e.data.height)+2+'px';if(e.data?.type==='sketch-screen'){const actual=e.data.id.replace('-mobile','');if(items.some(i=>i[0]===actual)){current=actual;mobile=e.data.id.endsWith('-mobile');history.replaceState(null,'','#'+current);mark();}}});
load(location.hash.slice(1)||'welcome');
