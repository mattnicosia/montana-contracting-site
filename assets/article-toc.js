/* Highlights the section being read in the "In this article" list. The links work without it. */
(function(){
  var links = Array.prototype.slice.call(document.querySelectorAll('.art__toc a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  links.forEach(function(a){ byId[decodeURIComponent(a.hash.slice(1))] = a; });
  var heads = links.map(function(a){ return document.getElementById(decodeURIComponent(a.hash.slice(1))); }).filter(Boolean);
  function mark(id){ links.forEach(function(a){ a.removeAttribute('aria-current'); }); if (byId[id]) byId[id].setAttribute('aria-current','true'); }
  var visible = {};
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ visible[e.target.id] = e.isIntersecting; });
    var current = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top < window.innerHeight * 0.35) current = heads[i].id;
    }
    mark(current || heads[0].id);
  }, {rootMargin:'-80px 0px -60% 0px', threshold:[0,1]});
  heads.forEach(function(h){ io.observe(h); });
  document.querySelectorAll('.art__toc-m a').forEach(function(a){ a.addEventListener('click', function(){ a.closest('details').open = false; }); });
})();
