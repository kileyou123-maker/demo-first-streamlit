const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const state={
  points:Number(localStorage.getItem("xray_points")||5),
  market:"全部",
  current:null,
  pendingUnlock:null,
  unlocked:new Set(JSON.parse(localStorage.getItem("xray_unlocked")||"[]")),
  catalog:[...ETF_DATA],
  catalogMeta:null,
  catalogLoaded:false
};

function save(){
  localStorage.setItem("xray_points",String(state.points));
  localStorage.setItem("xray_unlocked",JSON.stringify([...state.unlocked]));
  renderCredits();
}
function renderCredits(){ $("#creditsBtn").textContent=state.points+" 點"; }
function toast(msg){
  const t=$("#toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),1800);
}
function showView(id){
  $$(".view").forEach(v=>v.classList.toggle("hidden",v.id!==id));
  $("#lockModal").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="explore") renderETFGrid();
  if(id==="compare") renderCompare();
  if(id==="dca") renderDcaEmpty();
}
function fmt(n,d=0){return Number(n).toLocaleString("zh-TW",{maximumFractionDigits:d,minimumFractionDigits:d})}
function deepByTicker(t){return ETF_DATA.find(x=>x.ticker.toUpperCase()===String(t).toUpperCase())}
function byTicker(t){
  const key=String(t).toUpperCase();
  return deepByTicker(key)||state.catalog.find(x=>String(x.ticker).toUpperCase()===key);
}
function hasDeep(x){return !!(x&&x.demo&&x.annual&&x.top)}
function demoLabel(){return '<span class="badge">DEMO DATA</span>'}
function searchableText(x){return [x.ticker,x.name,x.category,x.market,x.issuer,...(x.tags||[])].join(" ").toLowerCase()}

function mergeCatalog(funds){
  const map=new Map();
  for(const x of funds||[]) map.set((x.market||"")+"|"+String(x.ticker).toUpperCase(),x);
  for(const x of ETF_DATA){
    const k=x.market+"|"+x.ticker.toUpperCase();
    map.set(k,{...(map.get(k)||{}),...x});
  }
  state.catalog=[...map.values()].sort((a,b)=>String(a.ticker).localeCompare(String(b.ticker)));
}
async function loadCatalog(){
  try{
    const res=await fetch("catalog.json?ts="+Date.now(),{cache:"no-store"});
    if(!res.ok) throw new Error("catalog "+res.status);
    const payload=await res.json();
    mergeCatalog(payload.funds||[]);
    state.catalogMeta=payload;
    state.catalogLoaded=true;
    updateCatalogStatus();
    if(!$("#explore").classList.contains("hidden")) renderETFGrid();
  }catch(err){
    state.catalogLoaded=false;
    updateCatalogStatus();
    console.warn("ETF catalog unavailable",err);
  }
}
function updateCatalogStatus(){
  const el=$("#catalogStatus");
  if(!el)return;
  if(state.catalogLoaded&&state.catalogMeta){
    const m=state.catalogMeta.markets||{};
    el.textContent="已載入 "+fmt(state.catalogMeta.count)+" 檔 ETF · 台灣 "+fmt(m["台灣"]||0)+" · 美國 "+fmt(m["美國"]||0);
    el.className="catalog-status ok";
  }else{
    el.textContent="完整市場清單同步中；目前先顯示已建置深度資料的 ETF";
    el.className="catalog-status";
  }
}

