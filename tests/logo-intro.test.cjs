const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/logo-intro.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../assets/logo-intro.css'), 'utf8');

// The opening's beats in milliseconds: the M lands by 500, grows from 550 to 1150, rests to 1650 and is open at 2350.
const LAND=500,RESTING=1400,HEADLINE=2084,FULL=2350;

function setup({seen=false,reduce=false,hash='',review=false,storageError=false,frames=true,drawError=false,hostname='127.0.0.1',missing='',overflow='',navInert=false,legacyMedia=false,phone=false,width=1440,height=900}={}) {
  const timers = new Map();let next=0,now=0;
  const windowEvents={},stored=[];
  function node(tagName='DIV'){
    const classes=new Set();
    return {tagName,hidden:true,inert:false,disabled:false,events:{},attrs:{},style:{overflow:'',display:'',setProperty(){}},children:[],
      setAttribute(k,v){if(drawError)throw Error('Drawing unavailable');this.attrs[k]=String(v);},
      classList:{add(...x){x.forEach(v=>classes.add(v));},remove(...x){x.forEach(v=>classes.delete(v));},contains(x){return classes.has(x);}},
      addEventListener(k,fn){this.events[k]=fn;},focus(){if(!this.disabled)document.activeElement=this;},blur(){if(document.activeElement===this)document.activeElement=document.body;}};
  }
  const intro=node(),hero=node(),replay=node('BUTTON'),slow=node('BUTTON'),previous=node('BUTTON'),controls=node(),nav=node(),photo=node('IMG');
  const parts={'.intro__place':node('g'),'.intro__sheet':node('path'),'.intro__plug':node('rect'),'.intro__glass':node('g'),'.intro__piece--left':node('path'),'.intro__piece--right':node('path')};
  const media={matches:reduce,...(legacyMedia?{addListener(fn){this.change=fn;}}:{addEventListener(k,fn){this.change=fn;}})};
  const settles=[];
  photo.animate=(keyframes,options)=>{const a={keyframes,options,cancelled:false,cancel(){this.cancelled=true;}};settles.push(a);return a;};
  intro.clientWidth=width;intro.clientHeight=height;
  intro.querySelector=s=>s===missing?null:parts[s];intro.contains=x=>x===intro;
  hero.querySelector=()=>photo;
  controls.querySelector=s=>s==='[data-replay]'?replay:slow;controls.querySelectorAll=()=>[replay,slow,previous];
  const document={events:{},body:node('BODY'),getElementById:id=>id===missing?null:({preloader:intro,hero,introReview:controls}[id]),addEventListener(k,fn){this.events[k]=fn;}};
  const script=node('SCRIPT'),style=node('STYLE'),link=node('LINK');
  document.body.children=[intro,controls,nav,hero,script,style,link];document.activeElement=document.body;
  document.body.style.overflow=overflow;nav.inert=navInert;
  let hidden=true;Object.defineProperty(intro,'hidden',{get:()=>hidden,set(value){hidden=value;if(value&&document.activeElement===intro)document.activeElement=document.body;}});
  let pending=null,began=false;
  const window={innerWidth:width,innerHeight:height,scrollTo(){document.scrolledToTop=true;},matchMedia:q=>q.includes('max-width')?{matches:phone}:media,addEventListener(k,fn){windowEvents[k]=fn;},cancelAnimationFrame(){pending=null;}};
  if(frames)window.requestAnimationFrame=fn=>{pending=fn;return 1;};
  vm.runInNewContext(source,{document,window,location:{hostname,hash,search:review?'?intro=preview':''},URLSearchParams,
    sessionStorage:{getItem(){if(storageError)throw Error();return seen?'seen':null;},setItem(key,value){if(storageError)throw Error();stored.push([key,value]);}},
    setTimeout(fn,ms){timers.set(++next,{fn,ms,at:now+ms});return next;},clearTimeout:id=>timers.delete(id)});
  function tick(ms){
    const target=now+ms;
    for(;;){
      const due=[...timers].filter(([,timer])=>timer.at<=target).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];
      if(!due)break;
      const [id,timer]=due;timers.delete(id);now=timer.at;timer.fn();
    }
    now=target;
  }
  // Paints the frame the browser would show this many milliseconds after the opening's first frame.
  function paint(ms){
    const run=at=>{const fn=pending;pending=null;fn(1000+at);};
    if(!began){began=true;run(0);}
    run(ms);
  }
  const move=part=>{const m=parts[part].attrs.transform.match(/^translate\((\S+) (\S+)\) scale\((\S+)\)$/);return {x:+m[1],y:+m[2],scale:+m[3]};};
  const dismiss=()=>document.events.keydown({key:'Escape',preventDefault(){}});
  const waiting=()=>pending!==null;
  return {intro,hero,dismiss,nav,replay,slow,previous,controls,document,media,tick,paint,move,waiting,parts,photo,settles,timers,windowEvents,stored,script,style,link};
}
const body=s=>s.document.body.classList;

