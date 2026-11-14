/* =========================================================
   HEALTH NIVO — NUTRITION LOG
   Daily food log built on data/foods.json (separate from the
   Food Guide). Values are estimates scaled from the dataset's
   serving; unknown nutrients are never treated as zero.
   ========================================================= */

(() => {

  HN_EXT.addStrings({

    bn: {
      "nut.title": "Nutrition Log",
      "nut.intro": "খাবার যোগ করে দিনের আনুমানিক ক্যালরি ও পুষ্টি দেখুন। মানগুলো ডেটাসেটের serving থেকে হিসাব করা অনুমান, নিখুঁত নয়।",
      "nut.date": "তারিখ",
      "nut.today": "আজ",
      "nut.summary": "দিনের সারাংশ",
      "nut.items": "{n}টি খাবার",
      "nut.kcal": "ক্যালরি (kcal)",
      "nut.protein": "প্রোটিন (g)",
      "nut.carbs": "কার্বোহাইড্রেট (g)",
      "nut.fat": "ফ্যাট (g)",
      "nut.fiber": "ফাইবার (g)",
      "nut.unknownSome": "{n}টি খাবারে এই মান ডেটায় নেই, তাই যোগফলে ধরা হয়নি।",
      "nut.empty": "এই দিনে এখনো কোনো খাবার log করা হয়নি।",
      "nut.addTitle": "খাবার যোগ করুন",
      "nut.search": "খাবার খুঁজুন",
      "nut.searchPlaceholder": "যেমন: ভাত, ডিম, আপেল",
      "nut.noFood": "কোনো খাবার পাওয়া যায়নি।",
      "nut.refine": "আরও ফলাফল আছে; নাম আরও নির্দিষ্ট করে লিখুন।",
      "nut.pick": "বেছে নিন",
      "nut.servingIs": "ডেটাসেটের serving: {s}",
      "nut.qtyServings": "কত serving?",
      "nut.qtyAmount": "পরিমাণ ({unit})",
      "nut.modeServings": "Serving সংখ্যা",
      "nut.modeAmount": "পরিমাণ ({unit})",
      "nut.amountUnavailable": "এই খাবারের serving থেকে গ্রাম/মিলি নির্ভরযোগ্যভাবে বোঝা যায়নি, তাই শুধু serving সংখ্যা ব্যবহার করা যাবে।",
      "nut.save": "সংরক্ষণ",
      "nut.update": "আপডেট",
      "nut.cancel": "বাতিল",
      "nut.edit": "সম্পাদনা",
      "nut.delete": "মুছুন",
      "nut.confirmDelete": "এই খাবারটি log থেকে মুছে ফেলবেন?",
      "nut.saved": "খাবার log হয়েছে।",
      "nut.updated": "আপডেট হয়েছে।",
      "nut.deleted": "মুছে ফেলা হয়েছে।",
      "nut.errServings": "Serving সংখ্যা ০.১ থেকে ২০-এর মধ্যে দিন।",
      "nut.errAmount": "পরিমাণ ১ থেকে ৫০০০-এর মধ্যে দিন।",
      "nut.errDate": "সঠিক তারিখ দিন।",
      "nut.missingFood": "খাবারের ডেটা পাওয়া যায়নি",
      "nut.excluded": "যোগফলে ধরা হয়নি",
      "nut.history": "গত ৭ দিন (আনুমানিক kcal)",
      "nut.share": "সারাংশ কার্ড শেয়ার (ঐচ্ছিক)",
      "nut.shareTitle": "শেয়ার কার্ড",
      "nut.shareIncludeList": "খাবারের তালিকা কার্ডে যোগ করুন",
      "nut.shareNote": "প্রোফাইল ও স্বাস্থ্য তথ্য কার্ডে থাকে না। শেয়ার সম্পূর্ণ ঐচ্ছিক।",
      "nut.shareNative": "শেয়ার করুন",
      "nut.shareCopy": "লেখা কপি করুন",
      "nut.shareImage": "ছবি (PNG) সংরক্ষণ",
      "nut.shareOpened": "শেয়ার মেনু খোলা হয়েছিল। কেউ শেয়ার সম্পন্ন করেছে কি না ব্রাউজার জানায় না।",
      "nut.shareCancelled": "শেয়ার বাতিল করা হয়েছে।",
      "nut.shareUnsupported": "এই ব্রাউজারে শেয়ার মেনু নেই। লেখা কপি করুন।",
      "nut.copied": "কপি হয়েছে।",
      "nut.copyFailed": "কপি করা যায়নি। লেখাটি নিজে নির্বাচন করে কপি করুন।",
      "nut.back": "← ফিরুন",
      "nut.disclaimer": "এটি আনুমানিক হিসাব। এটি ক্যালরি লক্ষ্য, ডায়েট প্ল্যান বা চিকিৎসা পরামর্শ নয়। খাদ্যতালিকা নিয়ে সন্দেহ থাকলে স্বাস্থ্যকর্মীর পরামর্শ নিন।",
      "nut.loading": "খাবারের ডেটা লোড হচ্ছে…",
      "nut.dataError": "খাবারের ডেটা লোড করা যায়নি।",
      "nut.cardTitle": "Health Nivo — দিনের খাবারের সারাংশ",
      "nut.cardNote": "আনুমানিক মান; নিখুঁত নয়।"
    },

    en: {
      "nut.title": "Nutrition Log",
      "nut.intro": "Add foods to see estimated calories and nutrients for the day. Values are estimates scaled from the dataset serving, not exact.",
      "nut.date": "Date",
      "nut.today": "Today",
      "nut.summary": "Daily summary",
      "nut.items": "{n} items",
      "nut.kcal": "Calories (kcal)",
      "nut.protein": "Protein (g)",
      "nut.carbs": "Carbohydrate (g)",
      "nut.fat": "Fat (g)",
      "nut.fiber": "Fibre (g)",
      "nut.unknownSome": "{n} items have no value for this in the data, so they are not counted in the total.",
      "nut.empty": "No food has been logged for this day yet.",
      "nut.addTitle": "Add food",
      "nut.search": "Search food",
      "nut.searchPlaceholder": "e.g. rice, egg, apple",
      "nut.noFood": "No food found.",
      "nut.refine": "There are more results; type a more specific name.",
      "nut.pick": "Select",
      "nut.servingIs": "Dataset serving: {s}",
      "nut.qtyServings": "How many servings?",
      "nut.qtyAmount": "Amount ({unit})",
      "nut.modeServings": "Number of servings",
      "nut.modeAmount": "Amount ({unit})",
      "nut.amountUnavailable": "The grams/ml for this food could not be read reliably from its serving, so only the number of servings can be used.",
      "nut.save": "Save",
      "nut.update": "Update",
      "nut.cancel": "Cancel",
      "nut.edit": "Edit",
      "nut.delete": "Delete",
      "nut.confirmDelete": "Remove this food from the log?",
      "nut.saved": "Food logged.",
      "nut.updated": "Updated.",
      "nut.deleted": "Removed.",
      "nut.errServings": "Enter a number of servings between 0.1 and 20.",
      "nut.errAmount": "Enter an amount between 1 and 5000.",
      "nut.errDate": "Enter a valid date.",
      "nut.missingFood": "Food data not found",
      "nut.excluded": "not counted in totals",
      "nut.history": "Last 7 days (estimated kcal)",
      "nut.share": "Share summary card (optional)",
      "nut.shareTitle": "Share card",
      "nut.shareIncludeList": "Include the food list on the card",
      "nut.shareNote": "Profile and health information are never on the card. Sharing is entirely optional.",
      "nut.shareNative": "Share",
      "nut.shareCopy": "Copy text",
      "nut.shareImage": "Save image (PNG)",
      "nut.shareOpened": "The share sheet was opened. The browser does not tell us whether anyone completed a share.",
      "nut.shareCancelled": "Sharing was cancelled.",
      "nut.shareUnsupported": "This browser has no share sheet. Copy the text instead.",
      "nut.copied": "Copied.",
      "nut.copyFailed": "Could not copy. Select the text and copy it yourself.",
      "nut.back": "← Back",
      "nut.disclaimer": "This is an estimate. It is not a calorie target, diet plan or medical advice. Ask a health professional if you have concerns about your diet.",
      "nut.loading": "Loading food data…",
      "nut.dataError": "Could not load food data.",
      "nut.cardTitle": "Health Nivo — daily food summary",
      "nut.cardNote": "Estimated values; not exact."
    }

  });


  const t = (key, vars) => HN_EXT.t(key, vars);
  const esc = HN_EXT.esc;

  const NUTRIENTS = [
    { id: "calories", field: "calories_kcal", label: "nut.kcal", digits: 0 },
    { id: "protein", field: "protein_g", label: "nut.protein", digits: 1 },
    { id: "carbs", field: "carbs_g", label: "nut.carbs", digits: 1 },
    { id: "fat", field: "fat_g", label: "nut.fat", digits: 1 },
    { id: "fiber", field: "fiber_g", label: "nut.fiber", digits: 1 }
  ];

  const state = {
    date: null,
    query: "",
    view: "day",       // day | add | share
    foodId: null,
    editId: null,
    includeList: false
  };

  const KEY = () => APP.keys.foodLog;


  /* ---------- PURE CALCULATIONS (exported for tests) ---------- */

  /* Reads a gram or millilitre amount from a serving label such as
     "1 Cup (160g)", "1 Serving (2 eggs/120g)" or "30g". Returns
     null when the label has no single reliable amount. */

  function servingBasis(food) {

    const label =
      String((food && (food.serving_size ?? food.serving)) || "").trim();

    let match =
      label.match(/\((?:[^()]*\/)?\s*(\d+(?:\.\d+)?)\s*(g|ml)\s*\)/i);

    if (!match) {

      match =
        label.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);

    }

    if (!match) {
      return null;
    }

    const amount = Number(match[1]);

    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    return {
      amount,
      unit: match[2].toLowerCase()
    };

  }

  function entryFactor(entry, food) {

    if (entry.mode === "amount") {

      const basis = servingBasis(food);

      if (!basis || basis.unit !== entry.unit) {
        return null;
      }

      const amount = Number(entry.amount);

      return Number.isFinite(amount) && amount > 0
        ? amount / basis.amount
        : null;

    }

    const servings = Number(entry.servings);

    return Number.isFinite(servings) && servings > 0
      ? servings
      : null;

  }

  /* Returns {calories, protein, ...} where an unknown value is null. */

  function entryNutrition(entry, food) {

    const result = {};

    const factor =
      food ? entryFactor(entry, food) : null;

    NUTRIENTS.forEach(nutrient => {

      const raw =
        food ? food[nutrient.field] : null;

      const value =
        raw === null || raw === undefined || raw === ""
          ? NaN
          : Number(raw);

      result[nutrient.id] =
        factor !== null && Number.isFinite(value)
          ? value * factor
          : null;

    });

    return result;

  }

  /* Sums known values only; counts how many items were unknown. */

  function totals(entries, getFood) {

    const sum = {};

    NUTRIENTS.forEach(nutrient => {
      sum[nutrient.id] = { value: 0, known: 0, unknown: 0 };
    });

    entries.forEach(entry => {

      const nutrition =
        entryNutrition(entry, getFood(entry.foodId));

      NUTRIENTS.forEach(nutrient => {

        const value = nutrition[nutrient.id];

        if (value === null) {
          sum[nutrient.id].unknown += 1;
        } else {
          sum[nutrient.id].value += value;
          sum[nutrient.id].known += 1;
        }

      });

    });

    return sum;

  }

  function validateEntry(input) {

    if (!HN_EXT.isValidISODate(input.date)) {
      return "nut.errDate";
    }

    if (input.mode === "amount") {

      const amount = Number(input.amount);

      if (
        !Number.isFinite(amount) ||
        amount < 1 ||
        amount > 5000
      ) {
        return "nut.errAmount";
      }

    } else {

      const servings = Number(input.servings);

      if (
        !Number.isFinite(servings) ||
        servings < 0.1 ||
        servings > 20
      ) {
        return "nut.errServings";
      }

    }

    return null;

  }


  /* ---------- STORAGE ---------- */

  function allEntries() {
    return HN_EXT.readList(KEY())
      .filter(entry =>
        entry && typeof entry === "object" &&
        HN_EXT.isValidISODate(entry.date)
      );
  }

  function entriesFor(date) {
    return allEntries().filter(entry => entry.date === date);
  }

  const foodOf = id => getFoodById(id);


  /* ---------- RENDERING ---------- */

  function fmt(value, digits) {

    return value === null
      ? "—"
      : HN_EXT.number(value, digits);

  }

  function totalsHTML(entries) {

    const sums = totals(entries, foodOf);

    const cells = NUTRIENTS.map(nutrient => {

      const info = sums[nutrient.id];

      const display =
        info.known === 0 && info.unknown > 0
          ? "—"
          : HN_EXT.number(info.value, nutrient.digits);

      return `
        <div class="ext-stat">
          <span class="small muted">${esc(t(nutrient.label))}</span>
          <strong>${esc(display)}</strong>
          ${info.unknown
            ? `<span class="small muted">${esc(t("nut.unknownSome", { n: info.unknown }))}</span>`
            : ""}
        </div>
      `;

    }).join("");

    return `<div class="ext-stat-grid">${cells}</div>`;

  }

  function quantityLabel(entry, food) {

    if (entry.mode === "amount") {
      return `${HN_EXT.number(entry.amount, 1)} ${entry.unit || ""}`;
    }

    const serving =
      food ? (food.serving_size || food.serving || "") : "";

    return `${HN_EXT.number(entry.servings, 2)} × ${serving}`;

  }

  function entryRowHTML(entry) {

    const food = foodOf(entry.foodId);

    const nutrition = entryNutrition(entry, food);

    return `
      <div class="list-item">
        <div class="list-main">
          <strong>${esc(food ? food.name_bn : (entry.name || t("nut.missingFood")))}</strong>
          <div class="small muted">${esc(quantityLabel(entry, food))}</div>
          <div class="small">
            ${esc(fmt(nutrition.calories, 0))} kcal
            ${food ? "" : ` • ${esc(t("nut.excluded"))}`}
          </div>
        </div>
        <div class="ext-inline-actions">
          <button class="btn btn-secondary ext-btn-small" type="button"
            data-ext-action="nut-edit" data-id="${esc(entry.id)}">${esc(t("nut.edit"))}</button>
          <button class="btn btn-danger ext-btn-small" type="button"
            data-ext-action="nut-delete" data-id="${esc(entry.id)}">${esc(t("nut.delete"))}</button>
        </div>
      </div>
    `;

  }

  function historyHTML() {

    const rows = [];

    for (let i = 0; i < 7; i++) {

      const date =
        HN_EXT.addDays(HN_EXT.localDate(), -i);

      const entries = entriesFor(date);

      if (!entries.length) continue;

      const sum = totals(entries, foodOf).calories;

      rows.push(`
        <div class="list-item">
          <span>${esc(date)}</span>
          <strong>${esc(sum.known ? HN_EXT.number(sum.value, 0) : "—")} kcal</strong>
        </div>
      `);

    }

    return rows.length
      ? `<h3 class="section">${esc(t("nut.history"))}</h3><div class="list">${rows.join("")}</div>`
      : "";

  }

  function dayBody() {

    const entries = entriesFor(state.date);

    return `
      <p class="muted small">${esc(t("nut.intro"))}</p>

      <label for="nutDate">${esc(t("nut.date"))}</label>
      <input id="nutDate" type="date" value="${esc(state.date)}"
        max="${esc(HN_EXT.localDate())}" data-ext-change="nut-date">

      <h3 class="section">${esc(t("nut.summary"))}
        <span class="badge">${esc(t("nut.items", { n: entries.length }))}</span>
      </h3>
      ${totalsHTML(entries)}

      <div class="ext-inline-actions">
        <button class="btn btn-primary" type="button"
          data-ext-action="nut-add">${esc(t("nut.addTitle"))}</button>
        ${entries.length
          ? `<button class="btn btn-secondary" type="button"
              data-ext-action="nut-share">${esc(t("nut.share"))}</button>`
          : ""}
      </div>

      <div class="section">
        ${entries.length
          ? `<div class="list">${entries.map(entryRowHTML).join("")}</div>`
          : `<div class="empty-state">${esc(t("nut.empty"))}</div>`}
      </div>

      ${historyHTML()}

      <div class="disclaimer section">${esc(t("nut.disclaimer"))}</div>
    `;

  }

  function searchResults() {

    const foods = APP.data.foods;

    const matches = foods.filter(food =>
      itemMatches(food, state.query, ["name_bn", "name_en", "category"])
    );

    if (!matches.length) {
      return `<div class="empty-state">${esc(t("nut.noFood"))}</div>`;
    }

    const shown = matches.slice(0, 8);

    return `
      <div class="list">
        ${shown.map(food => `
          <button class="list-item ext-row" type="button"
            data-ext-action="nut-pick" data-id="${esc(food.id)}">
            <span>
              <strong>${esc(food.name_bn)}</strong>
              <span class="small muted">
                ${esc(food.serving_size || "")} • ${esc(food.calories_kcal ?? "—")} kcal
              </span>
            </span>
          </button>
        `).join("")}
      </div>
      ${matches.length > shown.length
        ? `<p class="small muted">${esc(t("nut.refine"))}</p>`
        : ""}
    `;

  }

  function addBody() {

    const editing =
      state.editId
        ? allEntries().find(e => String(e.id) === String(state.editId))
        : null;

    if (state.foodId === null) {

      return `
        <button class="btn btn-secondary" type="button"
          data-ext-action="nut-cancel">${esc(t("nut.back"))}</button>

        <label for="nutSearch" class="section">${esc(t("nut.search"))}</label>
        <input id="nutSearch" type="search" autocomplete="off"
          value="${esc(state.query)}"
          placeholder="${esc(t("nut.searchPlaceholder"))}"
          data-ext-input="nut-search">

        <div id="nutResults" class="section">${searchResults()}</div>
      `;

    }

    const food = foodOf(state.foodId);

    if (!food) {
      return `<div class="error-state">${esc(t("nut.missingFood"))}</div>`;
    }

    const basis = servingBasis(food);

    const mode =
      editing && editing.mode === "amount" && basis
        ? "amount"
        : "servings";

    return `
      <button class="btn btn-secondary" type="button"
        data-ext-action="nut-cancel">${esc(t("nut.back"))}</button>

      <h3 class="section">${esc(food.name_bn)}</h3>
      <p class="small muted">${esc(t("nut.servingIs", { s: food.serving_size || "—" }))}</p>

      <form data-ext-form="nut-save" novalidate>

        <input type="hidden" name="foodId" value="${esc(food.id)}">
        <input type="hidden" name="entryId" value="${esc(editing ? editing.id : "")}">
        <input type="hidden" name="date" value="${esc(state.date)}">

        ${basis ? `
          <div class="ext-chips" role="radiogroup">
            <label><input type="radio" name="mode" value="servings" ${mode === "servings" ? "checked" : ""}>
              ${esc(t("nut.modeServings"))}</label>
            <label><input type="radio" name="mode" value="amount" ${mode === "amount" ? "checked" : ""}>
              ${esc(t("nut.modeAmount", { unit: basis.unit }))}</label>
          </div>
        ` : `
          <input type="hidden" name="mode" value="servings">
          <p class="small muted">${esc(t("nut.amountUnavailable"))}</p>
        `}

        <label for="nutServings">${esc(t("nut.qtyServings"))}</label>
        <input id="nutServings" name="servings" type="number" min="0.1" max="20"
          step="0.1" value="${esc(editing && editing.servings ? editing.servings : 1)}">

        ${basis ? `
          <label for="nutAmount">${esc(t("nut.qtyAmount", { unit: basis.unit }))}</label>
          <input id="nutAmount" name="amount" type="number" min="1" max="5000"
            step="1" value="${esc(editing && editing.amount ? editing.amount : basis.amount)}">
          <input type="hidden" name="unit" value="${esc(basis.unit)}">
        ` : ""}

        <p id="nutFormError" class="small" role="alert" style="color:var(--danger)"></p>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit">
            ${esc(editing ? t("nut.update") : t("nut.save"))}</button>
          <button class="btn btn-secondary" type="button"
            data-ext-action="nut-cancel">${esc(t("nut.cancel"))}</button>
        </div>

      </form>
    `;

  }


  /* ---------- SHARE CARD ---------- */

  function cardData() {

    const entries = entriesFor(state.date);

    const sums = totals(entries, foodOf);

    const lines =
      NUTRIENTS.map(nutrient => {

        const info = sums[nutrient.id];

        const value =
          info.known === 0 && info.unknown > 0
            ? "—"
            : HN_EXT.number(info.value, nutrient.digits);

        return { label: t(nutrient.label), value };

      });

    const foods =
      state.includeList
        ? entries.map(entry => {

            const food = foodOf(entry.foodId);

            return food ? food.name_bn : (entry.name || "");

          }).filter(Boolean)
        : [];

    return { date: state.date, lines, foods };

  }

  function cardText() {

    const data = cardData();

    const rows = [
      t("nut.cardTitle"),
      data.date,
      ...data.lines.map(line => `${line.label}: ${line.value}`),
      ...(data.foods.length ? ["", data.foods.join(", ")] : []),
      "",
      t("nut.cardNote")
    ];

    return rows.join("\n");

  }

  function shareBody() {

    const data = cardData();

    return `
      <button class="btn btn-secondary" type="button"
        data-ext-action="nut-cancel">${esc(t("nut.back"))}</button>

      <section class="card section" id="nutCard">
        <strong>${esc(t("nut.cardTitle"))}</strong>
        <p class="small muted">${esc(data.date)}</p>
        <div class="ext-stat-grid">
          ${data.lines.map(line => `
            <div class="ext-stat">
              <span class="small muted">${esc(line.label)}</span>
              <strong>${esc(line.value)}</strong>
            </div>`).join("")}
        </div>
        ${data.foods.length ? `<p class="small">${esc(data.foods.join(", "))}</p>` : ""}
        <p class="small muted">${esc(t("nut.cardNote"))}</p>
      </section>

      <label class="section">
        <input type="checkbox" data-ext-change="nut-include" ${state.includeList ? "checked" : ""}>
        ${esc(t("nut.shareIncludeList"))}
      </label>

      <p class="small muted">${esc(t("nut.shareNote"))}</p>

      <div class="ext-inline-actions">
        <button class="btn btn-primary" type="button" data-ext-action="nut-share-native">${esc(t("nut.shareNative"))}</button>
        <button class="btn btn-secondary" type="button" data-ext-action="nut-share-copy">${esc(t("nut.shareCopy"))}</button>
        <button class="btn btn-secondary" type="button" data-ext-action="nut-share-image">${esc(t("nut.shareImage"))}</button>
      </div>

      <p id="nutShareStatus" class="small" role="status"></p>
    `;

  }

  function setShareStatus(message) {

    const element = document.getElementById("nutShareStatus");

    if (element) {
      element.textContent = message;
    }

  }

  async function shareNative() {

    const text = cardText();

    if (typeof navigator.share !== "function") {

      setShareStatus(t("nut.shareUnsupported"));

      return;

    }

    try {

      await navigator.share({
        title: t("nut.cardTitle"),
        text
      });

      /* The promise resolving means the share sheet was used; the
         browser does not confirm delivery. */

      setShareStatus(t("nut.shareOpened"));

    } catch (error) {

      setShareStatus(
        error && error.name === "AbortError"
          ? t("nut.shareCancelled")
          : t("nut.shareUnsupported")
      );

    }

  }

  async function shareCopy() {

    try {

      await navigator.clipboard.writeText(cardText());

      setShareStatus(t("nut.copied"));

    } catch (error) {

      setShareStatus(t("nut.copyFailed"));

    }

  }

  function shareImage() {

    const data = cardData();

    const canvas = document.createElement("canvas");

    canvas.width = 720;

    const listLines =
      data.foods.length ? Math.ceil(data.foods.join(", ").length / 48) : 0;

    canvas.height = 420 + listLines * 30;

    const ctx = canvas.getContext("2d");

    if (!ctx) {

      setShareStatus(t("nut.shareUnsupported"));

      return;

    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f766e";
    ctx.fillRect(0, 0, canvas.width, 12);
    ctx.fillStyle = "#17202a";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(t("nut.cardTitle"), 32, 70);
    ctx.fillStyle = "#667085";
    ctx.font = "22px sans-serif";
    ctx.fillText(data.date, 32, 105);

    ctx.fillStyle = "#17202a";
    ctx.font = "26px sans-serif";

    data.lines.forEach((line, index) => {
      ctx.fillText(`${line.label}: ${line.value}`, 32, 160 + index * 42);
    });

    let y = 160 + data.lines.length * 42 + 12;

    if (data.foods.length) {

      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#344054";

      const words = data.foods.join(", ").split(" ");
      let line = "";

      words.forEach(word => {

        if ((line + word).length > 48) {
          ctx.fillText(line, 32, y);
          y += 30;
          line = "";
        }

        line += word + " ";

      });

      ctx.fillText(line, 32, y);
      y += 30;

    }

    ctx.fillStyle = "#667085";
    ctx.font = "18px sans-serif";
    ctx.fillText(t("nut.cardNote"), 32, canvas.height - 28);

    canvas.toBlob(blob => {

      if (!blob) {
        setShareStatus(t("nut.shareUnsupported"));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `health-nivo-${data.date}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 2000);

    }, "image/png");

  }


  /* ---------- OPEN / EVENTS ---------- */

  function bodyForView() {

    if (APP.dataState && APP.dataState.loading) {
      return `<div class="loading-state">${esc(t("nut.loading"))}</div>`;
    }

    if (
      (APP.dataState && APP.dataState.error) ||
      !Array.isArray(APP.data.foods) ||
      !APP.data.foods.length
    ) {
      return `<div class="error-state">${esc(t("nut.dataError"))}</div>`;
    }

    if (state.view === "add") return addBody();
    if (state.view === "share") return shareBody();

    return dayBody();

  }

  function show() {

    HN_EXT.modal(t("nut.title"), bodyForView());

  }

  HN_EXT.tool("nutrition", () => {

    state.date = HN_EXT.localDate();
    state.view = "day";
    state.foodId = null;
    state.editId = null;
    state.query = "";

    show();

  });

  HN_EXT.action("nut-add", () => {
    state.view = "add";
    state.foodId = null;
    state.editId = null;
    state.query = "";
    show();
  });

  HN_EXT.action("nut-cancel", () => {

    if (state.view === "add" && state.foodId !== null && !state.editId) {
      state.foodId = null;
    } else {
      state.view = "day";
      state.foodId = null;
      state.editId = null;
    }

    show();

  });

  HN_EXT.action("nut-pick", element => {
    state.foodId = element.dataset.id;
    show();
  });

  HN_EXT.input("nut-search", element => {
    state.query = element.value;
    HN_EXT.setHTML("#nutResults", searchResults());
  });

  HN_EXT.input("nut-date", element => {

    if (HN_EXT.isValidISODate(element.value)) {
      state.date = element.value;
      show();
    }

  });

  HN_EXT.action("nut-edit", element => {

    const entry =
      allEntries().find(e => String(e.id) === String(element.dataset.id));

    if (!entry) return;

    state.view = "add";
    state.foodId = String(entry.foodId);
    state.editId = entry.id;

    show();

  });

  HN_EXT.action("nut-delete", element => {

    if (!window.confirm(t("nut.confirmDelete"))) return;

    HN_EXT.writeList(
      KEY(),
      HN_EXT.readList(KEY()).filter(
        entry => String(entry.id) !== String(element.dataset.id)
      )
    );

    toast(t("nut.deleted"));

    show();

  });

  HN_EXT.form("nut-save", data => {

    const food = foodOf(data.foodId);

    const entry = {
      date: data.date,
      foodId: Number.isFinite(Number(data.foodId)) ? Number(data.foodId) : data.foodId,
      name: food ? food.name_bn : "",
      mode: data.mode === "amount" ? "amount" : "servings",
      servings: Number(data.servings),
      amount: data.amount !== undefined ? Number(data.amount) : null,
      unit: data.unit || null
    };

    if (entry.mode === "amount") {

      const basis = servingBasis(food);

      if (!basis) {
        entry.mode = "servings";
      }

    }

    const errorKey = validateEntry(entry);

    if (errorKey) {

      HN_EXT.setHTML("#nutFormError", esc(t(errorKey)));

      return;

    }

    const list = HN_EXT.readList(KEY());

    if (data.entryId) {

      const index =
        list.findIndex(e => String(e.id) === String(data.entryId));

      if (index >= 0) {
        list[index] = { ...list[index], ...entry };
      }

    } else {

      list.push({ id: HN_EXT.uid(), createdAt: Date.now(), ...entry });

    }

    HN_EXT.writeList(KEY(), list);

    toast(data.entryId ? t("nut.updated") : t("nut.saved"));

    state.view = "day";
    state.foodId = null;
    state.editId = null;

    show();

  });

  HN_EXT.action("nut-share", () => {
    state.view = "share";
    show();
  });

  HN_EXT.input("nut-include", element => {
    state.includeList = element.checked;
    show();
  });

  HN_EXT.action("nut-share-native", shareNative);
  HN_EXT.action("nut-share-copy", shareCopy);
  HN_EXT.action("nut-share-image", shareImage);


  window.HN_NUTRITION = {
    servingBasis,
    entryNutrition,
    totals,
    validateEntry
  };

})();
