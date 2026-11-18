/**
 * 부안미디어센터 홈페이지 관리 서버 (구글 Apps Script, 무료)
 * ------------------------------------------------------------
 * 하는 일: 관리자 로그인 / 홈페이지 내용 저장 / 사진 업로드 / 문의 접수 + 메일 알림
 *
 * [처음 한 번만]
 * 1) 아래 ADMIN_PASSWORD 에 관리자 비밀번호를 적어요. (8자 이상)
 * 2) 위쪽 함수 선택에서 setup 을 고르고 [실행] → 권한 허용
 * 3) [배포 → 새 배포 → 유형: 웹 앱] 실행: 나 / 액세스 권한: 모든 사용자 → [배포]
 * 4) 나온 웹 앱 URL(…/exec)을 Claude에게 전달하면 홈페이지와 연결해 드려요.
 * 5) setup이 끝나면 ADMIN_PASSWORD 줄의 비밀번호는 지워도 돼요. (비밀번호는 암호화되어 따로 저장돼요)
 */
const ADMIN_ID = "buanmedia";
const ADMIN_PASSWORD = "";             // ← 여기에 비밀번호를 적고 setup 실행
const RECEIVE_EMAIL = "haeun0430@korea.kr";   // 문의 알림을 받을 메일 (여러 개면 쉼표)

const KEYS = ["settings", "mall", "videos", "notices", "classes", "facilities", "equipment", "rules", "forms", "films"];
const TOKEN_HOURS = 12;

/* ===================== 처음 설정 ===================== */
function setup() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("SECRET")) p.setProperty("SECRET", Utilities.getUuid() + Utilities.getUuid());
  if (ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 8) throw new Error("비밀번호는 8자 이상으로 적어 주세요.");
    p.setProperty("ADMIN_ID", ADMIN_ID);
    p.setProperty("PW", hash_(ADMIN_PASSWORD));
  } else if (!p.getProperty("PW")) {
    throw new Error("ADMIN_PASSWORD 에 비밀번호를 적고 다시 실행해 주세요.");
  }
  // 데이터 시트
  let ssId = p.getProperty("SS");
  if (!ssId) { ssId = SpreadsheetApp.create("부안미디어센터 홈페이지 데이터").getId(); p.setProperty("SS", ssId); }
  const ss = SpreadsheetApp.openById(ssId);
  const data = ss.getSheetByName("DATA") || ss.insertSheet("DATA");
  if (!data.getRange("A1").getValue()) data.getRange("A1:C1").setValues([["항목", "내용(JSON)", "수정시각"]]).setFontWeight("bold");
  const inbox = ss.getSheetByName("문의함") || ss.insertSheet("문의함");
  if (!inbox.getRange("A1").getValue()) inbox.getRange("A1:G1").setValues([["접수시각", "이름", "연락처", "문의유형", "문의내용", "처리", "메모"]]).setFontWeight("bold");
  const first = ss.getSheetByName("시트1") || ss.getSheetByName("Sheet1");
  if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
  // 사진 폴더
  let folderId = p.getProperty("FOLDER");
  if (!folderId) {
    const f = DriveApp.createFolder("부안미디어센터 홈페이지 사진");
    folderId = f.getId(); p.setProperty("FOLDER", folderId);
  }
  MailApp.getRemainingDailyQuota(); // 메일 권한 확인용
  Logger.log("설정 완료! 데이터 시트: " + ss.getUrl());
  Logger.log("이제 [배포 → 새 배포 → 웹 앱]으로 배포하세요.");
}

/* ===================== 공개: 홈페이지 데이터 ===================== */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "data";
  if (action === "data") return json_(readAll_());
  if (action === "ping") return json_({ ok: true });
  return json_({ ok: false, error: "unknown action" });
}