test('a first desktop visit plays the opening, then shows the headline and the navigation',()=>{
  const s=setup();
  assert.equal(s.intro.hidden,false);assert.equal(s.hero.classList.contains('intro-await'),true);assert.equal(body(s).contains('intro-brand'),true);
  assert.equal(s.nav.inert,true);assert.equal(s.document.body.style.overflow,'hidden');
  s.tick(HEADLINE-1);assert.equal(s.hero.classList.contains('in'),false);
  s.tick(1);assert.equal(s.hero.classList.contains('in'),true);assert.equal(s.hero.classList.contains('intro-await'),false);
  assert.equal(s.intro.hidden,false);
  s.tick(FULL-HEADLINE-1);assert.equal(s.intro.hidden,false);
  s.tick(1);assert.equal(s.intro.hidden,true);
  assert.equal(body(s).contains('intro-brand'),false);assert.equal(body(s).contains('intro-brand-fade'),true);
  assert.equal(s.nav.inert,false);assert.equal(s.document.body.style.overflow,'');assert.equal(s.timers.size,0);assert.equal(s.waiting(),false);
});

test('the M lands small at the centre of the screen behind a solid sheet',()=>{
  const s=setup();
  const placed=s.move('.intro__place');
  assert.equal(placed.x,720);assert.equal(placed.y,450);assert.ok(Math.abs(placed.scale-1.17)<1e-9);
  assert.deepEqual(s.move('.intro__sheet'),{x:0,y:0,scale:1});assert.equal(s.parts['.intro__plug'].style.display,'');
  assert.equal(s.parts['.intro__piece--left'].attrs.opacity,'0');
  s.paint(LAND-1);assert.equal(s.parts['.intro__plug'].style.display,'');
  s.paint(LAND+40);assert.equal(s.parts['.intro__plug'].style.display,'none');
  assert.equal(s.parts['.intro__piece--left'].attrs.transform,'translate(0 0)');assert.equal(s.parts['.intro__piece--right'].attrs.opacity,'1');
  assert.equal(s.parts['.intro__glass'].attrs.opacity,'1');
});

test('the M rests centred as blue glass with the photograph visible through it',()=>{
  const s=setup();s.paint(RESTING);
  const sheet=s.move('.intro__sheet');
  assert.equal(sheet.x,0);assert.equal(sheet.y,0);assert.ok(sheet.scale>5.6&&sheet.scale<6);
  assert.deepEqual(s.move('.intro__glass'),sheet);assert.equal(s.parts['.intro__glass'].attrs.opacity,'0.62');
  // 111.5 units tall: the resting M fits inside the screen with room above and below.
  assert.ok(111.5*1.17*sheet.scale<900*.9);
});

test('the M opens around a fixed point until the glass is gone and the blue clears every corner',()=>{
  for(const [width,height] of [[1440,900],[1280,720],[1920,1080],[3440,1440],[900,1200]]){
    const s=setup({width,height}),unit=Math.min(width/1600,height/1000)*1.3;
    s.paint(1900);const mid=s.move('.intro__sheet');
    assert.ok(mid.scale>6);assert.ok(Math.abs(mid.x+mid.scale*-3-6*-3)<1e-6);assert.ok(Math.abs(mid.y+mid.scale*-14-6*-14)<1e-6);
    s.paint(FULL);const end=s.move('.intro__sheet');
    assert.equal(s.parts['.intro__glass'].attrs.opacity,'0');
    const pinX=width/2-3*unit*6,pinY=height/2-14*unit*6;
    const reach=Math.hypot(Math.max(pinX,width-pinX),Math.max(pinY,height-pinY));
    assert.ok(16.6*unit*end.scale>reach,`${width}x${height} leaves white in a corner`);
  }
});

test('the photograph eases back to rest behind the glass and is left to run out',()=>{
  const s=setup();assert.equal(s.settles.length,1);
  assert.equal(s.settles[0].options.delay,550);assert.equal(s.settles[0].options.duration,2200);assert.equal(s.settles[0].options.fill,'backwards');
  s.tick(FULL);assert.equal(s.settles[0].cancelled,false);
});

test('repeat visits, direct anchors, reduced motion and phones go straight to the headline',()=>{
  for(const options of [{seen:true},{hash:'#featured'},{reduce:true},{phone:true}]){
    const s=setup(options);assert.equal(s.intro.hidden,true);assert.equal(s.hero.classList.contains('in'),true);
    assert.equal(s.document.body.style.overflow,'');assert.equal(s.nav.inert,false);assert.equal(s.timers.size,0);assert.equal(s.waiting(),false);
  }
  assert.deepEqual(setup({phone:true}).stored,[]);
});

