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
  {k:"literacy", en:"Literacy", ru:"Грамотность", low:70, sticker:v=>v>=98?"🧠":v>=90?"📚":v>=80?"😐":"😵"},
  {k:"poverty", en:"Poverty", ru:"Бедность", high:50, sticker:v=>v<=15?"💚":v<=25?"🟡":"🔴"},
  {k:"energy", en:"Energy Independence", ru:"Энергонезависим.", low:35, sticker:v=>v>=90?"⚡":v>=70?"🔋":"⚠️"},
  {k:"debt", en:"Debt (% GDP)", ru:"Долг (% ВВП)", high:160, sticker:v=>v>=120?"💸":v>=70?"📉":"💰"},
  {k:"nature", en:"Nature", ru:"Природа", low:15, sticker:v=>v>=55?"🌲":v>=35?"🌿":"🏜️"},
  {k:"happiness", en:"Happiness", ru:"Счастье", low:20, sticker:v=>v>=70?"😊":v>=45?"🙂":"😟"},
  {k:"tourism", en:"Tourism", ru:"Туризм", sticker:v=>v>=60?"🏔️":"🚶"},
  {k:"economy", en:"Economy", ru:"Экономика", sticker:v=>v>=70?"📈":v>=50?"📊":"📉"},
  {k:"culture", en:"Culture", ru:"Культура", sticker:v=>v>=65?"🎭":"📜"}
];
let state={}, year=2026, score=48, qIndex=0, busy=false, history=[];

function init(){ state={...BASE}; year=2026; score=48; qIndex=0; busy=false; history=[];
  document.getElementById("game-over").style.display="none";
  document.getElementById("reaction").textContent="";
  show(); renderStats(); updateCharacter(0);
}

