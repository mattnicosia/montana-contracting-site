(function(){
  'use strict';
  var intro=document.getElementById('preloader'),hero=document.getElementById('hero');
  if(!intro||!hero)return;
  var controls=document.getElementById('introReview');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Phones skip the opening so the headline paints at once. It was the whole mobile load delay.
  var phone=window.matchMedia('(max-width: 860px)');
  var review=(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&new URLSearchParams(location.search).get('intro')==='preview';
  var place=intro.querySelector('.intro__place'),sheet=intro.querySelector('.intro__sheet'),plug=intro.querySelector('.intro__plug');
  var glass=intro.querySelector('.intro__glass'),left=intro.querySelector('.intro__piece--left'),right=intro.querySelector('.intro__piece--right');
  var photo=hero.querySelector('.hero__bg img');
  var supported=!!(place&&sheet&&plug&&glass&&left&&right)&&typeof window.requestAnimationFrame==='function';

  // The opening is five beats, in milliseconds: the M lands, waits, grows, rests as glass, and opens.
  var LAND=500,BEAT=50,GROW=600,HOLD=500,OPEN=700;
  var START=LAND+BEAT,TRAVEL=GROW+HOLD+OPEN,FULL=START+TRAVEL;
  var HEADLINE=START+GROW+HOLD+Math.round(OPEN*.62);
  // A CSS cubic-bezier as a function. It finds the curve parameter for a time by bisection, then reads the progress there.
  function curve(x1,y1,x2,y2){
    function at(a,b,u){return 3*a*u*(1-u)*(1-u)+3*b*u*u*(1-u)+u*u*u;}
    return function(time){
      if(time<=0)return 0;
      if(time>=1)return 1;
      var low=0,high=1,u=time;
      for(var i=0;i<24;i++){u=(low+high)/2;if(at(x1,x2,u)<time)low=u;else high=u;}
      return at(y1,y2,u);
    };
  }
  var SETTLE='cubic-bezier(.2,.7,.2,1)',settleEase=curve(.2,.7,.2,1),growEase=curve(.6,0,.2,1),openEase=curve(.65,0,.3,1);
  // Sizes are in the M's own units. Its path is 133 wide and 112 tall, centred on 0,0.
  var SMALL=1.3,REST_FROM=5.6,REST_TO=6,GLASS=.62;
  // The M opens around a point deep in its diagonal, where the blue reaches 16.6 units in every direction.
  var PIN_X=-3,PIN_Y=-14,PIN_ROOM=16.6;

  var running=false,timers=[],frame=0,settle,inertNodes=[],previousFocus,previousOverflow;
  var key='montana-m-intro-v3',seen=false;
  try{seen=sessionStorage.getItem(key)==='seen';}catch(error){}
  function later(fn,ms){timers.push(setTimeout(function(){if(running)fn();},ms));}
  function finish(){
    if(!running)return;
    running=false;
    var restoreFocus=intro.contains(document.activeElement);
    timers.forEach(clearTimeout);timers=[];
    window.cancelAnimationFrame(frame);
    intro.hidden=true;
    hero.classList.remove('intro-await');
    hero.classList.add('in');
    // The navigation fades in whether the opening ran out or was skipped.
    document.body.classList.add('intro-brand-fade');
    document.body.classList.remove('intro-brand');
    document.body.style.overflow=previousOverflow;
    inertNodes.forEach(function(item){item.node.inert=item.value;});inertNodes=[];
    if(controls)controls.querySelectorAll('button').forEach(function(button){button.disabled=false;});
    if(restoreFocus){
      var target=previousFocus&&previousFocus!==document.body?previousFocus:null;
      if(target)target.focus({preventScroll:true});
      else intro.blur();
    }
  }
  function part(value){return Math.min(1,Math.max(0,value));}
  // Draws the opening at a time in milliseconds. The paths are redrawn as vectors on every frame, so their edges stay sharp at any size.
  function draw(time,open){
    var l=1-settleEase(part(time/LAND)),r=1-settleEase(part((time-BEAT)/LAND));
    left.setAttribute('transform','translate('+(-26*l)+' '+(18*l)+')');left.setAttribute('opacity',part(time/(LAND*.3)));
    right.setAttribute('transform','translate('+(26*r)+' '+(-18*r)+')');right.setAttribute('opacity',part((time-BEAT)/(LAND*.3)));
    var scale=1,tint=1,after=time-START;
    if(after>GROW+HOLD){
      var opened=part((after-GROW-HOLD)/OPEN);
      scale=REST_TO+(open-REST_TO)*openEase(opened);tint=GLASS*(1-part(opened/.45));
    }else if(after>GROW){
      scale=REST_FROM+(REST_TO-REST_FROM)*(after-GROW)/HOLD;tint=GLASS;
    }else if(after>0){
      scale=1+(REST_FROM-1)*growEase(after/GROW);tint=1-(1-GLASS)*after/GROW;
    }
    // Past the rest size the M slides so that the pinned point stays where it was.
    var slip=Math.min(0,REST_TO-scale),move='translate('+slip*PIN_X+' '+slip*PIN_Y+') scale('+scale+')';
    sheet.setAttribute('transform',move);glass.setAttribute('transform',move);glass.setAttribute('opacity',tint);
    plug.style.display=time<LAND?'':'none';
  }
  function animate(rate){
    var width=intro.clientWidth||window.innerWidth,height=intro.clientHeight||window.innerHeight;
    var unit=Math.min(width/1600,height/1000)*SMALL;
    place.setAttribute('transform','translate('+width/2+' '+height/2+') scale('+unit+')');
    // Open far enough that the blue around the pinned point covers the farthest corner of the screen.
    var pinX=width/2+PIN_X*unit*REST_TO,pinY=height/2+PIN_Y*unit*REST_TO;
    var reach=Math.sqrt(Math.pow(Math.max(pinX,width-pinX),2)+Math.pow(Math.max(pinY,height-pinY),2));
    var open=Math.max(40,1.15*reach/(PIN_ROOM*unit)),began=null;
    draw(0,open);
    frame=window.requestAnimationFrame(function step(now){
      if(!running)return;
      if(began===null)began=now;
      draw((now-began)/rate,open);
      frame=window.requestAnimationFrame(step);
    });
    // The photograph eases back to rest behind the glass. It runs out by itself, so a skip never jolts it.
    if(settle)settle.cancel();
    if(photo&&typeof photo.animate==='function')settle=photo.animate([{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:(TRAVEL+400)*rate,delay:START*rate,easing:SETTLE,fill:'backwards'});
    later(function(){hero.classList.remove('intro-await');hero.classList.add('in');},HEADLINE*rate);
    later(finish,FULL*rate);
  }
  function start(rate){
    if(running)return;
    if(reduced.matches||!supported){intro.hidden=true;hero.classList.add('in');return;}
    window.scrollTo({top:0,left:0,behavior:'instant'});
    previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    Array.from(document.body.children).forEach(function(node){
      if(node===intro||node===controls||/^(SCRIPT|STYLE|LINK)$/.test(node.tagName))return;
      inertNodes.push({node:node,value:node.inert});node.inert=true;
    });
    running=true;intro.hidden=false;
    hero.classList.remove('in');hero.classList.add('intro-await');
    document.body.classList.remove('intro-brand-fade');document.body.classList.add('intro-brand');
    document.body.style.setProperty('--intro-rate',String(rate));
    intro.focus({preventScroll:true});
    if(controls)controls.querySelectorAll('button').forEach(function(button){button.disabled=true;});
    try{sessionStorage.setItem(key,'seen');}catch(error){}
    try{animate(rate);}catch(error){finish();}
  }
  var idleKeys=/^(Shift|Control|Alt|Meta|CapsLock)$/;
  document.addEventListener('keydown',function(event){
    if(!running)return;
    if(event.key==='Tab'){event.preventDefault();intro.focus();return;}
    if(!idleKeys.test(event.key))finish();
  });
  // Any click, scroll or touch ends the opening. The replay buttons in review mode are excluded.
  function skip(event){
    if(!running)return;
    if(event&&event.target&&controls&&controls.contains&&controls.contains(event.target))return;
    finish();
  }
  ['click','wheel','touchstart'].forEach(function(type){document.addEventListener(type,skip,{passive:true});});
  function motionChanged(){if(reduced.matches)finish();}
  if(reduced.addEventListener)reduced.addEventListener('change',motionChanged);
  else if(reduced.addListener)reduced.addListener(motionChanged);
  window.addEventListener('pagehide',finish);
  window.addEventListener('resize',function(){if(running)finish();});
  if(review&&controls){
    controls.hidden=false;
    controls.querySelector('[data-replay]').addEventListener('click',function(){start(1);});
    controls.querySelector('[data-slow]').addEventListener('click',function(){start(3);});
    hero.classList.add('in');
  }else if(seen||location.hash||phone.matches){hero.classList.add('in');}
  else{start(1);}
})();