test('a browser without animation frames or with missing artwork shows the page without the opening',()=>{
  for(const options of [{frames:false},{missing:'.intro__sheet'}]){
    const s=setup(options);assert.equal(s.intro.hidden,true);assert.equal(s.hero.classList.contains('in'),true);
    assert.equal(s.nav.inert,false);assert.equal(s.timers.size,0);
  }
});

test('a drawing failure releases focus and scroll and shows the headline',()=>{
  const s=setup({drawError:true});
  assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.nav.inert,false);
  assert.equal(s.document.activeElement,s.document.body);assert.equal(s.document.body.style.overflow,'');
  assert.equal(s.hero.classList.contains('in'),true);
});

test('click, wheel, touch and any other key end the opening at once, in every stage',()=>{
  for(const kind of ['click','wheel','touchstart','key','escape'])for(const elapsed of [0,400,RESTING,2000,2200]){
    const s=setup();s.tick(elapsed);assert.equal(s.intro.hidden,false);
    if(kind==='key')s.document.events.keydown({key:' ',preventDefault(){}});
    else if(kind==='escape')s.dismiss();
    else s.document.events[kind]({target:s.hero});
    assert.equal(s.intro.hidden,true);assert.equal(s.hero.classList.contains('in'),true);assert.equal(s.hero.classList.contains('intro-await'),false);
    assert.equal(body(s).contains('intro-brand'),false);assert.equal(body(s).contains('intro-brand-fade'),true);
    assert.equal(s.nav.inert,false);assert.equal(s.document.body.style.overflow,'');assert.equal(s.timers.size,0);assert.equal(s.waiting(),false);
  }
});

test('modifier keys and the replay button do not skip the opening',()=>{
  const s=setup();
  for(const key of ['Shift','Meta','Control','Alt','CapsLock'])s.document.events.keydown({key,preventDefault(){}});
  assert.equal(s.intro.hidden,false);
  const r=setup({review:true});r.controls.contains=n=>n===r.replay;
  r.replay.events.click();r.document.events.click({target:r.replay});assert.equal(r.intro.hidden,false);
  r.document.events.click({target:r.hero});assert.equal(r.intro.hidden,true);
});

test('Tab keeps focus on the opening and idle keyboard events remain untouched',()=>{
  const s=setup();let prevented=0;
  for(const shiftKey of [false,true]){
    s.document.activeElement=s.nav;
    s.document.events.keydown({key:'Tab',shiftKey,preventDefault(){prevented++;}});
    assert.equal(s.document.activeElement,s.intro);assert.equal(s.intro.hidden,false);
  }
  s.dismiss();
  for(const key of ['Tab','Escape','ArrowDown'])s.document.events.keydown({key,preventDefault(){prevented++;}});
  assert.equal(prevented,2);
});

test('pagehide, resize and a change to reduced motion release the page at any stage',()=>{
  for(const event of ['pagehide','resize','motion'])for(const elapsed of [0,RESTING,2200]){
    const s=setup({legacyMedia:elapsed===0});s.tick(elapsed);
    if(event==='motion'){s.media.change();assert.equal(s.intro.hidden,false);s.media.matches=true;s.media.change();}
    else s.windowEvents[event]();
    assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.nav.inert,false);assert.equal(s.waiting(),false);
    if(event!=='motion'){s.windowEvents[event]();assert.equal(s.intro.hidden,true);}
  }
});

test('cleanup restores prior inert and overflow values without stealing outside focus',()=>{
  const s=setup({navInert:true,overflow:'clip'});
  assert.equal(s.hero.inert,true);assert.equal(s.controls.inert,false);assert.equal(s.intro.inert,false);
  for(const node of [s.script,s.style,s.link])assert.equal(node.inert,false);
  s.document.activeElement=s.previous;s.dismiss();
  assert.equal(s.nav.inert,true);assert.equal(s.hero.inert,false);
  assert.equal(s.document.body.style.overflow,'clip');assert.equal(s.document.activeElement,s.previous);
});

