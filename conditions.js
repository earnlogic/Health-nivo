/* =========================================================
   HEALTH NIVO — CONDITIONS GUIDE
   Shows data/conditions.json. Only text and food ID lists that
   exist in the dataset are shown; nothing is generated here.
   Opened from More → Conditions Guide.
   ========================================================= */

(() => {

  HN_EXT.addStrings({

    bn: {
      "cond.title": "অবস্থা ও খাবারের গাইড",
      "cond.intro": "ডেটাসেটে থাকা সাধারণ তথ্য। এটি রোগ নির্ণয় বা চিকিৎসা নয়।",
      "cond.search": "অবস্থা খুঁজুন",
      "cond.searchPlaceholder": "নাম বা শব্দ লিখুন",
      "cond.count": "{n}টি ফলাফল",
      "cond.none": "কোনো ফলাফল পাওয়া যায়নি।",
      "cond.loading": "ডেটা লোড হচ্ছে…",
      "cond.error": "Data load করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।",
      "cond.back": "← তালিকায় ফিরুন",
      "cond.sameName": "একই নামে আরেকটি রেকর্ড আছে",
      "cond.record": "রেকর্ড #{id}",
      "cond.foodGuidance": "খাবারের সাধারণ নির্দেশনা",
      "cond.limitGuidance": "সীমিত বা এড়ানোর নির্দেশনা",
      "cond.lifestyle": "জীবনযাপনের পরামর্শ",
      "cond.green": "🟢 খাওয়া ভালো",
      "cond.yellow": "🟡 পরিমিত খাওয়া",
      "cond.red": "🔴 সীমিত বা এড়িয়ে চলুন",
      "cond.missingIds": "{n}টি খাবারের id খাবারের ডেটায় পাওয়া যায়নি, তাই দেখানো হয়নি।",
      "cond.noData": "তথ্য দেওয়া হয়নি।",
      "cond.disclaimer": "এই তথ্য সাধারণ শিক্ষা ও wellness সহায়তার জন্য। ব্যক্তিগত চিকিৎসা, ওষুধ বা খাদ্যতালিকা নিয়ে যোগ্য স্বাস্থ্যকর্মীর পরামর্শ নিন।",
      "cond.duplicateNote": "এই ডেটাসেটে একই নামের দুটি আলাদা রেকর্ড আছে; বর্ণনার শব্দ ভিন্ন হতে পারে। দুটিই আলাদাভাবে দেখানো হচ্ছে।"
    },

    en: {
      "cond.title": "Conditions & Food Guide",
      "cond.intro": "General information from the dataset. It is not a diagnosis or treatment.",
      "cond.search": "Search conditions",
      "cond.searchPlaceholder": "Type a name or word",
      "cond.count": "{n} results",
      "cond.none": "No results found.",
      "cond.loading": "Loading data…",
      "cond.error": "Could not load data. Refresh the page and try again.",
      "cond.back": "← Back to list",
      "cond.sameName": "Another record has the same name",
      "cond.record": "Record #{id}",
      "cond.foodGuidance": "General food guidance",
      "cond.limitGuidance": "Foods to limit or avoid",
      "cond.lifestyle": "Lifestyle tips",
      "cond.green": "🟢 Good to eat",
      "cond.yellow": "🟡 Eat in moderation",
      "cond.red": "🔴 Limit or avoid",
      "cond.missingIds": "{n} food IDs were not found in the food data and are not shown.",
      "cond.noData": "No information provided.",
      "cond.disclaimer": "This information is for general education and wellness support. Ask a qualified health professional about personal treatment, medicines or diet.",
      "cond.duplicateNote": "This dataset has two separate records with the same name; their wording may differ. Both are shown separately."
    }

  });


  const state = {
    query: "",
    selected: null,
    source: null,
    visible: [],
    sameName: {}
  };

  const SEARCH_FIELDS = [
    "name_bn",
    "name_en",
    "recommended_food_guidance",
    "limit_or_avoid_food_guidance",
    "lifestyle_tips"
  ];

  const t = (key, vars) => HN_EXT.t(key, vars);
  const esc = HN_EXT.esc;


  /* A record is hidden ONLY when every field except its own id is
     identical to an earlier record. Records that merely share a
     name are always kept. (See docs/conditions-duplicates-audit.md) */

  function recordFingerprint(record) {

    const copy = { ...record };

    delete copy.id;

    return JSON.stringify(copy);

  }

  function prepare() {

    const source = APP.data.conditions;

    if (state.source === source) {
      return;
    }

    state.source = source;

    const seen = new Set();
    const nameCount = {};

    source.forEach(record => {

      nameCount[record.name_bn] =
        (nameCount[record.name_bn] || 0) + 1;

    });

    state.visible = source.filter(record => {

      const fingerprint =
        recordFingerprint(record);

      if (seen.has(fingerprint)) {
        return false;
      }

      seen.add(fingerprint);

      return true;

    });

    state.sameName = {};

    state.visible.forEach(record => {

      const visibleSameName =
        state.visible.filter(
          other =>
            other.name_bn === record.name_bn
        ).length;

      state.sameName[record.id] =
        visibleSameName > 1;

    });

  }

  function matching() {

    prepare();

    return state.visible.filter(record =>
      itemMatches(
        record,
        state.query,
        SEARCH_FIELDS
      )
    );

  }

  function idList(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  /* ---------- LIST ---------- */

  function rowHTML(record) {

    const same = state.sameName[record.id];

    return `
      <button
        class="list-item ext-row"
        type="button"
        data-ext-action="cond-open"
        data-id="${esc(record.id)}"
      >
        <span>
          <strong>${esc(record.name_bn)}</strong>
          <span class="small muted">
            ${esc(record.name_en || "")}
            ${same ? ` • ${esc(t("cond.record", { id: record.id }))}` : ""}
          </span>
        </span>
      </button>
    `;

  }

  function resultsHTML() {

    const list = matching();

    if (!list.length) {

      return `
        <div class="empty-state">
          ${esc(t("cond.none"))}
        </div>
      `;

    }

    return `
      <p class="small muted">
        ${esc(t("cond.count", { n: list.length }))}
      </p>
      <div class="list">
        ${list.map(rowHTML).join("")}
      </div>
    `;

  }

  function listBody() {

    if (APP.dataState && APP.dataState.loading) {

      return `<div class="loading-state">${esc(t("cond.loading"))}</div>`;

    }

    if (
      (APP.dataState && APP.dataState.error) ||
      !Array.isArray(APP.data.conditions)
    ) {

      return `<div class="error-state">${esc(t("cond.error"))}</div>`;

    }

    return `
      <p class="muted small">${esc(t("cond.intro"))}</p>

      <label for="condSearch">${esc(t("cond.search"))}</label>
      <input
        id="condSearch"
        type="search"
        autocomplete="off"
        value="${esc(state.query)}"
        placeholder="${esc(t("cond.searchPlaceholder"))}"
        data-ext-input="cond-search"
      >

      <div id="condResults" class="section">
        ${resultsHTML()}
      </div>

      <div class="disclaimer">${esc(t("cond.disclaimer"))}</div>
    `;

  }


  /* ---------- DETAIL ---------- */

  function textBlock(title, value) {

    return `
      <div class="detail-section">
        <h3>${esc(title)}</h3>
        <p>${esc(value || t("cond.noData")).replace(/\n/g, "<br>")}</p>
      </div>
    `;

  }

  function foodGroup(title, ids) {

    const requested = idList(ids);

    if (!requested.length) {
      return { html: "", missing: 0 };
    }

    const foods = getFoodsByIds(requested);

    const missing =
      requested.length - foods.length;

    if (!foods.length) {
      return { html: "", missing };
    }

    const items = foods.map(food => `
      <li>
        ${esc(food.name_bn)}
        ${food.name_en ? `<span class="small muted">(${esc(food.name_en)})</span>` : ""}
      </li>
    `).join("");

    const summary =
      `${esc(title)} <span class="badge">${foods.length}</span>`;

    return {

      html: HN_EXT.collapsible(
        summary,
        `<ul class="ext-list">${items}</ul>`,
        foods.length <= 15
      ),

      missing

    };

  }

  function detailBody(record) {

    const green =
      foodGroup(t("cond.green"), record.recommended_food_ids);

    const yellow =
      foodGroup(t("cond.yellow"), record.moderate_food_ids);

    const red =
      foodGroup(t("cond.red"), record.limit_or_avoid_food_ids);

    const missing =
      green.missing + yellow.missing + red.missing;

    return `
      <button
        class="btn btn-secondary"
        type="button"
        data-ext-action="cond-back"
      >${esc(t("cond.back"))}</button>

      <h3>${esc(record.name_bn)}</h3>
      <p class="muted">
        ${esc(record.name_en || "")}
        ${state.sameName[record.id] ? ` • ${esc(t("cond.record", { id: record.id }))}` : ""}
      </p>

      ${state.sameName[record.id]
        ? `<p class="small muted">${esc(t("cond.duplicateNote"))}</p>`
        : ""}

      <section class="card">
        ${textBlock(t("cond.foodGuidance"), record.recommended_food_guidance)}
        ${textBlock(t("cond.limitGuidance"), record.limit_or_avoid_food_guidance)}
        ${textBlock(t("cond.lifestyle"), record.lifestyle_tips)}
      </section>

      ${green.html}
      ${yellow.html}
      ${red.html}

      ${missing
        ? `<p class="small muted">${esc(t("cond.missingIds", { n: missing }))}</p>`
        : ""}

      <div class="disclaimer">${esc(t("cond.disclaimer"))}</div>
    `;

  }


  /* ---------- OPEN / EVENTS ---------- */

  function show() {

    HN_EXT.modal(
      t("cond.title"),
      state.selected === null
        ? listBody()
        : (() => {

            prepare();

            const record =
              APP.data.conditions.find(
                item =>
                  String(item.id) ===
                  String(state.selected)
              );

            return record
              ? detailBody(record)
              : listBody();

          })()
    );

  }

  HN_EXT.tool("conditions", () => {

    state.selected = null;

    show();

  });

  HN_EXT.action("cond-open", element => {

    state.selected = element.dataset.id;

    show();

  });

  HN_EXT.action("cond-back", () => {

    state.selected = null;

    show();

  });

  HN_EXT.input("cond-search", element => {

    state.query = element.value;

    HN_EXT.setHTML("#condResults", resultsHTML());

  });


  /* Exposed for tests and for other modules (e.g. BMI). */

  window.HN_CONDITIONS = {

    open(id) {

      state.selected = id ?? null;

      show();

    },

    visibleCount() {

      prepare();

      return state.visible.length;

    }

  };

})();
