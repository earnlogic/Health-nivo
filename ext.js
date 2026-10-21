/* =========================================================
   HEALTH NIVO — EXTENSION CORE
   Loaded BEFORE app.js. Everything here only touches app.js
   globals (APP, escapeHTML, openModal, storageGet ...) at call
   time, so load order is safe.

   Provides:
   - HN_EXT.tool(name, fn)   register a tool opened from tiles
   - HN_EXT.action / input   delegated click / input handlers
   - HN_EXT.form(name, fn)   delegated form submit handlers
   - HN_EXT.addStrings()     central i18n dictionary (bn / en)
   - HN_EXT.t(key, vars)     translate with Bangla fallback
   ========================================================= */

const HN_EXT = (() => {

  const tools = {};
  const actions = {};
  const inputs = {};
  const forms = {};
  const strings = { bn: {}, en: {} };
  const SUPPORTED_LANGUAGES = ["bn", "en"];


  /* ---------- LANGUAGE ---------- */

  function lang() {

    try {

      const settings =
        storageGet(APP.keys.settings, {});

      const chosen =
        settings && settings.language;

      return SUPPORTED_LANGUAGES.includes(chosen)
        ? chosen
        : "bn";

    } catch (error) {

      return "bn";

    }

  }

  function addStrings(dictionary) {

    SUPPORTED_LANGUAGES.forEach(code => {

      Object.assign(
        strings[code],
        (dictionary && dictionary[code]) || {}
      );

    });

  }

  function t(key, vars) {

    const code = lang();

    let text =
      strings[code][key] ??
      strings.bn[key] ??
      key;

    if (vars) {

      Object.keys(vars).forEach(name => {

        text =
          text.split(`{${name}}`)
            .join(String(vars[name]));

      });

    }

    return text;

  }

  function hasString(key) {

    return Object.prototype
      .hasOwnProperty.call(strings.bn, key);

  }


  /* ---------- REGISTRIES ---------- */

  function tool(name, fn) {
    tools[name] = fn;
  }

  function action(name, fn) {
    actions[name] = fn;
  }

  function input(name, fn) {
    inputs[name] = fn;
  }

  function form(name, fn) {
    forms[name] = fn;
  }

  function openTool(name) {

    if (typeof tools[name] === "function") {

      tools[name]();

      return true;

    }

    return false;

  }

  function hasTool(name) {
    return typeof tools[name] === "function";
  }


  /* ---------- SHARED HELPERS ---------- */

  const esc = value => escapeHTML(value);

  /* Local calendar date (YYYY-MM-DD), not UTC. */

  function localDate(date = new Date()) {

    const pad = n => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  }

  function isValidISODate(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      return false;
    }

    const [y, m, d] =
      String(value).split("-").map(Number);

    const date = new Date(y, m - 1, d);

    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );

  }

  function parseISODate(value) {

    if (!isValidISODate(value)) {
      return null;
    }

    const [y, m, d] =
      String(value).split("-").map(Number);

    return new Date(y, m - 1, d);

  }

  function addDays(isoDate, days) {

    const date = parseISODate(isoDate);

    if (!date) return null;

    date.setDate(date.getDate() + days);

    return localDate(date);

  }

  function daysBetween(fromISO, toISO) {

    const a = parseISODate(fromISO);
    const b = parseISODate(toISO);

    if (!a || !b) return null;

    return Math.round(
      (b - a) / 86400000
    );

  }

  function uid() {
    return generateId();
  }

  function readList(key) {

    const value = storageGet(key, []);

    return Array.isArray(value) ? value : [];

  }

  function writeList(key, list) {
    return storageSet(key, list);
  }

  /* Native, accessible collapsible block. */

  function collapsible(summary, body, open = false) {

    return `
      <details class="ext-details" ${open ? "open" : ""}>
        <summary>${summary}</summary>
        <div class="ext-details-body">${body}</div>
      </details>
    `;

  }

  function number(value, digits = 1) {

    const n = Number(value);

    if (!Number.isFinite(n)) return "—";

    return String(
      Math.round(n * 10 ** digits) / 10 ** digits
    );

  }

  function setHTML(selector, html) {

    const element = document.querySelector(selector);

    if (element) {
      element.innerHTML = html;
    }

    return element;

  }

  function modal(title, body) {
    openModal(title, body);
  }

  /* Only http(s) links may be used for hrefs. */

  function safeURL(value) {

    try {

      const url = new URL(String(value));

      return (
        url.protocol === "https:" ||
        url.protocol === "http:"
      )
        ? url.href
        : "";

    } catch (error) {

      return "";

    }

  }


  /* ---------- DELEGATED EVENTS ---------- */

  document.addEventListener("click", event => {

    const element =
      event.target.closest &&
      event.target.closest("[data-ext-action]");

    if (!element) return;

    const handler =
      actions[element.dataset.extAction];

    if (typeof handler === "function") {

      event.preventDefault();

      handler(element, event);

    }

  });

  document.addEventListener("input", event => {

    const element =
      event.target.closest &&
      event.target.closest("[data-ext-input]");

    if (!element) return;

    const handler =
      inputs[element.dataset.extInput];

    if (typeof handler === "function") {
      handler(element, event);
    }

  });

  document.addEventListener("change", event => {

    const element =
      event.target.closest &&
      event.target.closest("[data-ext-change]");

    if (!element) return;

    const handler =
      inputs[element.dataset.extChange];

    if (typeof handler === "function") {
      handler(element, event);
    }

  });

  document.addEventListener("submit", event => {

    const element =
      event.target.closest &&
      event.target.closest("form[data-ext-form]");

    if (!element) return;

    const handler =
      forms[element.dataset.extForm];

    event.preventDefault();

    if (typeof handler === "function") {

      handler(
        Object.fromEntries(
          new FormData(element).entries()
        ),
        element
      );

    }

  });


  return {

    lang,
    t,
    hasString,
    addStrings,

    tool,
    openTool,
    hasTool,
    action,
    input,
    form,

    esc,
    localDate,
    isValidISODate,
    parseISODate,
    addDays,
    daysBetween,
    uid,
    readList,
    writeList,
    collapsible,
    number,
    setHTML,
    modal,
    safeURL,

    SUPPORTED_LANGUAGES

  };

})();
