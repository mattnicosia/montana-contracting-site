const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/logo-intro.js'), 'utf8');
function setup({seen=false,reduce=false,hash='',review=false,storageError=false,animated=false,animationError=false,hostname='127.0.0.1',missing='',overflow='',navInert=false,navMissing=false,imagesReady=true,brokenImage=false,legacyMedia=false}={}) {
  const timers = new Map();let next=0,now=0;
  const windowEvents={},stored=[];
  function node(tagName='DIV'){
    const classes=new Set();
    return {tagName,hidden:true,inert:false,disabled:false,events:{},style:{overflow:'',setProperty(){}},children:[],
      appendChild(child){this.children.push(child);},setAttribute(){},remove(){this.removed=true;},
      classList:{add(...x){x.forEach(v=>classes.add(v));},remove(...x){x.forEach(v=>classes.delete(v));},contains(x){return classes.has(x);}},
      addEventListener(k,fn){this.events[k]=fn;},removeEventListener(k,fn){if(this.events[k]===fn)delete this.events[k];},dispatch(k){this.events[k]?.();},focus(){if(!this.disabled)document.activeElement=this;}};
  }
  const intro=node(),hero=node(),skip=node('BUTTON'),replay=node('BUTTON'),slow=node('BUTTON'),previous=node('BUTTON'),controls=node(),nav=node();
  const imgs=Array.from({length:3},()=>Object.assign(node('IMG'),{complete:imagesReady,naturalWidth:imagesReady?1361:0})),img=imgs[0];
  if(brokenImage)img.naturalWidth=0;
  const media={matches:reduce,...(legacyMedia?{addListener(fn){this.change=fn;}}:{addEventListener(k,fn){this.change=fn;}})};
  const mark={getBoundingClientRect:()=>({left:500,top:300,width:156,height:132}),cloneNode:()=>node()};
  const panelAnimations=[];
  const animation={cancelled:false,finished:{then(fn){animation.complete=fn;}},cancel(){this.cancelled=true;}};
  if(animated)intro.animate=(frames,options)=>{animation.frames=frames;animation.options=options;return animation;};
  intro.querySelector=s=>s==='.intro__mark'?mark:skip;intro.querySelectorAll=()=>imgs;intro.contains=x=>x===skip;
  controls.querySelector=s=>s==='[data-replay]'?replay:s==='[data-slow]'?slow:previous;controls.querySelectorAll=()=>[replay,slow,previous];
  const document={events:{},body:node('BODY'),createElement(){const panel=node();panel.animate=(frames,options)=>{if(animationError)throw Error('Animation unavailable');let resolve;const result={frames,options,cancelled:false,finished:new Promise(r=>resolve=r),complete:()=>resolve(),cancel(){this.cancelled=true;}};panelAnimations.push(result);return result;};return panel;},getElementById:id=>id===missing?null:({preloader:intro,hero,introReview:controls}[id]),querySelector:()=>navMissing?null:nav,addEventListener(k,fn){this.events[k]=fn;}};
  const script=node('SCRIPT'),style=node('STYLE'),link=node('LINK');
  document.body.children=[intro,controls,nav,hero,script,style,link];document.activeElement=document.body;
  document.body.style.overflow=overflow;nav.inert=navInert;
  let hidden=true;Object.defineProperty(intro,'hidden',{get:()=>hidden,set(value){hidden=value;if(value&&document.activeElement===skip)document.activeElement=document.body;}});
  vm.runInNewContext(source,{document,window:{innerWidth:1280,innerHeight:720,scrollTo(){document.scrolledToTop=true;},matchMedia:()=>media,addEventListener(k,fn){windowEvents[k]=fn;}},location:{hostname,hash,search:review?'?intro=preview':''},URLSearchParams,
    sessionStorage:{getItem(){if(storageError)throw Error();return seen?'seen':null;},setItem(key,value){if(storageError)throw Error();stored.push([key,value]);}},
    setTimeout(fn,ms){timers.set(++next,{fn,ms,at:now+ms});return next;},clearTimeout:id=>timers.delete(id)});
  // Advance elapsed time, including timers scheduled by another timer before the target.
  function tick(ms){
    const target=now+ms;
    for(;;){
      const due=[...timers].filter(([,timer])=>timer.at<=target).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];
      if(!due)break;
      const [id,timer]=due;timers.delete(id);now=timer.at;timer.fn();
    }
    now=target;
  }
  return {intro,hero,skip,nav,replay,slow,previous,controls,document,media,tick,img,imgs,timers,animation,panelAnimations,windowEvents,stored,script,style,link};
}
test('intro ends without animation support and restores the page',()=>{
  const s=setup();s.tick(1800);assert.equal(s.intro.hidden,true);assert.equal(s.nav.inert,false);
  assert.equal(s.document.body.style.overflow,'');assert.equal(s.timers.size,0);
});
test('repeat visits, direct anchors, and reduced motion skip the introduction',()=>{
  for(const options of [{seen:true},{hash:'#featured'},{reduce:true}]){
    const s=setup(options);assert.equal(s.intro.hidden,true);assert.equal(s.hero.classList.contains('in'),true);
  }
});
test('review waits for input and always replays at the top',()=>{
  const s=setup({review:true,hash:'#featured'});assert.equal(s.intro.hidden,true);
  s.replay.events.click();assert.equal(s.document.scrolledToTop,true);assert.equal(s.replay.disabled,true);
  s.skip.events.click();assert.equal(s.replay.disabled,false);
});
test('assembly leads to a full blue field, held headline, then photo and navigation',()=>{
  const s=setup({animated:true});s.tick(1799);assert.equal(s.panelAnimations.length,0);
  s.tick(1);assert.equal(s.panelAnimations.length,1);
  const a=s.panelAnimations[0];assert.equal(a.options.duration,850);
  assert.deepEqual(JSON.parse(JSON.stringify(a.frames)),[{opacity:0},{opacity:1}]);
  s.tick(850);assert.equal(s.hero.classList.contains('intro-blue-title'),true);
  assert.equal(s.intro.children[0].hidden,true);assert.equal(s.hero.classList.contains('intro-blue-fade'),false);
  s.tick(1099);assert.equal(s.hero.classList.contains('intro-blue-fade'),false);
  s.tick(1);assert.equal(s.hero.classList.contains('intro-blue-fade'),true);
  assert.equal(s.document.body.classList.contains('intro-brand-fade'),false);
  s.tick(449);assert.equal(s.document.body.classList.contains('intro-brand-fade'),false);
  s.tick(1);assert.equal(s.document.body.classList.contains('intro-brand-fade'),true);
  s.tick(749);assert.equal(s.intro.hidden,false);
  s.tick(1);assert.equal(s.intro.hidden,true);assert.equal(s.hero.classList.contains('intro-blue-settled'),true);
  assert.equal(s.timers.size,0);assert.equal(s.nav.inert,false);assert.ok(a.cancelled);
});
test('skip or Escape cleans up at every stage and restores replay focus',()=>{
  for(const stage of [0,850,1950,2400]){
    const s=setup({animated:true,review:true});s.replay.focus();s.replay.events.click();s.tick(1800);
    if(stage)s.tick(stage);s.document.events.keydown({key:'Escape',preventDefault(){}});
    assert.equal(s.intro.hidden,true);assert.equal(s.nav.inert,false);assert.equal(s.timers.size,0);
    assert.equal(s.document.activeElement,s.replay);assert.ok(s.panelAnimations.every(a=>a.cancelled));
    assert.ok(s.intro.children.every(n=>n.removed));assert.equal(s.hero.classList.contains('intro-blue'),false);
  }
});
test('slow replay scales every stage and finishes before the safety deadline',()=>{
  const s=setup({animated:true,review:true});s.slow.events.click();s.tick(5399);
  assert.equal(s.panelAnimations.length,0);s.tick(1);
  assert.equal(s.panelAnimations[0].options.duration,2550);
  s.tick(2549);assert.equal(s.hero.classList.contains('intro-blue-title'),false);
  s.tick(1);assert.equal(s.hero.classList.contains('intro-blue-title'),true);
  s.tick(3300);assert.equal(s.hero.classList.contains('intro-blue-fade'),true);
  s.tick(1350);assert.equal(s.document.body.classList.contains('intro-brand-fade'),true);
  s.tick(2249);assert.equal(s.intro.hidden,false);
  s.tick(1);assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);
});
test('storage errors, missing artwork, and preference changes cannot trap the visitor',()=>{
  const s=setup({storageError:true});s.img.events.error();assert.equal(s.intro.hidden,true);
  const a=setup({animated:true});a.tick(1800);a.media.matches=true;a.media.change();
  assert.equal(a.intro.hidden,true);assert.equal(a.nav.inert,false);assert.equal(a.timers.size,0);
});
test('opening has no project-navigation or diagonal-reveal code',()=>{
  assert.doesNotMatch(source,/twisted-ridge|openSignature|clipPath|data-previous/);
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(html,/project-transition|Compare diagonal/);
});

