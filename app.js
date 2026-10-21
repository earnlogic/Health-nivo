/* =========================================================
   HEALTH NIVO
   PHASE 1 APPLICATION ARCHITECTURE

   Static frontend
   External JSON data
   LocalStorage
   Reusable search
   Favorites
   Trackers
   Experimental tools
   More section
   Honest device/API states

   Phase 2 intentionally NOT started.
   ========================================================= */

"use strict";


/* =========================================================
   APP CONFIGURATION
   ========================================================= */

const APP = {

  name: "Health Nivo",

  version: "0.1.0-phase1",

  routes: [
    "home",
    "problems",
    "foods",
    "tracker",
    "more"
  ],

  data: {
    foods: [],
    problems: [],
    conditions: []
  },

  dataState: {
    loading: true,
    error: null
  },

  route: "home",

  params: {},

  timers: {},

  keys: {

    profile: "healthnivo_profile",

    water: "healthnivo_water",

    sleep: "healthnivo_sleep",

    exercise: "healthnivo_exercise",

    steps: "healthnivo_steps",

    weight: "healthnivo_weight",

    bp: "healthnivo_bp",

    glucose: "healthnivo_glucose",

    heartRate: "healthnivo_heart_rate",

    favorites: "healthnivo_favorites",

    period: "healthnivo_period",

    settings: "healthnivo_settings",

    notifications: "healthnivo_notifications",

    foodLog: "healthnivo_food_log"

  }

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);


const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


/* =========================================================
   SECURITY / HTML ESCAPING
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, character => {

      const map = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };

      return map[character];

    });

}


/* =========================================================
   DATE HELPERS
   ========================================================= */

/* Local calendar date as YYYY-MM-DD. toISOString() would give the
   UTC date, which is the previous day for part of the day in
   time zones ahead of UTC (for example Bangladesh, UTC+6). */

function localISODate(date = new Date()) {

  const pad = number =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

}


function todayISO() {

  return localISODate();

}


function localDateTimeValue() {

  const date = new Date();

  const pad = number =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function storageGet(key, fallback) {

  try {

    const raw = localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw);

  } catch (error) {

    console.warn(
      "Health Nivo storage read error:",
      key,
      error
    );

    return fallback;

  }

}


function storageSet(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;

  } catch (error) {

    console.warn(
      "Health Nivo storage write error:",
      key,
      error
    );

    toast(
      "এই ডিভাইসে data সংরক্ষণ করা যাচ্ছে না।"
    );

    return false;

  }

}


function storageRemove(key) {

  try {

    localStorage.removeItem(key);

  } catch (error) {

    console.warn(error);

  }

}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

  const root = $("#toastRoot");

  if (!root) return;

  const element =
    document.createElement("div");

  element.className = "toast";

  element.textContent = message;

  root.appendChild(element);

  setTimeout(() => {

    element.remove();

  }, 2800);

}


/* =========================================================
   GLOBAL STATUS
   ========================================================= */

function globalStatus(message = "") {

  const element = $("#globalStatus");

  if (!element) return;

  element.hidden = !message;

  element.textContent = message;

}


/* =========================================================
   ROUTER
   ========================================================= */

function navigate(route, params = {}) {

  if (!APP.routes.includes(route)) {

    route = "home";

  }

  APP.route = route;

  APP.params = params;

  history.replaceState(
    {},
    "",
    `#${route}`
  );

  render();

  $("#mainContent")?.focus({
    preventScroll: true
  });

}


function readHashRoute() {

  const hash =
    location.hash
      .replace("#", "")
      .trim();

  if (APP.routes.includes(hash)) {

    APP.route = hash;

  }

}


window.addEventListener(
  "hashchange",
  () => {

    readHashRoute();

    render();

  }
);


window.addEventListener(
  "popstate",
  () => {

    readHashRoute();

    render();

  }
);


/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadJSON(path) {

  const response =
    await fetch(
      path,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      `${path} returned HTTP ${response.status}`
    );

  }

  const json =
    await response.json();

  if (!Array.isArray(json)) {

    throw new Error(
      `${path} must contain a JSON array`
    );

  }

  return json;

}


/* ---------------------------------------------------------
   FIELD NAME NORMALIZATION
   JSON files keep their original field names. The app reads
   the shorter aliases below, which point to the same values.
   --------------------------------------------------------- */

function normalizeFood(food) {

  return {

    ...food,

    serving:
      food.serving ??
      food.serving_size,

    calories:
      food.calories ??
      food.calories_kcal,

    protein:
      food.protein ??
      food.protein_g,

    carbs:
      food.carbs ??
      food.carbs_g,

    fat:
      food.fat ??
      food.fat_g,

    fiber:
      food.fiber ??
      food.fiber_g

  };

}


function normalizeProblem(problem) {

  return {

    ...problem,

    actions:
      problem.actions ??
      problem.actions_and_food_guidance,

    avoid:
      problem.avoid ??
      problem.avoid_or_limit

  };

}


async function loadApplicationData() {

  APP.dataState = {

    loading: true,

    error: null

  };

  try {

    const [
      foods,
      problems,
      conditions
    ] = await Promise.all([

      loadJSON(
        "data/foods.json"
      ),

      loadJSON(
        "data/problems.json"
      ),

      loadJSON(
        "data/conditions.json"
      )

    ]);

    APP.data = {

      foods:
        foods.map(normalizeFood),

      problems:
        problems.map(normalizeProblem),

      conditions

    };

    APP.dataState = {

      loading: false,

      error: null

    };

  } catch (error) {

    console.error(
      "Health Nivo JSON loading failed:",
      error
    );

    APP.dataState = {

      loading: false,

      error

    };

  }

}


/* =========================================================
   DATA ACCESS HELPERS
   ========================================================= */

function getFoodById(id) {

  return APP.data.foods.find(
    food =>
      String(food.id) === String(id)
  ) || null;

}


function getFoodsByIds(ids = []) {

  return ids
    .map(getFoodById)
    .filter(Boolean);

}


function getProblemById(id) {

  return APP.data.problems.find(
    problem =>
      String(problem.id) === String(id)
  ) || null;

}


function getConditionById(id) {

  return APP.data.conditions.find(
    condition =>
      String(condition.id) === String(id)
  ) || null;

}


/* =========================================================
   SEARCH
   ========================================================= */

function normalizeSearch(value) {

  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("bn");

}


function itemMatches(
  item,
  query,
  fields
) {

  const normalizedQuery =
    normalizeSearch(query);

  if (!normalizedQuery) {

    return true;

  }

  return fields.some(field =>

    normalizeSearch(
      item[field]
    ).includes(
      normalizedQuery
    )

  );

}


function searchFoods(query = "") {

  return APP.data.foods.filter(
    food =>
      itemMatches(
        food,
        query,
        [
          "name_bn",
          "name_en",
          "category"
        ]
      )
  );

}


function searchProblems(query = "") {

  return APP.data.problems.filter(
    problem =>
      itemMatches(
        problem,
        query,
        [
          "name_bn",
          "name_en",
          "symptoms",
          "actions",
          "avoid"
        ]
      )
  );

}


/* =========================================================
   FAVORITES
   ========================================================= */

function getFavorites() {

  const saved =
    storageGet(
      APP.keys.favorites,
      {
        foods: [],
        problems: [],
        health: []
      }
    );

  return {

    foods:
      Array.isArray(saved.foods)
        ? saved.foods
        : [],

    problems:
      Array.isArray(saved.problems)
        ? saved.problems
        : [],

    health:
      Array.isArray(saved.health)
        ? saved.health
        : []

  };

}


function isFavorite(
  type,
  id
) {

  const favorites =
    getFavorites();

  return (
    favorites[type] || []
  ).some(
    savedId =>
      String(savedId) === String(id)
  );

}


function toggleFavorite(
  type,
  id
) {

  const favorites =
    getFavorites();

  if (!favorites[type]) {

    favorites[type] = [];

  }

  const index =
    favorites[type].findIndex(
      savedId =>
        String(savedId) === String(id)
    );

  if (index >= 0) {

    favorites[type].splice(
      index,
      1
    );

    toast(
      "Favorites থেকে সরানো হয়েছে।"
    );

  } else {

    favorites[type].push(id);

    toast(
      "Favorites-এ যোগ হয়েছে।"
    );

  }

  storageSet(
    APP.keys.favorites,
    favorites
  );

  /* Update the star buttons in place so an open detail page
     stays open. Fall back to a full render only if no matching
     button is on screen. */

  const isNowFavorite =
    index < 0;

  const matchingButtons =
    Array.from(
      document.querySelectorAll(
        "[data-favorite]"
      )
    ).filter(
      button =>
        button.dataset.favorite ===
        `${type}:${id}`
    );

  if (matchingButtons.length) {

    matchingButtons.forEach(button => {

      button.classList.toggle(
        "favorite-on",
        isNowFavorite
      );

      button.textContent =
        isNowFavorite
          ? "★"
          : "☆";

      if (
        button.hasAttribute(
          "aria-label"
        )
      ) {

        button.setAttribute(
          "aria-label",
          isNowFavorite
            ? "Favorite সরান"
            : "Favorite করুন"
        );

      }

    });

  } else {

    render();

  }

}


/* =========================================================
   DATA STATE UI
   ========================================================= */

function dataStateView() {

  if (APP.dataState.loading) {

    return `
      <div
        class="loading-state"
        role="status"
        aria-live="polite"
      >
        ডেটা লোড হচ্ছে…
      </div>
    `;

  }

  if (APP.dataState.error) {

    return `
      <div class="error-state">

        <strong>
          Data load করা যায়নি
        </strong>

        <p class="small">
          data/foods.json,
          data/problems.json এবং
          data/conditions.json
          সঠিকভাবে আছে কি না দেখুন।
        </p>

        <button
          class="btn btn-secondary"
          type="button"
          data-action="reload-data"
        >
          আবার চেষ্টা করুন
        </button>

      </div>
    `;

  }

  return "";

}


/* =========================================================
   MAIN RENDER
   ========================================================= */

function render() {

  updateNavigation();

  const page =
    $("#pageView");

  if (!page) return;

  globalStatus("");

  switch (APP.route) {

    case "home":

      page.innerHTML =
        renderHome();

      break;

    case "problems":

      page.innerHTML =
        renderProblems();

      break;

    case "foods":

      page.innerHTML =
        renderFoods();

      break;

    case "tracker":

      page.innerHTML =
        renderTracker();

      break;

    case "more":

      page.innerHTML =
        renderMore();

      break;

    default:

      page.innerHTML =
        renderHome();

  }

  bindEvents();

}


/* =========================================================
   NAVIGATION UI
   ========================================================= */

