function bars(items){
  return items.map(([name,w])=>'<div class="bar-row"><span>'+name+'</span><span class="bar"><i style="width:'+Math.min(100,w*1.65)+'%"></i></span><b>'+w+'%</b></div>').join("");
}
function lockPanel(id,title,desc,inner){
  const unlocked=state.unlocked.has(id);
  return '<div class="panel locked"><div class="'+(unlocked?"":"locked-content")+'">'+inner+'</div>'+
    (unlocked?'':'<div class="lock-overlay"><div class="lock-box"><b>'+title+'</b><p>'+desc+'</p><button class="primary unlock" data-unlock="'+id+'" data-title="'+title+'">1 點解鎖</button></div></div>')+
    '</div>';
}
function renderDetail(x){
  const yearly=x.annual.map((r,i)=>'<div class="bar-row"><span>'+(2020+i)+'</span><span class="bar"><i style="width:'+Math.min(100,Math.abs(r)*2)+'%;background:'+(r>=0?'var(--accent)':'var(--danger)')+'"></i></span><b>'+(r>0?'+':'')+r+'%</b></div>').join("");
  const worst=Math.min(...x.annual),best=Math.max(...x.annual);
  const rollingInner=
    '<h3>任意起點 5 年持有*</h3>'+
    '<p>正報酬區間：<b>'+x.demo.rolling5+'%</b> · 示範最差五年年化：<b>'+Math.round(worst/3)+'%</b> · 中位數年化：<b>'+Math.round(x.annual.reduce((a,b)=>a+b,0)/x.annual.length)+'%</b></p>'+
    '<div class="bar-row"><span>負報酬</span><span class="bar"><i style="width:'+(100-x.demo.rolling5)+'%;background:var(--danger)"></i></span><b>'+(100-x.demo.rolling5)+'%</b></div>'+
    '<div class="bar-row"><span>正報酬</span><span class="bar"><i style="width:'+x.demo.rolling5+'%"></i></span><b>'+x.demo.rolling5+'%</b></div>';
  const recoveryInner=
    '<h3>回撤與恢復地圖*</h3><p>示範最深回撤 '+x.demo.drawdown+'%，最長恢復 '+x.demo.recovery+' 個月。</p>'+
    '<div class="bar-row"><span>第一次</span><span class="bar"><i style="width:55%;background:var(--danger)"></i></span><b>'+Math.round(x.demo.drawdown*.55)+'%</b></div>'+
    '<div class="bar-row"><span>第二次</span><span class="bar"><i style="width:82%;background:var(--danger)"></i></span><b>'+Math.round(x.demo.drawdown*.82)+'%</b></div>'+
    '<div class="bar-row"><span>最深</span><span class="bar"><i style="width:100%;background:var(--danger)"></i></span><b>'+x.demo.drawdown+'%</b></div>';

  $("#detailContent").innerHTML=
    '<div class="detail-hero"><div><div class="ticker-big">'+x.ticker+'</div><h1>'+x.name+'</h1>'+
    '<div class="badges">'+demoLabel()+'<span class="badge">'+x.market+'</span><span class="badge">'+x.category+'</span><span class="badge">'+x.currency+'</span></div></div>'+
    '<div class="score-ring"><div><b>'+x.demo.score+'</b></div></div></div>'+
    '<div class="demo-banner" style="margin-top:18px"><b>數據示範</b><span>以下數字用來驗證產品流程，不代表正式歷史績效。正式版會由可合法使用的資料源計算並附來源與更新時間。</span></div>'+
    '<div class="metrics4"><div class="metric"><small>最大回撤*</small><b>'+x.demo.drawdown+'%</b></div>'+
    '<div class="metric"><small>最長恢復*</small><b>'+x.demo.recovery+' 個月</b></div>'+
    '<div class="metric"><small>5 年正報酬區間*</small><b>'+x.demo.rolling5+'%</b></div>'+
    '<div class="metric"><small>波動指標*</small><b>'+x.demo.vol+'</b></div></div>'+
    '<div class="deep-grid">'+
      '<div class="panel"><h3>它到底買了什麼？</h3><p>以簡化持股快照呈現集中程度。正式版會顯示完整持股、產業、國家與歷史變化。</p>'+bars(x.top)+'</div>'+
      '<div class="panel"><h3>你真正要知道的風險</h3><p>示範資料中，這檔 ETF 最大回撤約 <b style="color:var(--danger)">'+x.demo.drawdown+'%</b>，最長約 <b>'+x.demo.recovery+' 個月</b>回復。比「年化報酬」更重要的是：你能不能撐過那段時間。</p>'+
      '<p>單年示範最佳：<b style="color:var(--accent)">+'+best+'%</b> · 最差：<b style="color:var(--danger)">'+worst+'%</b></p></div>'+
      '<div class="panel"><h3>年度報酬快照*</h3><p>正式版會切換「價格報酬 / 含息總報酬」，並附計算定義。</p>'+yearly+'</div>'+
      lockPanel("rolling:"+x.ticker,"Rolling Return X-RAY","看所有任意起點持有 3/5/10 年的結果，不只從今天倒推。",rollingInner)+
      lockPanel("recovery:"+x.ticker,"回撤恢復地圖","不是只告訴你跌多少，而是拆出每一次重大下跌與回到前高花多久。",recoveryInner)+
    '</div>';
  $$(".unlock").forEach(b=>b.onclick=()=>openUnlock(b.dataset.unlock,b.dataset.title));
}
function openUnlock(id,title){
  state.pendingUnlock={id,title};
  $("#lockText").textContent='「'+title+'」需要 1 點。你目前有 '+state.points+' 點。';
  $("#lockModal").classList.remove("hidden");
}
function usePoint(){
  if(!state.pendingUnlock)return;
  if(state.points<1){showView("pricing");toast("點數不足");return}
  state.points--;
  state.unlocked.add(state.pendingUnlock.id);
  save();
  $("#lockModal").classList.add("hidden");
  toast("已解鎖 "+state.pendingUnlock.title);
  if(state.current)renderDetail(state.current);
  state.pendingUnlock=null;
}
