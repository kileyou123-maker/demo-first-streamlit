function populateSelects(){
  const opts=ETF_DATA.map(x=>'<option value="'+x.ticker+'">'+x.ticker+' · '+x.name+'</option>').join("");
  $("#compareA").innerHTML=opts;$("#compareB").innerHTML=opts;$("#dcaTicker").innerHTML=opts;
  $("#compareA").value="0050";$("#compareB").value="006208";$("#dcaTicker").value="0050";
}

function overlap(a,b){
  const ma=new Map(a.top.map(([n,w])=>[n,w]));
  const mb=new Map(b.top.map(([n,w])=>[n,w]));
  const names=[...new Set([...ma.keys(),...mb.keys()])];
  const shared=names.filter(n=>ma.has(n)&&mb.has(n))
    .map(n=>[n,Math.min(ma.get(n),mb.get(n)),ma.get(n),mb.get(n)])
    .sort((x,y)=>y[1]-x[1]);
  return {pct:Math.min(100,Math.round(shared.reduce((s,x)=>s+x[1],0))),shared};
}
function renderCompare(){
  if(!$("#compareResult").innerHTML){
    $("#compareResult").innerHTML='<div class="demo-banner" style="margin-top:18px"><b>先選兩支 ETF</b><span>目前重疊率以種子資料中的示範持股快照計算；正式版會使用完整持股並標示持股日期。</span></div>';
  }
}
function runCompare(){
  const a=byTicker($("#compareA").value),b=byTicker($("#compareB").value),o=overlap(a,b);
  const same=a.ticker===b.ticker;
  const common=o.shared.length?o.shared.map(x=>'<div class="bar-row"><span>'+x[0]+'</span><span class="bar"><i style="width:'+Math.min(100,x[1]*6)+'%"></i></span><b>'+x[1]+'%</b></div>').join(""):'<p>示範前幾大持股沒有共同項目。</p>';
  const deep='<h3>深度 X-RAY*</h3><p>'+a.ticker+' 集中度示範：'+a.top.reduce((s,x)=>s+x[1],0)+'% · '+b.ticker+'：'+b.top.reduce((s,x)=>s+x[1],0)+'%</p>'+
    '<p>波動指標：'+a.ticker+' '+a.demo.vol+' / '+b.ticker+' '+b.demo.vol+'</p>';
  $("#compareResult").innerHTML=
    '<div class="comparison"><div class="demo-banner"><b>DEMO 計算</b><span>目前只用前幾大示範持股計算，不能視為正式 ETF 重疊率。</span></div>'+
    '<div class="overlap-hero"><div class="overlap-num"><div><b>'+(same?100:o.pct)+'%</b><small>示範重疊</small></div></div>'+
    '<div><div class="eyebrow">OVERLAP X-RAY</div><h2>'+a.ticker+' + '+b.ticker+'</h2><p>'+
    (same?'你選的是同一支 ETF。':o.pct>=25?'這兩檔在目前示範持股中有明顯重疊；同時持有不等於自動增加分散。':'目前示範前幾大持股重疊不高，但正式分析仍需要完整持股、產業與國家曝險。')+
    '</p></div></div><div class="deep-grid"><div class="panel"><h3>共同持股*</h3>'+common+'</div>'+
    lockPanel("compare:"+a.ticker+":"+b.ticker,"完整曝險比較","正式版會算完整持股重疊、產業集中、國家曝險與重複權重。",deep)+
    '</div></div>';
  $$(".unlock").forEach(el=>el.onclick=()=>openUnlock(el.dataset.unlock,el.dataset.title));
}