function updateNavigation() {

  $$(".bottom-nav-item")
    .forEach(button => {

      const active =
        button.dataset.route ===
        APP.route;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-current",
        active
          ? "page"
          : "false"
      );

    });

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

  const profile =
    storageGet(
      APP.keys.profile,
      {}
    );

  const name =
    profile?.name
      ? `, ${escapeHTML(profile.name)}`
      : "";

  const water =
    getTodayWater();

  const sleep =
    getLatestRecord(
      APP.keys.sleep
    );

  const exercise =
    getTodayRecords(
      APP.keys.exercise
    );

  const steps =
    getTodayRecords(
      APP.keys.steps
    );

  const weight =
    getLatestRecord(
      APP.keys.weight
    );

  const hasData =
    Boolean(
      water.total ||
      sleep ||
      exercise.length ||
      steps.length ||
      weight
    );

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          স্বাগতম
        </div>

        <h1>
          আপনার দৈনিক স্বাস্থ্য${name}
        </h1>

        <p class="muted">
          আপনি যতটুকু data লগ করেছেন,
          শুধু সেটুকুই এখানে দেখানো হচ্ছে।
        </p>

      </div>

    </div>


    <section class="hero">

      <h2>
        আজকের overview
      </h2>

      <p>
        ${
          hasData
            ? "আপনার লগ করা তথ্য থেকে আজকের overview তৈরি হয়েছে।"
            : "এখনো কোনো দৈনিক তথ্য নেই। একটি tracker দিয়ে শুরু করুন।"
        }
      </p>

      <div class="progress">
        <span
          style="width:${hasData ? "35%" : "0%"}"
        ></span>
      </div>

      <p class="small muted">
        এটি কোনো medical score বা health rating নয়।
      </p>

    </section>


    <div class="stats-grid">

      <div class="stat-card">
        <div class="stat-value">
          ${water.total} ml
        </div>
        <div class="stat-label">
          আজ পানি
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value">
          ${
            sleep
              ? escapeHTML(sleep.duration || "—")
              : "—"
          }
        </div>
        <div class="stat-label">
          সর্বশেষ ঘুম
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value">
          ${exercise.length}
        </div>
        <div class="stat-label">
          আজ exercise logs
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value">
          ${steps.length}
        </div>
        <div class="stat-label">
          আজ steps logs
        </div>
      </div>

    </div>


    <section class="section card">

      <div class="card-title-row">

        <h2>
          Quick Access
        </h2>

      </div>

      <div class="quick-grid">

        ${quickAction(
          "🩺",
          "সমস্যা",
          "সাধারণ সমস্যা",
          "problems"
        )}

        ${quickAction(
          "🍎",
          "খাবার",
          "Food Guide",
          "foods"
        )}

        ${quickAction(
          "📊",
          "Tracker",
          "Health Tracker",
          "tracker"
        )}

        ${quickTracker(
          "💧",
          "পানি যোগ করুন",
          "Water",
          "water"
        )}

        ${quickTracker(
          "🌙",
          "ঘুম",
          "Sleep",
          "sleep"
        )}

        ${quickTracker(
          "🏃",
          "Exercise",
          "Activity",
          "exercise"
        )}

        ${quickTracker(
          "👟",
          "Steps",
          "Manual steps",
          "steps"
        )}

        <button
          class="quick-action"
          type="button"
          data-action="favorites"
        >
          <span class="quick-action-icon">★</span>
          <strong>Favorites</strong>
          <small>
            সংরক্ষিত তথ্য
          </small>
        </button>

        <button
          class="quick-action"
          type="button"
          data-action="summary"
        >
          <span class="quick-action-icon">📅</span>
          <strong>30-Day Summary</strong>
          <small>
            বাস্তব logs-এর সারাংশ
          </small>
        </button>

      </div>

    </section>


    <section class="section card">

      <div class="card-title-row">

        <h2>
          Quick Actions
        </h2>

      </div>

      <div class="quick-grid">

        ${quickTracker(
          "⚖️",
          "Weight",
          "ওজন লগ",
          "weight"
        )}

        ${quickTracker(
          "🩸",
          "BP",
          "রক্তচাপ লগ",
          "bp"
        )}

        ${quickTracker(
          "🧪",
          "Glucose",
          "গ্লুকোজ লগ",
          "glucose"
        )}

        ${quickTracker(
          "♥",
          "Heart Rate",
          "Manual BPM",
          "heartRate"
        )}

      </div>

    </section>


    <section class="section card">

      <div class="card-title-row">

        <h2>
          Health Tips
        </h2>

      </div>

      <div class="list">

        <div class="list-item">

          <div class="list-main">

            <strong>
              নিয়মিততা
            </strong>

            <span class="small muted">
              নিজের বাস্তব দৈনিক অভ্যাসগুলো
              ধীরে ধীরে track করুন।
            </span>

          </div>

        </div>


        <div class="list-item">

          <div class="list-main">

            <strong>
              পানি ও ঘুম
            </strong>

            <span class="small muted">
              নিজের routine অনুযায়ী
              পানি ও ঘুমের দিকে নজর দিন।
            </span>

          </div>

        </div>


        <div class="list-item">

          <div class="list-main">

            <strong>
              Health information
            </strong>

            <span class="small muted">
              Tracker-এর data কোনো
              diagnosis নয়।
            </span>

          </div>

        </div>

      </div>

    </section>


    <section class="section card">

      <h2>
        আপনার ডেটা
      </h2>

      <p class="small muted">

        ${
          weight
            ? `সর্বশেষ weight log:
               ${escapeHTML(weight.value)} kg`
            : "Weight এখনো লগ করা হয়নি।"
        }

        Tracker-এর তথ্য এই browser-এর
        localStorage-এ রাখা হয়।

      </p>

    </section>

  `;

}


/* =========================================================
   QUICK ACTION HELPERS
   ========================================================= */

function quickAction(
  icon,
  title,
  description,
  route
) {

  return `

    <button
      class="quick-action"
      type="button"
      data-route="${route}"
    >

      <span class="quick-action-icon">
        ${icon}
      </span>

      <strong>
        ${escapeHTML(title)}
      </strong>

      <small>
        ${escapeHTML(description)}
      </small>

    </button>

  `;

}


function quickTracker(
  icon,
  title,
  description,
  tracker
) {

  return `

    <button
      class="quick-action"
      type="button"
      data-tracker="${tracker}"
    >

      <span class="quick-action-icon">
        ${icon}
      </span>

      <strong>
        ${escapeHTML(title)}
      </strong>

      <small>
        ${escapeHTML(description)}
      </small>

    </button>

  `;

}


/* =========================================================
   PROBLEMS
   ========================================================= */

function renderProblems() {

  if (
    APP.dataState.loading ||
    APP.dataState.error
  ) {

    return `

      <div class="view-header">

        <div>

          <div class="eyebrow">
            Problems
          </div>

          <h1>
            সাধারণ সমস্যা
          </h1>

        </div>

      </div>

      ${dataStateView()}

    `;

  }

  const query =
    APP.params.query || "";

  const results =
    searchProblems(query);

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          Problems
        </div>

        <h1>
          সাধারণ স্বাস্থ্য সমস্যা
        </h1>

        <p class="muted">
          শিক্ষামূলক তথ্য —
          নিজে diagnosis করার জন্য নয়।
        </p>

      </div>

    </div>


    <div class="search-wrap">

      <label
        class="sr-only"
        for="problemSearch"
      >
        সমস্যা খুঁজুন
      </label>

      <input
        id="problemSearch"
        type="search"
        autocomplete="off"
        placeholder="বাংলা বা English-এ খুঁজুন…"
        value="${escapeHTML(query)}"
      >

      ${
        query
          ? `
            <button
              class="search-clear"
              type="button"
              data-action="clear-problem-search"
              aria-label="Search clear"
            >
              ×
            </button>
          `
          : ""
      }

    </div>


    <div
      id="problemResults"
      class="list"
    >

      ${
        results.length

          ? results
              .map(renderProblemCard)
              .join("")

          : `
            <div class="empty-state">
              কোনো ফলাফল পাওয়া যায়নি।
              অন্য শব্দ দিয়ে চেষ্টা করুন।
            </div>
          `
      }

    </div>

  `;

}


function renderProblemCard(problem) {

  const favorite =
    isFavorite(
      "problems",
      problem.id
    );

  const symptoms =
    String(
      problem.symptoms || ""
    );

  return `

    <article class="list-item">

      <div class="list-main">

        <button
          class="btn-link"
          type="button"
          data-problem-id="${escapeHTML(problem.id)}"
        >

          <strong>
            ${escapeHTML(problem.name_bn)}
          </strong>

        </button>

        <div class="small muted">
          ${escapeHTML(problem.name_en || "")}
        </div>

        <div class="small">

          ${escapeHTML(
            symptoms.slice(0, 115)
          )}

          ${
            symptoms.length > 115
              ? "…"
              : ""
          }

        </div>

      </div>


      <div class="item-actions">

        <button
          class="icon-action ${
            favorite
              ? "favorite-on"
              : ""
          }"
          type="button"
          data-favorite="problems:${escapeHTML(problem.id)}"
          aria-label="${
            favorite
              ? "Favorite সরান"
              : "Favorite করুন"
          }"
        >
          ${
            favorite
              ? "★"
              : "☆"
          }
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   PROBLEM DETAIL
   ========================================================= */

function renderProblemDetail(id) {

  const problem =
    getProblemById(id);

  if (!problem) {

    return `

      <div class="error-state">

        এই সমস্যার তথ্য
        পাওয়া যায়নি।

      </div>

    `;

  }

  const favorite =
    isFavorite(
      "problems",
      problem.id
    );

  const recommendedFoods =
    getFoodsByIds(
      problem.recommended_food_ids || []
    );

  const moderateFoods =
    getFoodsByIds(
      problem.moderate_food_ids || []
    );

  const limitedFoods =
    getFoodsByIds(
      problem.limit_or_avoid_food_ids || []
    );

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          Problem Detail
        </div>

        <h1>
          ${escapeHTML(problem.name_bn)}
        </h1>

        <p class="muted">
          ${escapeHTML(problem.name_en || "")}
        </p>

      </div>


      <button
        class="icon-action ${
          favorite
            ? "favorite-on"
            : ""
        }"
        type="button"
        data-favorite="problems:${escapeHTML(problem.id)}"
      >
        ${favorite ? "★" : "☆"}
      </button>

    </div>


    <section class="card">

      ${detailBlock(
        "কী দেখে বুঝবেন",
        problem.symptoms
      )}

      ${detailBlock(
        "কী করবেন (করণীয় ও খাদ্য)",
        problem.actions
      )}

      ${detailBlock(
        "কী করবেন না (বর্জনীয়)",
        problem.avoid
      )}

      ${detailBlock(
        "কখন দ্রুত চিকিৎসা নেবেন",
        problem.red_flags
      )}


      ${foodGroupBlock(
        "🟢 খাওয়া ভালো",
        recommendedFoods
      )}

      ${foodGroupBlock(
        "🟡 পরিমিত খাওয়া",
        moderateFoods
      )}

      ${foodGroupBlock(
        "🔴 সীমিত বা এড়িয়ে চলুন",
        limitedFoods
      )}


      <div class="disclaimer">

        এই তথ্য সাধারণ শিক্ষা ও
        wellness সহায়তার জন্য।

        গুরুতর, নতুন বা দ্রুত খারাপ হওয়া
        উপসর্গে যোগ্য স্বাস্থ্যকর্মীর
        পরামর্শ নিন।

      </div>

    </section>


    <div class="form-actions">

      <button
        class="btn btn-secondary"
        type="button"
        data-route="problems"
      >
        ← সমস্যা তালিকায় ফিরুন
      </button>

    </div>

  `;

}


function detailBlock(
  title,
  value
) {

  const safeValue =
    escapeHTML(
      value ||
      "তথ্য দেওয়া হয়নি।"
    )
      .replace(
        /\n/g,
        "<br>"
      );

  return `

    <div class="detail-section">

      <h3>
        ${escapeHTML(title)}
      </h3>

      <p>
        ${safeValue}
      </p>

    </div>

  `;

}


/* Renders one food group (title + food names) as safe HTML.
   Every dynamic value is escaped here; the <br> separators are
   added by this function, so detailBlock() is not used for it. */

function foodGroupBlock(
  title,
  foods
) {

  if (!foods.length) {

    return "";

  }

  const lines =
    foods
      .map(food => {

        const english =
          food.name_en
            ? ` (${escapeHTML(food.name_en)})`
            : "";

        return `${escapeHTML(food.name_bn)}${english}`;

      })
      .join("<br>");

  return `

    <div class="detail-section">

      <h3>
        ${escapeHTML(title)}
      </h3>

      <p>
        ${lines}
      </p>

    </div>

  `;

}