function search(q){
  const s=String(q||"").trim().toLowerCase();
  if(!s)return [];
  return state.catalog
    .filter(x=>searchableText(x).includes(s))
    .sort((a,b)=>{
      const ae=String(a.ticker).toLowerCase()===s?0:String(a.ticker).toLowerCase().startsWith(s)?1:2;
      const be=String(b.ticker).toLowerCase()===s?0:String(b.ticker).toLowerCase().startsWith(s)?1:2;
      return ae-be;
    })
    .slice(0,10);
}
function renderSearchResults(input,box){
  const rows=search(input.value);
  if(!input.value.trim()){box.innerHTML="";return}
  if(!rows.length){
    box.innerHTML='<div class="search-empty">目前完整清單仍找不到這個代號。若是剛上市 ETF，請稍後等官方清單同步。</div>';
    return;
  }
  box.innerHTML=rows.map(x=>
    '<button data-ticker="'+x.ticker+'"><span class="result-main"><b>'+x.ticker+'</b><span>'+x.name+'</span></span>'+
    '<small>'+x.market+' · '+(x.category||"ETF")+(hasDeep(x)?" · 可做深度 X-RAY":" · 基本資料")+'</small></button>'
  ).join("");
  $$("[data-ticker]",box).forEach(b=>b.onclick=()=>openDetail(b.dataset.ticker));
}
function renderETFGrid(){
  const q=($("#dbSearch")?.value||"").trim().toLowerCase();
  const all=state.catalog.filter(x=>(state.market==="全部"||x.market===state.market)&&(!q||searchableText(x).includes(q)));
  const list=all.slice(0,120);
  $("#marketFilters").innerHTML=["全部",...new Set(state.catalog.map(x=>x.market).filter(Boolean))].map(m=>
    '<button class="'+(state.market===m?"active":"")+'" data-market="'+m+'">'+m+'</button>'
  ).join("");
  $$("[data-market]").forEach(b=>b.onclick=()=>{state.market=b.dataset.market;renderETFGrid()});
  const summary='<div class="catalog-summary">找到 <b>'+fmt(all.length)+'</b> 檔'+(all.length>120?'，先顯示前 120 檔；用搜尋可以直接找到任何代號。':'')+'</div>';
  $("#etfGrid").innerHTML=summary+list.map(x=>{
    if(hasDeep(x)){
      return '<button class="etf-card" data-open="'+x.ticker+'"><span class="market">'+x.market+'</span><div class="ticker">'+x.ticker+'</div>'+
        '<h3>'+x.name+'</h3><p>'+x.category+' · '+(x.issuer||"")+'</p>'+
        '<div class="mini-metrics"><div><small>最大回撤*</small><b>'+x.demo.drawdown+'%</b></div>'+
        '<div><small>恢復月數*</small><b>'+x.demo.recovery+'</b></div>'+
        '<div><small>5年正報酬*</small><b>'+x.demo.rolling5+'%</b></div></div></button>';
    }
    return '<button class="etf-card catalog-only" data-open="'+x.ticker+'"><span class="market">'+x.market+'</span><div class="ticker">'+x.ticker+'</div>'+
      '<h3>'+x.name+'</h3><p>'+(x.category||"ETF")+(x.exchange?' · '+x.exchange:'')+'</p>'+
      '<div class="basic-ready"><span>✓</span> 已收錄基本資料 <small>深度 X-RAY 建置中</small></div></button>';
  }).join("");
  $$("[data-open]").forEach(b=>b.onclick=()=>openDetail(b.dataset.open));
}
function renderBasicDetail(x){
  $("#detailContent").innerHTML=
    '<div class="detail-hero"><div><div class="ticker-big">'+x.ticker+'</div><h1>'+x.name+'</h1>'+
    '<div class="badges"><span class="badge">'+(x.market||"")+'</span><span class="badge">'+(x.category||"ETF")+'</span>'+
    (x.exchange?'<span class="badge">'+x.exchange+'</span>':'')+'</div></div></div>'+
    '<div class="panel basic-detail"><div class="eyebrow">CATALOG MATCH</div><h2>這檔 ETF 已經找得到</h2>'+
    '<p>目前已收錄在完整 ETF 主清單，但歷史總報酬、回撤、DCA、完整持股與重疊分析還沒有完成資料驗證，因此不會用示範數字冒充正式結果。</p>'+
    '<div class="basic-fields"><div><small>市場</small><b>'+(x.market||"—")+'</b></div><div><small>交易所</small><b>'+(x.exchange||"—")+'</b></div>'+
    '<div><small>類型</small><b>'+(x.category||"ETF")+'</b></div><div><small>資料來源</small><b>'+(x.source||"市場主清單")+'</b></div></div>'+
    '<div class="demo-banner"><b>深度資料建置中</b><span>正式分析只有在資料來源、歷史序列與計算方式驗證完成後才會開放。</span></div></div>';
}
function openDetail(ticker){
  const x=byTicker(ticker);if(!x){toast("找不到這個 ETF");return}
  state.current=x;
  history.replaceState(null,"","#"+x.ticker);
  showView("detail");
  if(hasDeep(x)) renderDetail(x); else renderBasicDetail(x);
}

function bindCore(){
  $("#heroSearch").addEventListener("input",e=>renderSearchResults(e.target,$("#heroResults")));
  $("#heroSearch").addEventListener("focus",e=>renderSearchResults(e.target,$("#heroResults")));
  $("#heroSearchBtn").onclick=()=>{const x=search($("#heroSearch").value)[0];x?openDetail(x.ticker):toast("完整 ETF 清單目前找不到這個代號")};
  $("#heroSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#heroSearchBtn").click()}});
  $("#dbSearch").addEventListener("input",renderETFGrid);
  document.addEventListener("click",e=>{if(!e.target.closest(".hero-search"))$("#heroResults").innerHTML=""});
}
