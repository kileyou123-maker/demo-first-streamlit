
const $=s=>document.querySelector(s);
const HOT=[
  {title:'如果你今天突然中了 10 億',plays:'12.8K 人已玩',tone:'money'},
  {title:'如果你可以回到 18 歲',plays:'9.4K 人已玩',tone:'youth'},
  {title:'如果你明天不用再工作',plays:'7.1K 人已玩',tone:'freedom'}
];
const AXES=[['money','資產'],['happy','幸福'],['fame','影響力'],['trust','關係']];
const BASE={money:50,happy:50,fame:50,trust:50};
const STORY=[
 {title:'沒有人知道接下來會發生什麼',text:'事情真的發生了。手機開始震動，訊息一則接一則跳出來。你知道第一個決定，往往最容易改變後面所有事情。',choices:[
  {label:'先不要告訴任何人',meta:'保守但安全',delta:{money:7,trust:-4,happy:4},impact:'你把消息壓了下來。沒有人能替你做決定，但孤獨感也跟著上升。'},
  {label:'立刻告訴最信任的人',meta:'把秘密交出去',delta:{trust:12,happy:6,fame:-2},impact:'你不再是一個人知道這件事。有人支持你，也代表秘密從此不只屬於你。'},
  {label:'先做一件一直不敢做的事',meta:'衝動但痛快',delta:{happy:13,money:-5,fame:5},impact:'你第一次沒有先想後果。這個決定讓你興奮，也讓事情開始被別人注意。'}]},
 {title:'世界開始注意到你',text:'你原本以為只要低調就好，但生活開始出現破綻。熟人看出不同、陌生人開始靠近，你必須決定自己想成為什麼樣的人。',choices:[
  {label:'把生活維持得跟以前一樣',meta:'低調路線',delta:{money:9,fame:-8,trust:3},impact:'你刻意維持平凡。資源被保留下來，但你也放棄了一部分立刻改變人生的機會。'},
  {label:'讓所有人都知道我變了',meta:'高調路線',delta:{fame:15,happy:6,money:-6},impact:'你的生活瞬間被放大。羨慕和關注一起湧來，你獲得影響力，也失去部分隱私。'},
  {label:'只幫身邊最重要的人',meta:'關係優先',delta:{trust:14,money:-7,happy:7},impact:'你沒有改變全世界，只先改變身邊幾個人的生活。這件事讓關係變得更深，也更複雜。'}]},
 {title:'第一次真正的代價',text:'每一種新人生都會索取代價。你現在同時收到一個風險很高的機會，以及一個讓你安心很多的選擇。',choices:[
  {label:'賭一次大的',meta:'高風險 / 高回報',delta:{money:18,happy:-4,trust:-5},impact:'你把籌碼推進去。結果比預期更刺激，你得到更多，也開始習慣用風險換速度。'},
  {label:'不碰，守住現在擁有的',meta:'穩定優先',delta:{money:6,happy:7,trust:4},impact:'你拒絕了誘惑。沒有煙火，但你睡得很好。你開始理解「不用證明什麼」也是一種選擇。'},
  {label:'找人一起承擔',meta:'把風險變成關係',delta:{trust:12,money:7,fame:3},impact:'你沒有獨自下注。你獲得一個盟友，也讓另一個人正式走進你的新人生。'}]},
 {title:'你開始不像以前的你',text:'幾個月後，你已經適應新的生活。真正困難的不是得到什麼，而是你發現自己正在變成另一個人。',choices:[
  {label:'繼續加速，直到做到最大',meta:'野心拉滿',delta:{money:14,fame:12,happy:-6},impact:'你選擇不停下來。更多機會開始主動找上門，但你能留給自己的時間越來越少。'},
  {label:'停下來，重新定義成功',meta:'生活優先',delta:{happy:16,trust:8,fame:-5},impact:'你第一次主動踩煞車。別人可能不懂，但你重新掌握了生活節奏。'},
  {label:'把資源拿去做一件有意義的事',meta:'影響世界',delta:{fame:13,trust:9,money:-8},impact:'你的選擇開始影響不認識的人。你失去一部分資源，但獲得一種完全不同的成就感。'}]},
 {title:'五年後，你回頭看今天',text:'時間把當年的興奮磨平了。現在你真正擁有的，不只是數字，而是這一路上你反覆選擇成為的那個人。',choices:[
  {label:'繼續追求更多',meta:'沒有終點',delta:{money:12,fame:8,happy:-3},impact:'你選擇繼續往前。你的人生很少無聊，也很少真正停下來。'},
  {label:'把自由留給自己',meta:'退出競賽',delta:{happy:15,trust:6,fame:-5},impact:'你決定不再跟任何人的人生比較。少了一些掌聲，多了很多自己的時間。'},
  {label:'把重要的人留在身邊',meta:'關係優先',delta:{trust:16,happy:9,money:-4},impact:'你最後選擇的不是更大的世界，而是更少但更重要的人。'}]}
];
let state={scenario:'',round:0,stats:{...BASE},history:[],seed:0,lastImpact:''};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h)}
function clamp(n){return Math.max(0,Math.min(100,n))}
function screen(id){['home','game','result'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));window.scrollTo({top:0,behavior:'smooth'})}
function hotCards(){const box=$('#hot');box.innerHTML='';HOT.forEach((x,i)=>{const b=document.createElement('button');b.type='button';b.className='card';b.innerHTML=`<span class="rank">TRENDING 0${i+1}</span><strong>${x.title}</strong><span>${x.plays} · 平均完成 92%</span>`;b.addEventListener('click',()=>startGame(x.title));box.appendChild(b)})}
function renderStats(){const box=$('#stats');box.innerHTML='';AXES.forEach(([key,name])=>{box.insertAdjacentHTML('beforeend',`<div class="stat"><small>${name}</small><b>${state.stats[key]}</b><i><u style="width:${state.stats[key]}%"></u></i></div>`)});}
function variantText(text){const s=state.scenario;const n=(state.seed+state.round*17)%5;const intros=[`你的「${s}」世界正式開始改變。`, `在「${s}」這條時間線裡，事情比你想像得快。`, `沒有人替「${s}」這個人生寫好答案。`, `這不是測驗。在「${s}」裡，每個決定都留下痕跡。`, `你已經進入「${s}」這條平行時間線。`];return intros[n]+' '+text}
function renderScene(){const e=STORY[state.round];$('#roundLabel').textContent=`第 ${state.round+1} / 5 幕`;$('#progress').style.width=((state.round+1)/5*100)+'%';$('#worldTitle').textContent=state.scenario;$('#day').textContent=`YEAR 0${state.round}`;$('#big').textContent='0'+(state.round+1);$('#sceneTitle').textContent=e.title;$('#sceneText').textContent=variantText(e.text);renderStats();const impact=$('#impact');if(state.lastImpact){impact.classList.remove('hidden');impact.innerHTML=`<div class="label">剛才的選擇造成</div><strong>${state.lastImpact}</strong><p>數值已經改變。下一幕會沿著這條路繼續。</p>`}else impact.classList.add('hidden');const box=$('#choices');box.innerHTML='';e.choices.forEach((c,i)=>{const b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML=`<span class="key">${String.fromCharCode(65+i)}</span><b>${c.label}</b><span>${c.meta}</span><strong>→</strong>`;b.addEventListener('click',()=>choose(c,i));box.appendChild(b)})}
function startGame(s){state={scenario:s.trim(),round:0,stats:{...BASE},history:[],seed:hash(s.trim()),lastImpact:''};if(!state.scenario)return;history.replaceState(null,'',location.pathname+'?q='+encodeURIComponent(state.scenario));screen('game');renderScene()}
function choose(c,i){Object.entries(c.delta).forEach(([k,v])=>state.stats[k]=clamp(state.stats[k]+v));state.history.push({round:state.round+1,label:c.label,impact:c.impact});state.lastImpact=c.impact;if(state.round===4){setTimeout(showResult,220)}else{state.round++;renderScene();window.scrollTo({top:0,behavior:'smooth'})}}
function endingData(){const sorted=Object.entries(state.stats).sort((a,b)=>b[1]-a[1]);const top=sorted[0][0],second=sorted[1][0];const key=top+'-'+second;const maps={
'money-fame':['低調不了的贏家','你把機會變成資源，也讓自己逐漸成為別人眼中的焦點。你的人生很有效率，但自由必須刻意保護。'],
'money-happy':['自由資產家','你沒有把「更多」當成唯一答案。你保住了資源，也努力讓生活本身值得過。'],
'money-trust':['家族守門人','你最終把資源拿來保護重要的人。外面的人可能看不懂，但你的世界很穩。'],
'happy-trust':['退出競賽的人','你沒有成為最耀眼的人，卻很可能成為最不後悔的人。你選擇了關係和自己的時間。'],
'happy-money':['自由人生玩家','你最後學會讓錢服務生活，而不是讓生活服務數字。'],
'happy-fame':['被喜歡的自由人','你保留了自己的節奏，也留下足夠多讓別人記得你的痕跡。'],
'fame-money':['話題中心人物','你的人生很難被忽略。影響力和資源互相放大，但每一步都會被更多人看見。'],
'fame-trust':['有號召力的領袖','你不是只讓自己過得更好，而是讓別人願意跟著你一起走。'],
'fame-happy':['高人氣生活家','你成功讓被看見和做自己同時存在，這比單純追求數字更難。'],
'trust-happy':['把人留下的人','你最後留下的不是最大的數字，而是最難取代的關係。'],
'trust-money':['可靠的掌舵者','你會先確保身邊的人安全，再考慮擴張自己的世界。'],
'trust-fame':['人脈核心','很多機會不是你搶來的，是別人願意帶著你一起走。']};return maps[key]||['平行人生玩家','你沒有單一路線。你的每個決定互相牽制，最後形成一個很難被簡單分類的人生。']}
function personalityTags(){const arr=Object.entries(state.stats).sort((a,b)=>b[1]-a[1]);const t={money:'高風險耐受',happy:'自由優先',fame:'存在感強',trust:'關係導向'};const second={money:'資源敏感',happy:'享受當下',fame:'敢被看見',trust:'重視信任'};return [t[arr[0][0]],second[arr[1][0]],state.stats.money>70?'敢下重注':'不容易梭哈']}
function showResult(){screen('result');const [title,desc]=endingData();const avg=Math.round(Object.values(state.stats).reduce((a,b)=>a+b,0)/4);const rarity=Math.max(2.3,Math.min(18.9,21-(avg/8)+((state.seed%37)/10))).toFixed(1);$('#rarity').textContent=`只有 ${rarity}% 玩家走到相近結局`;$('#ending').textContent=title;$('#endingText').textContent=desc;const tags=personalityTags();$('#tags').innerHTML=tags.map((x,i)=>`<span class="tag ${i===0?'hot':''}">${x}</span>`).join('');const maxKey=Object.entries(state.stats).sort((a,b)=>b[1]-a[1])[0][0];$('#compare').innerHTML=AXES.map(([k,n])=>`<div class="${k===maxKey?'champ':''}"><small>${n}</small><b>${state.stats[k]}</b></div>`).join('');$('#history').innerHTML=state.history.map(h=>`<div class="timeline-row"><span>0${h.round}</span><b>${h.label}</b><em>${h.impact.split('。')[0]}</em></div>`).join('');window._ending={title,rarity,tags}}
function challengeUrl(){const u=new URL(location.href);u.searchParams.set('q',state.scenario);u.searchParams.set('challenge','1');return u.toString()}
async function share(){const e=window._ending;const text=`我玩了「${state.scenario}」\n結局：${e.title}\n只有 ${e.rarity}% 玩家走到相近結局\n你會跟我一樣嗎？`;const url=challengeUrl();try{if(navigator.share){await navigator.share({title:'WHAT IF? 挑戰你',text,url})}else if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+url);toast('挑戰連結已複製')}else{prompt('複製這個挑戰連結',url)}}catch(_){}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1800)}
function init(){hotCards();const params=new URLSearchParams(location.search);const q=params.get('q');if(q){$('#idea').value=q;$('#count').textContent=`${q.length} / 70`;$('#start').disabled=false;if(params.get('challenge')==='1'){setTimeout(()=>startGame(q),150)}}}
$('#idea').addEventListener('input',e=>{$('#count').textContent=`${e.target.value.length} / 70`;$('#start').disabled=!e.target.value.trim()});
$('#create').addEventListener('submit',e=>{e.preventDefault();startGame($('#idea').value)});
$('#exit').addEventListener('click',()=>screen('home'));
$('#share').addEventListener('click',share);
$('#again').addEventListener('click',()=>startGame(state.scenario));
$('#newLife').addEventListener('click',()=>{history.replaceState(null,'',location.pathname);$('#idea').value='';$('#count').textContent='0 / 70';$('#start').disabled=true;screen('home')});
init();