/* =========================================================
   FOODS
   ========================================================= */

function renderFoods() {

  if (
    APP.dataState.loading ||
    APP.dataState.error
  ) {

    return `

      <div class="view-header">

        <div>

          <div class="eyebrow">
            Foods
          </div>

          <h1>
            Food Guide
          </h1>

        </div>

      </div>

      ${dataStateView()}

    `;

  }

  const query =
    APP.params.query || "";

  const results =
    searchFoods(query);

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          Foods
        </div>

        <h1>
          Food Guide
        </h1>

        <p class="muted">
          পরিমাণ ও ব্যক্তিগত
          health context গুরুত্বপূর্ণ।
        </p>

      </div>

    </div>


    <div class="search-wrap">

      <label
        class="sr-only"
        for="foodSearch"
      >
        খাবার খুঁজুন
      </label>

      <input
        id="foodSearch"
        type="search"
        autocomplete="off"
        placeholder="খাবারের বাংলা বা English নাম…"
        value="${escapeHTML(query)}"
      >

      ${
        query
          ? `
            <button
              class="search-clear"
              type="button"
              data-action="clear-food-search"
              aria-label="Search clear"
            >
              ×
            </button>
          `
          : ""
      }

    </div>


    <div
      id="foodResults"
      class="list"
    >

      ${
        results.length

          ? results
              .map(renderFoodCard)
              .join("")

          : `
            <div class="empty-state">
              কোনো খাবার পাওয়া যায়নি।
            </div>
          `
      }

    </div>

  `;

}


function renderFoodCard(food) {

  const favorite =
    isFavorite(
      "foods",
      food.id
    );

  return `

    <article class="list-item">

      <div class="list-main">

        <button
          class="btn-link"
          type="button"
          data-food-id="${escapeHTML(food.id)}"
        >

          <strong>
            ${escapeHTML(food.name_bn)}
          </strong>

        </button>

        <div class="small muted">

          ${escapeHTML(food.name_en || "")}

          • 

          ${escapeHTML(
            food.category || "অন্যান্য"
          )}

        </div>

        <div class="small">

          ${escapeHTML(
            food.serving || ""
          )}

          • 

          ${escapeHTML(
            food.calories ?? "—"
          )}
          kcal

          •

          Protein
          ${escapeHTML(
            food.protein ?? "—"
          )}
          g

        </div>

      </div>


      <div class="item-actions">

        <button
          class="icon-action ${
            favorite
              ? "favorite-on"
              : ""
          }"
          type="button"
          data-favorite="foods:${escapeHTML(food.id)}"
          aria-label="${
            favorite
              ? "Favorite সরান"
              : "Favorite করুন"
          }"
        >

          ${
            favorite
              ? "★"
              : "☆"
          }

        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   FOOD DETAIL
   ========================================================= */

function renderFoodDetail(id) {

  const food =
    getFoodById(id);

  if (!food) {

    return `

      <div class="error-state">

        এই খাবারের তথ্য
        পাওয়া যায়নি।

      </div>

    `;

  }

  const favorite =
    isFavorite(
      "foods",
      food.id
    );

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          Food Detail
        </div>

        <h1>
          ${escapeHTML(food.name_bn)}
        </h1>

        <p class="muted">
          ${escapeHTML(food.name_en || "")}
        </p>

      </div>


      <button
        class="icon-action ${
          favorite
            ? "favorite-on"
            : ""
        }"
        type="button"
        data-favorite="foods:${escapeHTML(food.id)}"
      >
        ${favorite ? "★" : "☆"}
      </button>

    </div>


    <section class="card">

      <div class="two-column">

        <div>
          <span class="small muted">
            Serving
          </span>

          <strong>
            ${escapeHTML(
              food.serving || "—"
            )}
          </strong>
        </div>


        <div>
          <span class="small muted">
            Category
          </span>

          <strong>
            ${escapeHTML(
              food.category || "—"
            )}
          </strong>
        </div>


        <div>
          <span class="small muted">
            Calories
          </span>

          <strong>
            ${escapeHTML(
              food.calories ?? "—"
            )}
            kcal
          </strong>
        </div>


        <div>
          <span class="small muted">
            Protein
          </span>

          <strong>
            ${escapeHTML(
              food.protein ?? "—"
            )}
            g
          </strong>
        </div>


        <div>
          <span class="small muted">
            Carbs
          </span>

          <strong>
            ${escapeHTML(
              food.carbs ?? "—"
            )}
            g
          </strong>
        </div>


        <div>
          <span class="small muted">
            Fat
          </span>

          <strong>
            ${escapeHTML(
              food.fat ?? "—"
            )}
            g
          </strong>
        </div>

      </div>


      <div class="divider"></div>


      <div class="disclaimer">

        Nutrition values dataset-এর
        stated serving-এর জন্য।

        এগুলো complete health বা
        diet assessment নয়।

      </div>

    </section>


    <div class="form-actions">

      <button
        class="btn btn-secondary"
        type="button"
        data-action="meal-swap"
        data-food-id="${escapeHTML(food.id)}"
      >
        Meal Swap
      </button>


      <button
        class="btn btn-secondary"
        type="button"
        data-route="foods"
      >
        ← খাবারে ফিরুন
      </button>

    </div>

  `;

}


/* =========================================================
   TRACKER DEFINITIONS
   ========================================================= */

const TRACKERS = [

  [
    "water",
    "💧",
    "Water Tracker",
    "পানি"
  ],

  [
    "sleep",
    "🌙",
    "Sleep Tracker",
    "ঘুম"
  ],

  [
    "exercise",
    "🏃",
    "Exercise",
    "ব্যায়াম"
  ],

  [
    "steps",
    "👟",
    "Steps",
    "পদক্ষেপ"
  ],

  [
    "bmi",
    "⚖️",
    "BMI/BMR",
    "হিসাব"
  ],

  [
    "weight",
    "⚖️",
    "Weight Tracker",
    "ওজন"
  ],

  [
    "bp",
    "🩸",
    "BP Log",
    "রক্তচাপ"
  ],

  [
    "glucose",
    "🧪",
    "Glucose Log",
    "গ্লুকোজ"
  ],

  [
    "heartRate",
    "♥",
    "Heart Rate",
    "হার্ট রেট"
  ],

  [
    "hrZone",
    "◉",
    "Heart Rate Zone",
    "জোন"
  ],

  [
    "foodGuide",
    "🍎",
    "Food Guide",
    "খাবার"
  ],

  [
    "summary",
    "📅",
    "30-Day Summary",
    "সারাংশ"
  ],

  [
    "period",
    "🗓",
    "Pregnancy & Period",
    "পিরিয়ড"
  ],

  [
    "nutrition",
    "🍽️",
    "Nutrition Log",
    "খাবার ও ক্যালরি"
  ]

];


const EXPERIMENTAL_TOOLS = [

  [
    "cameraHR",
    "📷",
    "Camera Heart Rate",
    "Beta"
  ],

  [
    "motionSteps",
    "📱",
    "Motion Step Counter",
    "Beta"
  ],

  [
    "pulseZone",
    "♥",
    "Exercise Pulse Zone",
    "Experimental"
  ],

  [
    "breathing",
    "🌬",
    "Breathing Rate Timer",
    "Functional"
  ]

];


/* =========================================================
   TRACKER PAGE
   ========================================================= */

function renderTracker() {

  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          Tracker
        </div>

        <h1>
          Health Tracker
        </h1>

        <p class="muted">

          শুধু আপনার নিজের
          লগ করা তথ্য দেখাবে।

          Sensor/API না থাকলে
          automatic value বানানো হবে না।

        </p>

      </div>

    </div>


    <div class="tracker-grid">

      ${TRACKERS
        .map(
          tracker =>
            trackerTile(tracker)
        )
        .join("")}

    </div>


    <section class="section">

      <div class="card-title-row">

        <h2>
          Experimental Tools
        </h2>

        <span class="badge">
          Beta
        </span>

      </div>


      <div class="tracker-grid">

        ${EXPERIMENTAL_TOOLS
          .map(
            tracker =>
              trackerTile(
                tracker,
                true
              )
          )
          .join("")}

      </div>

    </section>

  `;

}


function trackerTile(
  tracker,
  experimental = false
) {

  return `

    <button
      class="feature-tile"
      type="button"
      data-tracker="${escapeHTML(tracker[0])}"
    >

      <span class="tile-icon">
        ${tracker[1]}
      </span>

      <strong>
        ${escapeHTML(tracker[2])}
      </strong>

      <small>
        ${escapeHTML(tracker[3])}

        ${
          experimental
            ? " • Experimental"
            : ""
        }

      </small>

    </button>

  `;

}


/* =========================================================
   MORE
   ========================================================= */

function renderMore() {

  const items = [

    [
      "profile",
      "👤",
      "Profile",
      "ব্যক্তিগত তথ্য"
    ],

    [
      "conditions",
      "🩺",
      "Conditions Guide",
      "অবস্থা ও খাবারের গাইড"
    ],

    [
      "settings",
      "⚙️",
      "Settings",
      "ভাষা, theme, data"
    ],

    [
      "notifications",
      "🔔",
      "Notifications",
      "Reminder readiness"
    ],

    [
      "healthInfo",
      "ℹ️",
      "Health Information",
      "সাধারণ wellness"
    ],

    [
      "sources",
      "📚",
      "Sources/References",
      "বিশ্বস্ত উৎস"
    ],

    [
      "about",
      "HN",
      "About Health Nivo",
      "অ্যাপ সম্পর্কে"
    ],

    [
      "privacy",
      "🔒",
      "Privacy",
      "Data ব্যবহারের তথ্য"
    ],

    [
      "disclaimer",
      "⚠️",
      "Medical Disclaimer",
      "গুরুত্বপূর্ণ সীমাবদ্ধতা"
    ],

    [
      "feedback",
      "✉️",
      "Feedback",
      "মতামত জানান"
    ]

  ];


  return `

    <div class="view-header">

      <div>

        <div class="eyebrow">
          More
        </div>

        <h1>
          More
        </h1>

        <p class="muted">
          Health Nivo-এর তথ্য,
          settings ও সহায়ক অংশ।
        </p>

      </div>

    </div>


    <div class="more-grid">

      ${items
        .map(
          item =>
            trackerTile(item)
        )
        .join("")}

    </div>

  `;

}


/* =========================================================
   GENERIC RECORD HELPERS
   ========================================================= */

