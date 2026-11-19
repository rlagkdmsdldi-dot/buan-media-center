/* 부안미디어센터 배경음악
   - 기본: 브라우저에서 바로 만드는 귀여운 8비트 음악(저작권 걱정 없음)
   - 관리자 → 기본 설정 → 'BGM 음악 파일 주소'에 mp3 주소를 넣으면 그 음악이 나와요
   - 들어오면 바로 재생을 시도해요. 브라우저가 소리 자동재생을 막으면 화면을 처음 누르는 순간 나와요 */
(function(){
  const KEY = "bmc-bgm";
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "bgm-btn"; btn.setAttribute("aria-pressed","false");
  btn.innerHTML = '<span class="bgm-ico" aria-hidden="true">♪</span><span class="bgm-txt">음악 켜기</span>';
  const css = document.createElement("style");
  css.textContent = `
.bgm-btn{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:6px;border:1px solid var(--line,#e5e7eb);background:rgba(255,255,255,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--ink,#13233a);font:700 .82rem/1 Pretendard,"Noto Sans KR",sans-serif;padding:9px 14px 9px 11px;border-radius:999px;box-shadow:0 4px 14px rgba(20,30,60,.10);cursor:pointer}
.bgm-btn:hover{transform:translateY(-1px)}
.bgm-ico{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#fdf1e4;color:#d9741a;font-size:.8rem}
.bgm-btn.on .bgm-ico{background:#d9741a;color:#fff;animation:bgmBop 1.2s ease-in-out infinite}
@keyframes bgmBop{50%{transform:translateY(-2px) rotate(-8deg)}}
@media (max-width:760px){.bgm-btn{left:10px;bottom:10px;padding:7px 11px 7px 8px;font-size:.76rem}}
@media (prefers-reduced-motion: reduce){.bgm-btn.on .bgm-ico{animation:none}}
@media print{.bgm-btn{display:none}}`;
  document.head.appendChild(css);
  document.body.appendChild(btn);

  let on = false, ctx = null, master = null, timer = null, step = 0, nextT = 0, audio = null;
  const fileUrl = () => { try { return (typeof SETTINGS !== "undefined" && SETTINGS.bgm) || (window.BMC_DEFAULTS && BMC_DEFAULTS.settings.bgm) || ""; } catch(e){ return ""; } };

  /* ---- 8비트 음악: C - Am - F - G, 한 마디 8칸, 8마디 반복 ---- */
  const BPM = 96, EIGHTH = 60 / BPM / 2;
  const N = n => 440 * Math.pow(2, (n - 69) / 12);           // MIDI 번호 → 주파수
  const MEL = [ // 0 = 쉼
    72,0,76,79, 76,0,74,72,   69,0,72,76, 74,0,72,0,
    65,0,69,72, 74,72,69,0,   67,0,71,74, 72,0,0,0,
    76,0,79,81, 79,0,76,74,   72,0,76,77, 76,0,74,0,
    77,0,76,74, 72,0,69,0,    71,0,74,72, 71,0,67,0 ];
  const ROOT = [48,45,41,43, 48,45,41,43];                     // 마디별 베이스
  function tone(freq, t, dur, type, vol){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function tick(){
    while(nextT < ctx.currentTime + 0.25){
      const bar = Math.floor(step / 8) % 8, pos = step % 8, m = MEL[step % MEL.length];
      if(m) tone(N(m), nextT, EIGHTH * 1.6, "square", 0.05);
      if(pos % 2 === 0) tone(N(ROOT[bar] + (pos === 4 ? 7 : 0)), nextT, EIGHTH * 1.8, "triangle", 0.16);
      if(pos === 2 || pos === 6) tone(N(ROOT[bar] + 24), nextT, EIGHTH * 0.5, "square", 0.018); // 반짝이 음
      nextT += EIGHTH; step++;
    }
  }
  function startSynth(){
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if(!master){ master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    ctx.resume(); nextT = ctx.currentTime + 0.05; step = 0;
    clearInterval(timer); timer = setInterval(tick, 60); tick();
  }
  function stopSynth(){ clearInterval(timer); timer = null; if(ctx) ctx.suspend(); }

  function play(){
    const url = fileUrl();
    if(url){
      audio = audio || Object.assign(new Audio(url), {loop:true, volume:0.35});
      audio.play().catch(() => setState(false));
    } else startSynth();
  }
  function pause(){ if(audio) audio.pause(); stopSynth(); }
  function setState(v, save){
    on = v; btn.classList.toggle("on", v); btn.setAttribute("aria-pressed", String(v));
    btn.querySelector(".bgm-txt").textContent = v ? "음악 끄기" : "음악 켜기";
    btn.setAttribute("aria-label", v ? "배경음악 끄기" : "배경음악 켜기");
    if(save){ try { localStorage.setItem(KEY, v ? "on" : "off"); } catch(e){} }
  }
  btn.addEventListener("click", () => { if(on){ pause(); setState(false, true); } else { setState(true, true); play(); } });

  // 기본으로 켜짐: 들어오자마자 재생을 시도하고, 브라우저가 막으면 첫 클릭·터치·키 입력 때 바로 재생
  //  (방문자가 '음악 끄기'를 누른 적이 있으면 다음 방문에도 꺼진 채로 둬요)
  let saved = "on"; try { saved = localStorage.getItem(KEY) || "on"; } catch(e){}
  if(saved !== "off"){
    const allowed = () => audio ? !audio.paused : (ctx && ctx.state === "running");
    setState(true); play();
    setTimeout(() => { if(!allowed()){ pause(); setState(false); arm(); } }, 400);
    function arm(){
      const go = e => {
        if(e.target && e.target.closest && e.target.closest(".bgm-btn")) return;   // 버튼은 자기 클릭으로 처리
        ["pointerdown","keydown","touchend"].forEach(t => document.removeEventListener(t, go, true));
        if(!on){ setState(true); play(); }
      };
      ["pointerdown","keydown","touchend"].forEach(t => document.addEventListener(t, go, true));
    }
  }
  // 다른 탭으로 가면 잠시 멈춤
  document.addEventListener("visibilitychange", () => { if(!on) return; if(document.hidden) pause(); else play(); });
})();