test('the safety deadline releases the page if the assembly callback is lost',()=>{
  for(const rate of [1,3]){
    const s=setup({animated:true,review:true});(rate===1?s.replay:s.slow).events.click();
    // Simulate an interrupted assembly task without removing the independent watchdog.
    for(const [id,timer] of s.timers)if(timer.ms===1800*rate)s.timers.delete(id);
    s.tick(5500*rate-1);assert.equal(s.intro.hidden,false);
    s.tick(1);assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);
    assert.equal(s.nav.inert,false);assert.equal(s.document.body.style.overflow,'');
  }
});

test('Tab traps focus during the opening and idle keyboard events remain untouched',()=>{
  const s=setup();let prevented=0;
  for(const shiftKey of [false,true]){
    s.document.activeElement=s.nav;
    s.document.events.keydown({key:'Tab',shiftKey,preventDefault(){prevented++;}});
    assert.equal(s.document.activeElement,s.skip);
  }
  s.document.events.keydown({key:'ArrowDown',preventDefault(){prevented++;}});
  assert.equal(prevented,2);s.skip.events.click();
  for(const key of ['Tab','Escape'])s.document.events.keydown({key,preventDefault(){prevented++;}});
  assert.equal(prevented,2);
});

test('pagehide and resize release the page during assembly and the blue field',()=>{
  for(const event of ['pagehide','resize'])for(const elapsed of [0,1800,2650]){
    const s=setup({animated:true});s.tick(elapsed);s.windowEvents[event]();
    assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.nav.inert,false);
    assert.ok(s.panelAnimations.every(a=>a.cancelled));assert.ok(s.intro.children.every(n=>n.removed));
    s.windowEvents[event]();assert.equal(s.intro.hidden,true);
  }
});

