import * as THREE from 'three';

const SUPABASE_URL = "https://cgkmcpocfikqeawynvzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_PhTCDBstLhWJrQoam7iQRA_rThrW1vT";

const T = {
  en: {
    score:"Score", restart:"Play Again", save:"Save Score", namePh:"Your name",
    loseDebt:"Debt too high. The country defaults.",
    loseLit:"Literacy collapsed. The next generation is lost.",
    loseNat:"Nature is destroyed beyond recovery.",
    loseHap:"Trust collapsed. Society breaks.",
    win:"The country held together. Not perfect, but alive.",
    up:"Great move!", down:"Ouch..."
  },
  ru: {
    score:"Балл", restart:"Играть снова", save:"Сохранить", namePh:"Ваше имя",
    loseDebt:"Долг слишком высок. Дефолт.",
    loseLit:"Грамотность рухнула.",
    loseNat:"Природа уничтожена.",
    loseHap:"Доверие рухнуло.",
    win:"Страна удержалась.",
    up:"Отличный ход!", down:"Больно..."
  }
};
let lang = "en";
const BASE = { literacy:99, poverty:25, energy:79, debt:40, nature:38, happiness:52, tourism:42, economy:62, culture:55 };
const STATS = [
  {k:"literacy", en:"Literacy", ru:"Грамотность", low:75},
  {k:"poverty", en:"Poverty", ru:"Бедность", high:45},
  {k:"energy", en:"Energy Independence", ru:"Энергонезависим.", low:40},
  {k:"debt", en:"Debt (% GDP)", ru:"Долг (% ВВП)", high:180},
  {k:"nature", en:"Nature", ru:"Природа", low:18},
  {k:"happiness", en:"Happiness", ru:"Счастье", low:25},
  {k:"tourism", en:"Tourism", ru:"Туризм"},
  {k:"economy", en:"Economy", ru:"Экономика"},
  {k:"culture", en:"Culture", ru:"Культура"}
];
let state={}, year=2026, score=48, sceneKey="start", busy=false;

function init(){ state={...BASE}; year=2026; score=48; sceneKey="start"; busy=false;
  document.getElementById("game-over").style.display="none";
  document.getElementById("reaction").textContent="";
  show(); renderStats(); updateCharacter(0);
}

const scenes = {
  start: {
    en:"Early 2026. The country imports a lot of electricity, forests are small, and debt is moderate. What do you focus on first?",
    ru:"Начало 2026. Страна много импортирует электричество, лесов мало, долг умеренный. На что сфокусироваться первым?",
    choices:[
      {en:"Build big power plants with loans", ru:"Строить большие электростанции на кредиты", fx:{energy:15,debt:20,nature:-8,happiness:-4}},
      {en:"Improve schools and plant trees", ru:"Улучшить школы и посадить деревья", fx:{literacy:2,nature:8,energy:4,happiness:6}},
      {en:"Grow tourism and small factories", ru:"Развивать туризм и маленькие заводы", fx:{tourism:12,economy:8,nature:-4,poverty:-5}}
    ]
  },
  y29: {
    en:"Three years later. You can see what your first choice did. What next?",
    ru:"Три года спустя. Видно, что сделал первый выбор. Что дальше?",
    choices:[
      {en:"Continue the same path", ru:"Продолжить тот же путь", fx:{energy:5,debt:10,nature:-5}},
      {en:"Try to fix the damage", ru:"Попытаться исправить ущерб", fx:{nature:7,happiness:5,debt:3}},
      {en:"Invest more in people", ru:"Больше инвестировать в людей", fx:{literacy:2,culture:6,happiness:5}}
    ]
  },
  y32: {
    en:"Another three years. The country is at a turning point. Final choice?",
    ru:"Ещё три года. Страна на перепутье. Финальный выбор?",
    choices:[
      {en:"Take more loans for big projects", ru:"Взять ещё кредиты на большие проекты", fx:{debt:15,energy:8,nature:-6}},
      {en:"Protect nature and education", ru:"Защитить природу и образование", fx:{nature:8,happiness:6,literacy:1}},
      {en:"Balance everything carefully", ru:"Аккуратно сбалансировать всё", fx:{energy:4,nature:3,happiness:4,debt:5}}
    ]
  }
};