function generateId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {

    return window.crypto.randomUUID();

  }

  return (
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


function addRecord(
  key,
  record
) {

  const existing =
    storageGet(
      key,
      []
    );

  const records =
    Array.isArray(existing)
      ? existing
      : [];

  records.push({

    id:
      record.id ||
      generateId(),

    ...record

  });

  return storageSet(
    key,
    records
  );

}


function getLatestRecord(key) {

  const records =
    storageGet(
      key,
      []
    );

  if (
    !Array.isArray(records) ||
    records.length === 0
  ) {

    return null;

  }

  return [...records]
    .sort(
      (a, b) =>
        String(
          b.date ||
          b.datetime ||
          ""
        ).localeCompare(
          String(
            a.date ||
            a.datetime ||
            ""
          )
        )
    )[0];

}


function getTodayRecords(key) {

  const records =
    storageGet(
      key,
      []
    );

  if (!Array.isArray(records)) {

    return [];

  }

  return records.filter(
    record =>

      String(
        record.date ||
        record.datetime ||
        ""
      ).slice(0, 10)
      === todayISO()

  );

}


function getTodayWater() {

  const records =
    storageGet(
      APP.keys.water,
      []
    );

  const list =
    Array.isArray(records)
      ? records
      : [];

  const today =
    list.filter(
      record =>
        record.date ===
        todayISO()
    );

  return {

    total:
      today.reduce(
        (sum, record) =>
          sum +
          Number(
            record.amount || 0
          ),
        0
      ),

    records: list

  };

}


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(
  title,
  body
) {

  const root =
    $("#modalRoot");

  if (!root) return;

  root.innerHTML = `

    <div
      class="modal-backdrop"
      role="presentation"
    >

      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >

        <div class="modal-header">

          <h2 id="modalTitle">
            ${escapeHTML(title)}
          </h2>

          <button
            class="close-button"
            type="button"
            data-action="close-modal"
            aria-label="বন্ধ করুন"
          >
            ×
          </button>

        </div>

        <div>
          ${body}
        </div>

      </section>

    </div>

  `;


  $(".modal-backdrop", root)
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.classList
            .contains(
              "modal-backdrop"
            )
        ) {

          closeModal();

        }

      }
    );


  bindEvents();

}


function closeModal() {

  stopBreathing();

  const root =
    $("#modalRoot");

  if (root) {

    root.innerHTML = "";

  }

}


/* =========================================================
   FORM WRAPPER
   ========================================================= */

function formShell(
  fields,
  action,
  submitText = "সংরক্ষণ"
) {

  return `

    <form
      data-form="${escapeHTML(action)}"
    >

      ${fields}

      <div class="form-actions">

        <button
          class="btn btn-primary"
          type="submit"
        >
          ${escapeHTML(submitText)}
        </button>

        <button
          class="btn btn-secondary"
          type="button"
          data-action="close-modal"
        >
          বাতিল
        </button>

      </div>

    </form>

  `;

}


function collectForm(form) {

  const data =
    new FormData(form);

  return Object.fromEntries(
    data.entries()
  );

}


/* =========================================================
   WATER TRACKER
   ========================================================= */

function openWaterTracker() {

  const water =
    getTodayWater();

  const todayRecords =
    water.records.filter(
      record =>
        record.date ===
        todayISO()
    );


  openModal(

    "Water Tracker",

    `

      <div class="card">

        <div class="metric-big">
          ${water.total} ml
        </div>

        <div class="muted">
          আজ লগ করা পানি
        </div>

        <div class="progress">

          <span
            style="width:${Math.min(
              100,
              water.total / 25
            )}%"
          ></span>

        </div>

        <p class="small muted">
          Progress শুধু আপনার
          entered data-এর ওপর ভিত্তি করে।
        </p>

      </div>


      ${formShell(

        `

          <div class="form-grid">

            <div>

              <label for="waterAmount">
                পরিমাণ (ml)
              </label>

              <input
                id="waterAmount"
                name="amount"
                type="number"
                min="1"
                step="1"
                placeholder="যেমন 250"
                required
              >

            </div>


            <div>

              <label for="waterDate">
                তারিখ
              </label>

              <input
                id="waterDate"
                name="date"
                type="date"
                value="${todayISO()}"
                required
              >

            </div>

          </div>

        `,

        "water-add",

        "পানি যোগ করুন"

      )}


      <div class="divider"></div>

      <h3>
        আজকের history
      </h3>


      <div class="list">

        ${
          todayRecords.length

            ? todayRecords
                .map(
                  record => `

                    <div class="list-item">

                      <span>
                        ${escapeHTML(
                          record.amount
                        )}
                        ml
                      </span>

                      <button
                        class="icon-action"
                        type="button"
                        data-delete-record="water:${escapeHTML(record.id)}"
                      >
                        🗑
                      </button>

                    </div>

                  `
                )
                .join("")

            : `
              <div class="empty-state">
                আজ কোনো পানি log নেই।
              </div>
            `
        }

      </div>

    `

  );

}


/* =========================================================
   SLEEP TRACKER
   ========================================================= */

function openSleepTracker() {

  openModal(

    "Sleep Tracker",

    formShell(

      `

        <div class="form-grid two">

          <div>

            <label for="sleepBedtime">
              Bedtime
            </label>

            <input
              id="sleepBedtime"
              name="bedtime"
              type="datetime-local"
              value="${localDateTimeValue()}"
              required
            >

          </div>


          <div>

            <label for="sleepWake">
              Wake time
            </label>

            <input
              id="sleepWake"
              name="wake"
              type="datetime-local"
              value="${localDateTimeValue()}"
              required
            >

          </div>

        </div>


        <div>

          <label for="sleepGoal">
            Goal (hours)
          </label>

          <input
            id="sleepGoal"
            name="goal"
            type="number"
            min="1"
            max="24"
            step="0.5"
            value="8"
          >

        </div>

      `,

      "sleep-add"

    )

  );

}


/* =========================================================
   EXERCISE
   ========================================================= */

function openExerciseTracker() {

  openModal(

    "Exercise",

    formShell(

      `

        <div class="form-grid two">

          <div>

            <label for="exerciseType">
              Type
            </label>

            <select
              id="exerciseType"
              name="type"
            >

              <option>
                Walking
              </option>

              <option>
                Running
              </option>

              <option>
                Cycling
              </option>

              <option>
                Home workout
              </option>

              <option>
                Stretching
              </option>

              <option>
                Other
              </option>

            </select>

          </div>


          <div>

            <label for="exerciseDuration">
              Duration (minutes)
            </label>

            <input
              id="exerciseDuration"
              name="duration"
              type="number"
              min="1"
              max="1440"
              required
            >

          </div>

        </div>


        <div>

          <label for="exerciseIntensity">
            Intensity
          </label>

          <select
            id="exerciseIntensity"
            name="intensity"
          >

            <option>
              Light
            </option>

            <option>
              Moderate
            </option>

            <option>
              Vigorous
            </option>

            <option>
              Not specified
            </option>

          </select>

        </div>


        <div>

          <label for="exerciseDate">
            Date
          </label>

          <input
            id="exerciseDate"
            name="date"
            type="date"
            value="${todayISO()}"
            required
          >

        </div>

      `,

      "exercise-add"

    )

  );

}


/* =========================================================
   STEPS
   ========================================================= */

function openStepsTracker() {

  openModal(

    "Steps",

    formShell(

      `

        <div>

          <label for="stepsValue">
            Steps
          </label>

          <input
            id="stepsValue"
            name="steps"
            type="number"
            min="0"
            step="1"
            required
          >

        </div>


        <div>

          <label for="stepsGoal">
            Goal
          </label>

          <input
            id="stepsGoal"
            name="goal"
            type="number"
            min="0"
            value="6000"
          >

        </div>


        <div>

          <label for="stepsDate">
            Date
          </label>

          <input
            id="stepsDate"
            name="date"
            type="date"
            value="${todayISO()}"
            required
          >

        </div>


        <p class="small muted">

          Device integration না থাকলে
          এখানে শুধু manual entry হবে।

          কোনো fake automatic count
          তৈরি করা হবে না।

        </p>

      `,

      "steps-add"

    )

  );

}


/* =========================================================
   BMI / BMR
   ========================================================= */

function calculateBMI(
  height,
  weight
) {

  const heightMeters =
    Number(height) / 100;

  const weightKg =
    Number(weight);

  if (
    !heightMeters ||
    !weightKg
  ) {

    return null;

  }

  const bmi =
    weightKg /
    (heightMeters * heightMeters);


  let category =
    "তথ্য নির্ভর করে";


  if (bmi < 18.5) {

    category =
      "কম BMI range";

  } else if (bmi < 25) {

    category =
      "সাধারণ BMI range";

  } else if (bmi < 30) {

    category =
      "উচ্চ BMI range";

  } else {

    category =
      "আরও উচ্চ BMI range";

  }


  return {

    value:
      bmi.toFixed(1),

    category

  };

}


function calculateBMR(
  age,
  weight,
  height,
  sex
) {

  const a = Number(age);
  const w = Number(weight);
  const h = Number(height);

  if (!a || !w || !h) {

    return null;

  }

  return Math.round(

    (10 * w) +
    (6.25 * h) -
    (5 * a) +
    (sex === "male" ? 5 : -161)

  );

}


function openBMIBMR() {

  openModal(

    "BMI / BMR",

    `

      ${formShell(

        `

          <div class="form-grid two">

            <div>

              <label for="bmiHeight">
                Height (cm)
              </label>

              <input
                id="bmiHeight"
                name="height"
                type="number"
                min="50"
                max="250"
                step="0.1"
                required
              >

            </div>


            <div>

              <label for="bmiWeight">
                Weight (kg)
              </label>

              <input
                id="bmiWeight"
                name="weight"
                type="number"
                min="10"
                max="500"
                step="0.1"
                required
              >

            </div>


            <div>

              <label for="bmiAge">
                Age
              </label>

              <input
                id="bmiAge"
                name="age"
                type="number"
                min="1"
                max="120"
                required
              >

            </div>


            <div>

              <label for="bmiSex">
                Sex
              </label>

              <select
                id="bmiSex"
                name="sex"
              >

                <option value="female">
                  Female
                </option>

                <option value="male">
                  Male
                </option>

              </select>

            </div>

          </div>

        `,

        "bmi-calculate",

        "Calculate"

      )}


      <div
        id="bmiResult"
        class="section"
      ></div>


      <div class="disclaimer">

        BMI ও BMR simple calculations।
        এগুলো complete health status
        বা diagnosis নয়।

      </div>

    `

  );

}


/* =========================================================
   WEIGHT
   ========================================================= */

function openWeightTracker() {

  const latest =
    getLatestRecord(
      APP.keys.weight
    );

  openModal(

    "Weight Tracker",

    `

      ${formShell(

        `

          <div>

            <label for="weightValue">
              Weight (kg)
            </label>

            <input
              id="weightValue"
              name="value"
              type="number"
              min="10"
              max="500"
              step="0.1"
              value="${
                escapeHTML(
                  latest?.value || ""
                )
              }"
              required
            >

          </div>


          <div>

            <label for="weightDate">
              Date
            </label>

            <input
              id="weightDate"
              name="date"
              type="date"
              value="${todayISO()}"
              required
            >

          </div>

        `,

        "weight-add"

      )}


      ${historyMarkup(
        APP.keys.weight,
        "kg"
      )}

    `

  );

}


/* =========================================================
   BP
   ========================================================= */

function openBPTracker() {

  openModal(

    "BP Log",

    `

      ${formShell(

        `

          <div class="form-grid two">

            <div>

              <label for="bpSystolic">
                Systolic
              </label>

              <input
                id="bpSystolic"
                name="systolic"
                type="number"
                min="50"
                max="300"
                required
              >

            </div>


            <div>

              <label for="bpDiastolic">
                Diastolic
              </label>

              <input
                id="bpDiastolic"
                name="diastolic"
                type="number"
                min="30"
                max="200"
                required
              >

            </div>


            <div>

              <label for="bpDate">
                Date
              </label>

              <input
                id="bpDate"
                name="date"
                type="date"
                value="${todayISO()}"
                required
              >

            </div>


            <div>

              <label for="bpTime">
                Time
              </label>

              <input
                id="bpTime"
                name="time"
                type="time"
              >

            </div>

          </div>


          <div>

            <label for="bpNotes">
              Notes
            </label>

            <textarea
              id="bpNotes"
              name="notes"
              placeholder="Optional context"
            ></textarea>

          </div>


          <p class="small muted">

            একটি BP reading নিজে থেকে
            কোনো diagnosis প্রমাণ করে না।

          </p>

        `,

        "bp-add"

      )}


      ${historyMarkup(
        APP.keys.bp,
        "mmHg"
      )}

    `

  );

}