test('animation failures release focus, scroll, and the added blue panel',()=>{
  const s=setup({animated:true,animationError:true});s.tick(1800);
  assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.nav.inert,false);
  assert.equal(s.document.activeElement,s.nav);assert.equal(s.document.body.style.overflow,'');
  assert.ok(s.intro.children.every(n=>n.removed));assert.equal(s.hero.classList.contains('in'),true);
});

test('cleanup restores prior inert and overflow values without stealing outside focus',()=>{
  const s=setup({navInert:true,overflow:'clip'});
  assert.equal(s.hero.inert,true);assert.equal(s.controls.inert,false);assert.equal(s.intro.inert,false);
  for(const node of [s.script,s.style,s.link])assert.equal(node.inert,false);
  s.document.activeElement=s.previous;s.skip.events.click();
  assert.equal(s.nav.inert,true);assert.equal(s.hero.inert,false);
  assert.equal(s.document.body.style.overflow,'clip');assert.equal(s.document.activeElement,s.previous);
  const noTarget=setup({navMissing:true});noTarget.skip.events.click();
  assert.equal(noTarget.intro.hidden,true);assert.equal(noTarget.document.activeElement,noTarget.document.body);
});

test('duplicate replay events do not restart the clock and replay works again after finish',()=>{
  const s=setup({review:true,animated:true});s.replay.events.click();s.tick(900);
  const pending=s.timers.size;s.slow.events.click();assert.equal(s.timers.size,pending);
  s.tick(900);assert.equal(s.panelAnimations.length,1);assert.equal(s.panelAnimations[0].options.duration,850);
  s.tick(3150);assert.equal(s.hero.classList.contains('intro-blue-settled'),true);
  s.replay.events.click();assert.equal(s.hero.classList.contains('intro-blue-settled'),false);
  assert.equal(s.intro.hidden,false);s.skip.events.click();
  assert.deepEqual(s.stored,[['montana-m-intro-v2','seen'],['montana-m-intro-v2','seen']]);
});

