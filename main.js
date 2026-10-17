import * as THREE from 'three';

const SUPABASE_URL = "https://cgkmcpocfikqeawynvzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_PhTCDBstLhWJrQoam7iQRA_rThrW1vT";

const T = {
  en: { title:"SolarPunk Kyrgyzstan", restart:"Play Again", score:"Score",
    loseDebt:"Debt too high. Default.", loseLit:"Literacy collapsed.", loseNat:"Nature destroyed.", loseHap:"Trust collapsed.",
    win:"The country held together.", prosper:["Struggling","Stabilizing","Growing","Flourishing"] },
  ru: { title:"СоларПанк Кыргызстан", restart:"Играть снова", score:"Балл",
    loseDebt:"Долг слишком высок. Дефолт.", loseLit:"Грамотность рухнула.", loseNat:"Природа уничтожена.", loseHap:"Доверие рухнуло.",
    win:"Страна удержалась.", prosper:["Тяжело","Стабилизация","Рост","Процветание"] }
};
let lang = "en";
const BASE = { literacy:99, poverty:25, energy:79, debt:40, nature:38, happiness:52, tourism:42, economy:62, culture:55 };
const STATS = [
  {k:"literacy", en:"Literacy", ru:"Грамотность", low:75, sticker:v=>v>=98?"🧠":v>=90?"📚":"😐"},
  {k:"poverty", en:"Poverty", ru:"Бедность", high:45, sticker:v=>v<=15?"💚":v<=25?"🟡":"🔴"},
  {k:"energy", en:"Energy Ind.", ru:"Энергонезависим.", low:40, sticker:v=>v>=90?"⚡":"🔋"},
  {k:"debt", en:"Debt %GDP", ru:"Долг %ВВП", high:180, sticker:v=>v>=120?"💸":"💰"},
  {k:"nature", en:"Nature", ru:"Природа", low:18, sticker:v=>v>=55?"🌲":"🌿"},
  {k:"happiness", en:"Happiness", ru:"Счастье", low:25, sticker:v=>v>=70?"😊":"🙂"},
  {k:"tourism", en:"Tourism", ru:"Туризм", sticker:v=>v>=60?"🏔️":"🚶"},
  {k:"economy", en:"Economy", ru:"Экономика", sticker:v=>v>=70?"📈":"📊"},
  {k:"culture", en:"Culture", ru:"Культура", sticker:v=>v>=65?"🎭":"📜"}
];
let state={}, year=2026, score=48, sceneKey="start";

function init(){ state={...BASE}; year=2026; score=48; sceneKey="start"; document.getElementById("game-over").style.display="none"; show(); }

const scenes = {
  start: { en:"Early 2026. Glaciers retreat, forests 6.4%, country imports ~4 TWh. Debt ~40% GDP. What first?",
    ru:"Начало 2026. Ледники тают, леса 6,4%, импорт ~4 ТВт·ч. Долг ~40% ВВП. Что первым?",
    choices:[
      {en:"Big hydro + solar with foreign loans", ru:"Крупные ГЭС + солнце на кредиты", fx:{energy:14,debt:22,nature:-10,happiness:-5,economy:7}},
      {en:"Schools, small hydro, forests", ru:"Школы, малые ГЭС, леса", fx:{literacy:1,nature:7,energy:5,debt:5,happiness:6,culture:3}},
      {en:"Tourism + light industry", ru:"Туризм + лёгкая промышленность", fx:{tourism:14,economy:9,nature:-5,debt:7,poverty:-4}}
    ]},
  y29: { en:"2029. First consequences are visible.", ru:"2029. Первые последствия видны.",
    choices:[
      {en:"Double down", ru:"Удвоить ставку", fx:{energy:6,debt:12,nature:-6}},
      {en:"Repair damage", ru:"Исправить ущерб", fx:{nature:8,happiness:5,debt:4}},
      {en:"Focus on education & culture", ru:"Образование и культура", fx:{literacy:2,culture:7,happiness:6}}
    ]},
  y32: { en:"2032. Water timing shifts. Neighbors watch the rivers.", ru:"2032. Сроки воды меняются. Соседи смотрят на реки.",
    choices:[
      {en:"More external financing", ru:"Ещё внешнее финансирование", fx:{debt:18,energy:9,nature:-7}},
      {en:"Protect nature + people", ru:"Защитить природу и людей", fx:{nature:9,happiness:7,literacy:1}},
      {en:"Careful balance", ru:"Осторожный баланс", fx:{energy:4,nature:4,happiness:4,debt:6}}
    ]}
};

