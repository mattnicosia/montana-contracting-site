/* Mobile menu for pages that use the homepage navigation (the Blog). Mirrors the burger script in index.html. */
(function(){
  var nav = document.getElementById('nav');
  if (!nav) return;
  var burger = nav.querySelector('.nav__burger'), links = nav.querySelector('.nav__links');
  function isOpen(){ return nav.classList.contains('nav--open'); }
  function setOpen(open){
    nav.classList.toggle('nav--open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.textContent = open ? 'Close' : 'Menu';
    if (open) links.querySelector('a').focus();
  }
  burger.addEventListener('click', function(){ setOpen(!isOpen()); });
  links.addEventListener('click', function(e){ if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) { setOpen(false); burger.focus(); } });
})();