test('preview controls require a local host and may be absent',()=>{
  const local=setup({review:true,hostname:'localhost'});assert.equal(local.controls.hidden,false);
  const publicSite=setup({review:true,hostname:'montanacontracting.com'});
  assert.equal(publicSite.controls.hidden,true);assert.equal(publicSite.intro.hidden,false);
  assert.equal(publicSite.replay.events.click,undefined);publicSite.skip.events.click();
  const noControls=setup({review:true,missing:'introReview'});assert.equal(noControls.intro.hidden,false);
  noControls.skip.events.click();assert.equal(noControls.intro.hidden,true);
});

test('missing introduction or hero exits without changing the page',()=>{
  for(const missing of ['preloader','hero']){
    const s=setup({missing});assert.equal(s.timers.size,0);assert.equal(s.document.scrolledToTop,undefined);
    assert.equal(s.document.body.style.overflow,'');assert.equal(s.nav.inert,false);
  }
});

test('reduced motion can prevent a replay or finish an active opening on legacy browsers',()=>{
  const s=setup({review:true,reduce:true});s.replay.events.click();
  assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.document.scrolledToTop,undefined);
  const old=setup({animated:true,legacyMedia:true});old.media.change();assert.equal(old.intro.hidden,false);
  old.media.matches=true;old.media.change();assert.equal(old.intro.hidden,true);assert.equal(old.timers.size,0);
  const changed=setup({animated:true});changed.media.matches=true;changed.tick(1800);
  assert.equal(changed.intro.hidden,true);assert.equal(changed.panelAnimations.length,0);
});

test('the page stays available when scripts are disabled or the introduction script fails',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  assert.match(html,/<div id="preloader" hidden role="dialog" aria-modal="true"/);
  assert.match(html,/<noscript><style>#preloader\{display:none\}\.reveal\{opacity:1;transform:none\}<\/style><\/noscript>/);
  const handler=html.match(/<script src="assets\/logo-intro\.js" onerror="([^"]+)"/)[1];
  const s=setup({missing:'preloader'});vm.runInNewContext(handler,{document:s.document});
  assert.equal(s.hero.classList.contains('in'),true);assert.equal(s.intro.hidden,true);
});

test('assembly waits for all artwork and starts once after the final image loads',()=>{
  const s=setup({animated:true,imagesReady:false});s.tick(400);
  for(const img of s.imgs.slice(0,2)){img.complete=true;img.naturalWidth=1361;img.dispatch('load');}
  s.tick(400);assert.equal(s.intro.classList.contains('intro--playing'),false);
  const last=s.imgs[2];last.complete=true;last.naturalWidth=1361;const queuedLoad=last.events.load;last.dispatch('load');
  assert.equal(s.intro.classList.contains('intro--playing'),true);
  assert.ok(s.imgs.every(img=>img.events.load===undefined));
  queuedLoad();s.tick(1799);assert.equal(s.panelAnimations.length,0);
  s.tick(1);assert.equal(s.panelAnimations.length,1);
  s.tick(3150);assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);
});

test('artwork failures and the load deadline release the page and late loads stay idle',()=>{
  for(const options of [{imagesReady:false},{brokenImage:true},{imagesReady:false,fail:true}]){
    const s=setup({...options,animated:true});
    if(options.fail)s.img.events.error();
    if(!options.brokenImage&&!options.fail){s.tick(1199);assert.equal(s.intro.hidden,false);s.tick(1);}
    else s.tick(1200);
    assert.equal(s.intro.hidden,true);assert.equal(s.nav.inert,false);assert.equal(s.timers.size,0);
    assert.ok(s.imgs.every(img=>img.events.load===undefined));
    for(const img of s.imgs){img.complete=true;img.naturalWidth=1361;img.dispatch('load');}
    s.tick(6000);assert.equal(s.intro.hidden,true);assert.equal(s.panelAnimations.length,0);
  }
});