/* =========================================================
   GLUCOSE
   ========================================================= */

function openGlucoseTracker() {

  openModal(

    "Glucose Log",

    `

      ${formShell(

        `

          <div class="form-grid two">

            <div>

              <label for="glucoseValue">
                Value
              </label>

              <input
                id="glucoseValue"
                name="value"
                type="number"
                min="0"
                max="2000"
                step="0.1"
                required
              >

            </div>


            <div>

              <label for="glucoseUnit">
                Unit
              </label>

              <select
                id="glucoseUnit"
                name="unit"
              >

                <option>
                  mg/dL
                </option>

                <option>
                  mmol/L
                </option>

              </select>

            </div>


            <div>

              <label for="glucoseContext">
                Context
              </label>

              <select
                id="glucoseContext"
                name="context"
              >

                <option>
                  Not specified
                </option>

                <option>
                  Fasting
                </option>

                <option>
                  Before meal
                </option>

                <option>
                  After meal
                </option>

                <option>
                  Random
                </option>

              </select>

            </div>


            <div>

              <label for="glucoseDate">
                Date
              </label>

              <input
                id="glucoseDate"
                name="date"
                type="date"
                value="${todayISO()}"
                required
              >

            </div>

          </div>


          <div>

            <label for="glucoseNotes">
              Notes
            </label>

            <textarea
              id="glucoseNotes"
              name="notes"
            ></textarea>

          </div>


          <p class="small muted">

            এই log tracking-এর জন্য।
            Diagnosis বা treatment-এর
            বিকল্প নয়।

          </p>

        `,

        "glucose-add"

      )}


      ${historyMarkup(
        APP.keys.glucose,
        ""
      )}

    `

  );

}


/* =========================================================
   HEART RATE
   ========================================================= */

function openHeartRateTracker() {

  openModal(

    "Heart Rate",

    `

      ${formShell(

        `

          <div>

            <label for="heartRateValue">
              Heart rate (BPM)
            </label>

            <input
              id="heartRateValue"
              name="value"
              type="number"
              min="20"
              max="250"
              required
            >

          </div>


          <div>

            <label for="heartRateDate">
              Date & time
            </label>

            <input
              id="heartRateDate"
              name="datetime"
              type="datetime-local"
              value="${localDateTimeValue()}"
              required
            >

          </div>


          <div>

            <label for="heartRateNotes">
              Notes
            </label>

            <textarea
              id="heartRateNotes"
              name="notes"
            ></textarea>

          </div>


          <p class="small muted">

            এখানে BPM manually দিতে হবে।
            Camera বা wearable data এখনো
            fake করা হচ্ছে না।

          </p>

        `,

        "heart-rate-add"

      )}


      ${historyMarkup(
        APP.keys.heartRate,
        "BPM"
      )}

    `

  );

}


/* =========================================================
   HEART RATE ZONE
   ========================================================= */

function calculateHeartRateZones(age) {

  const numericAge =
    Number(age);

  if (!numericAge) {

    return null;

  }

  const max =
    220 - numericAge;

  return [

    [
      "Zone 1",
      Math.round(max * 0.50),
      Math.round(max * 0.60)
    ],

    [
      "Zone 2",
      Math.round(max * 0.60),
      Math.round(max * 0.70)
    ],

    [
      "Zone 3",
      Math.round(max * 0.70),
      Math.round(max * 0.80)
    ],

    [
      "Zone 4",
      Math.round(max * 0.80),
      Math.round(max * 0.90)
    ],

    [
      "Zone 5",
      Math.round(max * 0.90),
      max
    ]

  ];

}


function openHeartRateZone() {

  openModal(

    "Heart Rate Zone",

    `

      ${formShell(

        `

          <div>

            <label for="zoneAge">
              Age
            </label>

            <input
              id="zoneAge"
              name="age"
              type="number"
              min="10"
              max="120"
              required
            >

          </div>

        `,

        "heart-rate-zone-calculate",

        "Calculate"

      )}


      <div
        id="heartRateZoneResult"
        class="section"
      ></div>


      <p class="small muted">

        এটি একটি সাধারণ
        exercise-oriented estimate।
        ব্যক্তিগত medical advice নয়।

      </p>

    `

  );

}


/* =========================================================
   30 DAY SUMMARY
   ========================================================= */

function getLast30DaysCount(
  key
) {

  const records =
    storageGet(
      key,
      []
    );

  if (!Array.isArray(records)) {

    return 0;

  }

  const start =
    new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );

  start.setDate(
    start.getDate() - 29
  );

  const startDate =
    localISODate(start);


  return records.filter(
    record => {

      const date =
        String(
          record.date ||
          record.datetime ||
          ""
        ).slice(0, 10);

      return (
        date >= startDate &&
        date <= todayISO()
      );

    }
  ).length;

}


function calculateStreak() {

  const keys = [

    APP.keys.water,

    APP.keys.sleep,

    APP.keys.exercise,

    APP.keys.steps

  ];


  const activeDates =
    new Set();


  keys.forEach(key => {

    const records =
      storageGet(
        key,
        []
      );

    if (!Array.isArray(records)) {

      return;

    }

    records.forEach(record => {

      const date =
        String(
          record.date ||
          record.datetime ||
          ""
        ).slice(0, 10);

      if (date) {

        activeDates.add(
          date
        );

      }

    });

  });


  let current = 0;

  const cursor =
    new Date();

  cursor.setHours(
    0,
    0,
    0,
    0
  );


  while (
    activeDates.has(
      localISODate(cursor)
    )
  ) {

    current++;

    cursor.setDate(
      cursor.getDate() - 1
    );

  }


  const sorted =
    [...activeDates]
      .sort();


  let best = 0;

  let run = 0;

  let previous = null;


  sorted.forEach(
    dateString => {

      const date =
        new Date(
          `${dateString}T00:00:00`
        );

      if (previous) {

        const difference =
          Math.round(
            (
              date - previous
            ) / 86400000
          );

        if (
          difference === 1
        ) {

          run++;

        } else {

          run = 1;

        }

      } else {

        run = 1;

      }

      best =
        Math.max(
          best,
          run
        );

      previous = date;

    }
  );


  return {

    current,

    best

  };

}


function openSummary() {

  const datasets = [

    [
      "Water",
      APP.keys.water
    ],

    [
      "Sleep",
      APP.keys.sleep
    ],

    [
      "Exercise",
      APP.keys.exercise
    ],

    [
      "Steps",
      APP.keys.steps
    ],

    [
      "Weight",
      APP.keys.weight
    ],

    [
      "BP",
      APP.keys.bp
    ],

    [
      "Glucose",
      APP.keys.glucose
    ],

    [
      "Heart Rate",
      APP.keys.heartRate
    ]

  ];


  const cards =
    datasets
      .map(
        dataset => {

          const count =
            getLast30DaysCount(
              dataset[1]
            );

          return `

            <div class="stat-card">

              <div class="stat-value">
                ${count}
              </div>

              <div class="stat-label">
                ${escapeHTML(dataset[0])}
                logs / 30 days
              </div>

            </div>

          `;

        }
      )
      .join("");


  const streak =
    calculateStreak();


  openModal(

    "30-Day Summary",

    `

      <div class="stats-grid">

        ${cards}

      </div>


      <section class="section card">

        <strong>
          Current streak:
          ${streak.current} day(s)
        </strong>

        <p class="small muted">

          Best streak:
          ${streak.best} day(s)

        </p>

        <p class="small muted">

          Streak শুধুমাত্র
          actual activity logs থেকে
          গণনা হয়।

        </p>

      </section>


      <div class="disclaimer">

        Summary কোনো health score,
        diagnosis বা success rating নয়।

      </div>

    `

  );

}


/* =========================================================
   PERIOD / PREGNANCY
   ========================================================= */

function openPeriodTracker() {

  const saved =
    storageGet(
      APP.keys.period,
      {
        lastPeriod: "",
        cycleLength: 28,
        notes: ""
      }
    );


  openModal(

    "Pregnancy & Period",

    `

      ${formShell(

        `

          <div>

            <label for="periodDate">
              Last period date
            </label>

            <input
              id="periodDate"
              name="lastPeriod"
              type="date"
              value="${escapeHTML(
                saved.lastPeriod || ""
              )}"
            >

          </div>


          <div>

            <label for="cycleLength">
              Cycle length (days)
            </label>

            <input
              id="cycleLength"
              name="cycleLength"
              type="number"
              min="15"
              max="60"
              value="${escapeHTML(
                saved.cycleLength || 28
              )}"
            >

          </div>


          <div>

            <label for="periodNotes">
              Notes
            </label>

            <textarea
              id="periodNotes"
              name="notes"
            >${escapeHTML(
              saved.notes || ""
            )}</textarea>

          </div>


          <p class="small muted">

            Cycle estimates পরিবর্তনশীল।
            এগুলো medical diagnosis নয়।

          </p>

        `,

        "period-save"

      )}


      <section class="section card">

        <h3>
          Pregnancy information
        </h3>

        <p class="small muted">

          এই Phase 1 কোনো pregnancy
          diagnosis বা outcome prediction
          করে না।

          ভবিষ্যতে evidence-based
          information section যোগ করা যাবে।

        </p>

      </section>

    `

  );

}


/* =========================================================
   EXPERIMENTAL CAMERA HR
   ========================================================= */

function openCameraHeartRate() {

  openModal(

    "Camera Heart Rate",

    `

      <div class="card">

        <span class="badge">
          Experimental / Beta
        </span>

        <h3>
          Camera measurement এখনো
          সক্রিয় নয়
        </h3>

        <p>

          এই Phase 1-এ camera দিয়ে
          BPM অনুমান করা হচ্ছে না।

          কোনো fake result দেখানো হবে না।

        </p>

        <button
          class="btn btn-secondary"
          type="button"
          data-action="camera-check"
        >
          Camera support check
        </button>


        <div
          id="cameraStatus"
          class="section small muted"
        ></div>

      </div>

    `

  );

}


async function checkCameraSupport() {

  const status =
    $("#cameraStatus");

  if (!status) return;


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    status.textContent =
      "এই browser-এ Camera API support নেই।";

    return;

  }


  status.textContent =
    "Camera API available। Actual heart-rate measurement integration Phase 1-এ implement করা হয়নি।";

}


/* =========================================================
   EXPERIMENTAL MOTION STEPS
   ========================================================= */

function openMotionStepCounter() {

  openModal(

    "Motion Step Counter",

    `

      <div class="card">

        <span class="badge">
          Experimental / Beta
        </span>

        <p>

          Device motion sensor support
          থাকলে ভবিষ্যতে step detection
          করা যাবে।

          এখন কোনো automatic count
          বানানো হবে না।

        </p>


        <button
          class="btn btn-primary"
          type="button"
          data-action="motion-check"
        >
          Device support check
        </button>


        <div
          id="motionStatus"
          class="section small muted"
        ></div>

      </div>

    `

  );

}


function checkMotionSupport() {

  const status =
    $("#motionStatus");

  if (!status) return;


  if (
    "DeviceMotionEvent" in window
  ) {

    status.textContent =
      "DeviceMotionEvent API available। Step detection algorithm ও validation Phase 1-এ implement করা হয়নি।";

  } else {

    status.textContent =
      "Device motion API support নেই। Manual Steps ব্যবহার করুন।";

  }

}


/* =========================================================
   EXPERIMENTAL PULSE ZONE
   ========================================================= */