/* ===================== 요청 처리 ===================== */
function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { return json_({ ok: false, error: "잘못된 요청이에요." }); }
  try {
    switch (body.action) {
      case "inquiry": return json_(submitInquiry_(body.data || {}));
      case "login": return json_(login_(body.id, body.pw));
    }
    // 이하 관리자 전용
    if (!verify_(body.token)) return json_({ ok: false, auth: false, error: "로그인이 만료됐어요. 다시 로그인해 주세요." });
    switch (body.action) {
      case "check": return json_({ ok: true });
      case "save": return json_(save_(body.key, body.value));
      case "upload": return json_(upload_(body));
      case "uploadFile": return json_(uploadFile_(body));
      case "inquiries": return json_(listInquiries_());
      case "inquiryDone": return json_(markInquiry_(body.row, body.done, body.memo));
      case "password": return json_(changePassword_(body.oldPw, body.newPw));
    }
    return json_({ ok: false, error: "알 수 없는 요청이에요." });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ===================== 로그인 ===================== */
function login_(id, pw) {
  const p = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("fail") || 0);
  if (fails >= 10) return { ok: false, error: "로그인 시도가 너무 많아요. 10분 뒤에 다시 시도해 주세요." };
  if (String(id || "").trim() === p.getProperty("ADMIN_ID") && hash_(String(pw || "")) === p.getProperty("PW")) {
    cache.remove("fail");
    const exp = Date.now() + TOKEN_HOURS * 3600 * 1000;
    return { ok: true, token: exp + "." + sign_(String(exp)) };
  }
  cache.put("fail", String(fails + 1), 600);
  Utilities.sleep(800);
  return { ok: false, error: "아이디 또는 비밀번호가 맞지 않아요." };
}
function verify_(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  if (Number(parts[0]) < Date.now()) return false;
  return sign_(parts[0]) === parts[1];
}
function changePassword_(oldPw, newPw) {
  const p = PropertiesService.getScriptProperties();
  if (hash_(String(oldPw || "")) !== p.getProperty("PW")) return { ok: false, error: "지금 비밀번호가 맞지 않아요." };
  if (String(newPw || "").length < 8) return { ok: false, error: "새 비밀번호는 8자 이상이어야 해요." };
  p.setProperty("PW", hash_(String(newPw)));
  return { ok: true };
}
function sign_(s) {
  const key = PropertiesService.getScriptProperties().getProperty("SECRET");
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, key)).replace(/=+$/, "");
}
function hash_(pw) {
  const salt = PropertiesService.getScriptProperties().getProperty("SECRET");
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + "|" + pw, Utilities.Charset.UTF_8));
}

/* ===================== 데이터 ===================== */
function sheet_(name) {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SS")).getSheetByName(name);
}
function readAll_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("all");
  if (hit) return JSON.parse(hit);
  const out = {};
  const rows = sheet_("DATA").getDataRange().getValues().slice(1);
  rows.forEach(r => { if (KEYS.indexOf(r[0]) >= 0 && r[1]) { try { out[r[0]] = JSON.parse(r[1]); } catch (e) {} } });
  try { cache.put("all", JSON.stringify(out), 300); } catch (e) {}
  return out;
}
function save_(key, value) {
  if (KEYS.indexOf(key) < 0) return { ok: false, error: "저장할 수 없는 항목이에요." };
  const text = JSON.stringify(value);
  if (text.length > 45000) return { ok: false, error: "내용이 너무 길어요. 항목을 나누거나 줄여 주세요." };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet_("DATA");
    const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().map(r => r[0]);
    let row = keys.indexOf(key) + 1;
    if (row < 1) row = sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, 3).setValues([[key, text, new Date()]]);
    CacheService.getScriptCache().remove("all");
  } finally { lock.releaseLock(); }
  return { ok: true };
}

