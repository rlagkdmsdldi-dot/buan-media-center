/* 부안미디어센터 픽셀 마을
   - 캐릭터는 '마을 길'(첫 화면 아래, 맨 아래 바닥) 위에서만 천천히 걸어서 글자를 가리지 않아요.
   - 가끔 두 캐릭터가 서로 마주 보고 짧게 대화해요. 한 번에 한 쌍만, 20초 안팎에 한 번씩.
   - 말풍선이 뜬 캐릭터를 누르면 관련 메뉴로 이동해요.
   - 첫 화면 하늘에는 픽셀 구름이 흐르고, 가끔 촬영 드론이 날아가요.
   - 관리자 기본 설정 '픽셀 캐릭터 보이기'로 켜고 끄고, 방문자는 맨 아래 '캐릭터 숨기기'로 끌 수 있어요.
   - '동작 줄이기'를 켠 사람에게는 움직임 없이 제자리에 서 있어요. */
(function(){
  // 캐릭터: 나이와 모습이 다양한 부안 사람들
  const PALS = [
    { name:"부미",          hair:"#3a2a20", style:"short", shirt:"#E08020", item:"camera" },             // 0 촬영하는 청년
    { name:"안디",          hair:"#5a3a2a", style:"long",  shirt:"#D05080", item:"mic" },                // 1 아나운서
    { name:"미어 감독",     hair:"#1f1a17", style:"short", shirt:"#008090", item:"clapper", glasses:1 }, // 2 영화감독
    { name:"사장님",        hair:"#2b2b2b", style:"cap",   shirt:"#70A030", item:"phone", cap:"#70A030" }, // 3 소상공인
    { name:"순자 할머니",   hair:"#c9c9c9", style:"bun",   shirt:"#8060A0", item:"phone", skirt:"#5b4478" }, // 4 할머니
    { name:"만수 할아버지", hair:"#d8d8d8", style:"short", shirt:"#004070", item:"cane", glasses:1 },    // 5 할아버지
    { name:"콩이",          hair:"#3a2a20", style:"long",  shirt:"#f2b705", item:"none", kid:1, skirt:"#e0708a" }, // 6 어린이
    { name:"하루",          hair:"#1f1a17", style:"cap",   shirt:"#3d7bd9", item:"phone", cap:"#1b2433" }, // 7 학생
    { name:"영희 이모",     hair:"#7a4a2a", style:"long",  shirt:"#9ccc65", item:"bag", skirt:"#3f6f8f" },     // 8 동네 이모
    { name:"준호",          hair:"#2b2b2b", style:"cap",   shirt:"#e2543b", item:"none", kid:1, cap:"#e2543b" }, // 9 초등학생
    { name:"민지",          hair:"#1f1a17", style:"long",  shirt:"#7fc4e8", item:"laptop" },                 // 10 대학생
    { name:"김 반장님",     hair:"#4a4a4a", style:"bald",  shirt:"#8d6e63", item:"phone" },                  // 11 마을 반장님
    { name:"드론 삼촌",     hair:"#2b2b2b", style:"short", shirt:"#455a64", item:"remote", glasses:1 },      // 12 드론 날리는 삼촌
    { name:"수진 선생님",   hair:"#4a2c20", style:"bun",   shirt:"#f48fb1", item:"book", skirt:"#5c6bc0" },  // 13 강사 선생님
    { name:"복례 할머니",   hair:"#e6e6e6", style:"short", shirt:"#e57373", item:"bag" },                   // 14 시장 가는 할머니
    { name:"서윤",          hair:"#5a3a2a", style:"long",  shirt:"#ba68c8", item:"camera", kid:1, skirt:"#ffb74d" } // 15 사진 좋아하는 아이
  ];
  // 혼잣말 (가끔)
  const SOLO = {
    0:[["수업 보러 갈래요?","#edu"]], 1:[["유튜브 보러 가요","#video"]], 2:[["우리가 만든 영화!","#film"]],
    3:[["우리 가게 놀러 와요","#mall"]], 4:[["스마트폰 배우러 왔어요","#edu"]], 5:[["허허, 날씨 좋구먼","#home"]],
    6:[["드론이다!","#video"]], 7:[["스튜디오 빌리고 싶다","#rent"]], 8:[["장 보고 수업 가야지","#edu"]],
    9:[["나도 유튜버 할래!","#video"]], 10:[["과제 영상 찍어야 해","#rent"]], 11:[["우리 마을 영화도 찍자!","#film"]],
    12:[["드론 띄워 볼까?","#video"]], 13:[["오늘 수업 준비 끝!","#edu"]], 14:[["손주 사진 보내야지","#edu"]], 15:[["찰칵! 예쁘다","#edu"]]
  };
  // 대화: [말하는 사람, 대답하는 사람, 첫마디, 대답, 누르면 갈 곳]
  const TALKS = [
    [4,5,"영감, 나 유튜브 배웠어요!","허허, 나도 수업 들어볼까?","#edu"],
    [4,6,"콩아, 사진 찍어줄까?","할머니, 같이 배우러 가요!","#edu"],
    [6,2,"감독님, 저도 영화 찍을래요!","그럼 영화 교실로 와요!","#film"],
    [5,2,"영화에 나도 나올 수 있나?","그럼요, 주인공 하세요!","#film"],
    [3,1,"라이브 방송 너무 떨려요…","센터에서 연습해 봐요!","#mall"],
    [7,0,"카메라 빌릴 수 있어요?","정회원이면 돼요!","#rent"],
    [1,7,"유튜브 구독했어요?","알림 설정까지 했죠!","#video"],
    [0,3,"가게 영상 언제 찍어요?","스튜디오 예약했어요!","#rent"],
    [3,7,"우리 가게 블로그 봤어?","네, 사진 예뻐요!","#mall"],
    [8,9,"준호야, 수업 늦겠다!","유튜브 교실 재밌어요!","#edu"],
    [9,6,"콩이야, 드론 봤어?","응! 나도 찍어보고 싶어","#video"],
    [8,4,"어머님, 스마트폰 배우세요?","응, 손주한테 영상 보내려고","#edu"],
    [10,0,"노트북 빌릴 수 있어요?","정회원이면 가능해요!","#rent"],
    [10,1,"아나운서 되려면 어떻게 해요?","스피치 수업부터 들어봐요!","#edu"],
    [11,3,"우리 가게도 라이브 해볼까?","센터에서 배우면 돼요!","#mall"],
    [11,7,"요즘 학생들은 영상 잘 찍더라","반장님도 배우실 수 있어요!","#edu"],
    [12,9,"저기 드론 보이지?","우와, 삼촌이 날린 거예요?","#video"],
    [13,4,"어머님, 오늘도 오셨네요!","선생님 수업이 재밌어서요","#edu"],
    [14,5,"영감, 영화 보러 가요","우리 동네 사람들이 만들었대","#film"],
    [15,6,"콩이야, 사진 찍어줄게!","김치~!","#edu"],
    [12,0,"드론 촬영 같이 할래요?","좋아요, 장비 빌려 올게요!","#rent"],
    [13,10,"민지 씨, 과제 잘 돼가요?","편집실에서 하고 있어요!","#rent"]
  ];
  // 마을 길마다 이 중에서 매번 다르게 골라서 나와요
  const POOLS = { 0:[4,5,6,2,8,9,12,14,15], 1:[3,1,7,0,10,11,13] };
  function pickCast(pool, n){
    const pairs = TALKS.filter(t => pool.includes(t[0]) && pool.includes(t[1]));
    const cast = [];
    if(pairs.length){ const t = pairs[Math.floor(Math.random()*pairs.length)]; cast.push(t[0], t[1]); }
    const rest = pool.filter(i => !cast.includes(i)).sort(() => Math.random() - .5);
    while(cast.length < n && rest.length) cast.push(rest.shift());
    return cast.slice(0, n);
  }

  // ---------- 픽셀 그림 ----------
  const COL = {k:"#1b2433", s:"#f2c9a0", e:"#1b2433", m:"#e0708a", p:"#2c3e66", d:"#3b4352", w:"#ffffff", g:"#9aa3b0", r:"#e23b3b", B:"#8a5a3c",
               G:"#7cc35a", D:"#5ea443", L:"#b47b52", Y:"#ffd84a", P:"#ff8fb0", T:"#3f8f3a", R:"#d9534f", W:"#f4efe6", N:"#6c7a91", C:"#ffffff", c:"#dfe9f5", o:"#ff7a00"};
  function draw(rows, scale, extra){
    const w = Math.max(...rows.map(r=>r.length)), h = rows.length;
    const cv = document.createElement("canvas"); cv.width = w*scale; cv.height = h*scale;
    const g = cv.getContext("2d"), col = Object.assign({}, COL, extra||{});
    rows.forEach((row,y) => [...row].forEach((ch,x) => { if(ch!=="." && col[ch]){ g.fillStyle = col[ch]; g.fillRect(x*scale,y*scale,scale,scale); } }));
    return cv.toDataURL();
  }
  const set = (rows, y, x, ch) => { rows[y] = rows[y].slice(0,x) + ch + rows[y].slice(x+ch.length); };
  // 소품: 오른손(10번째 칸) 옆에 붙어요
  const ITEMS = {
    camera: {top:9,  rows:[".kkk.","kdddk","kdwdk","kdddk",".kkk."]},
    mic:    {top:7,  rows:[".kk..","kggk.",".kk..",".kd..",".kd..",".kd.."]},
    clapper:{top:9,  rows:["kwkwk","kkkkk","kdddk","kdddk","kkkkk"]},
    phone:  {top:9,  rows:["kkkk.","krrk.","kwwk.","kwwk.","kkkk."]},
    cane:   {top:9,  rows:["BBB..","..B..","..B..","..B..","..B..","..B..","..B.."]},
    bag:    {top:11, rows:[".kk..","k..k.","kBBk.","kLLk.","kkkk."]},
    laptop: {top:10, rows:["kkkkk","kgggk","kgwgk","kkkkk"]},
    remote: {top:9,  rows:["k...k",".kkk.","kgggk","kdrdk","kkkkk"]},
    book:   {top:10, rows:["kkkk.","kRRk.","kRWk.","kRRk.","kkkk."]},
    none:   {top:9,  rows:[]}
  };
  // 귀여운 2등신: 큰 머리(8줄) + 가는 몸(4줄, 양손 보임) + 짧은 다리(3줄)
  function palFrame(p, f){
    const rows = [
      "...kkkkkk...","..khhhhhhk..",".khhhhhhhhk.",".khsssssshk.",
      ".kssessessk.",".kmssssssmk.","..kssmmssk..","...kkkkkk...",
      "...kcccck...","..kcccccck..",".kckcccckck.",".kckcccckck.",
      "..skppppks.."
    ];
    if(p.style === "long"){ set(rows,4,1,"h"); set(rows,4,10,"h"); set(rows,5,1,"h"); set(rows,5,10,"h"); set(rows,6,1,"kh"); set(rows,6,9,"hk"); }
    if(p.style === "bun"){ rows[0] = "....khhk...."; rows[1] = "..kkhhhhkk.."; }
    if(p.style === "cap"){ rows[0] = "...kkkkkk..."; rows[1] = "..kqqqqqqk.."; rows[2] = ".kqqqqqqqqkk"; rows[3] = ".khsssssshk."; }
    if(p.style === "bald"){ rows[1] = "..kssssssk.."; rows[2] = ".khsssssshk."; }
    if(p.glasses){ rows[4] = ".ksgeggegsk."; }
    let legs = [["...kppppk...","...kp..pk...","...kk..kk..."],["...kppppk...","..kp....pk..","..kk....kk.."]];
    if(p.skirt){ rows[12] = "..skzzzzks.."; legs = [["..kzzzzzzk..","...ks..sk...","...kk..kk..."],["..kzzzzzzk..","..ks....sk..","..kk....kk.."]]; }
    const all = rows.concat(legs[f]).map(r => r.padEnd(16,"."));
    const it = ITEMS[p.item] || ITEMS.none;
    it.rows.forEach((r,i) => { const y = it.top+i; if(all[y]) all[y] = all[y].slice(0,10) + r.replace(/\./g, (m, j) => all[y][10+j] || ".") + all[y].slice(15); });
    return draw(all, p.kid ? 3 : 4, {h:p.hair, c:p.shirt, q:p.cap||"#333", z:p.skirt||"#2c3e66"});
  }
  const GROUND = draw(["DGGDGGGDGGDGGGGD","GGGGGGGGGGGGGGGG","GGDGGGGGGDGGGGGG","GGGGGGGGGGGGGGGG","LLLLLLLLLLLLLLLL","LBLLLLLLLBLLLLLL","LLLLLBLLLLLLLBLL","LLLLLLLLLLLLLLLL"], 4);
  const TREE = draw(["...TTTT...","..TTTTTT..",".TTTDTTTT.","TTTTTTTDTT","TTDTTTTTTT",".TTTTTTTT.","..TTTTTT..","....BB....","....BB....","....BB...."], 4);
  const HOUSE = draw(["....RRRR....","...RRRRRR...","..RRRRRRRR..",".RRRRRRRRRR.","RRRRRRRRRRRR",".WWWWWWWWWW.",".WkkWWWWkkW.",".WkkWWWWkkW.",".WWWWBBWWWW.",".WWWWBBWWWW."], 4);
  const FLOWER = draw([".Y.","YoY",".Y.",".D."], 4);
  const FLOWER2 = draw([".P.","PYP",".P.",".D."], 4);
  const CLOUD = draw(["....CCCC......","..CCCCCCCC....",".CCCCCCCCCCC..","CCCCCCCCCCCCCC","ccccccccccccc."], 6);
  // 드론 세 종류: 검은 촬영 드론, 하얀 카메라 드론, 상자 나르는 배달 드론
  const DRONES = [
    { w:56, speed:70, frames:[
      draw(["kkkk......kkkk","....kkkkkk....","...kNNNNNNk...","...kNNrNNNk...","....kkkkkk....",".....k..k....."], 4),
      draw([".kk........kk.","....kkkkkk....","...kNNNNNNk...","...kNNNNNNk...","....kkkkkk....",".....k..k....."], 4)] },
    { w:60, speed:85, frames:[
      draw(["gggg......gggg","....kkkkkk....","...kCCCCCCk...","...kCCrCCCk...","....kkkkkk....",".....kddk.....",".....kdwk.....","......kk......"], 4),
      draw([".gg........gg.","....kkkkkk....","...kCCCCCCk...","...kCCCCCCk...","....kkkkkk....",".....kddk.....",".....kdwk.....","......kk......"], 4)] },
    { w:72, speed:52, frames:[
      draw(["kkkk..........kkkk","....kkkkkkkkkk....","....kooooooook....","....kkkkkkkkkk....",".......k..k.......","......kkkkkk......","......kLLLLk......","......kLBBLk......","......kLLLLk......","......kkkkkk......"], 4),
      draw([".kk............kk.","....kkkkkkkkkk....","....kooooooook....","....kkkkkkkkkk....",".......k..k.......","......kkkkkk......","......kLLLLk......","......kLBBLk......","......kLLLLk......","......kkkkkk......"], 4)] }
  ];


  let started = false;
  function start(){
    const S = window.BMC_SETTINGS || {};
    if(S.pixelPals === false || started) return;
    started = true;
    let off = false; try{ off = !!localStorage.getItem("bmc-pals-off"); }catch(_){}
    addToggle(off);
    if(off) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 760;

    const css = document.createElement("style");
    css.textContent = `
      .pal-ground{position:relative;height:96px;overflow:visible;background:url(${GROUND}) repeat-x left bottom/64px 32px;pointer-events:none}
      .pal-ground .deco{position:absolute;bottom:26px;image-rendering:pixelated}
      .pal{position:absolute;bottom:22px;left:0;cursor:pointer;pointer-events:auto;border:0;background:none;padding:0;z-index:2}
      .pal img{width:100%;image-rendering:pixelated;display:block}
      .pal.left img{transform:scaleX(-1)}
      .pal .bub{position:absolute;bottom:100%;left:50%;transform:translate(-50%,6px);margin-bottom:4px;background:#fff;color:#13233a;border:2px solid #1b2433;border-radius:10px;padding:5px 10px;font:700 13px/1.3 inherit;white-space:nowrap;opacity:0;transition:opacity .3s, transform .3s;box-shadow:2px 2px 0 #1b2433;pointer-events:none}
      .pal .bub::after{content:"";position:absolute;top:100%;left:50%;margin-left:-5px;border:5px solid transparent;border-top-color:#1b2433}
      .pal.talk .bub{opacity:1;transform:translate(-50%,0)}
      .pal:focus-visible{outline:3px solid #E08020;outline-offset:2px;border-radius:8px}
      .px-sky{position:absolute;left:0;right:0;top:0;height:220px;pointer-events:none;z-index:-1;overflow:hidden}
      .px-cloud{position:absolute;image-rendering:pixelated;opacity:.9;animation:pxdrift linear infinite}
      @keyframes pxdrift{from{transform:translateX(-120px)}to{transform:translateX(calc(100vw + 120px))}}
      .px-drone{position:absolute;left:0;top:0;width:56px;image-rendering:pixelated;pointer-events:none;z-index:3;opacity:0}
      @media (max-width:760px){.pal .bub{font-size:12px}}
      @media (prefers-reduced-motion: reduce){.px-cloud{animation:none}}
    `;
    document.head.appendChild(css);

    const grounds = [...document.querySelectorAll(".pal-ground")];
    const all = [];
    grounds.forEach((gEl, gi) => {
      const decos = gi === 0 ? [[TREE,6,40],[FLOWER,20,12],[HOUSE,78,48],[FLOWER2,90,12],[TREE,94,40]]
                             : [[FLOWER2,4,12],[TREE,12,40],[FLOWER,60,12],[HOUSE,86,48]];
      decos.forEach(([src,left,w]) => { if(small && w>12 && left<50 && left>8) return; const im = new Image(); im.src = src; im.className = "deco"; im.alt = ""; im.style.left = left+"%"; if(left > 50) im.style.transform = "translateX(-100%)"; im.style.width = w+"px"; gEl.appendChild(im); });
      const cast = pickCast(POOLS[gi] || POOLS[1], small ? 2 : 4);
      cast.forEach((id, k, arr) => {
        const p = PALS[id];
        const frames = [palFrame(p,0), palFrame(p,1)];
        const el = document.createElement("button"); el.type = "button"; el.className = "pal";
        el.style.width = (p.kid ? 45 : 60) * (small ? .85 : 1) + "px";
        el.innerHTML = `<span class="bub"></span><img alt="" src="${frames[0]}">`;
        el.setAttribute("aria-label", p.name);
        gEl.appendChild(el);
        const st = { id, p, el, gEl, img: el.querySelector("img"), bub: el.querySelector(".bub"), frames,
          x: (k+0.6)/(arr.length+0.2), dir: k%2 ? -1 : 1, speed: p.item==="cane" ? 8 : p.kid ? 18 : 12 + (id%3)*2, pause: 0, step: 0, href: "" };
        el.addEventListener("click", () => { if(st.href) location.hash = st.href.slice(1); });
        all.push(st);
      });
    });

    const hero = document.getElementById("hero");
    let drone = null;
    if(hero){
      const sky = document.createElement("div"); sky.className = "px-sky"; hero.prepend(sky);
      if(!document.getElementById("heroBanner")) [[16,140,0],[70,190,-70],[34,230,-150]].forEach(([top,dur,delay], i) => {
        if(small && i===2) return;
        const c = new Image(); c.src = CLOUD; c.className = "px-cloud"; c.alt = "";
        c.style.top = top+"px"; c.style.width = (i===1?66:84)+"px"; c.style.animationDuration = dur+"s"; c.style.animationDelay = delay+"s";
        sky.appendChild(c);
      });
      drone = new Image(); drone.src = DRONES[0].frames[0]; drone.className = "px-drone"; drone.alt = ""; hero.appendChild(drone);
    }

    const place = st => {
      const w = st.gEl.clientWidth - 64;
      st.el.style.transform = `translateX(${Math.max(0, st.x * w)}px)`;
      st.el.classList.toggle("left", st.dir < 0);
    };
    if(reduced){ all.forEach(place); return; }

    const visible = st => { const r = st.gEl.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
    const byId = id => all.find(s => s.id === id);
    const speak = (st, text, href, sec) => { st.bub.textContent = text; st.href = href; st.el.classList.add("talk"); st.pause = Math.max(st.pause, sec); st.el.setAttribute("aria-label", `${st.p.name}: ${text}`); };
    const hush = st => { st.el.classList.remove("talk"); st.href = ""; st.el.setAttribute("aria-label", st.p.name); };

    // 대화 진행 순서: [시각, 할 일]
    let queue = [], nextScene = performance.now() + 5000, talkCount = 0;
    function scene(now){
      const vis = all.filter(visible);
      if(!vis.length){ nextScene = now + 3000; return; }
      const pairs = TALKS.filter(t => { const a = byId(t[0]), b = byId(t[1]); return a && b && a.gEl === b.gEl && visible(a); });
      if(pairs.length && talkCount % 3 !== 2){
        const [ai, bi, l1, l2, href] = pairs[Math.floor(Math.random()*pairs.length)];
        const a = byId(ai), b = byId(bi);
        a.dir = b.x > a.x ? 1 : -1; b.dir = -a.dir;          // 서로 마주 보기
        a.pause = 8; b.pause = 8;
        queue.push([now, () => speak(a, l1, href, 3.4)]);
        queue.push([now + 3400, () => { hush(a); speak(b, l2, href, 3.4); }]);
        queue.push([now + 6900, () => hush(b)]);
        nextScene = now + 18000 + Math.random()*8000;
      } else {
        const st = vis[Math.floor(Math.random()*vis.length)];
        const [t, href] = SOLO[st.id][0];
        queue.push([now, () => speak(st, t, href, 3.5)]);
        queue.push([now + 3500, () => hush(st)]);
        nextScene = now + 14000 + Math.random()*6000;
      }
      talkCount++;
    }

    let flight = null, nextFlight = performance.now() + 7000, last = performance.now();
    function tick(now){
      const dt = Math.min(.05, (now-last)/1000); last = now;
      if(now > nextScene && !queue.length) scene(now);
      while(queue.length && queue[0][0] <= now) queue.shift()[1]();
      all.forEach(st => {
        const w = Math.max(200, st.gEl.clientWidth - 64);
        if(st.pause > 0){ st.pause -= dt; st.img.src = st.frames[0]; }
        else {
          st.x += st.dir * st.speed * dt / w;
          if(st.x < 0.02){ st.x = 0.02; st.dir = 1; }
          if(st.x > 0.98){ st.x = 0.98; st.dir = -1; }
          if(Math.random() < dt * 0.04) st.pause = 2 + Math.random()*2;
          st.step += dt * (st.p.item==="cane" ? 2.5 : 4); st.img.src = st.frames[Math.floor(st.step) % 2];
        }
        place(st);
      });
      if(drone){
        if(!flight && now > nextFlight){ const type = DRONES[Math.floor(Math.random()*DRONES.length)]; drone.style.width = type.w + "px"; flight = {t:0, type, dir: Math.random() < .5 ? 1 : -1, top: 24 + Math.random()*50}; }
        if(flight){
          const W = hero.clientWidth + 120; flight.t += dt * flight.type.speed;
          const x = flight.dir > 0 ? flight.t - 60 : W - flight.t - 60;
          drone.style.opacity = 1;
          drone.style.transform = `translate(${x}px, ${flight.top + Math.sin(flight.t/30)*6}px) scaleX(${flight.dir})`;
          drone.src = flight.type.frames[Math.floor(now/80) % 2];
          if(flight.t > W){ flight = null; drone.style.opacity = 0; nextFlight = now + 14000 + Math.random()*14000; }
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function addToggle(off){
    const slot = document.getElementById("palsToggle"); if(!slot) return;
    slot.hidden = false;
    slot.textContent = off ? "캐릭터 보기" : "캐릭터 숨기기";
    slot.onclick = e => {
      e.preventDefault();
      try{ off ? localStorage.removeItem("bmc-pals-off") : localStorage.setItem("bmc-pals-off","1"); }catch(_){}
      location.reload();
    };
  }
  window.BMC_startPals = start;
})();