const questions = [
  {
    en:()=>"Early 2026. Electricity is partly imported, forests cover little land, debt is moderate. What is your first priority?",
    ru:()=>"Начало 2026. Электричество частично импортируется, лесов мало, долг умеренный. Какой первый приоритет?",
    choices:[
      {en:"Build large power plants with foreign loans", ru:"Строить крупные электростанции на иностранные кредиты", fx:{energy:16,debt:18,nature:-9,happiness:-5}},
      {en:"Strengthen schools and restore forests", ru:"Укрепить школы и восстанавливать леса", fx:{literacy:2,nature:9,energy:5,happiness:7}},
      {en:"Expand tourism and light industry", ru:"Расширять туризм и лёгкую промышленность", fx:{tourism:14,economy:9,nature:-5,poverty:-6}}
    ]
  },
  {
    en:()=>`Three years later. Literacy is ${Math.round(state.literacy)}%, energy independence is ${Math.round(state.energy)}%. What do you do now?`,
    ru:()=>`Три года спустя. Грамотность ${Math.round(state.literacy)}%, энергонезависимость ${Math.round(state.energy)}%. Что делаем дальше?`,
    choices:[
      {en:"Focus on energy security", ru:"Сфокусироваться на энергобезопасности", fx:{energy:8,debt:8,nature:-4}},
      {en:"Invest in education quality", ru:"Инвестировать в качество образования", fx:{literacy:3,culture:5,happiness:4}},
      {en:"Support local businesses and jobs", ru:"Поддержать местный бизнес и рабочие места", fx:{economy:7,poverty:-4,tourism:4}}
    ]
  },
  {
    en:()=>`Nature score is ${Math.round(state.nature)} and debt is ${Math.round(state.debt)}% of GDP. How do you respond?`,
    ru:()=>`Природа ${Math.round(state.nature)}, долг ${Math.round(state.debt)}% ВВП. Как реагируем?`,
    choices:[
      {en:"Protect remaining forests and water", ru:"Защитить оставшиеся леса и воду", fx:{nature:10,happiness:5,economy:-2}},
      {en:"Take more loans for infrastructure", ru:"Взять ещё кредиты на инфраструктуру", fx:{debt:14,energy:6,economy:4}},
      {en:"Balance both carefully", ru:"Аккуратно сбалансировать оба", fx:{nature:4,debt:5,energy:3,happiness:3}}
    ]
  },
  {
    en:()=>`Poverty is ${Math.round(state.poverty)}%. Happiness is ${Math.round(state.happiness)}. What next?`,
    ru:()=>`Бедность ${Math.round(state.poverty)}%. Счастье ${Math.round(state.happiness)}. Что дальше?`,
    choices:[
      {en:"Direct support to poorer regions", ru:"Прямая поддержка бедных регионов", fx:{poverty:-7,happiness:6,debt:4}},
      {en:"Push economic growth first", ru:"Сначала ускорить экономический рост", fx:{economy:9,poverty:-3,nature:-3}},
      {en:"Strengthen culture and community", ru:"Укрепить культуру и сообщества", fx:{culture:8,happiness:5,literacy:1}}
    ]
  },
  {
    en:()=>`Energy independence is ${Math.round(state.energy)}%. Tourism is ${Math.round(state.tourism)}. Choose a direction.`,
    ru:()=>`Энергонезависимость ${Math.round(state.energy)}%. Туризм ${Math.round(state.tourism)}. Выберите направление.`,
    choices:[
      {en:"Small hydro and rooftop solar", ru:"Малые ГЭС и крышная солнечная энергия", fx:{energy:7,nature:3,debt:4}},
      {en:"Develop mountain tourism carefully", ru:"Аккуратно развивать горный туризм", fx:{tourism:10,economy:5,nature:-2}},
      {en:"Cut spending and reduce debt", ru:"Сократить расходы и уменьшить долг", fx:{debt:-8,economy:-3,happiness:-2}}
    ]
  },
  {
    en:()=>`Culture is ${Math.round(state.culture)} and literacy is ${Math.round(state.literacy)}%. What matters more now?`,
    ru:()=>`Культура ${Math.round(state.culture)}, грамотность ${Math.round(state.literacy)}%. Что важнее сейчас?`,
    choices:[
      {en:"Teacher training and rural schools", ru:"Подготовка учителей и сельские школы", fx:{literacy:3,culture:4,happiness:4}},
      {en:"Festivals and cultural preservation", ru:"Фестивали и сохранение культуры", fx:{culture:9,happiness:5,tourism:3}},
      {en:"Vocational training for jobs", ru:"Профессиональное обучение для работы", fx:{economy:6,poverty:-3,literacy:1}}
    ]
  },
  {
    en:()=>`Debt is ${Math.round(state.debt)}% of GDP. Nature is ${Math.round(state.nature)}. How do you handle pressure?`,
    ru:()=>`Долг ${Math.round(state.debt)}% ВВП. Природа ${Math.round(state.nature)}. Как справляемся с давлением?`,
    choices:[
      {en:"Renegotiate and slow big projects", ru:"Пересмотреть условия и замедлить крупные проекты", fx:{debt:-6,energy:-2,happiness:3}},
      {en:"Double down on energy exports", ru:"Удвоить ставку на экспорт энергии", fx:{energy:10,economy:6,nature:-6,debt:5}},
      {en:"Community forest and water projects", ru:"Общественные проекты по лесам и воде", fx:{nature:8,happiness:6,culture:3}}
    ]
  },
  {
    en:()=>`Happiness is ${Math.round(state.happiness)}. Economy is ${Math.round(state.economy)}. Final stretch decisions.`,
    ru:()=>`Счастье ${Math.round(state.happiness)}. Экономика ${Math.round(state.economy)}. Решения на финишной прямой.`,
    choices:[
      {en:"Public services and trust-building", ru:"Общественные услуги и укрепление доверия", fx:{happiness:8,literacy:1,debt:3}},
      {en:"Attract more investment", ru:"Привлечь больше инвестиций", fx:{economy:8,debt:7,tourism:4}},
      {en:"Protect natural heritage", ru:"Защитить природное наследие", fx:{nature:7,culture:4,tourism:3}}
    ]
  },
  {
    en:()=>`Almost done. Poverty ${Math.round(state.poverty)}%, energy ${Math.round(state.energy)}%. One more choice.`,
    ru:()=>`Почти конец. Бедность ${Math.round(state.poverty)}%, энергия ${Math.round(state.energy)}%. Ещё один выбор.`,
    choices:[
      {en:"Stabilize and consolidate gains", ru:"Стабилизировать и закрепить успехи", fx:{happiness:4,economy:3,nature:2}},
      {en:"One last big infrastructure push", ru:"Последний рывок в инфраструктуру", fx:{energy:6,debt:10,nature:-4}},
      {en:"Focus on the next generation", ru:"Сфокусироваться на следующем поколении", fx:{literacy:2,culture:5,happiness:5}}
    ]
  },
  {
    en:()=>`Final year. Look at the numbers and choose the closing path.`,
    ru:()=>`Финальный год. Посмотрите на цифры и выберите завершающий путь.`,
    choices:[
      {en:"Lock in nature and education", ru:"Закрепить природу и образование", fx:{nature:6,literacy:2,happiness:5}},
      {en:"Push growth even if debt rises", ru:"Давить на рост, даже если долг растёт", fx:{economy:7,debt:8,nature:-3}},
      {en:"Balanced close", ru:"Сбалансированное завершение", fx:{energy:3,nature:3,happiness:3,debt:3}}
    ]
  }
];

