(function(){
  window.__anim=true;
  var root=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hero stagger
  var heroKids=document.querySelectorAll('.hero-text>*');
  heroKids.forEach(function(el,i){el.style.transitionDelay=(i*90)+'ms';});
  requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('ready');});});
  // Scroll reveal
  var targets=document.querySelectorAll('.section .eyebrow,.section h2,.job,.card,.edu,.band .eyebrow,.skills>div,.contact>*');
  targets.forEach(function(el){
    el.classList.add('reveal');
    var sib=el.parentElement?Array.prototype.indexOf.call(el.parentElement.children,el):0;
    el.style.transitionDelay=Math.min(sib,6)*80+'ms';
  });
  if(reduce||!('IntersectionObserver' in window)){targets.forEach(function(el){el.classList.add('in');});}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    targets.forEach(function(el){io.observe(el);});
  }
  // Clear reveal delays after entry so hover stays snappy
  document.addEventListener('transitionend',function(e){if(e.target.classList&&e.target.classList.contains('in'))e.target.style.transitionDelay='';});
  // Header shadow + active section
  var nav=document.querySelector('.nav');
  var onScroll=function(){nav.classList.toggle('scrolled',window.scrollY>8);};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var links={};document.querySelectorAll('.nav nav a[href^="#"]').forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){var a=links[e.target.id];if(!a)return;if(e.isIntersecting){Object.keys(links).forEach(function(k){links[k].classList.remove('active');});a.classList.add('active');}});},{rootMargin:'-45% 0px -50% 0px'});
    document.querySelectorAll('main section[id]').forEach(function(s){so.observe(s);});
  }
  // Count-up for the hero stats
  if(!reduce){
    document.querySelectorAll('.stats dt').forEach(function(dt){
      var end=parseInt(dt.textContent,10);if(!end)return;var t0=null;dt.textContent='0';
      function step(t){if(!t0)t0=t;var p=Math.min((t-t0)/1100,1);dt.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step);}
      setTimeout(function(){requestAnimationFrame(step);},500);
    });
  }
})();