function apply(fx){ for(const[k,v] of Object.entries(fx)) if(state[k]!==undefined) state[k]=Math.max(0,Math.min(k==="debt"?600:100, state[k]+v));
  const good=(state.literacy+state.energy+state.nature+state.happiness+state.tourism+state.economy+state.culture)/7;
  score=Math.max(0, Math.round(good - (state.poverty*0.6 + Math.min(state.debt,150)*0.25)*0.35));
}
function check(){ if(state.debt>=180) return T[lang].loseDebt; if(state.literacy<=75) return T[lang].loseLit; if(state.nature<=18) return T[lang].loseNat; if(state.happiness<=25) return T[lang].loseHap; return null; }
function prosper(){ const a=(state.nature+state.happiness+state.energy+(100-state.poverty)+Math.max(0,100-state.debt/2))/5; return a>=70?3:a>=55?2:a>=40?1:0; }

function renderStats(){
  const el=document.getElementById("stats"); el.innerHTML="";
  STATS.forEach(s=>{ const v=Math.round(state[s.k]); let c=""; if(s.low&&v<s.low)c="bad"; else if(s.high&&v>s.high)c="bad"; else if(v>75||(s.k==="poverty"&&v<20)||(s.k==="debt"&&v<55))c="good"; else if(v<45)c="warn";
    el.innerHTML+=`<div class="stat ${c}"><span>${lang==="ru"?s.ru:s.en}</span><span class="v">${v}${s.k==="debt"?"%":""} ${s.sticker?s.sticker(v):""}</span></div>`;
  });
  document.getElementById("score").textContent=`${T[lang].score}: ${score}`;
  document.getElementById("year").textContent=year;
}

function show(){
  const sc=scenes[sceneKey]; if(!sc){ end(T[lang].win); return; }
  document.getElementById("story").textContent=sc[lang];
  const ch=document.getElementById("choices"); ch.innerHTML="";
  sc.choices.forEach(c=>{
    const b=document.createElement("button");
    const fx=Object.entries(c.fx).map(([k,v])=>`${v>0?"+":""}${v} ${lang==="ru"?(STATS.find(x=>x.k===k)?.ru||k):(STATS.find(x=>x.k===k)?.en||k)}`).join(" · ");
    b.innerHTML=`<b>${c[lang]}</b><br><small>${fx}</small>`;
    b.onclick=()=>{ apply(c.fx); year+=3; const lose=check(); if(lose){ end(lose); return; } sceneKey=sceneKey==="start"?"y29":sceneKey==="y29"?"y32":"end"; if(sceneKey==="end") end(T[lang].win); else show(); renderStats(); };
    ch.appendChild(b);
  });
  renderStats();
}

async function end(msg){
  document.getElementById("choices").innerHTML=""; document.getElementById("story").textContent="";
  document.getElementById("end-title").textContent=lang==="ru"?"Конец пути":"End of Path";
  document.getElementById("end-text").textContent=msg;
  const name=prompt(lang==="ru"?"Имя для рейтинга:":"Name for leaderboard:")||"Anonymous";
  try{ await fetch(`${SUPABASE_URL}/rest/v1/scores`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({player_name:name,score,year})}); }catch(e){}
  try{ const r=await fetch(`${SUPABASE_URL}/rest/v1/scores?select=player_name,score,year&order=score.desc&limit=8`,{headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}}); const data=await r.json();
    let h="<ol>"; data.forEach(e=>h+=`<li>${e.player_name} — ${e.score}</li>`); document.getElementById("leaderboard").innerHTML=h+"</ol>"; }catch(e){}
  document.getElementById("game-over").style.display="block";
}

// Simple 3D scene
const wrap=document.getElementById("canvas-wrap");
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50, wrap.clientWidth/wrap.clientHeight, 0.1, 100);
camera.position.set(0,1.2,3.5);
const light=new THREE.DirectionalLight(0xffffff,1.2); light.position.set(2,3,2); scene.add(light); scene.add(new THREE.AmbientLight(0x404040,0.8));
const body=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,1.4,16), new THREE.MeshStandardMaterial({color:0x3d6b4f}));
body.position.y=0.7; scene.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(0.28,16,16), new THREE.MeshStandardMaterial({color:0xf5deb3}));
head.position.y=1.6; scene.add(head);
const kalpak=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.4,8), new THREE.MeshStandardMaterial({color:0xffffff}));
kalpak.position.y=1.95; scene.add(kalpak);
function animate(){ requestAnimationFrame(animate); body.rotation.y+=0.005; head.rotation.y+=0.005; kalpak.rotation.y+=0.005; renderer.render(scene,camera); }
animate();
window.addEventListener("resize",()=>{ renderer.setSize(wrap.clientWidth,wrap.clientHeight); camera.aspect=wrap.clientWidth/wrap.clientHeight; camera.updateProjectionMatrix(); });

document.getElementById("en").onclick=()=>{lang="en"; document.querySelectorAll(".lang-btn").forEach(b=>b.classList.remove("active")); document.getElementById("en").classList.add("active"); show();};
document.getElementById("ru").onclick=()=>{lang="ru"; document.querySelectorAll(".lang-btn").forEach(b=>b.classList.remove("active")); document.getElementById("ru").classList.add("active"); show();};
document.getElementById("restart").onclick=init;
init();
