(function(){
  const contenedor=document.querySelector('.poly-wrapper-fijo');
  if(!contenedor)return;
  const slides=contenedor.querySelectorAll('.poly-slide-fijo');
  if(slides.length<2)return;
  let idx=0,timer=null;

  const avanzar=()=>{
    slides[idx].classList.remove('active-fijo');
    idx=(idx+1)%slides.length;
    slides[idx].classList.add('active-fijo');
  };
  const iniciar=()=>{if(!timer)timer=setInterval(avanzar,4500);};
  const pausar=()=>{clearInterval(timer);timer=null;};

  document.addEventListener('visibilitychange',()=>{
    document.hidden?pausar():iniciar();
  });

  iniciar();
})();