function apply(fx){ const deltas=[]; for(const[k,v] of Object.entries(fx)) if(state[k]!==undefined){ const old=state[k]; state[k]=Math.max(0,Math.min(k==="debt"?600:100, state[k]+v)); deltas.push({k,v,old,now:state[k]}); }
  const good=(state.literacy+state.energy+state.nature+state.happiness+state.tourism+state.economy+state.culture)/7;
  score=Math.max(0, Math.round(good - (state.poverty*0.6 + Math.min(state.debt,150)*0.25)*0.35));
  return deltas;
}
function check(){ if(state.debt>=180) return T[lang].loseDebt; if(state.literacy<=75) return T[lang].loseLit; if(state.nature<=18) return T[lang].loseNat; if(state.happiness<=25) return T[lang].loseHap; return null; }
function prosperLevel(){ const a=(state.nature+state.happiness+state.energy+(100-state.poverty)+Math.max(0,100-state.debt/2))/5; return a>=70?3:a>=55?2:a>=40?1:0; }

function renderStats(){
  const el=document.getElementById("stats"); el.innerHTML="";
  STATS.forEach(s=>{ const v=Math.round(state[s.k]); let c=""; if(s.low&&v<s.low)c="bad"; else if(s.high&&v>s.high)c="bad"; else if(v>75||(s.k==="poverty"&&v<20)||(s.k==="debt"&&v<55))c="good";
    el.innerHTML+=`<div class="stat" id="stat-${s.k}"><span>${lang==="ru"?s.ru:s.en}</span><span class="v">${v}${s.k==="debt"?"%":""}</span></div>`;
  });
  document.getElementById("score").textContent=`${T[lang].score}: ${score}`;
  document.getElementById("year").textContent=year;
}

function fireworks(){
  const c=document.getElementById("fireworks"); c.width=window.innerWidth; c.height=window.innerHeight;
  const ctx=c.getContext("2d"); let particles=[];
  for(let i=0;i<40;i++) particles.push({x:c.width/2,y:c.height/2,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,life:60,color:`hsl(${Math.random()*60+40},100%,60%)`});
  function frame(){ ctx.clearRect(0,0,c.width,c.height); particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life--; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,3,3); }); particles=particles.filter(p=>p.life>0); if(particles.length) requestAnimationFrame(frame); else ctx.clearRect(0,0,c.width,c.height); }
  frame();
}

async function animateDeltas(deltas){
  const reaction=document.getElementById("reaction");
  let anyUp=false, anyDown=false;
  for(const d of deltas){
    const el=document.getElementById("stat-"+d.k); if(!el) continue;
    const up = (d.k==="poverty"||d.k==="debt") ? d.v<0 : d.v>0;
    if(up) anyUp=true; else anyDown=true;
    el.classList.add(up?"flash-up":"flash-down");
    reaction.textContent = up ? T[lang].up : T[lang].down;
    if(up) fireworks();
    triggerReaction(up);
    await new Promise(r=>setTimeout(r,700));
    el.classList.remove("flash-up","flash-down");
  }
  reaction.textContent="";
  updateCharacter(prosperLevel());
}

function show(){
  const sc=scenes[sceneKey]; if(!sc){ end(T[lang].win); return; }
  document.getElementById("story").textContent=sc[lang];
  const ch=document.getElementById("choices"); ch.innerHTML="";
  sc.choices.forEach(c=>{
    const b=document.createElement("button");
    b.textContent=c[lang];
    b.onclick=async()=>{ if(busy) return; busy=true; const deltas=apply(c.fx); year+=3; renderStats(); await animateDeltas(deltas); const lose=check(); if(lose){ end(lose); return; } sceneKey=sceneKey==="start"?"y29":sceneKey==="y29"?"y32":"end"; if(sceneKey==="end") end(T[lang].win); else show(); busy=false; };
    ch.appendChild(b);
  });
}

function end(msg){
  document.getElementById("choices").innerHTML=""; document.getElementById("story").textContent="";
  document.getElementById("end-title").textContent=lang==="ru"?"Конец пути":"End of Path";
  document.getElementById("end-text").textContent=msg;
  document.getElementById("game-over").style.display="block";
  document.getElementById("player-name").placeholder=T[lang].namePh;
  document.getElementById("save-score").textContent=T[lang].save;
}

async function saveScore(){
  const name=document.getElementById("player-name").value.trim()||"Anonymous";
  try{ await fetch(`${SUPABASE_URL}/rest/v1/scores`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({player_name:name,score,year})}); }catch(e){}
  try{ const r=await fetch(`${SUPABASE_URL}/rest/v1/scores?select=player_name,score&order=score.desc&limit=8`,{headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}}); const data=await r.json();
    let h="<ol>"; data.forEach(e=>h+=`<li>${e.player_name} — ${e.score}</li>`); document.getElementById("leaderboard").innerHTML=h+"</ol>"; }catch(e){}
}