function apply(fx){ const deltas=[]; for(const[k,v] of Object.entries(fx)) if(state[k]!==undefined){ const old=state[k]; state[k]=Math.max(0,Math.min(k==="debt"?600:100, state[k]+v)); deltas.push({k,v,old,now:state[k]}); }
  const good=(state.literacy+state.energy+state.nature+state.happiness+state.tourism+state.economy+state.culture)/7;
  score=Math.max(0, Math.round(good - (state.poverty*0.6 + Math.min(state.debt,150)*0.25)*0.35));
  return deltas;
}
function check(){ if(state.debt>=180) return T[lang].loseDebt; if(state.literacy<=75) return T[lang].loseLit; if(state.nature<=18) return T[lang].loseNat; if(state.happiness<=25) return T[lang].loseHap; return null; }
function prosperLevel(){ const a=(state.nature+state.happiness+state.energy+(100-state.poverty)+Math.max(0,100-state.debt/2))/5; return a>=70?3:a>=55?2:a>=40?1:0; }

function renderStats(){
  const el=document.getElementById("stats"); el.innerHTML="";
  STATS.forEach(s=>{
    const v=Math.round(state[s.k]);
    let c="";
    if(s.low && v < s.low) c="bad";
    else if(s.high && v > s.high) c="bad";
    else if(v>75 || (s.k==="poverty"&&v<20) || (s.k==="debt"&&v<55)) c="good";
    const sticker = s.sticker ? s.sticker(v) : "";
    const crit = s.low ? ` (lose <${s.low})` : s.high ? ` (lose >${s.high})` : "";
    el.innerHTML+=`<div class="stat" id="stat-${s.k}"><span>${lang==="ru"?s.ru:s.en}${crit}</span><span class="v">${v}${s.k==="debt"?"%":""} ${sticker}</span></div>`;
  });
  document.getElementById("score").textContent=`${T[lang].score}: ${score}`;
  document.getElementById("year").textContent=year;
}

function show(){
  if(qIndex >= questions.length){ end(T[lang].win); return; }
  const q = questions[qIndex];
  document.getElementById("story").textContent = q[lang]();
  const ch = document.getElementById("choices"); ch.innerHTML="";
  q.choices.forEach(c=>{
    const b=document.createElement("button");
    b.textContent = c[lang];
    b.onclick=async()=>{
      if(busy) return; busy=true;
      history.push(c[lang]);
      const deltas = apply(c.fx);
      year += 1;
      renderStats();
      await animateDeltas(deltas);
      const lose = check();
      if(lose){ end(lose); return; }
      qIndex++;
      if(qIndex >= questions.length) end(T[lang].win);
      else show();
      busy=false;
    };
    ch.appendChild(b);
  });
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

// Better Kalpak (white body, black band, tassel) + more detailed face
const kalpakGroup = new THREE.Group();
const kalpakBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.36, 0.38, 12),
  new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.7})
);
kalpakBody.position.y = 0.05;
const kalpakBand = new THREE.Mesh(
  new THREE.TorusGeometry(0.34, 0.04, 8, 16),
  new THREE.MeshStandardMaterial({color:0x111111})
);
kalpakBand.rotation.x = Math.PI/2;
kalpakBand.position.y = -0.12;
const tassel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.01, 0.18, 6),
  new THREE.MeshStandardMaterial({color:0x222222})
);
tassel.position.y = 0.28;
kalpakGroup.add(kalpakBody, kalpakBand, tassel);
kalpakGroup.position.y = 1.72;
scene.add(kalpakGroup);

const eyeL=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8), new THREE.MeshStandardMaterial({color:0x111111}));
const eyeR=eyeL.clone();
eyeL.position.set(-0.07,1.48,0.25); eyeR.position.set(0.07,1.48,0.25); scene.add(eyeL,eyeR);

const mouth=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.018,0.015), new THREE.MeshStandardMaterial({color:0x442222}));
mouth.position.set(0,1.36,0.26); scene.add(mouth);

// Face details
const browL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), new THREE.MeshStandardMaterial({color:0x333333}));
const browR = browL.clone();
browL.position.set(-0.07, 1.54, 0.26); browR.position.set(0.07, 1.54, 0.26);
scene.add(browL, browR);

const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshStandardMaterial({color:0xe8c9a0}));
nose.position.set(0, 1.44, 0.27);
scene.add(nose);

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
  kalpakGroup.scale.setScalar(1 + level * 0.08);
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
  kalpakGroup.rotation.y += 0.003;

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
