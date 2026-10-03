const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const state={
  points:Number(localStorage.getItem("xray_points")||5),
  market:"全部",
  current:null,
  pendingUnlock:null,
  unlocked:new Set(JSON.parse(localStorage.getItem("xray_unlocked")||"[]"))
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
function byTicker(t){return ETF_DATA.find(x=>x.ticker.toUpperCase()===String(t).toUpperCase())}
function demoLabel(){return '<span class="badge">DEMO DATA</span>'}

function search(q){
  const s=String(q||"").trim().toLowerCase();
  if(!s)return [];
  return ETF_DATA.filter(x=>[x.ticker,x.name,x.category,x.market,x.issuer,...x.tags].join(" ").toLowerCase().includes(s)).slice(0,7);
}
function renderSearchResults(input,box){
  const rows=search(input.value);
  box.innerHTML=rows.map(x=>'<button data-ticker="'+x.ticker+'"><b>'+x.ticker+'</b> · '+x.name+'<small>'+x.market+' · '+x.category+'</small></button>').join("");
  $$("[data-ticker]",box).forEach(b=>b.onclick=()=>openDetail(b.dataset.ticker));
}
function initQuick(){
  $("#quickTickers").innerHTML=["0050","006208","00878","VOO","QQQ","VT"].map(t=>'<button data-q="'+t+'">'+t+'</button>').join("");
  $$("[data-q]").forEach(b=>b.onclick=()=>openDetail(b.dataset.q));
}
function renderETFGrid(){
  const q=($("#dbSearch")?.value||"").trim().toLowerCase();
  const list=ETF_DATA.filter(x=>(state.market==="全部"||x.market===state.market)&&(!q||[x.ticker,x.name,x.category,x.tags.join(" ")].join(" ").toLowerCase().includes(q)));
  $("#marketFilters").innerHTML=["全部",...new Set(ETF_DATA.map(x=>x.market))].map(m=>'<button class="'+(state.market===m?"active":"")+'" data-market="'+m+'">'+m+'</button>').join("");
  $$("[data-market]").forEach(b=>b.onclick=()=>{state.market=b.dataset.market;renderETFGrid()});
  $("#etfGrid").innerHTML=list.map(x=>'<button class="etf-card" data-open="'+x.ticker+'">'+
    '<span class="market">'+x.market+'</span><div class="ticker">'+x.ticker+'</div>'+
    '<h3>'+x.name+'</h3><p>'+x.category+' · '+x.issuer+'</p>'+
    '<div class="mini-metrics"><div><small>最大回撤*</small><b>'+x.demo.drawdown+'%</b></div>'+
    '<div><small>恢復月數*</small><b>'+x.demo.recovery+'</b></div>'+
    '<div><small>5年正報酬*</small><b>'+x.demo.rolling5+'%</b></div></div></button>').join("");
  $$("[data-open]").forEach(b=>b.onclick=()=>openDetail(b.dataset.open));
}
function openDetail(ticker){
  const x=byTicker(ticker);if(!x)return;
  state.current=x;
  history.replaceState(null,"","#"+x.ticker);
  showView("detail");
  renderDetail(x);
}