// 3D character with clearer reactions
const wrap=document.getElementById("canvas-wrap");
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50, wrap.clientWidth/wrap.clientHeight, 0.1, 100);
camera.position.set(0,1.4,4);
const light=new THREE.DirectionalLight(0xffffff,1.3); light.position.set(2,4,3); scene.add(light); scene.add(new THREE.AmbientLight(0x505050,1));

const bodyMat=new THREE.MeshStandardMaterial({color:0x3d6b4f});
const body=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.38,1.2,16), bodyMat);
body.position.y=0.6; scene.add(body);

const headMat=new THREE.MeshStandardMaterial({color:0xf5deb3});
const head=new THREE.Mesh(new THREE.SphereGeometry(0.28,24,24), headMat);
head.position.y=1.45; scene.add(head);

const kalpak=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.42,8), new THREE.MeshStandardMaterial({color:0xffffff}));
kalpak.position.y=1.82; scene.add(kalpak);

const eyeL=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8), new THREE.MeshStandardMaterial({color:0x111111}));
const eyeR=eyeL.clone();
eyeL.position.set(-0.07,1.48,0.24); eyeR.position.set(0.07,1.48,0.24); scene.add(eyeL,eyeR);

const mouth=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,0.02), new THREE.MeshStandardMaterial({color:0x333333}));
mouth.position.set(0,1.38,0.25); scene.add(mouth);

const armL=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.55,8), bodyMat);
const armR=armL.clone();
armL.position.set(-0.38,0.85,0); armR.position.set(0.38,0.85,0);
armL.rotation.z=0.3; armR.rotation.z=-0.3;
scene.add(armL,armR);

let reactionAnim = 0;
let reactionType = 0; // 1 = good, -1 = bad

function updateCharacter(level){
  const colors=[0x6d4c41,0x3d6b4f,0x43a047,0xffd54f];
  bodyMat.color.setHex(colors[Math.min(level,3)]);
  kalpak.scale.setScalar(1 + level * 0.08);
  head.scale.set(1, 1 + level*0.03, 1);
}

function triggerReaction(isGood){
  reactionAnim = 1;
  reactionType = isGood ? 1 : -1;
}

function animate(){
  requestAnimationFrame(animate);
  body.rotation.y += 0.003;
  head.rotation.y += 0.003;
  kalpak.rotation.y += 0.003;

  if(reactionAnim > 0){
    reactionAnim -= 0.015;
    const t = Math.sin(reactionAnim * Math.PI);
    if(reactionType > 0){
      // Happy: lean back, arms up, smile
      body.rotation.x = -t * 0.25;
      head.rotation.x = -t * 0.15;
      armL.rotation.z = 0.3 - t * 1.2;
      armR.rotation.z = -0.3 + t * 1.2;
      mouth.scale.y = 1 + t * 3;
    } else {
      // Sad: lean forward, arms down, frown
      body.rotation.x = t * 0.3;
      head.rotation.x = t * 0.25;
      armL.rotation.z = 0.3 + t * 0.5;
      armR.rotation.z = -0.3 - t * 0.5;
      mouth.scale.y = 1 - t * 0.6;
    }
  } else {
    body.rotation.x *= 0.92;
    head.rotation.x *= 0.92;
    armL.rotation.z = 0.3 + (armL.rotation.z - 0.3) * 0.9;
    armR.rotation.z = -0.3 + (armR.rotation.z + 0.3) * 0.9;
    mouth.scale.y = 1 + (mouth.scale.y - 1) * 0.85;
  }
  renderer.render(scene,camera);
}
animate();
window.addEventListener("resize",()=>{ renderer.setSize(wrap.clientWidth,wrap.clientHeight); camera.aspect=wrap.clientWidth/wrap.clientHeight; camera.updateProjectionMatrix(); });

document.getElementById("en").onclick=()=>{lang="en"; document.querySelectorAll(".lang-btn").forEach(b=>b.classList.remove("active")); document.getElementById("en").classList.add("active"); show();};
document.getElementById("ru").onclick=()=>{lang="ru"; document.querySelectorAll(".lang-btn").forEach(b=>b.classList.remove("active")); document.getElementById("ru").classList.add("active"); show();};
document.getElementById("restart").onclick=init;
document.getElementById("save-score").onclick=saveScore;
init();