test('the opening takes focus without a visible skip control and gives it back',()=>{
  assert.doesNotMatch(html,/intro__skip|Skip introduction/);
  assert.match(html,/id="preloader"[^>]*tabindex="-1"/);
  assert.match(css,/#preloader:focus\{outline:none\}/);
  for(const action of ['finish','escape']){
    const s=setup();assert.equal(s.document.activeElement,s.intro);
    if(action==='finish')s.tick(FULL);else s.dismiss();
    assert.equal(s.intro.hidden,true);assert.equal(s.document.activeElement,s.document.body);
  }
});

test('review waits for input, replays at the top and restores focus to the replay button',()=>{
  const s=setup({review:true,hash:'#featured'});assert.equal(s.intro.hidden,true);assert.equal(s.controls.hidden,false);
  s.replay.focus();s.replay.events.click();
  assert.equal(s.document.scrolledToTop,true);assert.equal(s.replay.disabled,true);assert.equal(s.intro.hidden,false);
  assert.equal(s.hero.classList.contains('in'),false);
  s.dismiss();assert.equal(s.replay.disabled,false);assert.equal(s.document.activeElement,s.replay);
});

test('slow replay stretches every beat by three',()=>{
  const s=setup({review:true});s.slow.events.click();
  s.paint(RESTING*3);const sheet=s.move('.intro__sheet');
  assert.ok(sheet.scale>5.6&&sheet.scale<6);assert.equal(s.parts['.intro__glass'].attrs.opacity,'0.62');
  assert.equal(s.settles[0].options.duration,6600);
  s.tick(HEADLINE*3-1);assert.equal(s.hero.classList.contains('in'),false);
  s.tick(1);assert.equal(s.hero.classList.contains('in'),true);
  s.tick((FULL-HEADLINE)*3-1);assert.equal(s.intro.hidden,false);
  s.tick(1);assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);
});

test('duplicate replay events do not restart the clock and replay works again after finish',()=>{
  const s=setup({review:true});s.replay.events.click();s.tick(900);
  const pending=s.timers.size;s.slow.events.click();assert.equal(s.timers.size,pending);
  s.tick(FULL-900);assert.equal(s.intro.hidden,true);
  s.replay.events.click();assert.equal(s.intro.hidden,false);assert.equal(body(s).contains('intro-brand-fade'),false);
  assert.equal(s.settles[0].cancelled,true);assert.equal(s.settles.length,2);
  s.dismiss();
  assert.deepEqual(s.stored,[['montana-m-intro-v3','seen'],['montana-m-intro-v3','seen']]);
});

test('reduced motion prevents a replay',()=>{
  const s=setup({review:true,reduce:true});s.replay.events.click();
  assert.equal(s.intro.hidden,true);assert.equal(s.timers.size,0);assert.equal(s.document.scrolledToTop,undefined);
});

test('preview controls require a local host and may be absent',()=>{
  const local=setup({review:true,hostname:'localhost'});assert.equal(local.controls.hidden,false);
  const publicSite=setup({review:true,hostname:'montanacontracting.com'});
  assert.equal(publicSite.controls.hidden,true);assert.equal(publicSite.intro.hidden,false);
  assert.equal(publicSite.replay.events.click,undefined);publicSite.dismiss();
  const noControls=setup({review:true,missing:'introReview'});assert.equal(noControls.intro.hidden,false);
  noControls.dismiss();assert.equal(noControls.intro.hidden,true);
});

test('storage errors do not stop the opening or trap the visitor',()=>{
  const s=setup({storageError:true});assert.equal(s.intro.hidden,false);
  s.tick(FULL);assert.equal(s.intro.hidden,true);assert.equal(s.nav.inert,false);
});

test('missing introduction or hero exits without changing the page',()=>{
  for(const missing of ['preloader','hero']){
    const s=setup({missing});assert.equal(s.timers.size,0);assert.equal(s.document.scrolledToTop,undefined);
    assert.equal(s.document.body.style.overflow,'');assert.equal(s.nav.inert,false);
  }
});

test('the page stays available when scripts are disabled or the introduction script fails',()=>{
  assert.match(html,/<div id="preloader" hidden role="dialog" aria-modal="true"/);
  assert.match(html,/<noscript><style>#preloader\{display:none\}\.reveal\{opacity:1;transform:none\}<\/style><\/noscript>/);
  const handler=html.match(/<script src="assets\/logo-intro\.js" onerror="([^"]+)"/)[1];
  const s=setup({missing:'preloader'});vm.runInNewContext(handler,{document:s.document});
  assert.equal(s.hero.classList.contains('in'),true);assert.equal(s.intro.hidden,true);
});

test('the M is drawn from the vector path in the page and waits on no image',()=>{
  const opening=html.slice(html.indexOf('<div id="preloader"'),html.indexOf('<div class="intro-review"'));
  for(const part of ['intro__place','intro__sheet','intro__plug','intro__glass','intro__piece--left','intro__piece--right'])assert.match(opening,new RegExp(`class="${part}"`));
  assert.doesNotMatch(opening,/<img|href=/);
  assert.doesNotMatch(html,/montana-m-original/);
  assert.match(opening,/<svg class="intro__svg" aria-hidden="true" focusable="false">/);
});

test('headline uses the smaller desktop size and keeps the mobile size',()=>{
  assert.match(html,/font-size:clamp\(2\.8rem,5\.92vw,5\.28rem\);max-width:16ch/);
  assert.match(html,/@media\(max-width:600px\)\{\.hero h1\{font-size:clamp\(2\.6rem,7\.4vw,6\.6rem\)\}\}/);
});
