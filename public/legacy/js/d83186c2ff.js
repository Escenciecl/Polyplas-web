(function(){
  var DESTINOS={
    policarbonato: "https://polyplas.cl/categoria-producto/policarbonato-compacto/",
    petg:          "https://polyplas.cl/categoria-producto/planchas-petg/",
    pet:           "https://polyplas.cl/categoria-producto/planchas-pet/",
    cupulas:       "https://polyplas.cl/categoria-producto/cupulas/",
    receptaculos:  "https://polyplas.cl/categoria-producto/receptaculos/",
    tinas:         "https://polyplas.cl/categoria-producto/tinas-de-hidromasaje/",
    acrilico:      "https://polyplas.cl/categoria-producto/planchas-acrilico/",
    guia_acrilico: "https://polyplas.cl/guia-de-acrilicos/",
    guia_tina:     "https://polyplas.cl/guia-para-comprar-tina-de-hidromasaje-en-chile/",
    blog:          "https://polyplas.cl/blog/"
  };
  var REGLAS=[
    {destino:"policarbonato", keys:["policarbonato","policarbonato compacto"]},
    {destino:"petg",          keys:["petg"]},
    {destino:"pet",           keys:["pet"]},
    {destino:"cupulas",       keys:["cupula","cupulas","domo","cubierta de techo"]},
    {destino:"receptaculos",  keys:["receptaculo","receptaculos","plato de ducha","mampara","base de ducha"]},
    {destino:"tinas",         keys:["tina","tinas","hidromasaje","jacuzzi","jacuzzy","jacuzy","spa","banera"]},
    {destino:"acrilico",      keys:["acrilico","acrilica","plancha","planchas","lamina","laminas","pmma","plexiglas","plexiglass","metacrilato"]}
  ];
  var SUGERENCIAS=[
    {label:"Planchas de Acrílico",      url:DESTINOS.acrilico,      tag:"Categoría"},
    {label:"Cúpulas de Acrílico",       url:DESTINOS.cupulas,       tag:"Categoría"},
    {label:"Tinas de Hidromasaje",      url:DESTINOS.tinas,         tag:"Categoría"},
    {label:"Receptáculos de Ducha",     url:DESTINOS.receptaculos,  tag:"Categoría"},
    {label:"Policarbonato Compacto",    url:DESTINOS.policarbonato, tag:"Categoría"},
    {label:"Planchas PET",              url:DESTINOS.pet,           tag:"Categoría"},
    {label:"Planchas PETG",             url:DESTINOS.petg,          tag:"Categoría"},
    {label:"Guía de Acrílicos",         url:DESTINOS.guia_acrilico, tag:"Guía"},
    {label:"Guía para comprar tu Tina", url:DESTINOS.guia_tina,     tag:"Guía"},
    {label:"Blog",                      url:DESTINOS.blog,          tag:"Blog"}
  ];

  function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/s+/g," ").trim();}

  function resolver(consulta){
    var q=norm(consulta);if(!q)return null;
    for(var i=0;i<REGLAS.length;i++){for(var j=0;j<REGLAS[i].keys.length;j++){if(q.indexOf(REGLAS[i].keys[j])!==-1)return DESTINOS[REGLAS[i].destino];}}
    return DESTINOS.acrilico;
  }

  function huboMatch(consulta){
    var q=norm(consulta);
    for(var i=0;i<REGLAS.length-1;i++){for(var j=0;j<REGLAS[i].keys.length;j++){if(q.indexOf(REGLAS[i].keys[j])!==-1)return true;}}
    var ult=REGLAS[REGLAS.length-1];
    for(var k=0;k<ult.keys.length;k++){if(q.indexOf(ult.keys[k])!==-1)return true;}
    return false;
  }

  function trackBusqueda(termino,destino,match){
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push({event:"busqueda_interna",search_term:(termino||"").trim().toLowerCase(),search_destino:destino,search_match:match?"si":"no_fallback"});
  }

  var form=document.getElementById("polySearchForm");
  var input=document.getElementById("poly-search-field");
  var list=document.getElementById("polySuggestions");
  var box=form.parentElement;
  var activeIdx=-1;

  function openSugs(){list.classList.add("open");input.setAttribute("aria-expanded","true");}
  function closeSugs(){list.classList.remove("open");input.setAttribute("aria-expanded","false");input.removeAttribute("aria-activedescendant");activeIdx=-1;}

  function renderSugerencias(filtro){
    var f=norm(filtro);var items;
    if(!f){items=SUGERENCIAS;}else{
      var labelMatches=SUGERENCIAS.filter(function(s){return norm(s.label).indexOf(f)!==-1;});
      var reglasUrl=null;
      for(var i=0;i<REGLAS.length;i++){for(var j=0;j<REGLAS[i].keys.length;j++){if(f.indexOf(REGLAS[i].keys[j])!==-1||REGLAS[i].keys[j].indexOf(f)!==-1){reglasUrl=DESTINOS[REGLAS[i].destino];break;}}if(reglasUrl)break;}
      items=labelMatches.slice();
      if(reglasUrl){var yaIncluido=false;for(var k=0;k<items.length;k++){if(items[k].url===reglasUrl){yaIncluido=true;break;}}if(!yaIncluido){for(var m=0;m<SUGERENCIAS.length;m++){if(SUGERENCIAS[m].url===reglasUrl){items.unshift(SUGERENCIAS[m]);break;}}}}
      if(items.length===0)items=SUGERENCIAS;
    }
    list.innerHTML=items.map(function(s,idx){return'<li role="option" id="poly-sug-'+idx+'" data-url="'+s.url+'">'+s.label+'<span class="poly-sug-tag">'+s.tag+'</span></li>';}).join("");
    activeIdx=-1;openSugs();
  }

  input.addEventListener("input",function(){renderSugerencias(input.value);});
  input.addEventListener("focus",function(){renderSugerencias(input.value);});

  list.addEventListener("click",function(e){
    var li=e.target.closest("li");
    if(li){var url=li.getAttribute("data-url");trackBusqueda(input.value,url,true);window.location.href=url;}
  });

  input.addEventListener("keydown",function(e){
    if(!list.classList.contains("open"))return;
    var lis=Array.prototype.slice.call(list.querySelectorAll("li"));if(!lis.length)return;
    if(e.key==="ArrowDown"){e.preventDefault();activeIdx=Math.min(activeIdx+1,lis.length-1);}
    else if(e.key==="ArrowUp"){e.preventDefault();activeIdx=Math.max(activeIdx-1,0);}
    else if(e.key==="Escape"){closeSugs();return;}
    else return;
    lis.forEach(function(li,i){li.classList.toggle("active",i===activeIdx);if(i===activeIdx){li.scrollIntoView({block:"nearest"});input.setAttribute("aria-activedescendant","poly-sug-"+i);}});
  });

  form.addEventListener("submit",function(e){
    e.preventDefault();var lis=list.querySelectorAll("li");var termino=input.value;
    if(activeIdx>=0&&lis[activeIdx]){var url=lis[activeIdx].getAttribute("data-url");trackBusqueda(termino,url,true);window.location.href=url;return;}
    var destino=resolver(termino);trackBusqueda(termino,destino,huboMatch(termino));if(destino)window.location.href=destino;
  });

  document.addEventListener("pointerdown",function(e){
    if(!box.contains(e.target))closeSugs();
  },{passive:true});

  document.addEventListener("click",function(e){
    if(window.innerWidth>992)return;
    var btn=box.querySelector(".poly-search-btn");
    if(btn&&btn.contains(e.target)&&!box.classList.contains("is-active")){
      e.preventDefault();
      box.classList.add("is-active");
      setTimeout(function(){input.focus();},50);
    }else if(!box.contains(e.target)){
      box.classList.remove("is-active");
    }
  });
})();
