(function(){
  var menu=document.getElementById("polyMenu");
  var btn=document.getElementById("polyBtn");

  btn.addEventListener("click",function(){
    var isActive=menu.classList.toggle("is-active");
    btn.setAttribute("aria-expanded",String(isActive));
  });

  document.querySelectorAll(".poly-submenu-toggle").forEach(function(toggle){
    toggle.addEventListener("click",function(e){
      if(window.innerWidth<=992){
        e.preventDefault();
        this.parentElement.classList.toggle("submenu-active");
      }
    });
  });
})();
