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
    { name:"하루",          hair:"#1f1a17", style:"cap",   shirt:"#3d7bd9", item:"phone", cap:"#1b2433" } // 7 학생
  ];
  // 혼잣말 (가끔)
  const SOLO = {
    0:[["수업 보러 갈래요?","#edu"]], 1:[["유튜브 보러 가요","#video"]], 2:[["우리가 만든 영화!","#film"]],
    3:[["우리 가게 놀러 와요","#mall"]], 4:[["스마트폰 배우러 왔어요","#edu"]], 5:[["허허, 날씨 좋구먼","#home"]],
    6:[["드론이다!","#video"]], 7:[["스튜디오 빌리고 싶다","#rent"]]
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
    [3,7,"우리 가게 블로그 봤어?","네, 사진 예뻐요!","#mall"]
  ];
  const GROUNDS = { 0:{wide:[4,5,6,2], small:[4,5]}, 1:{wide:[3,1,7,0], small:[3,1]} };

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
  const ITEMS = {
    camera: {top:8, rows:[".kkk.","kdddk","kdwdk","kdddk",".kkk."]},
    mic:    {top:6, rows:[".kk..","kggk.",".kk..",".kd..",".kd.."]},
    clapper:{top:8, rows:["kwkwk","kkkkk","kdddk","kdddk","kkkkk"]},
    phone:  {top:8, rows:["kkkk.","krrk.","kwwk.","kwwk.","kkkk."]},
    cane:   {top:8, rows:["BBB..","..B..","..B..","..B..","..B..","..B..","..B..","..B.."]},
    none:   {top:8, rows:[]}
  };
  function palFrame(p, f){
    const rows = [
      "...kkkkkk...","..khhhhhhk..",".khhhhhhhhk.",".khsssssshk.",
      ".kssessessk.",".kssssssssk.","..kssmmssk..","...kkkkkk...",
      "..kccccccck.",".kccccccccck",".kscccccccsk",".kscccccccsk",
      "..kpppppppk."
    ];
    if(p.style === "long"){ set(rows,4,1,"h"); set(rows,4,10,"h"); set(rows,5,1,"h"); set(rows,5,10,"h"); set(rows,6,1,"kh"); set(rows,6,9,"hk"); }
    if(p.style === "bun"){ rows[0] = "....khhk...."; rows[1] = "..kkhhhhkk.."; }
    if(p.style === "cap"){ rows[0] = "...kkkkkk..."; rows[1] = "..kqqqqqqk.."; rows[2] = ".kqqqqqqqqkk"; rows[3] = ".khsssssshk."; }
    if(p.glasses){ rows[4] = ".kskekkeksk."; }
    let legs = [["..kpppkpppk.","..kppk.kppk.","..kkkk.kkkk."],["..kpppkpppk.",".kppk...kppk",".kkkk...kkkk"]];
    if(p.skirt){ rows[rows.length-1] = "..kqqqqqqqk.".replace(/q/g,"z"); legs = [[".kzzzzzzzzzk","...ks..sk...","...kk..kk..."],[".kzzzzzzzzzk","..ks....sk..","..kk....kk.."]]; }
    const all = rows.concat(legs[f]).slice(0,16).map(r => r.padEnd(17,"."));
    const it = ITEMS[p.item] || ITEMS.none;
    it.rows.forEach((r,i) => { const y = it.top+i; if(all[y]) all[y] = all[y].slice(0,11) + r + all[y].slice(16); });
    return draw(all, p.kid ? 3 : 4, {h:p.hair, c:p.shirt, q:p.cap||"#333", z:p.skirt||"#2c3e66"});
  }
  const GROUND = draw(["DGGDGGGDGGDGGGGD","GGGGGGGGGGGGGGGG","GGDGGGGGGDGGGGGG","GGGGGGGGGGGGGGGG","LLLLLLLLLLLLLLLL","LBLLLLLLLBLLLLLL","LLLLLBLLLLLLLBLL","LLLLLLLLLLLLLLLL"], 4);
  const TREE = draw(["...TTTT...","..TTTTTT..",".TTTDTTTT.","TTTTTTTDTT","TTDTTTTTTT",".TTTTTTTT.","..TTTTTT..","....BB....","....BB....","....BB...."], 4);
  const HOUSE = draw(["....RRRR....","...RRRRRR...","..RRRRRRRR..",".RRRRRRRRRR.","RRRRRRRRRRRR",".WWWWWWWWWW.",".WkkWWWWkkW.",".WkkWWWWkkW.",".WWWWBBWWWW.",".WWWWBBWWWW."], 4);
  const FLOWER = draw([".Y.","YoY",".Y.",".D."], 4);
  const FLOWER2 = draw([".P.","PYP",".P.",".D."], 4);
  const CLOUD = draw(["....CCCC......","..CCCCCCCC....",".CCCCCCCCCCC..","CCCCCCCCCCCCCC","ccccccccccccc."], 6);
  const DRONE = [
    draw(["kkkk......kkkk","....kkkkkk....","...kNNNNNNk...","...kNNrNNNk...","....kkkkkk....",".....k..k....."], 4),
    draw([".kk........kk.","....kkkkkk....","...kNNNNNNk...","...kNNNNNNk...","....kkkkkk....",".....k..k....."], 4)
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
      const conf = GROUNDS[gi] || GROUNDS[1];
      (small ? conf.small : conf.wide).forEach((id, k, arr) => {
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
      [[16,140,0],[70,190,-70],[34,230,-150]].forEach(([top,dur,delay], i) => {
        if(small && i===2) return;
        const c = new Image(); c.src = CLOUD; c.className = "px-cloud"; c.alt = "";
        c.style.top = top+"px"; c.style.width = (i===1?66:84)+"px"; c.style.animationDuration = dur+"s"; c.style.animationDelay = delay+"s";
        sky.appendChild(c);
      });
      drone = new Image(); drone.src = DRONE[0]; drone.className = "px-drone"; drone.alt = ""; hero.appendChild(drone);
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
        if(!flight && now > nextFlight) flight = {t:0, dir: Math.random() < .5 ? 1 : -1, top: 30 + Math.random()*40};
        if(flight){
          const W = hero.clientWidth + 120; flight.t += dt * 70;
          const x = flight.dir > 0 ? flight.t - 60 : W - flight.t - 60;
          drone.style.opacity = 1;
          drone.style.transform = `translate(${x}px, ${flight.top + Math.sin(flight.t/30)*6}px) scaleX(${flight.dir})`;
          drone.src = DRONE[Math.floor(now/80) % 2];
          if(flight.t > W){ flight = null; drone.style.opacity = 0; nextFlight = now + 18000 + Math.random()*16000; }
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
