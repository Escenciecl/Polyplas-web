/* ── Navegación del flujo guiado de corte ── */
(function(){
  function g(id){return document.getElementById(id);}

  window.corteGuideAnswer=function(choice){
    var A=g('corteGuideA'),B=g('corteGuideB'),C=g('corteGuideC');
    if(choice==='no'){
      if(window.selectCorteOption)window.selectCorteOption('none');
      if(window.pccSinCorte)window.pccSinCorte(); // avanza a paso 4 sin corte
    }else if(choice==='si'){
      if(A)A.style.display='none';
      if(B)B.style.display='';
    }else if(choice==='iguales'||choice==='distintos'){
      if(B)B.style.display='none';
      if(C)C.style.display='';
      if(window.selectCorteOption)window.selectCorteOption(choice);
      if(window.pccChooseCalcular)window.pccChooseCalcular(choice);
    }
  };

  window.corteGuideBack=function(to){
    var A=g('corteGuideA'),B=g('corteGuideB'),C=g('corteGuideC');
    if(to==='A'){
      if(B)B.style.display='none';
      if(A)A.style.display='';
      if(window.resetCorteBadge)window.resetCorteBadge();
    }else if(to==='B'){
      if(window.pccClearAll)window.pccClearAll();
      if(C)C.style.display='none';
      if(B)B.style.display='';
      if(window.resetCorteBadge)window.resetCorteBadge();
    }
  };
})();
