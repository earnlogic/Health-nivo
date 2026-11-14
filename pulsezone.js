/* =========================================================
   HEALTH NIVO — EXERCISE PULSE ZONE
   Registers the "pulseZone" tool. Age + a heart rate the
   person types in. The BPM is MANUAL input, never a sensor
   reading, and max heart rate / zones are estimates.
   ========================================================= */

const HN_PULSE = (() => {

  const KEY = "healthnivo_pulse_sessions";

  const ZONES = [
    { id: 1, name: "Zone 1 — খুব হালকা", from: 0.50, to: 0.60,
      info: "ওয়ার্ম-আপ বা রিকভারির মতো খুব হালকা পরিশ্রম; সহজে কথা বলা যায়।" },
    { id: 2, name: "Zone 2 — হালকা", from: 0.60, to: 0.70,
      info: "হালকা, দীর্ঘ সময় চালানো যায় এমন পরিশ্রম; কথা বলা যায়।" },
    { id: 3, name: "Zone 3 — মাঝারি", from: 0.70, to: 0.80,
      info: "মাঝারি পরিশ্রম; শ্বাস বাড়ে, ছোট বাক্যে কথা বলা যায়।" },
    { id: 4, name: "Zone 4 — কঠিন", from: 0.80, to: 0.90,
      info: "কঠিন পরিশ্রম; অল্প সময়ের জন্য ধরে রাখা যায়, কথা বলা কষ্টকর।" },
    { id: 5, name: "Zone 5 — সর্বোচ্চ চেষ্টা", from: 0.90, to: 1.00,
      info: "খুব কঠিন, খুব অল্প সময়ের পরিশ্রম। অস্বস্তি হলে সঙ্গে সঙ্গে থামুন।" }
  ];

  const esc = value => HN_EXT.esc(value);

  /* ---------- PURE HELPERS ---------- */

  function validAge(value) {

    const n = Number(value);

    return Number.isInteger(n) && n >= 10 && n <= 100 ? n : null;

  }

  function validBpm(value) {

    if (value === "" || value === null || value === undefined) return null;

    const n = Number(value);

    return Number.isFinite(n) && n >= 30 && n <= 250 ? Math.round(n) : null;

  }

  /* Estimated maximum heart rate: 220 − age. */

  function maxHeartRate(age) {

    const a = validAge(age);

    return a === null ? null : 220 - a;

  }

  /* Zone BPM ranges. A boundary value belongs to the higher zone,
     so displayed ranges never overlap. */

  function zonesFor(age) {

    const max = maxHeartRate(age);

    if (max === null) return null;

    return ZONES.map((zone, index) => {

      const low = Math.round(max * zone.from);
      const nextLow = index < ZONES.length - 1
        ? Math.round(max * ZONES[index + 1].from)
        : max + 1;

      return Object.assign({}, zone, { low, high: nextLow - 1 });

    });

  }

  /* -> { zone } | { below: true } | { above: true } */

  function classify(age, bpm) {

    const zones = zonesFor(age);
    const value = validBpm(bpm);

    if (!zones || value === null) return null;

    if (value < zones[0].low) return { below: true };
    if (value > zones[zones.length - 1].high) return { above: true };

    return { zone: zones.find(z => value >= z.low && value <= z.high) };

  }

  function formatDuration(ms) {

    const total = Math.max(0, Math.floor(ms / 1000));
    const pad = n => String(n).padStart(2, "0");

    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;

  }


  /* ---------- STATE ---------- */

  let age = "";
  let bpm = "";
  let timer = { status: "idle", accumulated: 0, resumedAt: 0 };
  let readings = [];
  let tickHandle = null;
  let watcher = null;
  let notice = "";

  function elapsed() {

    return timer.accumulated +
      (timer.status === "running" ? Date.now() - timer.resumedAt : 0);

  }

  function resultHTML() {

    const zones = zonesFor(age);

    if (!zones) {
      return `<p class="muted small">বয়স (১০–১০০) দিলে আনুমানিক সর্বোচ্চ হার্ট রেট ও জোন দেখা যাবে।</p>`;
    }

    const max = maxHeartRate(age);
    const hit = bpm === "" ? null : classify(age, bpm);
    const bpmValue = validBpm(bpm);

    let current = "";

    if (bpm !== "" && bpmValue === null) {

      current = `<p class="small" role="alert">BPM ৩০–২৫০-এর মধ্যে একটি সংখ্যা দিন।</p>`;

    } else if (hit) {

      const label = hit.zone
        ? esc(hit.zone.name)
        : hit.below
          ? "Zone 1-এর নিচে (বিশ্রাম/খুব হালকা)"
          : "অনুমিত সর্বোচ্চের ওপরে — বিশ্রাম নিন; অস্বস্তি হলে চিকিৎসকের পরামর্শ নিন";

      current = `
        <div class="card" role="status">
          <strong>আপনার দেওয়া ${esc(bpmValue)} BPM → ${label}</strong>
          <p class="small muted">এটি আপনার নিজে লেখা মান, কোনো sensor-এর পরিমাপ নয়।</p>
        </div>`;

    }

    return `
      <div class="ext-stat"><small>আনুমানিক সর্বোচ্চ হার্ট রেট (২২০ − বয়স)</small><strong>≈ ${max} BPM</strong></div>
      ${current}
      <div class="section">
        ${zones.map(zone => {

          const active = hit && hit.zone && hit.zone.id === zone.id;

          return `
            <div class="card pulse-zone-card${active ? " active" : ""}" ${active ? 'aria-current="true"' : ""}>
              <strong>${esc(zone.name)}</strong>
              <span class="badge">≈ ${zone.low}–${zone.high} BPM</span>
              <p class="small muted">${esc(zone.info)}</p>
            </div>`;

        }).join("")}
      </div>
      <p class="small muted">জোন ও সর্বোচ্চ হার্ট রেট সাধারণ সূত্রে আনুমানিক; ব্যক্তিভেদে অনেক আলাদা হতে পারে, চিকিৎসা পরামর্শ নয়।</p>`;

  }

  function sessionHTML() {

    const status = timer.status;

    let controls = "";

    if (status === "idle") {
      controls = `<button class="btn btn-primary" type="button" data-ext-action="pz-start">শুরু (Start)</button>`;
    } else if (status === "running") {
      controls = `<button class="btn btn-secondary" type="button" data-ext-action="pz-pause">বিরতি (Pause)</button>`;
    } else {
      controls = `<button class="btn btn-primary" type="button" data-ext-action="pz-resume">আবার শুরু (Resume)</button>`;
    }

    const hasData = elapsed() > 0 || readings.length > 0;

    return `
      <div class="card">
        <strong>সেশন টাইমার</strong>
        <p style="font-size:1.8rem;margin:6px 0" id="pzTime" role="timer">${formatDuration(elapsed())}</p>
        <div class="ext-inline-actions">
          ${controls}
          <button class="btn btn-secondary" type="button" data-ext-action="pz-reset" ${hasData ? "" : "disabled"}>রিসেট</button>
          <button class="btn btn-primary" type="button" data-ext-action="pz-save" ${hasData ? "" : "disabled"}>সেশন সংরক্ষণ</button>
        </div>
        <div class="ext-inline-actions">
          <button class="btn btn-secondary" type="button" data-ext-action="pz-add" ${validBpm(bpm) !== null && maxHeartRate(age) !== null ? "" : "disabled"}>বর্তমান BPM সেশনে যোগ করুন</button>
        </div>
        ${readings.length
          ? `<ul class="ext-list small">${readings.map(r => `<li>${formatDuration(r.atSec * 1000)} — ${esc(r.bpm)} BPM (হাতে লেখা) • ${esc(r.zone)}</li>`).join("")}</ul>`
          : `<p class="small muted">এখনো কোনো BPM যোগ করা হয়নি।</p>`}
      </div>`;

  }

  function historyHTML() {

    const list = HN_EXT.readList(KEY);

    if (!list.length) {
      return `<p class="muted small">এখনো কোনো সেশন সংরক্ষিত নেই।</p>`;
    }

    return list.map(item => `
      <div class="card">
        <strong>${esc(item.date)}</strong>
        <span class="small muted"> • সময় ${formatDuration(item.durationSec * 1000)} • বয়স ${esc(item.age)} • আনুমানিক সর্বোচ্চ ${esc(item.maxHr)} BPM</span>
        ${item.readings.length
          ? `<ul class="ext-list small">${item.readings.map(r => `<li>${formatDuration(r.atSec * 1000)} — ${esc(r.bpm)} BPM (হাতে লেখা) • ${esc(r.zone)}</li>`).join("")}</ul>`
          : `<p class="small muted">কোনো BPM যোগ করা হয়নি।</p>`}
        <button class="btn btn-danger ext-btn-small" type="button" data-ext-action="pz-delete" data-id="${esc(item.id)}">মুছুন</button>
      </div>`).join("");

  }

  function body() {

    return `
      <div id="hnPulsePanel">
        <p class="badge badge-yellow">Experimental • আনুমানিক</p>
        <p class="small muted">বয়স ও নিজে মাপা/দেখা BPM লিখুন। এই টুল হার্ট রেট মাপে না; জোন ও সর্বোচ্চ হার্ট রেট আনুমানিক।</p>
        <div class="form-grid two">
          <div>
            <label for="pzAge">বয়স</label>
            <input id="pzAge" type="number" inputmode="numeric" min="10" max="100" value="${esc(age)}" data-ext-input="pz-age">
          </div>
          <div>
            <label for="pzBpm">বর্তমান BPM (হাতে লেখা)</label>
            <input id="pzBpm" type="number" inputmode="numeric" min="30" max="250" value="${esc(bpm)}" data-ext-input="pz-bpm">
          </div>
        </div>
        <div id="pzResult" class="section">${resultHTML()}</div>
        <div id="pzSession" class="section">${sessionHTML()}</div>
        ${notice ? `<p class="small" role="alert" id="pzNotice">${esc(notice)}</p>` : `<p id="pzNotice"></p>`}
        <div class="section">
          <h3>সংরক্ষিত সেশন</h3>
          <div id="pzHistory">${historyHTML()}</div>
        </div>
      </div>`;

  }

  function refresh(parts) {

    (parts || ["result", "session", "history"]).forEach(part => {

      const html = { result: resultHTML, session: sessionHTML, history: historyHTML }[part]();
      const id = { result: "pzResult", session: "pzSession", history: "pzHistory" }[part];
      const el = document.getElementById(id);

      if (el) el.innerHTML = html;

    });

    const note = document.getElementById("pzNotice");

    if (note) note.textContent = notice;

  }

  function startTick() {
    stopTick();
    tickHandle = setInterval(() => {
      const el = document.getElementById("pzTime");
      if (el) el.textContent = formatDuration(elapsed());
    }, 500);
  }

  function stopTick() {
    clearInterval(tickHandle);
    tickHandle = null;
  }


  /* ---------- ACTIONS ---------- */

  HN_EXT.input("pz-age", element => {
    age = element.value;
    refresh(["result", "session"]);
  });

  HN_EXT.input("pz-bpm", element => {
    bpm = element.value;
    refresh(["result", "session"]);
  });

  HN_EXT.action("pz-start", () => {
    notice = "";
    timer = { status: "running", accumulated: 0, resumedAt: Date.now() };
    startTick();
    refresh(["session"]);
  });

  HN_EXT.action("pz-pause", () => {
    timer.accumulated += Date.now() - timer.resumedAt;
    timer.status = "paused";
    stopTick();
    refresh(["session"]);
  });

  HN_EXT.action("pz-resume", () => {
    timer.status = "running";
    timer.resumedAt = Date.now();
    startTick();
    refresh(["session"]);
  });

  HN_EXT.action("pz-reset", () => {
    timer = { status: "idle", accumulated: 0, resumedAt: 0 };
    readings = [];
    notice = "";
    stopTick();
    refresh(["session"]);
  });

  HN_EXT.action("pz-add", () => {

    const hit = classify(age, bpm);

    if (!hit) return;

    readings.push({
      atSec: Math.round(elapsed() / 1000),
      bpm: validBpm(bpm),
      zone: hit.zone ? hit.zone.name : hit.below ? "Zone 1-এর নিচে" : "সর্বোচ্চের ওপরে"
    });

    refresh(["session"]);

  });

  HN_EXT.action("pz-save", () => {

    const maxHr = maxHeartRate(age);

    if (maxHr === null) {
      notice = "সেশন সংরক্ষণ করতে সঠিক বয়স (১০–১০০) দিন।";
      refresh(["session"]);
      return;
    }

    if (timer.status === "running") {
      timer.accumulated += Date.now() - timer.resumedAt;
      timer.status = "paused";
      stopTick();
    }

    const entry = {
      id: HN_EXT.uid(),
      date: HN_EXT.localDate(),
      savedAt: new Date().toISOString(),
      durationSec: Math.round(timer.accumulated / 1000),
      age: validAge(age),
      maxHr,
      readings: readings.slice(),
      source: "manual",
      estimated: true
    };

    if (HN_EXT.writeList(KEY, [entry, ...HN_EXT.readList(KEY)])) {

      timer = { status: "idle", accumulated: 0, resumedAt: 0 };
      readings = [];
      notice = "সেশন সংরক্ষিত হয়েছে ✔";

    } else {

      notice = "সেশন সংরক্ষণ করা যায়নি।";

    }

    refresh();

  });

  HN_EXT.action("pz-delete", element => {

    if (!confirm("এই সেশন মুছে ফেলবেন?")) return;

    HN_EXT.writeList(KEY, HN_EXT.readList(KEY).filter(item => item.id !== element.dataset.id));

    notice = "";
    refresh(["history"]);

  });

  function open() {

    try {

      const profile = storageGet(APP.keys.profile, {});

      if (!age && profile && validAge(profile.age) !== null) age = String(profile.age);

    } catch (e) { /* ignore */ }

    notice = "";

    HN_EXT.modal("Exercise Pulse Zone", body());

    if (timer.status === "running") startTick();

    if (watcher) watcher.disconnect();

    const root = document.getElementById("modalRoot");

    if (!root) return;

    watcher = new MutationObserver(() => {

      if (!document.getElementById("hnPulsePanel")) {
        watcher.disconnect();
        watcher = null;
        stopTick();     // timer value is timestamp-based, so it stays correct
      }

    });

    watcher.observe(root, { childList: true, subtree: true });

  }

  HN_EXT.tool("pulseZone", open);

  return { maxHeartRate, zonesFor, classify, validAge, validBpm, KEY };

})();
