/* =========================================================
   HEALTH NIVO — CAMERA HEART RATE (finger on camera, PPG)
   Registers the "cameraHR" tool. Uses only getUserMedia, a
   canvas and plain JS. No data leaves the device.

   Honesty rules:
   - BPM is shown ONLY when the signal passes every quality
     check below. Otherwise the user sees why, never a number.
   - Nothing is random or simulated.
   ========================================================= */

const HN_CAMHR = (() => {

  const SETTLE_MS = 3000;     // let exposure settle after finger detected
  const MEASURE_MS = 30000;   // usable signal needed
  const TIMEOUT_MS = 90000;   // give up after this long
  const FINGER_LOST_MS = 1200;
  const RESAMPLE_HZ = 50;
  const LOST_MESSAGE = "আঙুল সরে গেছে। ক্যামেরা ও ফ্ল্যাশ আঙুল দিয়ে ঢেকে দিন।";

  const REASONS = {
    too_short: "পর্যাপ্ত সময়ের সংকেত পাওয়া যায়নি।",
    low_fps: "ক্যামেরা ফ্রেম-রেট খুব কম; নির্ভরযোগ্য হিসাব সম্ভব নয়।",
    weak_signal: "নাড়ির সংকেত খুব দুর্বল বা অস্থির ছিল।",
    inconsistent: "নাড়ির ছন্দ স্থির ছিল না (নড়াচড়া বা আলো বদলেছে)।",
    few_beats: "পর্যাপ্ত নির্ভরযোগ্য স্পন্দন শনাক্ত হয়নি।",
    out_of_range: "ফলাফল গ্রহণযোগ্য সীমার (৪০–১৮০) বাইরে ছিল।"
  };

  /* ---------- SIGNAL ANALYSIS (pure, unit-testable) ---------- */

  function movingAverage(values, window) {

    const half = Math.max(1, Math.floor(window / 2));
    const out = new Array(values.length);
    let sum = 0;
    let count = 0;
    let lo = 0;
    let hi = -1;

    for (let i = 0; i < values.length; i++) {

      const wantHi = Math.min(values.length - 1, i + half);
      const wantLo = Math.max(0, i - half);

      while (hi < wantHi) { hi++; sum += values[hi]; count++; }
      while (lo < wantLo) { sum -= values[lo]; lo++; count--; }

      out[i] = sum / count;

    }

    return out;

  }

  function resample(samples, hz) {

    const t0 = samples[0].t;
    const t1 = samples[samples.length - 1].t;
    const step = 1000 / hz;
    const out = [];

    let j = 0;

    for (let t = t0; t <= t1; t += step) {

      while (j < samples.length - 2 && samples[j + 1].t < t) j++;

      const a = samples[j];
      const b = samples[j + 1];
      const span = b.t - a.t;
      const f = span > 0 ? (t - a.t) / span : 0;

      out.push(a.v + (b.v - a.v) * Math.min(1, Math.max(0, f)));

    }

    return out;

  }

  function median(list) {

    const sorted = [...list].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

  }

  function fail(reason, extra) {
    return Object.assign({ ok: false, reason, message: REASONS[reason] }, extra || {});
  }

  /* samples: [{ t: milliseconds, v: mean red value }] */

  function analyze(samples) {

    if (!Array.isArray(samples) || samples.length < 40) {
      return fail("too_short");
    }

    const durationSec =
      (samples[samples.length - 1].t - samples[0].t) / 1000;

    if (durationSec < 20) return fail("too_short");

    const rate = samples.length / durationSec;

    if (rate < 8) return fail("low_fps", { rate });

    const raw = resample(samples, RESAMPLE_HZ);
    const baseline = movingAverage(raw, RESAMPLE_HZ);          // ~1 s
    const detrended = raw.map((v, i) => v - baseline[i]);
    const x = movingAverage(detrended, 5);                      // ~0.1 s

    const n = x.length;
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const centered = x.map(v => v - mean);
    const energy = centered.reduce((a, b) => a + b * b, 0);
    const sd = Math.sqrt(energy / n);

    if (!(sd > 0.15)) return fail("weak_signal");

    /* Autocorrelation estimate over 40–180 BPM. */

    const minLag = Math.floor(RESAMPLE_HZ * 60 / 180);
    const maxLag = Math.ceil(RESAMPLE_HZ * 60 / 40);
    const r = new Array(maxLag + 2).fill(0);

    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {

      let sum = 0;

      for (let i = 0; i + lag < n; i++) sum += centered[i] * centered[i + lag];

      r[lag] = sum / energy * (n / (n - lag));

    }

    let best = minLag;

    for (let lag = minLag; lag <= maxLag; lag++) if (r[lag] > r[best]) best = lag;

    /* Prefer the shortest strong peak (avoid picking a 2x period). */

    let chosen = best;

    for (let lag = minLag + 1; lag < best; lag++) {
      if (
        r[lag] > r[lag - 1] &&
        r[lag] >= r[lag + 1] &&
        r[lag] >= 0.85 * r[best]
      ) { chosen = lag; break; }
    }

    const acStrength = r[chosen];

    if (acStrength < 0.45) return fail("weak_signal", { acStrength });

    const denom = r[chosen - 1] - 2 * r[chosen] + r[chosen + 1];
    const offset = denom !== 0
      ? 0.5 * (r[chosen - 1] - r[chosen + 1]) / denom
      : 0;
    const lagExact = chosen + Math.max(-1, Math.min(1, offset));
    const bpmAutocorr = 60 * RESAMPLE_HZ / lagExact;

    /* Beat detection. */

    const minGap = Math.round(RESAMPLE_HZ * 0.33);
    const peaks = [];

    for (let i = 1; i < n - 1; i++) {

      if (
        centered[i] > centered[i - 1] &&
        centered[i] >= centered[i + 1] &&
        centered[i] > 0.25 * sd
      ) {

        const last = peaks[peaks.length - 1];

        if (last !== undefined && i - last < minGap) {
          if (centered[i] > centered[last]) peaks[peaks.length - 1] = i;
        } else {
          peaks.push(i);
        }

      }

    }

    const intervals = [];

    for (let i = 1; i < peaks.length; i++) {
      intervals.push((peaks[i] - peaks[i - 1]) / RESAMPLE_HZ);
    }

    if (intervals.length < 8) return fail("few_beats", { beats: peaks.length });

    const med = median(intervals);
    const kept = intervals.filter(v =>
      v >= 0.33 && v <= 1.5 && Math.abs(v - med) <= 0.25 * med
    );

    if (kept.length < 12 || kept.length < 0.7 * intervals.length) {
      return fail("few_beats", { beats: peaks.length, kept: kept.length });
    }

    const meanInterval = kept.reduce((a, b) => a + b, 0) / kept.length;
    const cv = Math.sqrt(
      kept.reduce((a, b) => a + (b - meanInterval) ** 2, 0) / kept.length
    ) / meanInterval;

    if (cv > 0.15) return fail("inconsistent", { cv });

    const bpmPeaks = 60 / meanInterval;

    if (Math.abs(bpmPeaks - bpmAutocorr) > 6) {
      return fail("inconsistent", { bpmPeaks, bpmAutocorr });
    }

    const bpm = Math.round(bpmPeaks);

    if (bpm < 40 || bpm > 180) return fail("out_of_range", { bpm });

    return {
      ok: true,
      bpm,
      quality: {
        acStrength: Math.round(acStrength * 100) / 100,
        cv: Math.round(cv * 1000) / 1000,
        beats: kept.length,
        rate: Math.round(rate)
      }
    };

  }


  /* ---------- CAMERA / UI ---------- */

  const esc = value => HN_EXT.esc(value);

  const state = {
    phase: "idle",     // idle | requesting | waiting | measuring | done | failed | error
    message: "",
    progress: 0,
    result: null,
    torch: "unknown",  // unknown | on | unavailable
    finger: false,
    lost: false
  };

  let stream = null;
  let video = null;
  let canvas = null;
  let ctx2d = null;
  let loopHandle = null;
  let loopKind = "";
  let watcher = null;
  let samples = [];
  let fingerSince = 0;
  let lastFingerAt = 0;
  let startedAt = 0;
  let lastUiAt = 0;
  let lastMediaTime = -1;

  function supportProblem() {

    if (!window.isSecureContext) {
      return "ক্যামেরা ব্যবহার করতে নিরাপদ (HTTPS) সংযোগ দরকার।";
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return "এই ব্রাউজারে Camera API সমর্থিত নয়।";
    }

    return "";

  }

  function stopCamera() {

    if (loopHandle !== null) {

      if (loopKind === "video" && video && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(loopHandle);
      } else {
        clearInterval(loopHandle);
      }

      loopHandle = null;

    }

    if (stream) {
      stream.getTracks().forEach(track => { try { track.stop(); } catch (e) { /* ignore */ } });
      stream = null;
    }

    if (video) {
      try { video.pause(); } catch (e) { /* ignore */ }
      video.srcObject = null;
      video.remove();
      video = null;
    }

    document.removeEventListener("visibilitychange", onVisibility);

  }

  function onVisibility() {

    if (document.hidden && ["waiting", "measuring"].includes(state.phase)) {

      stopCamera();
      state.phase = "failed";
      state.message = "অ্যাপ background-এ যাওয়ায় মাপা বন্ধ হয়েছে। আবার চেষ্টা করুন।";
      state.result = null;
      render();

    }

  }

  function resetSignal() {
    samples = [];
    fingerSince = 0;
    state.progress = 0;
  }

  function frameStats() {

    ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);

    const { data } = ctx2d.getImageData(0, 0, canvas.width, canvas.height);

    let r = 0, g = 0, b = 0, red = 0;
    const pixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {

      r += data[i]; g += data[i + 1]; b += data[i + 2];

      if (data[i] > 60 && data[i] > 1.4 * data[i + 1] && data[i] > 1.4 * data[i + 2]) {
        red++;
      }

    }

    r /= pixels; g /= pixels; b /= pixels;

    return {
      r, g, b,
      finger: r >= 60 && r > 1.5 * g && r > 1.5 * b && red / pixels >= 0.85
    };

  }

  function onFrame(now) {

    if (!video || !["waiting", "measuring"].includes(state.phase)) return;

    if (video.readyState < 2) return;

    if (loopKind === "interval") {

      if (video.currentTime === lastMediaTime) return;
      lastMediaTime = video.currentTime;

    }

    const t = performance.now();

    if (t - startedAt > TIMEOUT_MS) {

      finishWith(analyze(samples), true);
      return;

    }

    const stats = frameStats();

    state.finger = stats.finger;

    if (stats.finger) {

      lastFingerAt = t;

      if (!fingerSince) {
        fingerSince = t;
        samples = [];
        state.lost = false;
      }

      if (t - fingerSince >= SETTLE_MS) {

        if (state.phase !== "measuring") {
          state.phase = "measuring";
          state.message = "স্থির থাকুন; আঙুল সরাবেন না।";
          render();
        }

        samples.push({ t, v: stats.r });

        const span = t - samples[0].t;

        state.progress = Math.min(1, span / MEASURE_MS);

        if (span >= MEASURE_MS) {
          finishWith(analyze(samples), false);
          return;
        }

      } else {
        state.message = "আঙুল শনাক্ত হয়েছে; সংকেত স্থির হচ্ছে…";
      }

    } else if (fingerSince && t - lastFingerAt > FINGER_LOST_MS) {

      resetSignal();
      state.phase = "waiting";
      state.lost = true;
      state.message = LOST_MESSAGE;
      render();

    } else if (!fingerSince && !state.lost) {

      state.message = stats.r < 60
        ? "আলো কম। ফ্ল্যাশ/উজ্জ্বল আলোর সামনে ক্যামেরা আঙুল দিয়ে ঢাকুন।"
        : "ক্যামেরা ও ফ্ল্যাশ পুরো আঙুল দিয়ে ঢেকে দিন (হালকা চাপ)।";

    }

    if (t - lastUiAt > 250) {
      lastUiAt = t;
      updateLive();
    }

  }

  function finishWith(result, timedOut) {

    stopCamera();

    if (result.ok) {

      state.phase = "done";
      state.result = result;
      state.message = "";

    } else {

      state.phase = "failed";
      state.result = null;
      state.message = timedOut && result.reason === "too_short"
        ? "পর্যাপ্ত স্থির সংকেত পাওয়া যায়নি। আঙুল ঠিকমতো ঢেকে আবার চেষ্টা করুন।"
        : result.message || "নির্ভরযোগ্য সংকেত পাওয়া যায়নি।";

    }

    render();

  }

  function explainError(error) {

    switch (error && error.name) {

      case "NotAllowedError":
      case "SecurityError":
        return "ক্যামেরার অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে অনুমতি দিয়ে আবার চেষ্টা করুন।";

      case "NotFoundError":
      case "OverconstrainedError":
        return "কোনো উপযুক্ত ক্যামেরা পাওয়া যায়নি।";

      case "NotReadableError":
      case "AbortError":
        return "ক্যামেরা অন্য অ্যাপ ব্যবহার করছে বা চালু করা যায়নি।";

      default:
        return "ক্যামেরা চালু করা যায়নি।";

    }

  }

  async function start() {

    stopCamera();
    resetSignal();

    state.result = null;
    state.finger = false;
    state.lost = false;
    state.torch = "unknown";

    const problem = supportProblem();

    if (problem) {
      state.phase = "error";
      state.message = problem;
      render();
      return;
    }

    state.phase = "requesting";
    state.message = "ক্যামেরার অনুমতির জন্য অপেক্ষা করা হচ্ছে…";
    render();

    try {

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 160 },
          height: { ideal: 120 },
          frameRate: { ideal: 30 }
        }
      });

    } catch (error) {

      stream = null;
      state.phase = "error";
      state.message = explainError(error);
      render();
      return;

    }

    /* The modal may have been closed while the permission prompt was open. */

    if (!document.getElementById("hnCamPanel")) {

      stream.getTracks().forEach(track => track.stop());
      stream = null;
      state.phase = "idle";
      return;

    }

    /* Flash (torch) is optional and not supported on most browsers. */

    try {

      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};

      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: true }] });
        state.torch = "on";
      } else {
        state.torch = "unavailable";
      }

    } catch (error) {

      state.torch = "unavailable";

    }

    video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.muted = true;
    video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";
    video.srcObject = stream;
    document.body.appendChild(video);

    try {
      await video.play();
    } catch (error) {
      stopCamera();
      state.phase = "error";
      state.message = "ক্যামেরার ভিডিও চালু করা যায়নি।";
      render();
      return;
    }

    canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    ctx2d = canvas.getContext("2d", { willReadFrequently: true });

    startedAt = performance.now();
    lastMediaTime = -1;
    state.phase = "waiting";
    state.message = "ক্যামেরা ও ফ্ল্যাশ আঙুল দিয়ে ঢেকে দিন (হালকা চাপ)।";

    document.addEventListener("visibilitychange", onVisibility);

    if (typeof video.requestVideoFrameCallback === "function") {

      loopKind = "video";

      const tick = (now) => {
        if (!video) return;
        onFrame(now);
        if (video && loopKind === "video") {
          loopHandle = video.requestVideoFrameCallback(tick);
        }
      };

      loopHandle = video.requestVideoFrameCallback(tick);

    } else {

      loopKind = "interval";
      loopHandle = setInterval(onFrame, 33);

    }

    render();

  }

  function stop() {

    stopCamera();
    resetSignal();
    state.phase = "idle";
    state.message = "";
    state.result = null;
    render();

  }

  function updateLive() {

    const bar = document.getElementById("camProgress");
    const msg = document.getElementById("camMessage");
    const pct = document.getElementById("camPercent");

    if (bar) bar.style.width = Math.round(state.progress * 100) + "%";
    if (msg) msg.textContent = state.message;
    if (pct) pct.textContent = Math.round(state.progress * 100) + "%";

  }

  function body() {

    const active = ["requesting", "waiting", "measuring"].includes(state.phase);

    let main = "";

    if (state.phase === "idle") {

      main = `
        <p>ক্যামেরা ও ফ্ল্যাশের ওপর আঙুলের ডগা হালকা চাপে রেখে প্রায় ৩০ সেকেন্ড স্থির থাকুন।</p>`;

    } else if (active) {

      main = `
        <p id="camMessage" role="status">${esc(state.message)}</p>
        <div class="ext-progress" aria-hidden="true">
          <span id="camProgress" style="width:${Math.round(state.progress * 100)}%"></span>
        </div>
        <p class="small muted">অগ্রগতি: <span id="camPercent">${Math.round(state.progress * 100)}%</span></p>
        ${state.torch === "unavailable" ? `<p class="small muted">এই ডিভাইসে ব্রাউজার থেকে ফ্ল্যাশ চালু করা যায়নি। উজ্জ্বল আলোর সামনে ধরুন বা ফ্ল্যাশ ঢেকে রাখুন।</p>` : ""}`;

    } else if (state.phase === "done") {

      main = `
        <div class="card" role="status">
          <strong style="font-size:1.8rem">≈ ${esc(state.result.bpm)} BPM</strong>
          <p class="small muted">ক্যামেরা-ভিত্তিক আনুমানিক মান; ডাক্তারি পরিমাপ নয়।</p>
        </div>`;

    } else if (state.phase === "failed") {

      main = `
        <div class="card" role="alert">
          <strong>নির্ভরযোগ্য ফলাফল পাওয়া যায়নি</strong>
          <p class="small">${esc(state.message)}</p>
          <p class="small muted">তাই কোনো BPM দেখানো হচ্ছে না।</p>
        </div>`;

    } else if (state.phase === "error") {

      main = `
        <div class="card" role="alert">
          <strong>ক্যামেরা ব্যবহার করা যাচ্ছে না</strong>
          <p class="small">${esc(state.message)}</p>
        </div>`;

    }

    const buttons = active
      ? `<button class="btn btn-secondary" type="button" data-ext-action="cam-stop">থামান (Stop)</button>`
      : `<button class="btn btn-primary" type="button" data-ext-action="cam-start">${
          ["failed", "error", "done"].includes(state.phase) ? "আবার চেষ্টা (Retry)" : "শুরু (Start)"
        }</button>`;

    return `
      <div id="hnCamPanel">
        <p class="badge badge-yellow">Experimental • আনুমানিক</p>
        <p class="small"><strong>সতর্কতা:</strong> এটি চিকিৎসা যন্ত্র নয়। ফোনের ক্যামেরায় আঙুলের রং-পরিবর্তন দেখে নাড়ির হার অনুমান করা হয়; ভুল হতে পারে। অসুস্থ বোধ করলে বা সিদ্ধান্তের জন্য চিকিৎসকের পরামর্শ নিন।</p>
        <div class="section">${main}</div>
        <div class="ext-inline-actions">${buttons}</div>
        <p class="small muted">ছবি/ভিডিও সংরক্ষণ বা আপলোড হয় না; সবকিছু আপনার ডিভাইসেই হয়।</p>
      </div>`;

  }

  function render() {

    const panel = document.getElementById("hnCamPanel");

    if (!panel) return;

    panel.outerHTML = body();

  }

  function open() {

    stopCamera();
    resetSignal();

    state.phase = "idle";
    state.message = "";
    state.result = null;

    HN_EXT.modal("Camera Heart Rate", body());

    if (watcher) watcher.disconnect();

    const root = document.getElementById("modalRoot");

    if (root) {

      watcher = new MutationObserver(() => {

        if (!document.getElementById("hnCamPanel")) {
          watcher.disconnect();
          watcher = null;
          stopCamera();
          state.phase = "idle";
        }

      });

      watcher.observe(root, { childList: true, subtree: true });

    }

  }

  HN_EXT.tool("cameraHR", open);
  HN_EXT.action("cam-start", start);
  HN_EXT.action("cam-stop", stop);

  return { analyze, _state: state };

})();