function openExercisePulseZone() {

  openModal(

    "Exercise Pulse Zone",

    `

      ${formShell(

        `

          <div class="form-grid two">

            <div>

              <label for="pulseAge">
                Age
              </label>

              <input
                id="pulseAge"
                name="age"
                type="number"
                min="10"
                max="120"
                required
              >

            </div>


            <div>

              <label for="pulseHR">
                Current HR (BPM)
              </label>

              <input
                id="pulseHR"
                name="hr"
                type="number"
                min="20"
                max="250"
                required
              >

            </div>

          </div>


          <p class="small muted">

            Experimental exercise
            context tool।
            General estimate only।

          </p>

        `,

        "pulse-zone-calculate",

        "Calculate"

      )}


      <div
        id="pulseZoneResult"
        class="section"
      ></div>

    `

  );

}


/* =========================================================
   BREATHING TIMER
   ========================================================= */

function openBreathingTimer() {

  openModal(

    "Breathing Rate Timer",

    `

      <div class="center">

        <span class="badge">
          Functional wellness tool
        </span>


        <div
          id="breathCircle"
          class="breath-circle"
        >

          <strong
            id="breathLabel"
          >
            Ready
          </strong>

        </div>


        <div
          id="breathTime"
          class="metric-big"
        >
          02:00
        </div>


        <p
          id="breathInstruction"
          class="muted"
        >
          Start চাপলে
          breathing rhythm দেখাবে।
        </p>

      </div>


      <div>

        <label for="breathDuration">
          Duration (seconds)
        </label>

        <input
          id="breathDuration"
          type="number"
          min="30"
          max="1800"
          step="30"
          value="120"
        >

      </div>


      <div class="form-actions">

        <button
          class="btn btn-primary"
          type="button"
          data-action="breathing-start"
        >
          Start
        </button>

        <button
          class="btn btn-secondary"
          type="button"
          data-action="breathing-pause"
        >
          Pause
        </button>

        <button
          class="btn btn-secondary"
          type="button"
          data-action="breathing-reset"
        >
          Reset
        </button>

      </div>


      <p class="small muted">

        এটি relaxation/wellness timer।
        কোনো চিকিৎসা নয়।

        মাথা ঘোরা বা অস্বস্তি হলে
        থামুন।

      </p>

    `

  );


  initializeBreathing();

}


function initializeBreathing() {

  APP.timers.breathing = {

    remaining: 120,

    running: false,

    phase: "ready",

    interval: null,

    phaseStarted: 0

  };

  updateBreathingUI();

}


function updateBreathingUI() {

  const timer =
    APP.timers.breathing;

  if (!timer) return;


  const timeElement =
    $("#breathTime");

  const labelElement =
    $("#breathLabel");

  const instruction =
    $("#breathInstruction");

  const circle =
    $("#breathCircle");


  if (!timeElement) return;


  const minutes =
    Math.floor(
      Math.max(
        0,
        timer.remaining
      ) / 60
    )
      .toString()
      .padStart(2, "0");


  const seconds =
    Math.floor(
      Math.max(
        0,
        timer.remaining
      ) % 60
    )
      .toString()
      .padStart(2, "0");


  timeElement.textContent =
    `${minutes}:${seconds}`;


  labelElement.textContent =
    timer.phase === "inhale"
      ? "শ্বাস নিন"
      : timer.phase === "exhale"
        ? "শ্বাস ছাড়ুন"
        : timer.phase === "done"
          ? "Done"
          : "Ready";


  instruction.textContent =
    timer.phase === "inhale"
      ? "ধীরে শ্বাস নিন।"
      : timer.phase === "exhale"
        ? "ধীরে শ্বাস ছাড়ুন।"
        : timer.phase === "done"
          ? "Session complete."
          : "Start চাপুন।";


  circle.classList.toggle(
    "inhale",
    timer.phase === "inhale"
  );


  circle.classList.toggle(
    "exhale",
    timer.phase === "exhale"
  );

}


function startBreathing() {

  const timer =
    APP.timers.breathing;

  if (!timer) return;

  if (
    timer.remaining <= 0
  ) {

    timer.remaining =
      Number(
        $("#breathDuration")?.value
      ) || 120;

  }


  if (timer.running) {

    return;

  }


  timer.running = true;

  timer.phase = "inhale";

  timer.phaseStarted =
    Date.now();


  updateBreathingUI();


  timer.interval =
    setInterval(
      () => {

        timer.remaining -= 1;


        const phaseSeconds =
          Math.floor(
            (
              Date.now() -
              timer.phaseStarted
            ) / 1000
          );


        if (
          phaseSeconds >= 4
        ) {

          timer.phase =
            timer.phase === "inhale"
              ? "exhale"
              : "inhale";

          timer.phaseStarted =
            Date.now();

        }


        if (
          timer.remaining <= 0
        ) {

          timer.remaining = 0;

          timer.running = false;

          timer.phase = "done";

          clearInterval(
            timer.interval
          );

          timer.interval = null;

          toast(
            "Breathing timer complete."
          );

        }


        updateBreathingUI();

      },
      1000
    );

}


function pauseBreathing() {

  const timer =
    APP.timers.breathing;

  if (!timer) return;

  timer.running = false;

  clearInterval(
    timer.interval
  );

  timer.interval = null;

  updateBreathingUI();

}


function resetBreathing() {

  const timer =
    APP.timers.breathing;

  if (!timer) return;

  clearInterval(
    timer.interval
  );

  timer.interval = null;

  timer.running = false;

  timer.phase = "ready";

  timer.remaining =
    Number(
      $("#breathDuration")?.value
    ) || 120;

  updateBreathingUI();

}


function stopBreathing() {

  const timer =
    APP.timers.breathing;

  if (
    timer?.interval
  ) {

    clearInterval(
      timer.interval
    );

  }

  APP.timers.breathing = null;

}


/* =========================================================
   PROFILE
   ========================================================= */

function openProfile() {

  const profile =
    storageGet(
      APP.keys.profile,
      {}
    );


  openModal(

    "Profile",

    formShell(

      `

        <div>

          <label for="profileName">
            Name (optional)
          </label>

          <input
            id="profileName"
            name="name"
            value="${escapeHTML(
              profile.name || ""
            )}"
          >

        </div>


        <div class="form-grid two">

          <div>

            <label for="profileAge">
              Age (optional)
            </label>

            <input
              id="profileAge"
              name="age"
              type="number"
              min="1"
              max="120"
              value="${escapeHTML(
                profile.age || ""
              )}"
            >

          </div>


          <div>

            <label for="profileSex">
              Sex (optional)
            </label>

            <select
              id="profileSex"
              name="sex"
            >

              <option value="">
                Not specified
              </option>

              <option
                value="female"
                ${
                  profile.sex === "female"
                    ? "selected"
                    : ""
                }
              >
                Female
              </option>

              <option
                value="male"
                ${
                  profile.sex === "male"
                    ? "selected"
                    : ""
                }
              >
                Male
              </option>

            </select>

          </div>


          <div>

            <label for="profileHeight">
              Height cm
            </label>

            <input
              id="profileHeight"
              name="height"
              type="number"
              min="50"
              max="250"
              value="${escapeHTML(
                profile.height || ""
              )}"
            >

          </div>


          <div>

            <label for="profileWeight">
              Weight kg
            </label>

            <input
              id="profileWeight"
              name="weight"
              type="number"
              min="10"
              max="500"
              value="${escapeHTML(
                profile.weight || ""
              )}"
            >

          </div>

        </div>


        <div>

          <label for="profileGoal">
            Goal / preference
          </label>

          <input
            id="profileGoal"
            name="goal"
            value="${escapeHTML(
              profile.goal || ""
            )}"
            placeholder="যেমন: hydration tracking"
          >

        </div>


        <p class="small muted">

          Profile fields optional।
          অপ্রয়োজনীয় sensitive data
          সংগ্রহ করা হয় না।

        </p>

      `,

      "profile-save"

    )

  );

}


/* =========================================================
   SETTINGS
   ========================================================= */

