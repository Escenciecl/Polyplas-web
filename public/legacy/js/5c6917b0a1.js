(function(){
  var N=0,lastRes=null,lastPieces=null,lastSvgs=null,blocked=false,curMode=null,paso4Ready=false;
  var K=3;
  var H=document.documentElement;
  function g(id){return document.getElementById(id);}

  function sheet(){
    var s=window._ppState;if(!s||!s.dim)return null;
    var p=s.dim.split('x').map(Number);
    if(p.length!==2||isNaN(p[0]))return null;
    // Siempre usar orientación portrait (plancha parada: menor dim = ancho)
    var w=Math.min(p[0],p[1]),h=Math.max(p[0],p[1]);
    return{w:w,h:h};
  }

  /* ── MaxRects ── */
  function pack(pieces,sw,sh){
    var all=[];pieces.forEach(function(p){for(var i=0;i<p.qty;i++)all.push({w:p.w,h:p.h});});
    all.sort(function(a,b){return Math.max(b.w,b.h)-Math.max(a.w,a.h);});
    var sheets=[],unp=[];
    all.forEach(function(pc){
      var ok=false;
      for(var i=0;i<sheets.length&&!ok;i++)ok=fit(sheets[i],pc,sw,sh);
      if(!ok){var ns={free:[{x:0,y:0,w:sw,h:sh}],placed:[]};if(fit(ns,pc,sw,sh))sheets.push(ns);else unp.push(pc);}
    });
    return{sheets:sheets,unp:unp};
  }
  function fit(sheet,pc,sw,sh){
    var oris=pc.w!==pc.h?[{w:pc.w,h:pc.h},{w:pc.h,h:pc.w}]:[{w:pc.w,h:pc.h}];
    var best=null,bs=Infinity;
    sheet.free.forEach(function(r){oris.forEach(function(o){
      var pw=o.w+K,ph=o.h+K;
      if(r.w>=pw&&r.h>=ph){var s=Math.min(r.w-pw,r.h-ph);if(s<bs){bs=s;best={r:r,o:o};}}
    });});
    if(!best)return false;
    var x=best.r.x,y=best.r.y,pw=best.o.w,ph=best.o.h;
    sheet.placed.push({x:x,y:y,W:pw,H:ph});
    var nf=[];
    sheet.free.forEach(function(r){
      if(x+pw+K>r.x&&x<r.x+r.w&&y+ph+K>r.y&&y<r.y+r.h){
        if(r.x+r.w>x+pw+K)nf.push({x:x+pw+K,y:r.y,w:r.x+r.w-(x+pw+K),h:r.h});
        if(r.y+r.h>y+ph+K)nf.push({x:r.x,y:y+ph+K,w:r.w,h:r.y+r.h-(y+ph+K)});
      }else nf.push(r);
    });
    sheet.free=nf.filter(function(r){return r.w>K&&r.h>K;});
    return true;
  }

  /* ── Guillotine Bin Packing — Best Short Side Fit + Longer Axis Split ──
     Produce cortes rectos de borde a borde, igual a una sierra de panel real.
     Usado en optimizadores profesionales (cutlistoptimizer, etc.) ── */
  function guillotinePack(pieces,sw,sh){
    var sorts=[
      function(a,b){return(b.w*b.h)-(a.w*a.h);},
      function(a,b){return Math.max(b.w,b.h)-Math.max(a.w,a.h);},
      function(a,b){return(b.w+b.h)-(a.w+a.h);},
      function(a,b){return b.w-a.w;},
      function(a,b){return b.h-a.h;}
    ];
    // Generar combinaciones de rotación: probar cada tipo apaisado rotado individualmente
    var rotCombos=[[]];
    pieces.forEach(function(p,pi){
      if(p.w>p.h){
        var newCombos=[];
        rotCombos.forEach(function(c){newCombos.push(c);newCombos.push(c.concat([pi]));});
        rotCombos=newCombos;
      }
    });
    var best=null,bestKey=null;
    rotCombos.forEach(function(rotSet){
      var rotMap={};rotSet.forEach(function(i){rotMap[i]=true;});
      sorts.forEach(function(sortFn){
        [false,true].forEach(function(preferH){
          var all=[];
          pieces.forEach(function(p,pi){
            var doRot=!!rotMap[pi],pw=doRot?p.h:p.w,ph=doRot?p.w:p.h;
            for(var i=0;i<p.qty;i++)all.push({w:pw,h:ph,fixed:doRot,ow:p.w,oh:p.h});
          });
          all.sort(sortFn);
          var res=gPackOrder(all,sw,sh,preferH);
          var colCount=0,minUtil=1;
          res.sheets.forEach(function(s){
            var xs={};s.placed.forEach(function(p){xs[p.x]=1;});colCount+=Object.keys(xs).length;
            Object.keys(xs).forEach(function(cx){
              cx=Number(cx);var bw=0,area=0;
              s.placed.forEach(function(p){if(p.x===cx){if(p.W>bw)bw=p.W;area+=p.W*p.H;}});
              var u=area/(bw*sh);if(u<minUtil)minUtil=u;
            });
          });
          var key=[res.sheets.length,res.unp.length,colCount,-minUtil];
          if(!bestKey||key[0]<bestKey[0]||(key[0]===bestKey[0]&&key[1]<bestKey[1])||(key[0]===bestKey[0]&&key[1]===bestKey[1]&&key[2]<bestKey[2])||(key[0]===bestKey[0]&&key[1]===bestKey[1]&&key[2]===bestKey[2]&&key[3]<bestKey[3])){best=res;bestKey=key;}
        });
      });
    });
    return best;
  }
  function gPackOrder(all,sw,sh,preferH){
    var sheets=[],unp=[];
    all.forEach(function(pc){
      var placed=false;
      for(var i=0;i<sheets.length&&!placed;i++)placed=gFit(sheets[i],pc,preferH,sh);
      if(!placed){
        var ns={free:[{x:0,y:0,w:sw,h:sh}],placed:[]};
        if(gFit(ns,pc,preferH,sh))sheets.push(ns);else unp.push(pc);
      }
    });
    return{sheets:sheets,unp:unp};
  }
  function gFit(sheet,pc,preferH,sh){
    var bestO=null,bsO=Infinity,bestR=null,bsR=Infinity;
    for(var ri=0;ri<sheet.free.length;ri++){
      var r=sheet.free[ri];
      var ypen=1+2*(r.y/sh);
      if(r.w>=pc.w&&r.h>=pc.h){var s=Math.min(r.w-pc.w,r.h-pc.h)*ypen;if(s<bsO){bsO=s;bestO={r:r,o:{w:pc.w,h:pc.h},ri:ri};}}
      if(!pc.fixed&&pc.w!==pc.h){ // no rotar si la orientación fue fijada externamente
        if(r.w>=pc.h&&r.h>=pc.w){var sr=Math.min(r.w-pc.h,r.h-pc.w)*ypen;if(sr<bsR){bsR=sr;bestR={r:r,o:{w:pc.h,h:pc.w},ri:ri};}}
      }
    }
    var best=bestO||bestR; // rotada solo si original no cabe en ningún espacio libre
    if(!best)return false;
    var r=best.r,pw=best.o.w,ph=best.o.h;
    sheet.placed.push({x:r.x,y:r.y,W:pw,H:ph,uw:pc.w,uh:pc.h});
    sheet.free.splice(best.ri,1);
    var rightW=r.w-pw-K,topH=r.h-ph-K;
    var splitH=(preferH?topH>=rightW:rightW>=topH);
    if(splitH){
      if(rightW>K)sheet.free.push({x:r.x+pw+K,y:r.y,     w:rightW,h:r.h});
      if(topH  >K)sheet.free.push({x:r.x,     y:r.y+ph+K,w:pw,    h:topH});
    }else{
      if(topH  >K)sheet.free.push({x:r.x,     y:r.y+ph+K,w:r.w,   h:topH});
      if(rightW>K)sheet.free.push({x:r.x+pw+K,y:r.y,     w:rightW,h:ph});
    }
    return true;
  }

  /* ── Grid (cortes iguales rectos) ── */
  function packGrid(pw,ph,qty,sw,sh){
    var best=null;
    // Intentar orientación original primero; usar rotada solo si original no cabe
    var cols0=Math.floor((sw+K)/(pw+K)),rows0=Math.floor((sh+K)/(ph+K));
    if(cols0>=1&&rows0>=1){
      best={w:pw,h:ph,cols:cols0,rows:rows0,pps:cols0*rows0};
    } else if(pw!==ph){
      var colsR=Math.floor((sw+K)/(ph+K)),rowsR=Math.floor((sh+K)/(pw+K));
      if(colsR>=1&&rowsR>=1)best={w:ph,h:pw,cols:colsR,rows:rowsR,pps:colsR*rowsR};
    }
    if(!best)return{sheets:[],unp:Array(qty).fill(0).map(function(){return{w:pw,h:ph};}),ow:pw,oh:ph};
    var sheets=[],rem=qty;
    while(rem>0){
      var count=Math.min(rem,best.pps);
      var placed=[];
      for(var i=0;i<count;i++){
        var col=i%best.cols,row=Math.floor(i/best.cols);
        placed.push({x:col*(best.w+K),y:row*(best.h+K),W:best.w,H:best.h,uw:pw,uh:ph});
      }
      sheets.push({placed:placed});
      rem-=count;
    }
    return{sheets:sheets,unp:[],ow:best.w,oh:best.h};
  }

  /* ── SVG ── */
  var PAL=['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];
  function cmap(pieces){
    var m={},i=0;
    pieces.forEach(function(p){var k=p.w+'x'+p.h;if(!m[k]){m[k]=PAL[i%PAL.length];i++;}m[p.h+'x'+p.w]=m[k];});
    return m;
  }
  function svgSheet(sh,sw,shh,cm){
    var fsH=Math.max(20,Math.round(Math.min(sw,shh)*0.032));
    var LPAD=Math.max(64,Math.round(fsH*2.4));
    var TPAD=Math.max(36,Math.round(fsH*1.1));
    var RPAD=Math.max(48,Math.round(fsH*2.0));
    var vw=sw+LPAD+RPAD,vh=shh+TPAD+12;
    var s='<svg viewBox="0 0 '+vw+' '+vh+'" style="width:100%;height:auto;display:block;" xmlns="http://www.w3.org/2000/svg">';
    // Fondo de la plancha (áreas de desperdicio quedan en gris)
    s+='<rect x="'+LPAD+'" y="'+TPAD+'" width="'+sw+'" height="'+shh+'" fill="#dce3ee" rx="2" stroke="#555" stroke-width="2.5"/>';
    // Detectar columnas (posiciones x únicas de piezas colocadas)
    var colXs=[];
    sh.placed.forEach(function(p){if(colXs.indexOf(p.x)<0)colXs.push(p.x);});
    colXs.sort(function(a,b){return a-b;});
    // Construir bandas de columnas incluyendo desperdicios
    var colBands=[],prevX=0;
    colXs.forEach(function(cx){
      if(cx>prevX+K+0.5)colBands.push({x:prevX,w:cx-prevX,waste:true});
      var bw=0;sh.placed.forEach(function(p){if(p.x===cx&&p.W>bw)bw=p.W;});
      colBands.push({x:cx,w:bw,waste:false});
      prevX=cx+bw;
    });
    if(prevX<sw-K-0.5)colBands.push({x:prevX,w:sw-prevX,waste:true});
    // Etiquetas de ancho de columna arriba (÷10 para mostrar cm)
    colBands.forEach(function(band){
      var cx=LPAD+band.x+band.w/2;
      s+='<text x="'+cx+'" y="'+(TPAD-7)+'" text-anchor="middle" font-family="Arial" font-size="'+fsH+'" fill="'+(band.waste?'#9baac4':'#374151')+'" font-weight="'+(band.waste?'400':'600')+'">'+(band.w%10===0?band.w/10:(band.w/10).toFixed(1))+'</text>';
    });
    // Etiquetas de desperdicio superior por columna (÷10 para mostrar cm)
    colXs.forEach(function(cx){
      var pInCol=[];sh.placed.forEach(function(p){if(p.x===cx)pInCol.push(p);});
      if(!pInCol.length)return;
      var topY=pInCol.reduce(function(m,p){return Math.min(m,p.y);},Infinity);
      if(topY>K+1){
        s+='<text x="'+(LPAD-8)+'" y="'+(TPAD+topY/2)+'" text-anchor="end" dominant-baseline="middle" font-family="Arial" font-size="'+fsH+'" fill="#9baac4">'+Math.round(topY/10)+'</text>';
      }
    });
    // Dibujar piezas
    sh.placed.forEach(function(p){
      var col=cm[p.W+'x'+p.H]||'#3b82f6';
      var px=LPAD+p.x,py=TPAD+p.y;
      var fsP=Math.max(13,Math.round(Math.min(p.W,p.H)*0.16));
      s+='<rect x="'+px+'" y="'+py+'" width="'+p.W+'" height="'+p.H+'" fill="'+col+'" fill-opacity="0.22" stroke="'+col+'" stroke-opacity="0.85" stroke-width="1.5" rx="1"/>';
      // Ancho arriba (÷10 para mostrar cm)
      if(p.W>55&&p.H>42){
        s+='<text x="'+(px+p.W/2)+'" y="'+(py+fsP+3)+'" text-anchor="middle" font-family="Arial" font-size="'+fsP+'" fill="#1a1a2e" font-weight="700">'+(p.W%10===0?p.W/10:(p.W/10).toFixed(1))+'</text>';
      }
      // Alto rotado -90° (÷10 para mostrar cm)
      if(p.H>55&&p.W>38){
        var mx=px+fsP/2+3,my=py+p.H/2;
        s+='<text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="'+fsP+'" fill="#1a1a2e" font-weight="700" transform="rotate(-90,'+mx+','+my+')">'+(p.H%10===0?p.H/10:(p.H/10).toFixed(1))+'</text>';
      }
    });
    // Borde de la plancha encima de todo
    s+='<rect x="'+LPAD+'" y="'+TPAD+'" width="'+sw+'" height="'+shh+'" fill="none" stroke="#444" stroke-width="2"/>';
    // Indicador rojo de altura total a la derecha (÷10 para mostrar cm)
    var rix=LPAD+sw+Math.round(RPAD*0.35),rly=TPAD+shh/2;
    s+='<line x1="'+rix+'" y1="'+TPAD+'" x2="'+rix+'" y2="'+(TPAD+shh)+'" stroke="#dc2626" stroke-width="1.5"/>';
    s+='<line x1="'+(rix-5)+'" y1="'+TPAD+'" x2="'+(rix+5)+'" y2="'+TPAD+'" stroke="#dc2626" stroke-width="1.5"/>';
    s+='<line x1="'+(rix-5)+'" y1="'+(TPAD+shh)+'" x2="'+(rix+5)+'" y2="'+(TPAD+shh)+'" stroke="#dc2626" stroke-width="1.5"/>';
    s+='<text x="'+(rix+fsH*0.7)+'" y="'+rly+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="'+fsH+'" fill="#dc2626" font-weight="700" transform="rotate(90,'+(rix+fsH*0.7)+','+rly+')">'+Math.round(shh/10)+'</text>';
    return s+'</svg>';
  }

  /* ── Filas de la calculadora ── */
  window.pccAdd=function(w,h,q){
    N++;var id=N,list=g('pccList');if(!list)return;
    var row=document.createElement('div');row.className='pcc-row';row.id='pccR_'+id;
    row.innerHTML=
      '<div><span class="pcc-lbl">Ancho cm</span><input class="pcc-in" type="number" id="pccW_'+id+'" min="30" step="1" value="'+(w||'')+'" placeholder="ej: 30" oninput="pccV('+id+',this,0)"><div class="pcc-tip" id="pccT_'+id+'_0"></div></div>'+
      '<div><span class="pcc-lbl">Alto cm</span><input class="pcc-in" type="number" id="pccH_'+id+'" min="30" step="1" value="'+(h||'')+'" placeholder="ej: 20" oninput="pccV('+id+',this,1)"><div class="pcc-tip" id="pccT_'+id+'_1"></div></div>'+
      '<div><span class="pcc-lbl">Cant.</span><input class="pcc-in" type="number" id="pccQ_'+id+'" min="1" value="'+(q||1)+'"></div>'+
      '<button class="pcc-x" type="button" onclick="pccDel('+id+')">&#215;</button>';
    list.appendChild(row);
  };
  window.pccDel=function(id){var el=g('pccR_'+id);if(el)el.remove();};
  window.pccV=function(id,el,axis){
    var sh=sheet();if(!sh)return;
    var val=parseFloat(el.value),max=axis===0?Math.floor(sh.w/10):Math.floor(sh.h/10);
    var tooLarge=val>0&&val>max,tooSmall=val>0&&val<30,bad=tooLarge||tooSmall;
    el.classList.toggle('err',bad);
    var tip=g('pccT_'+id+'_'+axis);
    var msg=tooLarge?'Máx '+max+' cm':tooSmall?'Mín 30 cm':'';
    if(tip){tip.textContent=msg;tip.style.display=msg?'block':'none';}
    // Limpiar resultados obsoletos cuando el usuario edita los inputs
    var resEl=g('pccRes');if(resEl&&resEl.innerHTML)resEl.innerHTML='';
    lastRes=null;lastPieces=null;
  };

  /* ── Calcular ── */
  window.pccCalc=function(){
    var sh=sheet();
    if(!sh){alert('Completa la seleccion de plancha primero.');return;}
    // Bug 3: bloquear si algún input tiene error de validación
    var errInputs=document.querySelectorAll('#pccList .pcc-in.err');
    if(errInputs.length){
      var resEl2=g('pccRes');
      if(resEl2)resEl2.innerHTML='<div class="pcc-al al-err">&#9888; Corrige los valores marcados en rojo antes de calcular.</div>';
      return;
    }
    var rows=document.querySelectorAll('#pccList .pcc-row'),pieces=[];
    rows.forEach(function(row){
      var id=row.id.replace('pccR_','');
      var w=parseFloat((g('pccW_'+id)||{}).value),h=parseFloat((g('pccH_'+id)||{}).value),q=parseInt((g('pccQ_'+id)||{}).value,10);
      if(w>=30&&h>=30&&q>=1)pieces.push({w:w*10,h:h*10,qty:q});
    });
    if(!pieces.length){
      var resEl3=g('pccRes');
      if(resEl3)resEl3.innerHTML='<div class="pcc-al al-err">&#9888; Agrega al menos una pieza (mínimo 30&times;30 cm).</div>';
      return;
    }
    var allSameNow=pieces.length===1||(function(){var k0=pieces[0].w+'x'+pieces[0].h;return pieces.every(function(p){return p.w+'x'+p.h===k0;});}());
    var res;
    if(curMode==='iguales'&&allSameNow){
      var totQty=pieces.reduce(function(s,p){return s+p.qty;},0);
      // Bug 5: preservar orientación original del usuario (no usar res.ow/res.oh que pueden estar rotados)
      var origW=pieces[0].w,origH=pieces[0].h;
      res=packGrid(origW,origH,totQty,sh.w,sh.h);
      pieces=[{w:origW,h:origH,qty:totQty}];
    }else{
      res=guillotinePack(pieces,sh.w,sh.h);
    }
    lastRes=res;lastPieces=pieces;lastSvgs=null;
    var tot=pieces.reduce(function(s,p){return s+p.qty;},0);
    var placed=tot-res.unp.length;
    var used=0;res.sheets.forEach(function(s){s.placed.forEach(function(p){used+=p.W*p.H;});});
    var waste=res.sheets.length>0?(100-used/(sh.w*sh.h*res.sheets.length)*100):0;
    var wc=waste<20?'wl':waste<40?'wm':'wh';
    var Nsh=res.sheets.length;
    var html='<div class="pcc-stats">'+
      '<div class="pcc-stat"><div class="n">'+Nsh+'</div><div class="l">Planchas</div></div>'+
      '<div class="pcc-stat"><div class="n">'+placed+'/'+tot+'</div><div class="l">Piezas</div></div>'+
      '<div class="pcc-stat"><div class="n '+wc+'">'+waste.toFixed(0)+'%</div><div class="l">Desperdicio</div></div>'+
    '</div>';
    if(res.unp.length)html+='<div class="pcc-al al-err">&#9888; '+res.unp.length+' pieza(s) superan el tamano de la plancha.</div>';
    html+=waste<20?'<div class="pcc-al al-ok">&#10003; Excelente aprovechamiento &mdash; '+waste.toFixed(0)+'% desperdicio</div>':
      waste<40?'<div class="pcc-al al-warn">&#9888; '+waste.toFixed(0)+'% de desperdicio.</div>':
      '<div class="pcc-al al-err">&#9888; '+waste.toFixed(0)+'% desperdicio alto. Revisa las medidas.</div>';
    if(Nsh>0){
      var cm=cmap(pieces);
      var seen={},ley='<div class="pcc-ley">';
      pieces.forEach(function(p){var k=p.w+'x'+p.h;if(!seen[k]){seen[k]=true;ley+='<span><i style="background:'+cm[k]+'"></i>'+p.w/10+' x '+p.h/10+' cm</span>';}});
      ley+='</div>';
      lastSvgs=res.sheets.map(function(s){return svgSheet(s,sh.w,sh.h,cm);});
      var DIAG_PREVIEW=2;
      html+='<div class="pcc-viz-lbl">Como quedan en la plancha</div>'+ley;
      res.sheets.forEach(function(s,idx){
        if(idx===DIAG_PREVIEW&&Nsh>DIAG_PREVIEW+1)html+='<details class="pcc-more-sheets"><summary>Ver '+(Nsh-DIAG_PREVIEW)+' plancha'+(Nsh-DIAG_PREVIEW===1?'':'s')+' más</summary>';
        html+='<div class="pcc-svg-w pcc-in-anim">'+
          (Nsh>1?'<div class="pcc-svg-lbl">Plancha '+(idx+1)+'</div>':'')+
          svgSheet(s,sh.w,sh.h,cm)+'</div>';
        if(idx===Nsh-1&&Nsh>DIAG_PREVIEW+1)html+='</details>';
      });
      var curQty=(window._ppState&&window._ppState.qty)||1;
      if(Nsh>curQty)html+='<div class="pcc-al al-info">&#8593; Necesitas <strong>'+Nsh+' planchas</strong>. La cantidad se actualiza al confirmar.</div>';
      var allSame=pieces.length===1||(function(){var k0=pieces[0].w+'x'+pieces[0].h;return pieces.every(function(p){return p.w+'x'+p.h===k0;});}());
      html+='<div style="display:flex;align-items:flex-start;gap:10px;background:#f0f7f2;border:1px solid #b7d9c4;border-radius:4px;padding:11px 13px;margin-bottom:12px;font-family:Arial,sans-serif;">'+
        '<span style="font-size:1rem;color:#1B7A3E;flex-shrink:0;margin-top:1px;"></span>'+
        '<span style="font-size:0.75rem;color:#1E2226;line-height:1.5;"><strong style="display:block;margin-bottom:2px;">El sobrante de plancha se incluye en tu pedido</strong>Como se cobra la plancha completa, el material que sobre después del corte siempre se entrega junto con tus piezas.</span>'+
        '</div>'+
        '<button class="pcc-btn-ok pcc-in-anim" type="button" onclick="pccOk()">&#10003;&nbsp; Ver valor — '+Nsh+(Nsh===1?' plancha':' planchas')+' con cortes &rarr;</button>'+
        (function(){
          var surchargeLabel='Corte +10% por distintas medidas';
          if(!allSame){
            var st=window._ppState;
            var pp=st&&typeof prices!=='undefined'&&prices[st.tipo]&&prices[st.tipo][st.dim]&&prices[st.tipo][st.dim][st.color]&&prices[st.tipo][st.dim][st.color][st.esp];
            if(pp&&Nsh>0){
              var recargo=Math.round(Math.round(pp/1.19)*Nsh*0.10*1.19);
              surchargeLabel='Corte distintas medidas +10% (≈ '+fmt(recargo)+')';
            }
          }
          return '<div style="font-size:0.7rem;color:#6b7280;text-align:center;margin-top:5px;font-family:Arial,sans-serif;">'+(allSame?'Corte gratis incluido':surchargeLabel)+'</div>';
        })();
    }
    var resEl=g('pccRes');if(!resEl)return;
    resEl.innerHTML=html;
    resEl.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  /* ── Confirmar desde calculadora ── */
  window.pccOk=function(){
    if(!lastRes||!lastPieces)return;
    var res=lastRes,pieces=lastPieces,Nsh=res.sheets.length;
    var allSame=pieces.length===1||(function(){var k0=pieces[0].w+'x'+pieces[0].h;return pieces.every(function(p){return p.w+'x'+p.h===k0;});}());
    var mode=allSame?'iguales':'distintos';
    var curQty=(window._ppState&&window._ppState.qty)||1;
    if(Nsh!==curQty&&window.changeQty)window.changeQty(Nsh-curQty);
    blocked=true;
    if(window.selectCorteOption)window.selectCorteOption(mode);
    setTimeout(function(){blocked=false;},500);
    setTimeout(function(){
      if(mode==='iguales'){
        var aEl=g('igualSharedAncho'),hEl=g('igualSharedAlto'),qEl=g('igualSharedQty');
        if(aEl&&hEl){aEl.value=pieces[0].w/10;hEl.value=pieces[0].h/10;
          if(window.onIgualSharedInput){window.onIgualSharedInput('ancho',aEl);window.onIgualSharedInput('alto',hEl);}
        }
        if(qEl&&pieces[0].qty){qEl.value=pieces[0].qty;if(window.onIgualSharedInput)window.onIgualSharedInput('qty',qEl);}
      }else{
        res.sheets.forEach(function(s,pi){
          var counts={};
          s.placed.forEach(function(p){var k=p.W+'_'+p.H;if(!counts[k])counts[k]={a:p.W,h:p.H,qty:0};counts[k].qty++;});
          var meds=Object.keys(counts).map(function(k){return counts[k];});
          meds.forEach(function(med,mi){
            if(mi>0&&window.addMedidaToPlank)window.addMedidaToPlank(pi);
            setTimeout((function(pii,mii,m){return function(){
              var aEl=g('msAncho_'+pii+'_'+mii),hEl=g('msAlto_'+pii+'_'+mii);
              if(aEl){aEl.value=Math.round(m.a/10);if(window.onMedidaSetInput)window.onMedidaSetInput(pii,mii,'ancho',aEl);}
              if(hEl){hEl.value=Math.round(m.h/10);if(window.onMedidaSetInput)window.onMedidaSetInput(pii,mii,'alto',hEl);}
              // Guardar qty en el estado para que llegue al CRM
              if(corteState.medidaSets[pii]&&corteState.medidaSets[pii].medidas[mii])
                corteState.medidaSets[pii].medidas[mii].qty=m.qty;
            };})(pi,mi,med),(mi+1)*120);
          });
        });
      }
      var resEl=g('pccRes');if(!resEl)return;
      var prev=g('pccDone');if(prev)prev.remove();
      resEl.insertAdjacentHTML('beforeend',
        '<div class="pcc-done pcc-in-anim" id="pccDone">'+
          '<div class="ico">&#10003;</div>'+
          '<div class="tit">'+Nsh+(Nsh===1?' plancha lista':' planchas listas')+' con corte</div>'+
          '<div class="sub">'+(mode==='iguales'?'Corte gratis incluido':'Cortes distintos +10%')+'</div>'+
          '<button class="ed" type="button" onclick="pccEdit()">Editar piezas</button>'+
        '</div>');
      // Guardar info de piezas para el resumen del pedido
      var tot=pieces.reduce(function(s,p){return s+p.qty;},0);
      window._pccCalcInfo = {pieces:pieces, Nsh:Nsh, tot:tot, mode:mode, svgs:lastSvgs||[],
        placedSheets:res.sheets.map(function(s){return s.placed.map(function(p){return{x:p.x,y:p.y,W:p.W,H:p.H};});})
      };
      var pInfo=g('paso3PiezasInfo');
      if(pInfo){
        var pzTxt=pieces.length===1
          ?tot+(tot===1?' pieza':' piezas')+' de '+pieces[0].w/10+' × '+pieces[0].h/10+' cm'
          :tot+' piezas en '+pieces.length+' medidas distintas';
        pInfo.innerHTML='&#128204; Corte calculado para '+pzTxt+' &bull; '+Nsh+(Nsh===1?' plancha':' planchas');
        pInfo.style.display='block';
      }
      var qWarn=g('paso3QtyWarn');if(qWarn)qWarn.style.display='none';
      showPaso4();
    },150);
  };

  /* ── Gateway: bifurcación ── */
  function injectGateway(mode){
    clearAll();
    curMode=mode;
    var area=g('corteInstruccionesArea');if(!area)return;
    area.style.display='none';
    var sh=sheet();
    var shLabel=sh?(sh.h/10+' x '+sh.w/10+' cm'):'la plancha';
    var div=document.createElement('div');
    div.id='pccGateway';div.className='pcc-in-anim';
    div.innerHTML=
      '<div class="pcc-gw-title">¿Cuantas planchas necesitas?</div>'+
      '<button class="pcc-gw-opt pcc-gw-primary" type="button" onclick="pccChooseCalcular(\''+mode+'\')">' +
        '<div class="pcc-gw-ico">&#128990;</div>'+
        '<div><strong>No se cuantas &mdash; quiero calcular</strong>'+
        '<span>Ingresa tus piezas y te mostramos cuantas planchas necesitas y como quedan distribuidas</span></div>'+
      '</button>'+
      '<button class="pcc-gw-opt" type="button" onclick="pccChooseSe(\''+mode+'\')">' +
        '<div class="pcc-gw-ico">&#9998;</div>'+
        '<div><strong>Ya se cuantas necesito</strong>'+
        '<span>Ingresa directamente las medidas de corte y continua al pedido</span></div>'+
      '</button>';
    area.parentNode.insertBefore(div,area.nextSibling);
  }

  window.pccChooseCalcular=function(mode){
    var gw=g('pccGateway');if(gw)gw.remove();
    injectCalc(mode);
  };

  window.pccChooseSe=function(mode){
    var gw=g('pccGateway');if(gw)gw.remove();
    injectDirect(mode);
  };

  /* ── Camino A: calculadora ── */
  function injectCalc(mode){
    clearAll();curMode=mode;
    var area=g('corteInstruccionesArea');if(!area)return;
    area.style.display='none';
    var sh=sheet();
    var _esp=(window._ppState&&window._ppState.esp)?(' · Espesor '+window._ppState.esp):'';
    var banner=sh?(sh.h/10+' x '+sh.w/10+' cm'+_esp+' · Sierra '+K+' mm incluida'):'Plancha seleccionada';
    var sublbl=mode==='iguales'?'Medida del corte (se aplica a todas las planchas)':'Ingresá cada pieza — el sistema calcula cuántas planchas necesitás';
    var addLbl=mode==='iguales'?'+ Agregar medida':'+ Agregar corte';
    var calcLbl=mode==='iguales'?'Calcular automáticamente →':'Ver cuántas planchas necesito →';
    var div=document.createElement('div');
    div.id='pccCalc';div.className='pcc-in-anim'+(mode==='distintos'?' pcc-distintos':' pcc-iguales');
    div.innerHTML=
      '<div class="pcc-banner">'+banner+'</div>'+
      '<div class="pcc-sublbl">'+sublbl+'</div>'+
      '<div id="pccList"></div>'+
      '<button class="pcc-btn-add" type="button" onclick="pccAdd()">'+addLbl+'</button>'+
      '<button class="pcc-btn-calc" type="button" onclick="pccCalc()">'+calcLbl+'</button>'+
      '<div id="pccRes"></div>';
    area.parentNode.insertBefore(div,area.nextSibling);
    if(sh){
      if(mode==='iguales'){pccAdd(Math.round(sh.w*0.4/10),Math.round(sh.h*0.4/10),4);}
      else{pccAdd();pccAdd();}
    }else{pccAdd();}
  }

  /* ── Camino B: ya sé cuántas ── */
  function injectDirect(mode){
    clearAll();curMode=mode;
    var area=g('corteInstruccionesArea');if(!area)return;
    area.style.display=''; // mostrar el formulario existente del módulo
    // Inyectar botón confirmar + volver debajo del formulario
    var card=document.createElement('div');
    card.id='pccDirectCard';card.className='pcc-in-anim';
    card.innerHTML=
      '<button class="pcc-btn-next" type="button" onclick="pccDirectOk()">Confirmar y ver pedido &rarr;</button>'+
      '<button class="pcc-back-link" type="button" onclick="pccBackGw()">&#8592; Volver</button>';
    area.parentNode.insertBefore(card,area.nextSibling);
  }

  window.pccDirectOk=function(){
    var d=g('pccDirectCard');if(d)d.remove();
    showPaso4();
  };

  window.pccBackGw=function(){
    var mode=curMode||'iguales';
    clearAll();
    var area=g('corteInstruccionesArea');if(area)area.style.display='none';
    injectGateway(mode);
  };

  /* ── Sin corte ── */
  function injectSinCorte(){
    if(g('pccSinCorteCard'))return;
    clearAll();curMode='none';
    var area=g('corteInstruccionesArea');if(!area)return;
    area.style.display='none';
    var sh=sheet();
    var card=document.createElement('div');
    card.id='pccSinCorteCard';card.className='pcc-in-anim';
    card.innerHTML=
      '<div class="pcc-sincorte-tit">Plancha completa sin corte</div>'+
      '<div class="pcc-sincorte-sub">Recibes '+(sh?(sh.h/10+' x '+sh.w/10+' cm'):'la plancha')+' en su tamano original.</div>'+
      '<button class="pcc-btn-next" type="button" onclick="pccSinCorte()">Continuar al pedido &rarr;</button>';
    area.parentNode.insertBefore(card,area.nextSibling);
    var det=g('corteDetalle');if(det)det.style.display='block';
  }
  window.pccSinCorte=function(){
    var pInfo=g('paso3PiezasInfo');
    if(pInfo){
      pInfo.innerHTML='&#128204; Plancha completa sin corte &bull; la recibes en su tamaño original';
      pInfo.style.display='block';
    }
    showPaso4();
  };
  window.goBackToPaso2=function(){
    // Bloquear enterPaso3 mientras navegamos hacia atrás
    window._pccGoingBack=true;
    var H=document.documentElement;
    H.classList.remove('pcc-paso3');H.classList.remove('pcc-paso4');
    var cw=document.getElementById('corteSectionWrapper');if(cw)cw.style.display='none';
    var sum=document.getElementById('paso3SummarySection');if(sum)sum.style.display='none';
    var p4b=document.getElementById('paso4BackBtn');if(p4b)p4b.style.display='none';
    var s=window._ppState;
    var preset=window._ppPresetColor||'';
    if(s){if(preset)s.color=preset;else s.color='';}
    // goToStep es la función global equivalente a renderStep
    if(window.goToStep)window.goToStep(2);
    // Re-habilitar enterPaso3 después de que los observers hayan disparado
    setTimeout(function(){window._pccGoingBack=false;},150);
  };

  /* ── Editar (desde pccDone) ── */
  window.pccEdit=function(){
    // Sin corte: volver al inicio del paso de corte (guideA) sin mostrar calculador
    if(curMode==='none'){
      enterPaso3(false);
      return;
    }
    var savedInfo=window._pccCalcInfo; // guardar antes de que clearAll limpie el estado
    paso4Ready=false;
    enterPaso3(true);
    lastRes=null;lastPieces=null;N=0;
    var gA=g('corteGuideA'),gB=g('corteGuideB'),gC=g('corteGuideC');
    if(gA)gA.style.display='none';
    if(gB)gB.style.display='none';
    if(gC)gC.style.display='';
    injectCalc(curMode||'iguales');
    // Re-hidratar con las piezas del último cálculo en vez de los valores por defecto
    if(savedInfo&&savedInfo.pieces&&savedInfo.pieces.length){
      var list=g('pccList');
      if(list){list.innerHTML='';N=0;}
      savedInfo.pieces.forEach(function(p){pccAdd(Math.round(p.w/10),Math.round(p.h/10),p.qty);});
    }
    var l=g('pccList');if(l)setTimeout(function(){l.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
  };

  /* ── Utilidades ── */
  function clearAll(){
    var ids=['pccCalc','pccGateway','pccDirectCard','pccSinCorteCard'];
    ids.forEach(function(id){var el=g(id);if(el)el.remove();});
    N=0;lastRes=null;lastPieces=null;
  }
  window.pccClearAll=clearAll;

  /* ── Mini resumen de precio visible durante el paso de corte ── */
  function renderCorteResumen(){
    var s=window._ppState||{};
    var resEl=g('corteProductoResumen');
    var descEl=g('corteResumenDesc');
    var priceEl=g('corteResumenPrice');
    if(!resEl||!descEl||!priceEl)return;
    var precio=(window._ppPrices||{})[s.tipo]&&(window._ppPrices[s.tipo][s.dim])&&(window._ppPrices[s.tipo][s.dim][s.color])&&(window._ppPrices[s.tipo][s.dim][s.color][s.esp]);
    if(!precio){resEl.style.display='none';return;}
    var dimLabel=((window._ppDimMeta||{})[s.dim]||{}).label||s.dim||'';
    var fmtP=function(v){return '$ '+Math.round(v).toLocaleString('es-CL');};
    descEl.textContent=dimLabel+(s.esp?' · '+s.esp:'')+(s.qty&&s.qty>1?' × '+s.qty+' u.':'');
    priceEl.textContent=fmtP(precio*(s.qty||1));
    resEl.style.display='';
  }

  /* ── Gestión de pasos ── */
  function enterPaso3(fromEdit){
    if(window._pccGoingBack)return;
    if(!fromEdit&&!window._ppInPopstate)history.pushState({ppModal:'configurador',step:'paso3'},'');
    paso4Ready=false;
    H.classList.add('pcc-paso3');H.classList.remove('pcc-paso4');
    setup4Steps();
    setTopbar('Paso 2 de 2 — Tu pedido');
    renderCorteResumen();
    if(!fromEdit){
      var gA=g('corteGuideA'),gB=g('corteGuideB'),gC=g('corteGuideC');
      if(gA)gA.style.display='';
      if(gB)gB.style.display='none';
      if(gC)gC.style.display='none';
      clearAll();
    }
    var backBtn=g('paso4BackBtn');if(backBtn)backBtn.style.display='none';
    var s3=g('confStep3'),l3=g('confLine3'),s4=g('confStep4');
    if(s3)s3.className='pp-conf-step active';
    if(l3)l3.className='pp-conf-step-line';
    if(s4)s4.className='pp-conf-step';
  }

  function showPaso4(){
    if(!window._ppInPopstate)history.pushState({ppModal:'configurador',step:'paso4'},'');
    paso4Ready=true;
    H.classList.remove('pcc-paso3');H.classList.add('pcc-paso4');
    setTopbar('Paso 2 de 2 — Tu pedido');
    var resEl=g('corteProductoResumen');if(resEl)resEl.style.display='none';
    var s3=g('confStep3'),l3=g('confLine3'),s4=g('confStep4');
    if(s3)s3.className='pp-conf-step done';
    if(l3)l3.className='pp-conf-step-line done';
    if(s4)s4.className='pp-conf-step active';
    var backBtn=g('paso4BackBtn');if(backBtn)backBtn.style.display='block';
    setTimeout(function(){
      var sum=g('paso3SummarySection');
      if(sum)sum.scrollIntoView({behavior:'smooth',block:'start'});
    },200);
  }

  function setTopbar(txt){
    var tb=g('configuratorTopbarTitle');if(tb)tb.textContent=txt;
  }

  function setup4Steps(){
    if(g('confStep4'))return;
    var s3=g('confStep3');if(!s3)return;
    var lbl3=s3.querySelector('.pp-conf-step-label');
    if(lbl3)lbl3.textContent='Corte';
    var line3=document.createElement('div');line3.className='pp-conf-step-line';line3.id='confLine3';
    var step4=document.createElement('div');step4.className='pp-conf-step';step4.id='confStep4';
    step4.innerHTML='<div class="pp-conf-step-num">4</div><div class="pp-conf-step-label">Pedido</div>';
    s3.parentNode.insertBefore(line3,s3.nextSibling);
    s3.parentNode.insertBefore(step4,line3.nextSibling);
  }

  /* ── Observers ── */
  function watchTopbar(){
    var tb=g('configuratorTopbarTitle');if(!tb)return;
    new MutationObserver(function(){
      if(!paso4Ready&&g('confStep4')){
        if(tb.textContent==='Paso 3 de 3 — Tu pedido')tb.textContent='Paso 2 de 2 — Tu pedido';
      }
    }).observe(tb,{childList:true,characterData:true,subtree:true});
  }

  function watchWrapper(){
    var wrap=g('corteSectionWrapper');
    if(!wrap){setTimeout(watchWrapper,200);return;}
    new MutationObserver(function(){
      if(wrap.style.display!=='none'){
        if(!paso4Ready)enterPaso3();
      }else{
        H.classList.remove('pcc-paso3','pcc-paso4');paso4Ready=false;
      }
    }).observe(wrap,{attributes:true,attributeFilter:['style']});
    if(wrap.style.display!=='none')enterPaso3();
  }

  function watchButtons(){
    var btnI=g('corteOpt3Iguales'),btnD=g('corteOpt3Distintos'),btnN=g('corteOpt3None');
    if(!btnI||!btnD){setTimeout(watchButtons,200);return;}
    function check(){
      if(blocked)return;
      var isI=btnI.classList.contains('active');
      var isD=btnD.classList.contains('active');
      var isN=btnN&&btnN.classList.contains('active');
      if(isI)     {if(!g('pccGateway')&&!g('pccCalc')&&!g('pccDirectCard'))setTimeout(function(){injectGateway('iguales');},80);}
      else if(isD){if(!g('pccGateway')&&!g('pccCalc')&&!g('pccDirectCard'))setTimeout(function(){injectGateway('distintos');},80);}
      else if(isN){if(!g('pccSinCorteCard'))setTimeout(injectSinCorte,80);}
      else        {clearAll();var area=g('corteInstruccionesArea');if(area)area.style.display='';}
    }
    [btnI,btnD,btnN].forEach(function(btn){
      if(!btn)return;
      new MutationObserver(check).observe(btn,{attributes:true,attributeFilter:['class']});
    });
    check();
  }

  function init(){
    setup4Steps();
    watchTopbar();
    watchWrapper();
    watchButtons();
  }

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',init)
    :init();
})();
