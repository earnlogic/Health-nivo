/* =========================================================
   HEALTH NIVO — ACTIVITY TRACKER
   Replaces the old Motion Step Counter placeholder
   (tool key "motionSteps").

   Modes:
   - Walking / Running: DeviceMotion step estimate
   - Cycling: Geolocation distance and speed

   Everything is an estimate and is labelled so. If a sensor
   or GPS gives no data, nothing is invented.
   Browser APIs + localStorage only.
   ========================================================= */

const HN_ACTIVITY = (() => {

  const KEY = "healthnivo_activity_sessions";

  const MODES = {
    walking: { icon: "🚶", label: "হাঁটা", sensor: "motion" },
    running: { icon: "🏃", label: "দৌড়", sensor: "motion" },
    cycling: { icon: "🚴", label: "সাইক্লিং", sensor: "gps" }
  };

  const STRIDE_FACTOR = { walking: 0.415, running: 0.65 };

  const GPS_MAX_ACCURACY_M = 30;
  const GPS_MAX_SPEED_MS = 20;       // 72 km/h; faster = treated as a GPS jump
  const SENSOR_WAIT_MS = 4000;

  const esc = value => HN_EXT.esc(value);


  /* ---------- PURE HELPERS (unit-testable) ---------- */

  function haversine(a, b) {

    const R = 6371000;
    const rad = deg => deg * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) *
      Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));

  }

  /* Step detector: high-pass the acceleration magnitude, smooth,
     then count local peaks above a threshold with a minimum gap. */

  function createStepDetector(mode) {

    const cfg = mode === "running"
      ? { threshold: 2.2, minGap: 230 }
      : { threshold: 0.9, minGap: 300 };

    let base = null;
    let smooth = 0;
    let prev = 0;
    let prev2 = 0;
    let lastStep = -1e9;

    return {

      push(t, x, y, z) {

        const magnitude = Math.hypot(x, y, z);

        base = base === null ? magnitude : base + 0.02 * (magnitude - base);

        smooth += 0.35 * ((magnitude - base) - smooth);

        let step = false;

        if (
          prev > prev2 &&
          prev >= smooth &&
          prev > cfg.threshold &&
          t - lastStep >= cfg.minGap
        ) {
          step = true;
          lastStep = t;
        }

        prev2 = prev;
        prev = smooth;

        return step;

      }

    };

  }

  /* GPS filter: drops inaccurate fixes and impossible jumps. */

  function createGpsFilter() {

    let last = null;
    let consecutiveJumps = 0;

    const out = {
      distanceM: 0,
      accepted: 0,
      rejected: 0,
      window: []     // [{ t, d }] recent cumulative distance for current speed
    };

    function trackWindow(t) {

      out.window.push({ t, d: out.distanceM });

      while (out.window.length > 1 && t - out.window[0].t > 10000) {
        out.window.shift();
      }

    }

    out.push = fix => {

      if (
        !fix ||
        !Number.isFinite(fix.lat) || !Number.isFinite(fix.lon) ||
        Math.abs(fix.lat) > 90 || Math.abs(fix.lon) > 180
      ) {
        out.rejected++;
        return { accepted: false, reason: "invalid" };
      }

      if (Number.isFinite(fix.acc) && fix.acc > GPS_MAX_ACCURACY_M) {
        out.rejected++;
        return { accepted: false, reason: "accuracy" };
      }

      if (!last) {
        last = fix;
        out.accepted++;
        trackWindow(fix.t);
        return { accepted: true, deltaM: 0 };
      }

      const dt = (fix.t - last.t) / 1000;

      if (dt <= 0) {
        out.rejected++;
        return { accepted: false, reason: "time" };
      }

      const d = haversine(last, fix);

      if (d / dt > GPS_MAX_SPEED_MS) {

        out.rejected++;
        consecutiveJumps++;

        /* A persistent "jump" is a real relocation or GPS re-lock:
           re-anchor without adding distance. */

        if (consecutiveJumps >= 5) {
          last = fix;
          consecutiveJumps = 0;
          trackWindow(fix.t);
        }

        return { accepted: false, reason: "jump" };

      }

      consecutiveJumps = 0;

      const jitter = Math.max(3, (Number.isFinite(fix.acc) ? fix.acc : 0) / 2);

      if (d < jitter) {
        trackWindow(fix.t);
        return { accepted: true, deltaM: 0, still: true };
      }

      out.distanceM += d;
      last = fix;
      out.accepted++;
      trackWindow(fix.t);

      return { accepted: true, deltaM: d };

    };

    out.breakChain = () => {
      last = null;
      consecutiveJumps = 0;
      out.window = [];
    };

    out.currentSpeedMs = now => {

      const w = out.window;

      if (w.length < 2 || now - w[w.length - 1].t > 10000) return null;

      const dt = (w[w.length - 1].t - w[0].t) / 1000;

      return dt > 0 ? (w[w.length - 1].d - w[0].d) / dt : null;

    };

    return out;

  }

  function strideFromHeight(mode, heightCm) {

    const h = Number(heightCm);

    if (!Number.isFinite(h) || h < 100 || h > 230) return null;

    return Math.round(h / 100 * STRIDE_FACTOR[mode] * 100) / 100;

  }

  function validStride(value) {

    const n = Number(value);

    return Number.isFinite(n) && n >= 0.3 && n <= 1.5 ? n : null;

  }

  function formatDuration(ms) {

    const total = Math.max(0, Math.floor(ms / 1000));
    const pad = n => String(n).padStart(2, "0");

    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;

  }


  /* ---------- SESSION STATE ---------- */

  let session = null;       // { mode, status, ... }
  let mode = "walking";
  let strideInput = {};     // per-mode stride text
  let notice = "";
  let summary = null;       // last finished session
  let tickHandle = null;
  let watcher = null;
  let wakeLock = null;
  let motionHandler = null;
  let geoWatchId = null;
  let sensorTimer = null;
  let detector = null;
  let gps = null;

  function activeMs() {

    if (!session) return 0;

    return session.activeMs +
      (session.status === "running" ? Date.now() - session.resumedAt : 0);

  }

  function stride() {

    return validStride(session ? session.strideM : strideInput[mode]);

  }

  function metrics() {

    const ms = activeMs();
    const hours = ms / 3600000;
    const m = session && session.mode;

    let distanceKm = null;
    let currentKmh = null;
    let avgKmh = null;

    if (session && MODES[m].sensor === "motion") {

      const s = validStride(session.strideM);

      if (s) {

        distanceKm = session.steps * s / 1000;
        avgKmh = hours > 0 ? distanceKm / hours : null;

        const cutoff = Date.now() - 10000;
        const recent = session.stepTimes.filter(t => t >= cutoff).length;

        currentKmh = session.status === "running" && session.stepTimes.length
          ? recent * s / 10 * 3.6
          : null;

      }

    } else if (session && gps) {

      distanceKm = gps.distanceM / 1000;
      avgKmh = hours > 0 ? distanceKm / hours : null;

      const speed = session.status === "running" ? gps.currentSpeedMs(Date.now()) : null;

      currentKmh = speed === null ? null : speed * 3.6;

    }

    return { ms, distanceKm, currentKmh, avgKmh };

  }

  function fmt(value, digits) {

    return value === null || value === undefined || !Number.isFinite(value)
      ? "—"
      : (Math.round(value * 10 ** digits) / 10 ** digits).toFixed(digits);

  }


  /* ---------- SENSORS ---------- */

  function detach() {

    if (motionHandler) {
      window.removeEventListener("devicemotion", motionHandler);
      motionHandler = null;
    }

    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
      geoWatchId = null;
    }

    clearTimeout(sensorTimer);
    sensorTimer = null;

    document.removeEventListener("visibilitychange", onVisibility);

    if (wakeLock) {
      try { wakeLock.release(); } catch (e) { /* ignore */ }
      wakeLock = null;
    }

  }

  async function requestWakeLock() {

    try {

      if (navigator.wakeLock && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
      }

    } catch (e) {

      wakeLock = null;

    }

  }

  function onVisibility() {

    if (!session || session.status !== "running") return;

    if (document.hidden) {

      session.interrupted = true;
      notice = "স্ক্রিন বন্ধ বা অ্যাপ background-এ যাওয়ায় ট্র্যাকিং থেমে থাকতে পারে; এই সেশনের ডেটা অসম্পূর্ণ হতে পারে।";

    } else {

      requestWakeLock();
      render();

    }

  }

  function attach() {

    document.addEventListener("visibilitychange", onVisibility);
    requestWakeLock();

    if (MODES[session.mode].sensor === "motion") {

      detector = createStepDetector(session.mode);
      session.events = 0;

      motionHandler = event => {

        const a = event.accelerationIncludingGravity || event.acceleration;

        if (!a || a.x === null || a.y === null || a.z === null) return;

        session.events++;

        if (detector.push(Date.now(), a.x, a.y, a.z)) {
          session.steps++;
          session.stepTimes.push(Date.now());
          if (session.stepTimes.length > 60) session.stepTimes.shift();
        }

      };

      window.addEventListener("devicemotion", motionHandler);

      sensorTimer = setTimeout(() => {

        if (session && session.status === "running" && session.events === 0) {

          abort("Motion sensor থেকে কোনো ডেটা আসছে না। এই ডিভাইস/ব্রাউজার সমর্থন না করলে হাঁটা/দৌড় মোড কাজ করবে না, তাই কোনো ধাপ দেখানো হচ্ছে না।");

        }

      }, SENSOR_WAIT_MS);

    } else {

      gps = gps || createGpsFilter();
      gps.breakChain();

      geoWatchId = navigator.geolocation.watchPosition(
        position => {

          if (!session || session.status !== "running") return;

          session.fixes++;
          session.gpsWarning = "";

          const result = gps.push({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            acc: position.coords.accuracy,
            t: Date.now()
          });

          if (result.accepted && result.deltaM) {
            session.maxMs = Math.max(session.maxMs, gps.currentSpeedMs(Date.now()) || 0);
          }

        },
        error => {

          if (error.code === 1) {

            abort("লোকেশনের অনুমতি দেওয়া হয়নি, তাই সাইক্লিং ট্র্যাক করা যাচ্ছে না।");

          } else if (session) {

            session.gpsWarning = error.code === 3
              ? "GPS সংকেতের জন্য অপেক্ষা করা হচ্ছে… খোলা জায়গায় যান।"
              : "GPS অবস্থান পাওয়া যাচ্ছে না।";

          }

        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );

    }

  }

  function abort(message) {

    detach();
    stopTick();
    session = null;
    gps = null;
    notice = message;
    render();

  }


  /* ---------- ACTIONS ---------- */

  function sensorProblem(selected) {

    if (!window.isSecureContext) {
      return "সেন্সর/GPS ব্যবহার করতে নিরাপদ (HTTPS) সংযোগ দরকার।";
    }

    if (MODES[selected].sensor === "gps") {

      return "geolocation" in navigator
        ? ""
        : "এই ব্রাউজারে Geolocation (GPS) সমর্থিত নয়।";

    }

    return "DeviceMotionEvent" in window
      ? ""
      : "এই ব্রাউজারে Motion sensor সমর্থিত নয়।";

  }

  async function startSession() {

    notice = "";
    summary = null;

    const typed = readStrideField();

    if (typed !== null) strideInput[mode] = typed;

    const problem = sensorProblem(mode);

    if (problem) {
      notice = problem;
      render();
      return;
    }

    let strideM = null;

    if (MODES[mode].sensor === "motion") {

      strideM = validStride(readStrideField());

      if (!strideM) {
        notice = "স্ট্রাইড দৈর্ঘ্য ০.৩–১.৫ মিটারের মধ্যে দিন।";
        render();
        return;
      }

      /* iOS asks for motion permission on a user gesture. */

      if (typeof DeviceMotionEvent.requestPermission === "function") {

        try {

          const answer = await DeviceMotionEvent.requestPermission();

          if (answer !== "granted") {
            notice = "Motion sensor-এর অনুমতি দেওয়া হয়নি, তাই ধাপ গণনা সম্ভব নয়।";
            render();
            return;
          }

        } catch (e) {
          notice = "Motion sensor-এর অনুমতি পাওয়া যায়নি।";
          render();
          return;
        }

      }

    }

    session = {
      mode,
      status: "running",
      startedAt: new Date(),
      activeMs: 0,
      resumedAt: Date.now(),
      steps: 0,
      stepTimes: [],
      strideM,
      events: 0,
      fixes: 0,
      maxMs: 0,
      interrupted: false,
      gpsWarning: ""
    };

    gps = MODES[mode].sensor === "gps" ? createGpsFilter() : null;

    attach();
    startTick();
    render();

  }

  function pauseSession(auto) {

    if (!session || session.status !== "running") return;

    session.activeMs += Date.now() - session.resumedAt;
    session.status = "paused";

    detach();
    stopTick();

    if (auto) {
      notice = "ট্র্যাকিং বিরতিতে আছে। চালিয়ে যেতে 'আবার শুরু' চাপুন।";
    }

    render();

  }

  function resumeSession() {

    if (!session || session.status !== "paused") return;

    if (MODES[session.mode].sensor === "motion") {

      const s = validStride(readStrideField());

      if (!s) {
        notice = "স্ট্রাইড দৈর্ঘ্য ০.৩–১.৫ মিটারের মধ্যে দিন।";
        render();
        return;
      }

      session.strideM = s;

    }

    notice = "";
    session.status = "running";
    session.resumedAt = Date.now();

    attach();
    startTick();
    render();

  }

  function finishSession() {

    if (!session) return;

    if (session.status === "running") {
      session.activeMs += Date.now() - session.resumedAt;
      session.status = "paused";
    }

    detach();
    stopTick();

    const m = metrics();
    const info = session;
    const isMotion = MODES[info.mode].sensor === "motion";

    const entry = {
      id: HN_EXT.uid(),
      mode: info.mode,
      date: HN_EXT.localDate(info.startedAt),
      startedAt: info.startedAt.toISOString(),
      durationSec: Math.round(info.activeMs / 1000),
      steps: isMotion ? info.steps : null,
      strideM: isMotion ? info.strideM : null,
      distanceKm: m.distanceKm === null ? null : Math.round(m.distanceKm * 1000) / 1000,
      avgSpeedKmh: m.avgKmh === null ? null : Math.round(m.avgKmh * 10) / 10,
      maxSpeedKmh: !isMotion && info.maxMs ? Math.round(info.maxMs * 3.6 * 10) / 10 : null,
      rejectedGpsPoints: !isMotion && gps ? gps.rejected : null,
      interrupted: info.interrupted,
      estimated: true
    };

    if (entry.durationSec < 1) {

      notice = "খুব ছোট সেশন, সংরক্ষণ করা হয়নি।";

    } else if (HN_EXT.writeList(KEY, [entry, ...HN_EXT.readList(KEY)])) {

      summary = entry;
      notice = "";

    } else {

      notice = "সেশন সংরক্ষণ করা যায়নি।";

    }

    session = null;
    gps = null;
    render();

  }

  function discardSession() {

    if (!session) return;

    if (!confirm("এই সেশন বাতিল করবেন? ডেটা সংরক্ষিত হবে না।")) return;

    detach();
    stopTick();
    session = null;
    gps = null;
    notice = "সেশন বাতিল করা হয়েছে।";
    render();

  }

  function deleteEntry(element) {

    const id = element.dataset.id;

    if (!confirm("এই রেকর্ড মুছে ফেলবেন?")) return;

    HN_EXT.writeList(KEY, HN_EXT.readList(KEY).filter(item => item.id !== id));

    if (summary && summary.id === id) summary = null;

    render();

  }

  function clearHistory() {

    if (!HN_EXT.readList(KEY).length) return;

    if (!confirm("সব অ্যাক্টিভিটি ইতিহাস মুছে ফেলবেন?")) return;

    HN_EXT.writeList(KEY, []);
    summary = null;
    render();

  }

  function selectMode(element) {

    if (session) return;

    strideInput[mode] = readStrideField() ?? strideInput[mode];
    mode = element.dataset.mode;
    notice = "";
    summary = null;
    render();

  }

  function readStrideField() {

    const field = document.getElementById("actStride");

    return field ? field.value : null;

  }


  /* ---------- TICK / RENDER ---------- */

  function startTick() {

    stopTick();
    tickHandle = setInterval(updateLive, 1000);

  }

  function stopTick() {

    clearInterval(tickHandle);
    tickHandle = null;

  }

  function updateLive() {

    if (!document.getElementById("hnActPanel") || !session) return;

    const m = metrics();
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set("actTime", formatDuration(m.ms));
    set("actDist", fmt(m.distanceKm, 3));
    set("actCur", fmt(m.currentKmh, 1));
    set("actAvg", fmt(m.avgKmh, 1));

    if (session.mode !== "cycling") set("actSteps", String(session.steps));

    const warn = document.getElementById("actWarn");

    if (warn) {
      warn.textContent = session.gpsWarning || (session.interrupted ? "স্ক্রিন বন্ধ/ব্যাকগ্রাউন্ডে থাকায় ডেটা অসম্পূর্ণ হতে পারে।" : "");
    }

    if (gps) set("actRejected", String(gps.rejected));

  }

  function historyHTML() {

    const list = HN_EXT.readList(KEY);

    if (!list.length) {
      return `<p class="muted small">এখনো কোনো অ্যাক্টিভিটি সংরক্ষিত নেই।</p>`;
    }

    return list.map(item => {

      const info = MODES[item.mode] || { icon: "•", label: item.mode };

      const parts = [
        `সময় ${formatDuration(item.durationSec * 1000)}`,
        item.steps !== null && item.steps !== undefined ? `≈ ${item.steps} ধাপ` : "",
        item.distanceKm !== null && item.distanceKm !== undefined ? `≈ ${fmt(item.distanceKm, 3)} কিমি` : "",
        item.avgSpeedKmh !== null && item.avgSpeedKmh !== undefined ? `গড় ≈ ${fmt(item.avgSpeedKmh, 1)} কিমি/ঘ` : ""
      ].filter(Boolean).join(" • ");

      return `
        <div class="card">
          <strong>${info.icon} ${esc(info.label)}</strong>
          <span class="small muted"> • ${esc(item.date)}</span>
          <p class="small">${esc(parts)}</p>
          ${item.interrupted ? `<p class="small muted">⚠ ট্র্যাকিং মাঝে বিঘ্নিত হয়ে থাকতে পারে।</p>` : ""}
          <button class="btn btn-danger ext-btn-small" type="button" data-ext-action="act-delete" data-id="${esc(item.id)}">মুছুন</button>
        </div>`;

    }).join("");

  }

  function body() {

    const current = session ? session.mode : mode;
    const isMotion = MODES[current].sensor === "motion";
    const profile = (typeof storageGet === "function" && storageGet(APP.keys.profile, {})) || {};
    const suggested = strideFromHeight(current, profile.height);

    let strideValue = session ? session.strideM : strideInput[current];

    if ((strideValue === undefined || strideValue === null || strideValue === "") && suggested) {
      strideValue = suggested;
    }

    const modeButtons = Object.keys(MODES).map(key => `
      <button class="ext-chip" type="button" data-ext-action="act-mode" data-mode="${key}"
        aria-pressed="${key === current}" ${session ? "disabled" : ""}>
        ${MODES[key].icon} ${MODES[key].label}
      </button>`).join("");

    const m = metrics();

    const status = session ? session.status : "idle";

    let controls = "";

    if (status === "idle") {

      controls = `<button class="btn btn-primary" type="button" data-ext-action="act-start">শুরু (Start)</button>`;

    } else if (status === "running") {

      controls = `
        <button class="btn btn-secondary" type="button" data-ext-action="act-pause">বিরতি (Pause)</button>
        <button class="btn btn-primary" type="button" data-ext-action="act-finish">শেষ (Finish)</button>`;

    } else {

      controls = `
        <button class="btn btn-primary" type="button" data-ext-action="act-resume">আবার শুরু (Resume)</button>
        <button class="btn btn-secondary" type="button" data-ext-action="act-finish">শেষ (Finish)</button>
        <button class="btn btn-danger" type="button" data-ext-action="act-discard">বাতিল</button>`;

    }

    const strideField = isMotion
      ? `
        <div class="form-group">
          <label for="actStride">স্ট্রাইড/পদক্ষেপ দৈর্ঘ্য (মিটার)</label>
          <input id="actStride" type="number" inputmode="decimal" min="0.3" max="1.5" step="0.01"
            value="${esc(strideValue ?? "")}" ${status === "running" ? "disabled" : ""}>
          <p class="small muted">${
            suggested
              ? `প্রোফাইলের উচ্চতা (${esc(profile.height)} সেমি) থেকে প্রাথমিক অনুমান: ${suggested} মি। নিজের মাপ জানলে বদলান।`
              : "প্রোফাইলে উচ্চতা না থাকায় নিজে লিখুন (সাধারণত ০.৫–১.০ মি)।"
          }</p>
        </div>`
      : "";

    const stats = status === "idle"
      ? ""
      : `
        <div class="ext-stat-grid" role="status">
          <div class="ext-stat"><small>সময়</small><strong id="actTime">${formatDuration(m.ms)}</strong></div>
          ${isMotion
            ? `<div class="ext-stat"><small>ধাপ (≈)</small><strong id="actSteps">${session.steps}</strong></div>`
            : `<div class="ext-stat"><small>বাদ দেওয়া GPS পয়েন্ট</small><strong id="actRejected">${gps ? gps.rejected : 0}</strong></div>`}
          <div class="ext-stat"><small>দূরত্ব (≈ কিমি)</small><strong id="actDist">${fmt(m.distanceKm, 3)}</strong></div>
          <div class="ext-stat"><small>বর্তমান গতি (≈ কিমি/ঘ)</small><strong id="actCur">${fmt(m.currentKmh, 1)}</strong></div>
          <div class="ext-stat"><small>গড় গতি (≈ কিমি/ঘ)</small><strong id="actAvg">${fmt(m.avgKmh, 1)}</strong></div>
        </div>
        <p id="actWarn" class="small muted" role="status">${esc(session.gpsWarning || "")}</p>`;

    const summaryHTML = summary
      ? `
        <div class="card" role="status">
          <strong>সেশন সংরক্ষিত হয়েছে ✔</strong>
          <p class="small">${esc(MODES[summary.mode].label)} • সময় ${formatDuration(summary.durationSec * 1000)}${
            summary.steps !== null ? ` • ≈ ${summary.steps} ধাপ` : ""
          } • ≈ ${fmt(summary.distanceKm, 3)} কিমি • গড় ≈ ${fmt(summary.avgSpeedKmh, 1)} কিমি/ঘ</p>
          <p class="small muted">সব মান আনুমানিক।</p>
        </div>`
      : "";

    return `
      <div id="hnActPanel">
        <p class="badge badge-yellow">Beta • সব মান আনুমানিক</p>
        <div class="ext-chips" role="group" aria-label="মোড">${modeButtons}</div>

        <p class="small muted">${
          isMotion
            ? "ধাপ ও দূরত্ব ফোনের motion sensor থেকে অনুমান করা হয়; ফোন পকেট/হাতে স্থির রাখুন। ভুল হতে পারে।"
            : "দূরত্ব ও গতি GPS থেকে হিসাব করা হয়। অস্বাভাবিক লোকেশন-লাফ ও দুর্বল সংকেত বাদ দেওয়া হয়।"
        }</p>
        <p class="small"><strong>⚠</strong> স্ক্রিন লক বা অ্যাপ background-এ গেলে ট্র্যাকিং বন্ধ হতে পারে; সেশন চলার সময় স্ক্রিন চালু রাখুন।</p>

        ${strideField}
        ${stats}
        ${notice ? `<p class="small" role="alert">${esc(notice)}</p>` : ""}
        <div class="ext-inline-actions">${controls}</div>
        ${summaryHTML}

        <div class="section">
          <div class="card-title-row"><h3>অ্যাক্টিভিটি ইতিহাস</h3>
            <button class="btn-link" type="button" data-ext-action="act-clear">সব মুছুন</button></div>
          ${historyHTML()}
        </div>
      </div>`;

  }

  function render() {

    const panel = document.getElementById("hnActPanel");

    if (panel) panel.outerHTML = body();

  }

  function open() {

    HN_EXT.modal("Activity Tracker", body());

    if (watcher) watcher.disconnect();

    const root = document.getElementById("modalRoot");

    if (!root) return;

    watcher = new MutationObserver(() => {

      if (!document.getElementById("hnActPanel")) {

        watcher.disconnect();
        watcher = null;

        /* Closing the window stops sensors; the session stays paused. */

        if (session && session.status === "running") pauseSession(true);

      }

    });

    watcher.observe(root, { childList: true, subtree: true });

  }

  HN_EXT.tool("motionSteps", open);
  HN_EXT.action("act-mode", selectMode);
  HN_EXT.action("act-start", startSession);
  HN_EXT.action("act-pause", () => pauseSession(false));
  HN_EXT.action("act-resume", resumeSession);
  HN_EXT.action("act-finish", finishSession);
  HN_EXT.action("act-discard", discardSession);
  HN_EXT.action("act-delete", deleteEntry);
  HN_EXT.action("act-clear", clearHistory);

  return {
    createStepDetector,
    createGpsFilter,
    haversine,
    strideFromHeight,
    validStride,
    KEY
  };

})();