function openSettings() {

  const settings =
    storageGet(
      APP.keys.settings,
      {
        language: "bn",
        theme: "light"
      }
    );


  openModal(

    "Settings",

    `

      ${formShell(

        `

          <div>

            <label for="settingsLanguage">
              Language
            </label>

            <select
              id="settingsLanguage"
              name="language"
            >

              <option
                value="bn"
                ${
                  settings.language === "bn"
                    ? "selected"
                    : ""
                }
              >
                বাংলা
              </option>

              <option
                value="en"
                ${
                  settings.language === "en"
                    ? "selected"
                    : ""
                }
              >
                English
              </option>

            </select>

          </div>


          <div>

            <label for="settingsTheme">
              Theme
            </label>

            <select
              id="settingsTheme"
              name="theme"
            >

              <option
                value="light"
                selected
              >
                Light
              </option>

              <option value="dark">
                Dark
              </option>

            </select>

          </div>

        `,

        "settings-save"

      )}


      <div class="divider"></div>


      <button
        class="btn btn-danger"
        type="button"
        data-action="reset-data"
      >
        সব local data মুছুন
      </button>


      <p class="small muted">

        Reset করলে Health Nivo-এর
        এই browser-এ রাখা
        profile, tracker, favorites,
        settings ও period data মুছে যাবে।

      </p>


      <p class="small muted">

        Version:
        ${escapeHTML(APP.version)}

      </p>

    `

  );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function openNotifications() {

  const settings =
    storageGet(
      APP.keys.notifications,
      {
        water: false,
        sleep: false,
        exercise: false,
        steps: false
      }
    );


  openModal(

    "Notifications",

    formShell(

      `

        <label>

          <input
            type="checkbox"
            name="water"
            ${
              settings.water
                ? "checked"
                : ""
            }
          >

          Water reminder

        </label>


        <label>

          <input
            type="checkbox"
            name="sleep"
            ${
              settings.sleep
                ? "checked"
                : ""
            }
          >

          Sleep reminder

        </label>


        <label>

          <input
            type="checkbox"
            name="exercise"
            ${
              settings.exercise
                ? "checked"
                : ""
            }
          >

          Exercise reminder

        </label>


        <label>

          <input
            type="checkbox"
            name="steps"
            ${
              settings.steps
                ? "checked"
                : ""
            }
          >

          Steps reminder

        </label>


        <p class="small muted">

          Browser notification support
          অনুযায়ী behavior বদলাতে পারে।

          এই frontend নিজে থেকে
          “notification sent” দাবি করবে না।

        </p>

      `,

      "notifications-save"

    )

  );

}


/* =========================================================
   HEALTH INFORMATION
   ========================================================= */

function healthInformationHTML() {

  return `

    <h3>
      সাধারণ wellness
    </h3>

    <p>

      সুষম খাবার, পর্যাপ্ত পানি,
      নিয়মিত ঘুম, নিরাপদ physical activity
      এবং প্রয়োজনে qualified healthcare
      professional-এর পরামর্শ সাধারণ
      wellness-এর গুরুত্বপূর্ণ অংশ।

    </p>


    <h3>
      কখন সাহায্য নেবেন
    </h3>

    <p>

      নতুন, তীব্র, দ্রুত খারাপ হওয়া
      বা জরুরি মনে হওয়া উপসর্গে
      self-care-এর ওপর নির্ভর না করে
      দ্রুত স্বাস্থ্যসেবা নিন।

    </p>

  `;

}


/* =========================================================
   SOURCES
   ========================================================= */

function sourcesHTML() {

  return `

    <p>

      Production health content-এর
      relevant claims যাচাই করার জন্য
      reputable organizations ব্যবহার করা
      উচিত।

    </p>


    <ul>

      <li>
        World Health Organization (WHO)
      </li>

      <li>
        NHS
      </li>

      <li>
        CDC
      </li>

      <li>
        American Diabetes Association (ADA)
      </li>

      <li>
        BIRDEM / Bangladesh Diabetic Association
      </li>

    </ul>


    <p class="small muted">

      এই Phase 1 source section
      কোনো নির্দিষ্ট article বা claim-কে
      “verified by” বলে উপস্থাপন করছে না।

      Production dataset বসানোর সময়
      প্রতিটি relevant content source
      যাচাই করা উচিত।

    </p>

  `;

}


/* =========================================================
   ABOUT
   ========================================================= */

function aboutHTML() {

  return `

    <h3>
      Health Nivo কী?
    </h3>

    <p>

      Health Nivo হলো সাধারণ health,
      food এবং wellness tracking-এর
      জন্য একটি mobile-first
      educational frontend।

    </p>


    <h3>
      Core principles
    </h3>

    <p>

      সহজ বাংলা UI,
      কম data collection,
      honest measurements এবং
      diagnosis-এর পরিবর্তে
      educational guidance।

    </p>


    <p class="small muted">

      Version:
      ${escapeHTML(APP.version)}

    </p>

  `;

}


/* =========================================================
   PRIVACY
   ========================================================= */

function privacyHTML() {

  return `

    <h3>
      Local Storage
    </h3>

    <p>

      Profile, tracker logs,
      favorites, settings ও period data
      browser localStorage-এ রাখা হতে পারে।

      Browser data clear করলে
      এগুলো হারাতে পারে।

    </p>


    <h3>
      External Services
    </h3>

    <p>

      এই Phase 1-এ health measurement-এর
      জন্য কোনো external API ব্যবহার করা হচ্ছে না।

      ভবিষ্যতে API যোগ হলে কোন data
      কোথায় পাঠানো হয় তা স্পষ্টভাবে
      জানানো উচিত।

    </p>


    <h3>
      User Control
    </h3>

    <p>

      Settings থেকে local data reset
      করা যাবে।

      Health Nivo 100% privacy guarantee
      দাবি করছে না।

    </p>

  `;

}


/* =========================================================
   MEDICAL DISCLAIMER
   ========================================================= */

function medicalDisclaimerHTML() {

  return `

    <p>

      <strong>
        Health Nivo চিকিৎসক বা
        healthcare provider নয়।
      </strong>

    </p>


    <p>

      এই অ্যাপের educational information,
      calculators এবং trackers
      diagnosis, treatment বা
      emergency care-এর বিকল্প নয়।

    </p>


    <p>

      নিজের reading দেখে নিজে
      রোগ নির্ণয় করবেন না।

      গুরুতর বা জরুরি উপসর্গে
      যোগ্য চিকিৎসা সহায়তা নিন।

    </p>


    <p>

      Tracker-এর values ব্যবহারকারীর
      input-এর ওপর নির্ভর করে।

      Sensor/API না থাকলে Health Nivo
      কোনো measurement বানিয়ে দেখায় না।

    </p>

  `;

}


/* =========================================================
   GENERIC INFO MODAL
   ========================================================= */

function openInformationModal(
  title,
  content
) {

  openModal(

    title,

    `

      <section class="card">

        ${content}

      </section>

    `

  );

}


/* =========================================================
   FEEDBACK
   ========================================================= */

function openFeedback() {

  openModal(

    "Feedback",

    formShell(

      `

        <div>

          <label for="feedbackName">
            Name (optional)
          </label>

          <input
            id="feedbackName"
            name="name"
          >

        </div>


        <div>

          <label for="feedbackEmail">
            Email (optional)
          </label>

          <input
            id="feedbackEmail"
            name="email"
            type="email"
          >

        </div>


        <div>

          <label for="feedbackType">
            Type
          </label>

          <select
            id="feedbackType"
            name="type"
          >

            <option>
              General feedback
            </option>

            <option>
              Bug report
            </option>

            <option>
              Content issue
            </option>

            <option>
              Feature request
            </option>

          </select>

        </div>


        <div>

          <label for="feedbackMessage">
            Message
          </label>

          <textarea
            id="feedbackMessage"
            name="message"
            required
          ></textarea>

        </div>


        <p class="small muted">

          Backend না থাকায় এই Phase 1-এ
          feedback সত্যিই server-এ
          পাঠানো হবে না।

        </p>

      `,

      "feedback-submit",

      "Submit"

    )

  );

}


/* =========================================================
   HISTORY MARKUP
   ========================================================= */

function historyMarkup(
  key,
  unit
) {

  const records =
    storageGet(
      key,
      []
    );


  if (
    !Array.isArray(records) ||
    !records.length
  ) {

    return `

      <div class="section empty-state">

        এখনো কোনো history নেই।

      </div>

    `;

  }


  const recent =
    records
      .slice()
      .reverse()
      .slice(0, 10);


  return `

    <div class="section">

      <h3>
        History
      </h3>


      <div class="list">

        ${recent
          .map(
            record => {

              let value = "";


              if (
                record.systolic
              ) {

                value =
                  `${escapeHTML(
                    record.systolic
                  )}/${escapeHTML(
                    record.diastolic
                  )}`;

              } else if (
                record.steps !== undefined
              ) {

                value =
                  `${escapeHTML(
                    record.steps
                  )} steps`;

              } else if (
                record.value !== undefined
              ) {

                value =
                  `${escapeHTML(
                    record.value
                  )} ${escapeHTML(
                    unit
                  )}`;

              } else if (
                record.duration
              ) {

                value =
                  escapeHTML(
                    record.duration
                  );

              }


              return `

                <div class="list-item">

                  <span>

                    ${value}

                    <span class="muted small">

                      ${
                        escapeHTML(
                          record.date ||
                          record.datetime ||
                          ""
                        )
                      }

                    </span>

                  </span>


                  <button
                    class="icon-action"
                    type="button"
                    data-delete-record="${escapeHTML(key)}:${escapeHTML(record.id)}"
                    aria-label="Delete record"
                  >
                    🗑
                  </button>

                </div>

              `;

            }
          )
          .join("")}

      </div>

    </div>

  `;

}


/* =========================================================
   MEAL SWAP
   ========================================================= */

function openMealSwap(
  foodId
) {

  const food =
    getFoodById(foodId);

  if (!food) {

    toast(
      "Food information পাওয়া যায়নি।"
    );

    return;

  }


  const alternatives =
    APP.data.foods
      .filter(
        item =>

          String(item.id) !==
          String(food.id)

          &&

          item.category
          &&

          food.category

          &&

          normalizeSearch(
            item.category
          ) ===
          normalizeSearch(
            food.category
          )

      )
      .slice(0, 8);


  openModal(

    "Meal Swap",

    `

      <p>

        <strong>
          ${escapeHTML(
            food.name_bn
          )}
        </strong>

        -এর available dataset
        alternatives:

      </p>


      ${
        alternatives.length

          ? `

            <div class="list">

              ${alternatives
                .map(
                  renderFoodCard
                )
                .join("")}

            </div>

          `

          : `

            <div class="empty-state">

              এই category-তে
              available alternative নেই।

            </div>

          `
      }


      <p class="small muted">

        এটি simple data-based swap।
        AI recommendation নয়।

      </p>

    `

  );

}


/* =========================================================
   RESET DATA
   ========================================================= */

function resetAllData() {

  const confirmed =
    window.confirm(
      "Health Nivo-এর সব local data মুছে ফেলবেন? এই কাজ undo করা যাবে না।"
    );


  if (!confirmed) {

    return;

  }


  Object.values(
    APP.keys
  ).forEach(
    storageRemove
  );


  closeModal();

  toast(
    "সব local data মুছে ফেলা হয়েছে।"
  );


  render();

}


/* =========================================================
   TRACKER DISPATCHER
   ========================================================= */

function openTracker(
  tracker
) {

  /* Modules registered in ext.js (HN_EXT.tool) take priority. */

  if (
    typeof HN_EXT !== "undefined" &&
    HN_EXT.openTool(tracker)
  ) {

    return;

  }

  switch (tracker) {

    case "water":
      openWaterTracker();
      break;

    case "sleep":
      openSleepTracker();
      break;

    case "exercise":
      openExerciseTracker();
      break;

    case "steps":
      openStepsTracker();
      break;

    case "bmi":
      openBMIBMR();
      break;

    case "weight":
      openWeightTracker();
      break;

    case "bp":
      openBPTracker();
      break;

    case "glucose":
      openGlucoseTracker();
      break;

    case "heartRate":
      openHeartRateTracker();
      break;

    case "hrZone":
      openHeartRateZone();
      break;

    case "foodGuide":
      navigate("foods");
      break;

    case "summary":
      openSummary();
      break;

    case "period":
      openPeriodTracker();
      break;

    case "cameraHR":
      openCameraHeartRate();
      break;

    case "motionSteps":
      openMotionStepCounter();
      break;

    case "pulseZone":
      openExercisePulseZone();
      break;

    case "breathing":
      openBreathingTimer();
      break;

    case "profile":
      openProfile();
      break;

    case "settings":
      openSettings();
      break;

    case "notifications":
      openNotifications();
      break;

    case "healthInfo":
      openInformationModal(
        "Health Information",
        healthInformationHTML()
      );
      break;

    case "sources":
      openInformationModal(
        "Sources / References",
        sourcesHTML()
      );
      break;

    case "about":
      openInformationModal(
        "About Health Nivo",
        aboutHTML()
      );
      break;

    case "privacy":
      openInformationModal(
        "Privacy",
        privacyHTML()
      );
      break;

    case "disclaimer":
      openInformationModal(
        "Medical Disclaimer",
        medicalDisclaimerHTML()
      );
      break;

    case "feedback":
      openFeedback();
      break;

  }

}


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

function handleFormSubmit(event) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const action =
    form.dataset.form;

  const data =
    collectForm(form);


  switch (action) {

    /* ---------- WATER ---------- */

    case "water-add":

      addRecord(
        APP.keys.water,
        {
          amount:
            Number(data.amount),

          date:
            data.date
        }
      );

      toast(
        "পানি log হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- SLEEP ---------- */

    case "sleep-add": {

      const bedtime =
        new Date(
          data.bedtime
        );

      const wake =
        new Date(
          data.wake
        );


      const hours =
        (
          wake - bedtime
        ) / 3600000;


      if (
        !Number.isFinite(hours) ||
        hours < 0 ||
        hours > 24
      ) {

        toast(
          "Bedtime ও wake time ঠিক আছে কি না দেখুন।"
        );

        return;

      }


      addRecord(
        APP.keys.sleep,
        {

          bedtime:
            data.bedtime,

          wake:
            data.wake,

          duration:
            `${hours.toFixed(1)} h`,

          goal:
            Number(data.goal),

          date:
            data.bedtime
              .slice(0, 10)

        }
      );


      toast(
        "ঘুম log হয়েছে।"
      );

      closeModal();

      break;

    }


    /* ---------- EXERCISE ---------- */

    case "exercise-add":

      addRecord(
        APP.keys.exercise,
        {

          type:
            data.type,

          duration:
            Number(
              data.duration
            ),

          intensity:
            data.intensity,

          date:
            data.date

        }
      );


      toast(
        "Exercise log হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- STEPS ---------- */

    case "steps-add":

      addRecord(
        APP.keys.steps,
        {

          steps:
            Number(data.steps),

          goal:
            Number(data.goal),

          date:
            data.date

        }
      );


      toast(
        "Steps log হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- BMI ---------- */

    case "bmi-calculate": {

      const bmi =
        calculateBMI(
          data.height,
          data.weight
        );


      const bmr =
        calculateBMR(
          data.age,
          data.weight,
          data.height,
          data.sex
        );


      const result =
        $("#bmiResult");


      if (!result) return;


      if (!bmi) {

        result.innerHTML =
          `<div class="error-state">
            Input values ঠিক করুন।
          </div>`;

        return;

      }


      result.innerHTML = `

        <div class="card">

          <strong>
            BMI:
            ${escapeHTML(
              bmi.value
            )}
          </strong>

          <p>
            ${escapeHTML(
              bmi.category
            )}
          </p>


          <strong>
            Estimated BMR:
            ${escapeHTML(
              bmr
            )}
            kcal/day
          </strong>


          <p class="small muted">

            BMI/BMR simple calculations।
            Complete health assessment নয়।

          </p>

        </div>

      `;

      break;

    }


    /* ---------- WEIGHT ---------- */

    case "weight-add":

      addRecord(
        APP.keys.weight,
        {

          value:
            Number(data.value),

          date:
            data.date

        }
      );


      toast(
        "Weight log হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- BP ---------- */

    case "bp-add":

      addRecord(
        APP.keys.bp,
        {

          systolic:
            Number(
              data.systolic
            ),

          diastolic:
            Number(
              data.diastolic
            ),

          date:
            data.date,

          time:
            data.time,

          notes:
            data.notes

        }
      );


      toast(
        "BP log সংরক্ষণ হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- GLUCOSE ---------- */

    case "glucose-add":

      addRecord(
        APP.keys.glucose,
        {

          value:
            Number(data.value),

          unit:
            data.unit,

          context:
            data.context,

          date:
            data.date,

          notes:
            data.notes

        }
      );


      toast(
        "Glucose log সংরক্ষণ হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- HEART RATE ---------- */

    case "heart-rate-add":

      addRecord(
        APP.keys.heartRate,
        {

          value:
            Number(data.value),

          datetime:
            data.datetime,

          notes:
            data.notes

        }
      );


      toast(
        "Heart Rate log সংরক্ষণ হয়েছে।"
      );

      closeModal();

      break;


    /* ---------- HR ZONE ---------- */

    case "heart-rate-zone-calculate": {

      const zones =
        calculateHeartRateZones(
          data.age
        );


      const result =
        $("#heartRateZoneResult");


      if (
        !zones ||
        !result
      ) return;


      result.innerHTML = `

        <div class="card">

          <div class="list">

            ${zones
              .map(
                zone => `

                  <div class="list-item">

                    <strong>
                      ${zone[0]}
                    </strong>

                    <span>
                      ${zone[1]}
                      –
                      ${zone[2]}
                      BPM
                    </span>

                  </div>

                `
              )
              .join("")}

          </div>


          <p class="small muted">

            General age-based estimate।
            Individual medical advice নয়।

          </p>

        </div>

      `;

      break;

    }


    /* ---------- PULSE ZONE ---------- */

    case "pulse-zone-calculate": {

      const zones =
        calculateHeartRateZones(
          data.age
        );

      const hr =
        Number(data.hr);

      const result =
        $("#pulseZoneResult");


      if (
        !zones ||
        !result
      ) return;


      const currentZone =
        zones.find(
          zone =>
            hr >= zone[1] &&
            hr <= zone[2]
        );


      result.innerHTML = `

        <div class="card">

          <strong>
            Estimated zone:
            ${
              currentZone
                ? escapeHTML(
                    currentZone[0]
                  )
                : "Outside listed zones"
            }
          </strong>

          <p class="small muted">

            Current input:
            ${escapeHTML(hr)}
            BPM

          </p>

          <p class="small muted">

            General exercise estimate only।

          </p>

        </div>

      `;

      break;

    }


    /* ---------- PERIOD ---------- */

    case "period-save":

      storageSet(
        APP.keys.period,
        {

          lastPeriod:
            data.lastPeriod,

          cycleLength:
            Number(
              data.cycleLength
            ),

          notes:
            data.notes

        }
      );


      toast(
        "Period data locally saved."
      );

      closeModal();

      break;


    /* ---------- PROFILE ---------- */

    case "profile-save":

      storageSet(
        APP.keys.profile,
        data
      );


      toast(
        "Profile locally saved."
      );

      closeModal();

      render();

      break;


    /* ---------- SETTINGS ---------- */

    case "settings-save":

      storageSet(
        APP.keys.settings,
        data
      );


      toast(
        "Settings saved."
      );

      closeModal();

      break;


    /* ---------- NOTIFICATIONS ---------- */

    case "notifications-save":

      storageSet(
        APP.keys.notifications,
        data
      );


      toast(
        "Notification preferences saved."
      );

      closeModal();

      break;


    /* ---------- FEEDBACK ---------- */

    case "feedback-submit":

      toast(
        "Feedback form ready আছে, কিন্তু backend না থাকায় message পাঠানো হয়নি।"
      );

      closeModal();

      break;

  }

}


/* =========================================================
   EVENT HANDLING
   ========================================================= */

function bindEvents() {

  /* ---------- MAIN NAV ---------- */

  $$(".bottom-nav-item")
    .forEach(button => {

      button.onclick = () => {

        navigate(
          button.dataset.route
        );

      };

    });


  /* ---------- GENERIC ROUTE ---------- */

  $$("[data-route]")
    .forEach(button => {

      if (
        button.classList
          .contains(
            "bottom-nav-item"
          )
      ) {

        return;

      }


      button.onclick = () => {

        navigate(
          button.dataset.route
        );

      };

    });


  /* ---------- TRACKERS ---------- */

  $$("[data-tracker]")
    .forEach(button => {

      button.onclick = () => {

        openTracker(
          button.dataset.tracker
        );

      };

    });


  /* ---------- PROBLEM SEARCH ---------- */

  const problemSearch =
    $("#problemSearch");


  if (problemSearch) {

    problemSearch.addEventListener(
      "input",
      event => {

        APP.params.query =
          event.target.value;

        const results =
          searchProblems(
            APP.params.query
          );


        const container =
          $("#problemResults");


        if (!container) return;


        container.innerHTML =
          results.length

            ? results
                .map(
                  renderProblemCard
                )
                .join("")

            : `
              <div class="empty-state">
                কোনো ফলাফল পাওয়া যায়নি।
              </div>
            `;


        bindEvents();

      }
    );

  }


  /* ---------- FOOD SEARCH ---------- */

  const foodSearch =
    $("#foodSearch");


  if (foodSearch) {

    foodSearch.addEventListener(
      "input",
      event => {

        APP.params.query =
          event.target.value;

        const results =
          searchFoods(
            APP.params.query
          );


        const container =
          $("#foodResults");


        if (!container) return;


        container.innerHTML =
          results.length

            ? results
                .map(
                  renderFoodCard
                )
                .join("")

            : `
              <div class="empty-state">
                কোনো খাবার পাওয়া যায়নি।
              </div>
            `;


        bindEvents();

      }
    );

  }


  /* ---------- PROBLEM DETAIL ---------- */

  $$("[data-problem-id]")
    .forEach(button => {

      button.onclick = () => {

        const id =
          button.dataset.problemId;

        const page =
          $("#pageView");


        page.innerHTML =
          renderProblemDetail(id);


        bindEvents();

      };

    });


  /* ---------- FOOD DETAIL ---------- */

  $$("[data-food-id]")
    .forEach(button => {

      if (
        button.dataset.favorite
      ) {

        return;

      }


      button.onclick = () => {

        const id =
          button.dataset.foodId;

        const page =
          $("#pageView");


        page.innerHTML =
          renderFoodDetail(id);


        bindEvents();

      };

    });


  /* ---------- FAVORITES ---------- */

  $$("[data-favorite]")
    .forEach(button => {

      button.onclick = () => {

        const parts =
          button.dataset.favorite
            .split(":");


        toggleFavorite(
          parts[0],
          parts[1]
        );

      };

    });


  /* ---------- ACTIONS ---------- */

  $$("[data-action]")
    .forEach(button => {

      button.onclick = () => {

        handleAction(
          button.dataset.action,
          button
        );

      };

    });


  /* ---------- DELETE ---------- */

  $$("[data-delete-record]")
    .forEach(button => {

      button.onclick = () => {

        const [key, id] =
          button.dataset
            .deleteRecord
            .split(":");


        deleteRecord(
          key,
          id
        );

      };

    });


  /* ---------- FORMS ---------- */

  $$("[data-form]")
    .forEach(form => {

      form.addEventListener(
        "submit",
        handleFormSubmit
      );

    });

}


/* =========================================================
   ACTION HANDLER
   ========================================================= */

function handleAction(
  action,
  button
) {

  switch (action) {

    case "close-modal":

      closeModal();

      break;


    case "clear-problem-search":

      APP.params.query = "";

      render();

      break;


    case "clear-food-search":

      APP.params.query = "";

      render();

      break;


    case "reload-data":

      loadApplicationData()
        .then(render);

      break;


    case "favorites":

      openFavorites();

      break;


    case "summary":

      openSummary();

      break;


    case "meal-swap":

      openMealSwap(
        button.dataset.foodId
      );

      break;


    case "reset-data":

      resetAllData();

      break;


    case "camera-check":

      checkCameraSupport();

      break;


    case "motion-check":

      checkMotionSupport();

      break;


    case "breathing-start":

      startBreathing();

      break;


    case "breathing-pause":

      pauseBreathing();

      break;


    case "breathing-reset":

      resetBreathing();

      break;

  }

}


/* =========================================================
   DELETE RECORD
   ========================================================= */

function deleteRecord(
  key,
  id
) {

  const records =
    storageGet(
      key,
      []
    );


  if (
    !Array.isArray(records)
  ) {

    return;

  }


  const confirmed =
    window.confirm(
      "এই log মুছে ফেলবেন?"
    );


  if (!confirmed) {

    return;

  }


  const next =
    records.filter(
      record =>
        String(record.id) !==
        String(id)
    );


  storageSet(
    key,
    next
  );


  toast(
    "Log মুছে ফেলা হয়েছে।"
  );


  closeModal();

}


/* =========================================================
   FAVORITES MODAL
   ========================================================= */

function openFavorites() {

  const favorites =
    getFavorites();


  const foods =
    favorites.foods
      .map(getFoodById)
      .filter(Boolean);


  const problems =
    favorites.problems
      .map(getProblemById)
      .filter(Boolean);


  openModal(

    "Favorites",

    `

      <h3>
        খাবার
      </h3>


      ${
        foods.length

          ? `

            <div class="list">

              ${foods
                .map(
                  renderFoodCard
                )
                .join("")}

            </div>

          `

          : `

            <div class="empty-state">

              কোনো favorite খাবার নেই।

            </div>

          `
      }


      <div class="divider"></div>


      <h3>
        সমস্যা
      </h3>


      ${
        problems.length

          ? `

            <div class="list">

              ${problems
                .map(
                  renderProblemCard
                )
                .join("")}

            </div>

          `

          : `

            <div class="empty-state">

              কোনো favorite সমস্যা নেই।

            </div>

          `
      }

    `

  );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function bootHealthNivo() {

  readHashRoute();

  render();

  await loadApplicationData();

  render();

}


$("#brandHomeBtn")
  ?.addEventListener(
    "click",
    () => navigate("home")
  );


$("#headerProfileBtn")
  ?.addEventListener(
    "click",
    () => openProfile()
  );


$("#headerNotificationBtn")
  ?.addEventListener(
    "click",
    () => openNotifications()
  );


/* =========================================================
   START APP
   ========================================================= */

bootHealthNivo();