/* ===================== 사진 ===================== */
function upload_(b) {
  if (!b.data) return { ok: false, error: "사진이 없어요." };
  const type = String(b.type || "image/jpeg");
  if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return { ok: false, error: "jpg, png, webp, gif 사진만 올릴 수 있어요." };
  const bytes = Utilities.base64Decode(String(b.data).replace(/^data:[^,]+,/, ""));
  if (bytes.length > 8 * 1024 * 1024) return { ok: false, error: "사진이 너무 커요. 8MB 이하로 올려 주세요." };
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("FOLDER"));
  const name = (Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd-HHmmss") + "-" + String(b.name || "photo")).slice(0, 120);
  const file = folder.createFile(Utilities.newBlob(bytes, type, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: "https://lh3.googleusercontent.com/d/" + file.getId() };
}

/* ===================== 신청서 등 파일 ===================== */
function uploadFile_(b) {
  if (!b.data) return { ok: false, error: "파일이 없어요." };
  const name = String(b.name || "file").replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
  const ext = ((name.match(/\.([a-z0-9]+)$/i) || [])[1] || "").toLowerCase();
  const MIME = { hwp: "application/x-hwp", hwpx: "application/haansofthwpx", pdf: "application/pdf",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
  if (!MIME[ext]) return { ok: false, error: "한글(hwp·hwpx), PDF, 워드, 엑셀, 파워포인트, zip 파일만 올릴 수 있어요." };
  const bytes = Utilities.base64Decode(String(b.data).replace(/^data:[^,]*,/, ""));
  if (bytes.length > 10 * 1024 * 1024) return { ok: false, error: "파일이 너무 커요. 10MB 이하로 올려 주세요." };
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("FOLDER"));
  const file = folder.createFile(Utilities.newBlob(bytes, MIME[ext], name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: "https://drive.google.com/uc?export=download&id=" + file.getId(), name: name };
}

/* ===================== 문의 ===================== */
function submitInquiry_(d) {
  if (d.website) return { ok: true }; // 스팸 방지용 숨은 칸
  const name = clip_(d["이름"], 40), contact = clip_(d["연락처"], 80), type = clip_(d["문의유형"], 40), text = clip_(d["문의내용"], 3000);
  if (!name || !contact || !text) return { ok: false, error: "이름, 연락처, 문의 내용을 모두 적어 주세요." };
  if (d["개인정보동의"] !== "동의") return { ok: false, error: "개인정보 수집·이용에 동의해 주세요." };
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get("inq") || 0);
  if (n > 30) return { ok: false, error: "잠시 후 다시 시도해 주세요." };
  cache.put("inq", String(n + 1), 600);
  sheet_("문의함").appendRow([new Date(), name, contact, type, text, "", ""]);
  try {
    MailApp.sendEmail({
      to: RECEIVE_EMAIL,
      subject: "[부안미디어센터 홈페이지] 새 문의 - " + name + " (" + type + ")",
      htmlBody: "<p>홈페이지로 새 문의가 들어왔어요.</p><table style='border-collapse:collapse;font-size:14px'>" +
        [["이름", name], ["연락처", contact], ["문의유형", type], ["내용", text]].map(r =>
          "<tr><th style='text-align:left;padding:6px 12px;background:#f5f5f7'>" + r[0] + "</th><td style='padding:6px 12px;white-space:pre-line'>" + esc_(r[1]) + "</td></tr>").join("") +
        "</table><p style='color:#888'>관리자 페이지의 문의함에서도 볼 수 있어요.</p>"
    });
  } catch (err) { /* 메일이 실패해도 문의함에는 남아요 */ }
  return { ok: true };
}
function listInquiries_() {
  const rows = sheet_("문의함").getDataRange().getValues();
  const list = rows.slice(1).map((r, i) => ({
    row: i + 2,
    at: r[0] instanceof Date ? Utilities.formatDate(r[0], "Asia/Seoul", "yyyy-MM-dd HH:mm") : String(r[0]),
    name: r[1], contact: r[2], type: r[3], text: r[4], done: r[5] === "완료", memo: r[6]
  })).reverse();
  return { ok: true, list: list };
}
function markInquiry_(row, done, memo) {
  row = Number(row);
  const sh = sheet_("문의함");
  if (!(row >= 2 && row <= sh.getLastRow())) return { ok: false, error: "없는 문의예요." };
  sh.getRange(row, 6, 1, 2).setValues([[done ? "완료" : "", clip_(memo, 500)]]);
  return { ok: true };
}

/* ===================== 도우미 ===================== */
function clip_(s, n) { return String(s == null ? "" : s).trim().slice(0, n); }
function esc_(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 문의 메일이 잘 오는지 확인할 때 실행
function testMail() {
  MailApp.sendEmail(RECEIVE_EMAIL, "[부안미디어센터 홈페이지] 메일 수신 테스트", "이 메일이 보이면 문의 알림이 정상으로 와요.");
}