function monthlyRate(annual){return Math.pow(1+annual/100,1/12)-1}
function simulateDca(etf,amount,years,offset=0){
  let value=0,invested=0,minGap=0;
  for(let m=0;m<years*12;m++){
    invested+=amount;value+=amount;
    const ar=etf.annual[(Math.floor(m/12)+offset)%etf.annual.length];
    value*=1+monthlyRate(ar);
    minGap=Math.min(minGap,(value-invested)/invested);
  }
  return {value,invested,returnPct:(value/invested-1)*100,minGap:minGap*100};
}
function renderDcaEmpty(){
  if(!$("#dcaResult").innerHTML){
    $("#dcaResult").innerHTML='<div class="demo-banner" style="margin-top:18px"><b>情境模擬</b><span>目前用示範年度序列驗證計算與 UI。正式版將由歷史總報酬序列逐月計算，並附股息、匯率與費用假設。</span></div>';
  }
}
function runDca(){
  const e=byTicker($("#dcaTicker").value);
  const amount=Number($("#dcaAmount").value)||5000;
  const years=Number($("#dcaYears").value);
  const scenarios=[0,2,4].map(o=>simulateDca(e,amount,years,o)).sort((a,b)=>a.value-b.value);
  const names=["較差情境*","中位情境*","較佳情境*"];
  const cards=scenarios.map((s,i)=>'<div class="scenario"><small>'+names[i]+'</small><h3>NT$ '+fmt(s.value)+'</h3><p>投入本金 NT$ '+fmt(s.invested)+'<br>期末報酬 '+(s.returnPct>=0?'+':'')+fmt(s.returnPct,1)+'%<br>過程最差資產落後本金 '+fmt(s.minGap,1)+'%</p></div>').join("");
  const deep='<h3 style="margin-top:0">最倒楣起點分析*</h3><p>這裡會展示「如果剛好從歷史不利時點開始扣款」的完整路徑，而不是只看最後賺多少。</p>'+
    '<div class="metrics4"><div class="metric"><small>示範最深落後本金</small><b>'+fmt(scenarios[0].minGap,1)+'%</b></div>'+
    '<div class="metric"><small>投入本金</small><b>'+fmt(scenarios[0].invested)+'</b></div></div>';
  $("#dcaResult").innerHTML='<div class="scenario-grid">'+cards+'</div>'+
    lockPanel("dca:"+e.ticker+":"+years,"Worst-start DCA X-RAY","解鎖不同歷史起始月份、最久未轉正期間與最深浮虧。",deep);
  $$(".unlock").forEach(el=>el.onclick=()=>openUnlock(el.dataset.unlock,el.dataset.title));
}

function trait(name,v){
  return '<div class="trait"><b>'+name+'</b><span class="track"><i style="width:'+v+'%"></i></span><span>'+v+'</span></div>';
}
function quizSubmit(e){
  e.preventDefault();
  const f=new FormData(e.currentTarget);
  const vals=[1,2,3,4,5].map(i=>Number(f.get("q"+i)));
  const horizon=vals[0]*50;
  const risk=Math.round((vals[1]+vals[3])/4*100);
  const buffer=vals[2]*50;
  const stability=vals[4]*50;
  const level=risk<35?"對波動敏感":risk<70?"可接受中度波動":"可接受較高波動";
  const lesson=risk<35?
    "優先理解回撤、債券/股票資產類別差異與緊急預備金；不要只因為高報酬就忽略下跌幅度。":
    risk<70?
    "優先比較分散程度、最大回撤、恢復時間與長期持有區間；不要只看單一年報酬。":
    "特別注意集中度、槓桿/反向產品的路徑風險，以及高波動是否真的符合你的資金使用時間。";
  $("#quizResult").innerHTML='<div class="quiz-result"><div class="eyebrow">你的教育型風險輪廓</div><h2>'+level+'</h2>'+
    '<p style="color:var(--muted)">這不是特定 ETF 推薦，也不會產生買賣比例。用途是幫你理解自己研究 ETF 時應特別注意哪些風險。</p>'+
    trait("投資時間",horizon)+trait("波動承受",risk)+trait("預備金完整度",buffer)+trait("投入穩定度",stability)+
    '<div class="panel" style="margin-top:18px"><h3>你接下來應該研究什麼？</h3><p>'+lesson+'</p></div></div>';
  $("#quizResult").scrollIntoView({behavior:"smooth",block:"start"});
}

function bind(){
  $$("[data-view]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();showView(b.dataset.view)}));
  $("#heroSearch").addEventListener("input",e=>renderSearchResults(e.target,$("#heroResults")));
  $("#heroSearchBtn").onclick=()=>{const x=search($("#heroSearch").value)[0];x?openDetail(x.ticker):toast("目前種子資料庫找不到這個代號")};
  $("#heroSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#heroSearchBtn").click()}});
  $("#dbSearch").addEventListener("input",renderETFGrid);
  $("#runCompare").onclick=runCompare;
  $("#runDca").onclick=runDca;
  $("#quizForm").onsubmit=quizSubmit;
  $("#closeModal").onclick=()=>$("#lockModal").classList.add("hidden");
  $("#usePoint").onclick=usePoint;
  $("#goPricing").onclick=()=>showView("pricing");
  $("#creditsBtn").onclick=()=>showView("pricing");
  $$(".fake-pay").forEach(b=>b.onclick=()=>toast("MVP 尚未串正式金流；正式收費前會先完成法規與金流審查"));
  $("#lockModal").addEventListener("click",e=>{if(e.target===$("#lockModal"))$("#lockModal").classList.add("hidden")});
}
function init(){
  renderCredits();populateSelects();bind();bindCore();renderETFGrid();updateCatalogStatus();loadCatalog();
  const h=location.hash.replace("#","");if(h&&byTicker(h))openDetail(h);
}
init();
