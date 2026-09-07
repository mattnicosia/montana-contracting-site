(function(){
  'use strict';
  var intro=document.getElementById('preloader'),hero=document.getElementById('hero');
  if(!intro||!hero)return;
  var skip=intro.querySelector('button'),controls=document.getElementById('introReview');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var review=(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&new URLSearchParams(location.search).get('intro')==='preview';
  var running=false,assembling=false,artworkTimer,timers=[],animations=[],flood,inertNodes=[],previousFocus,previousOverflow;
  var artwork=Array.from(intro.querySelectorAll('img'));
  var stopWaiting=function(){};
  var key='montana-m-intro-v2',seen=false;
  try{seen=sessionStorage.getItem(key)==='seen';}catch(error){}
  function later(fn,ms){timers.push(setTimeout(function(){if(running)fn();},ms));}
  function finish(){
    if(!running)return;
    running=false;
    assembling=false;
    clearTimeout(artworkTimer);
    stopWaiting();
    var restoreFocus=intro.contains(document.activeElement);
    timers.forEach(clearTimeout);timers=[];
    animations.forEach(function(animation){animation.cancel();});animations=[];
    if(flood){flood.remove();flood=null;}
    intro.hidden=true;
    intro.classList.remove('intro--playing','intro--blue-ready','intro--filling');
    hero.classList.remove('intro-await');
    if(hero.classList.contains('intro-blue-title'))hero.classList.add('intro-blue-settled');
    hero.classList.remove('intro-blue','intro-blue-title','intro-blue-fade');
    document.body.classList.remove('intro-brand','intro-brand-fade');
    hero.classList.add('in');
    document.body.style.overflow=previousOverflow;
    inertNodes.forEach(function(item){item.node.inert=item.value;});inertNodes=[];
    if(controls)controls.querySelectorAll('button').forEach(function(button){button.disabled=false;});
    if(restoreFocus){
      var target=previousFocus&&previousFocus!==document.body?previousFocus:null;
      if(target)target.focus({preventScroll:true});
      else skip.blur();
    }
  }
  function fillBlue(rate){
    if(reduced.matches||typeof intro.animate!=='function'){finish();return;}
    try{
      flood=document.createElement('div');
      flood.className='intro__flood';flood.setAttribute('aria-hidden','true');
      intro.appendChild(flood);
      // The whole field changes together. No growing polygon or diagonal seam.
      animations.push(flood.animate([{opacity:0},{opacity:1}],{
        duration:850*rate,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'
      }));
      intro.classList.add('intro--filling');
      later(function(){
        hero.classList.add('intro-blue','intro-blue-title');
        hero.classList.remove('intro-await');
        intro.classList.add('intro--blue-ready');
        flood.hidden=true;
      },850*rate);
      later(function(){hero.classList.add('intro-blue-fade');},1950*rate);
      later(function(){document.body.classList.add('intro-brand-fade');},2400*rate);
      later(finish,3150*rate);
    }catch(error){finish();}
  }
  function start(rate){
    if(running)return;
    if(reduced.matches){intro.hidden=true;hero.classList.add('in');return;}
    window.scrollTo({top:0,left:0,behavior:'instant'});
    previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    Array.from(document.body.children).forEach(function(node){
      if(node===intro||node===controls||/^(SCRIPT|STYLE|LINK)$/.test(node.tagName))return;
      inertNodes.push({node:node,value:node.inert});node.inert=true;
    });
    running=true;intro.hidden=false;
    hero.classList.add('intro-await');hero.classList.remove('intro-blue-settled');
    document.body.classList.add('intro-brand');
    [intro,hero,document.body].forEach(function(node){node.style.setProperty('--intro-rate',String(rate));});
    intro.classList.remove('intro--playing','intro--blue-ready','intro--filling');
    skip.focus({preventScroll:true});
    if(controls)controls.querySelectorAll('button').forEach(function(button){button.disabled=true;});
    try{sessionStorage.setItem(key,'seen');}catch(error){}
    function assemble(){
      if(!running||assembling||!artwork.every(function(img){return img.complete&&img.naturalWidth>0;}))return;
      assembling=true;clearTimeout(artworkTimer);
      stopWaiting();
      void intro.offsetWidth;
      intro.classList.add('intro--playing');
      later(function(){fillBlue(rate);},1800*rate);
      later(finish,5500*rate);
    }
    stopWaiting=function(){artwork.forEach(function(img){img.removeEventListener('load',assemble);});};
    artwork.forEach(function(img){img.addEventListener('load',assemble,{once:true});});
    // Do not keep a visitor waiting on a slow or missing decorative asset.
    artworkTimer=setTimeout(function(){
      stopWaiting();
      if(!assembling)finish();
    },1200);
    assemble();
  }
  skip.addEventListener('click',finish);
  document.addEventListener('keydown',function(event){
    if(!running)return;
    if(event.key==='Escape'){event.preventDefault();finish();}
    if(event.key==='Tab'){event.preventDefault();skip.focus();}
  });
  function motionChanged(){if(reduced.matches)finish();}
  if(reduced.addEventListener)reduced.addEventListener('change',motionChanged);
  else if(reduced.addListener)reduced.addListener(motionChanged);
  window.addEventListener('pagehide',finish);
  window.addEventListener('resize',function(){if(running)finish();});
  intro.querySelectorAll('img').forEach(function(img){img.addEventListener('error',finish);});
  if(review&&controls){
    controls.hidden=false;
    controls.querySelector('[data-replay]').addEventListener('click',function(){start(1);});
    controls.querySelector('[data-slow]').addEventListener('click',function(){start(3);});
    hero.classList.add('in');
  }else if(seen||location.hash){hero.classList.add('in');}
  else{start(1);}
})();
