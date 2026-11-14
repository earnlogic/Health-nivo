/* =========================================================
   HEALTH NIVO — BMI / BMR (v2)
   Registered as the "bmi" tool, so it replaces the older modal
   from the tracker tile (the old code in app.js is left intact).

   Reference rules used:
   - Adults (19+): WHO adult BMI classification
       <18.5 underweight, 18.5–24.9 healthy range,
       25–29.9 overweight, >=30 obesity (class I 30–34.9,
       II 35–39.9, III >=40).
     Additional public-health cut-points for Asian populations
     (WHO Expert Consultation, Lancet 2004): 23.0 and 27.5.
   - Under 19: BMI-for-age needs sex- and age-specific reference
     tables (e.g. WHO 2007 growth reference). Those tables are not
     part of this app, so NO classification is shown; adult cut-offs
     are never applied to children or adolescents.
   - Under 5: BMI-for-age is not used; growth charts are needed.
   ========================================================= */

(() => {

  HN_EXT.addStrings({

    bn: {
      "bmi.title": "BMI / BMR",
      "bmi.intro": "BMI উচ্চতা ও ওজনের একটি সহজ অনুপাত। এটি রোগ নির্ণয় নয়, আর শরীরের চর্বির সরাসরি পরিমাপও নয়।",
      "bmi.age": "বয়স ও জন্মতারিখ",
      "bmi.dob": "জন্মতারিখ (ঐচ্ছিক)",
      "bmi.ageYears": "বয়স (বছর)",
      "bmi.ageHint": "জন্মতারিখ দিলে বয়স স্বয়ংক্রিয়ভাবে হিসাব হবে।",
      "bmi.sex": "লিঙ্গ (BMR-এর জন্য)",
      "bmi.sexFemale": "নারী",
      "bmi.sexMale": "পুরুষ",
      "bmi.sexNone": "উল্লেখ করতে চাই না",
      "bmi.heightUnit": "উচ্চতার একক",
      "bmi.cm": "সেন্টিমিটার (cm)",
      "bmi.ftin": "ফুট ও ইঞ্চি",
      "bmi.height": "উচ্চতা (cm)",
      "bmi.feet": "ফুট",
      "bmi.inches": "ইঞ্চি",
      "bmi.weightUnit": "ওজনের একক",
      "bmi.kg": "কিলোগ্রাম (kg)",
      "bmi.lb": "পাউন্ড (lb)",
      "bmi.weight": "ওজন",
      "bmi.pregnant": "আমি গর্ভবতী বা সন্তানকে বুকের দুধ খাওয়াচ্ছি",
      "bmi.calculate": "হিসাব করুন",
      "bmi.errAge": "সঠিক বয়স বা জন্মতারিখ দিন (০–১২০ বছর)।",
      "bmi.errDob": "জন্মতারিখ ভবিষ্যতে হতে পারে না।",
      "bmi.errHeight": "উচ্চতা ৫০–২৫০ cm-এর মধ্যে দিন।",
      "bmi.errFeet": "ফুট ১–৮ এবং ইঞ্চি ০–১১.৯ এর মধ্যে দিন।",
      "bmi.errWeight": "ওজন ১০–৫০০ kg (বা সমতুল্য lb)-এর মধ্যে দিন।",
      "bmi.resultBMI": "আপনার BMI",
      "bmi.convertedHeight": "উচ্চতা: {cm} cm",
      "bmi.convertedWeight": "ওজন: {kg} kg",
      "bmi.catUnder": "কম ওজনের পরিসর (underweight)",
      "bmi.catHealthy": "স্বাস্থ্যসম্মত পরিসর",
      "bmi.catOver": "বেশি ওজনের পরিসর (overweight)",
      "bmi.catObese1": "স্থূলতার পরিসর — শ্রেণি ১",
      "bmi.catObese2": "স্থূলতার পরিসর — শ্রেণি ২",
      "bmi.catObese3": "স্থূলতার পরিসর — শ্রেণি ৩",
      "bmi.healthyRange": "এই উচ্চতায় BMI ১৮.৫–২৪.৯-এর ওজন প্রায় {min}–{max} kg। এটি সাধারণ তথ্য, লক্ষ্য নয়।",
      "bmi.asianNote": "দক্ষিণ ও পূর্ব এশীয় জনগোষ্ঠীর ক্ষেত্রে কম BMI-তেও স্বাস্থ্যঝুঁকি বাড়তে পারে; WHO-র বিশেষজ্ঞ পরামর্শে অতিরিক্ত সীমা ২৩.০ ও ২৭.৫ উল্লেখ আছে।",
      "bmi.childUnavailable": "১৯ বছরের কম বয়সীদের BMI বয়স ও লিঙ্গভেদে আলাদা reference চার্টে (BMI-for-age) দেখা হয়। সেই যাচাইকৃত তথ্য এই অ্যাপে নেই, তাই নির্ভরযোগ্য শ্রেণি দেওয়া যাচ্ছে না। প্রাপ্তবয়স্কদের সীমা শিশু বা কিশোরের জন্য ব্যবহার করা হয় না। শিশু-কিশোরদের ওজন নিয়ে স্বাস্থ্যকর্মী বা WHO growth chart দেখুন।",
      "bmi.under5": "৫ বছরের কম বয়সীদের জন্য BMI-for-age ব্যবহার হয় না; growth chart ও স্বাস্থ্যকর্মীর সাহায্য নিন।",
      "bmi.pregnantNote": "গর্ভাবস্থা ও বুকের দুধ খাওয়ানোর সময় সাধারণ BMI শ্রেণি প্রযোজ্য নয়। ওজন বাড়ার সঠিক মাত্রা জানতে চিকিৎসক বা মিডওয়াইফের পরামর্শ নিন।",
      "bmi.limits": "BMI পেশি, হাড়ের গঠন, বয়স ও শরীরের গড়ন আলাদা করে না। অ্যাথলেট, বয়স্ক বা অসুস্থ ব্যক্তির ক্ষেত্রে ফল বিভ্রান্তিকর হতে পারে। এটি রোগ নির্ণয় নয়।",
      "bmi.foodNone": "এই পরিসরের জন্য ডেটাসেটে যাচাইকৃত খাবারের তালিকা নেই। ওজন নিয়ে চিন্তা থাকলে স্বাস্থ্যকর্মীর পরামর্শ নিন।",
      "bmi.foodHealthy": "খাবারের সাধারণ গাইডের জন্য ‘খাবার’ ট্যাব দেখুন। কোনো খাবার একা ওজন বাড়ায় বা কমায় না।",
      "bmi.foodObesityLink": "ডেটাসেটের ‘স্থূলতা’ অবস্থার খাবারের গাইড দেখুন",
      "bmi.foodNoClaim": "কোনো একটি খাবার একা ওজন কমায় বা বাড়ায়, এমন দাবি করা হয় না।",
      "bmi.bmr": "আনুমানিক BMR: {n} kcal/দিন",
      "bmi.bmrNote": "Mifflin–St Jeor সূত্রে প্রাপ্তবয়স্কদের জন্য অনুমান। এটি ক্যালরি লক্ষ্য নয়।",
      "bmi.safe": "অতিরিক্ত বা দ্রুত ওজন কমানো/বাড়ানো ঝুঁকিপূর্ণ হতে পারে। কোনো ওজন লক্ষ্য ঠিক করার আগে স্বাস্থ্যকর্মীর পরামর্শ নিন।",
      "bmi.source": "উৎস: WHO প্রাপ্তবয়স্ক BMI শ্রেণিবিভাগ; এশীয় সীমা: WHO Expert Consultation (Lancet 2004)।",
      "bmi.close": "বন্ধ করুন"
    },

    en: {
      "bmi.title": "BMI / BMR",
      "bmi.intro": "BMI is a simple ratio of weight to height. It is not a diagnosis and not a direct measure of body fat.",
      "bmi.age": "Age and date of birth",
      "bmi.dob": "Date of birth (optional)",
      "bmi.ageYears": "Age (years)",
      "bmi.ageHint": "If you enter a date of birth, age is calculated automatically.",
      "bmi.sex": "Sex (used for BMR)",
      "bmi.sexFemale": "Female",
      "bmi.sexMale": "Male",
      "bmi.sexNone": "Prefer not to say",
      "bmi.heightUnit": "Height unit",
      "bmi.cm": "Centimetres (cm)",
      "bmi.ftin": "Feet and inches",
      "bmi.height": "Height (cm)",
      "bmi.feet": "Feet",
      "bmi.inches": "Inches",
      "bmi.weightUnit": "Weight unit",
      "bmi.kg": "Kilograms (kg)",
      "bmi.lb": "Pounds (lb)",
      "bmi.weight": "Weight",
      "bmi.pregnant": "I am pregnant or breastfeeding",
      "bmi.calculate": "Calculate",
      "bmi.errAge": "Enter a valid age or date of birth (0–120 years).",
      "bmi.errDob": "Date of birth cannot be in the future.",
      "bmi.errHeight": "Enter a height between 50 and 250 cm.",
      "bmi.errFeet": "Enter feet 1–8 and inches 0–11.9.",
      "bmi.errWeight": "Enter a weight between 10 and 500 kg (or the equivalent in lb).",
      "bmi.resultBMI": "Your BMI",
      "bmi.convertedHeight": "Height: {cm} cm",
      "bmi.convertedWeight": "Weight: {kg} kg",
      "bmi.catUnder": "Underweight range",
      "bmi.catHealthy": "Healthy range",
      "bmi.catOver": "Overweight range",
      "bmi.catObese1": "Obesity range — class I",
      "bmi.catObese2": "Obesity range — class II",
      "bmi.catObese3": "Obesity range — class III",
      "bmi.healthyRange": "At this height, a BMI of 18.5–24.9 corresponds to about {min}–{max} kg. This is general information, not a target.",
      "bmi.asianNote": "In South and East Asian populations health risk can rise at a lower BMI; a WHO expert consultation lists additional cut-points of 23.0 and 27.5.",
      "bmi.childUnavailable": "For people under 19, BMI is read against age- and sex-specific reference charts (BMI-for-age). That validated reference data is not included in this app, so a reliable category cannot be given. Adult cut-offs are never applied to children or adolescents. Ask a health professional or use the WHO growth charts.",
      "bmi.under5": "BMI-for-age is not used for children under 5; use growth charts with a health professional.",
      "bmi.pregnantNote": "The standard BMI categories do not apply during pregnancy or breastfeeding. Ask a doctor or midwife about healthy weight gain.",
      "bmi.limits": "BMI does not separate muscle, bone, age or body shape. It can mislead for athletes, older adults or people who are ill. It is not a diagnosis.",
      "bmi.foodNone": "The dataset has no verified food list for this range. If you are concerned about your weight, ask a health professional.",
      "bmi.foodHealthy": "See the Foods tab for general food guidance. No single food on its own makes weight rise or fall.",
      "bmi.foodObesityLink": "Open the dataset's food guide for the ‘Obesity’ condition",
      "bmi.foodNoClaim": "No claim is made that any single food causes weight loss or gain.",
      "bmi.bmr": "Estimated BMR: {n} kcal/day",
      "bmi.bmrNote": "Estimate for adults using the Mifflin–St Jeor equation. It is not a calorie target.",
      "bmi.safe": "Losing or gaining weight too fast or by too much can be risky. Talk to a health professional before setting any weight goal.",
      "bmi.source": "Source: WHO adult BMI classification; Asian cut-points: WHO Expert Consultation (Lancet 2004).",
      "bmi.close": "Close"
    }

  });


  const t = (key, vars) => HN_EXT.t(key, vars);
  const esc = HN_EXT.esc;

  const LB_TO_KG = 0.45359237;
  const CM_PER_FOOT = 30.48;
  const CM_PER_INCH = 2.54;

  /* Adults start at 19: the WHO 2007 BMI-for-age reference ends at
     19, so under 19 never uses adult cut-offs. */
  const ADULT_MIN_AGE = 19;


  /* ---------- PURE FUNCTIONS (exported for tests) ---------- */

  function toCm(input) {

    if (input.unit === "ftin") {

      const feet = Number(input.feet);
      const inches = Number(input.inches);

      if (
        !Number.isFinite(feet) || !Number.isFinite(inches) ||
        feet < 1 || feet > 8 || inches < 0 || inches >= 12
      ) {
        return { error: "bmi.errFeet" };
      }

      const cm = feet * CM_PER_FOOT + inches * CM_PER_INCH;

      return cm >= 50 && cm <= 250
        ? { cm }
        : { error: "bmi.errHeight" };

    }

    const cm = Number(input.cm);

    return Number.isFinite(cm) && cm >= 50 && cm <= 250
      ? { cm }
      : { error: "bmi.errHeight" };

  }

  function toKg(input) {

    const value = Number(input.value);

    if (!Number.isFinite(value)) {
      return { error: "bmi.errWeight" };
    }

    const kg =
      input.unit === "lb"
        ? value * LB_TO_KG
        : value;

    return kg >= 10 && kg <= 500
      ? { kg }
      : { error: "bmi.errWeight" };

  }

  /* Whole completed years (and months) between a birth date and
     "today"; both ISO strings. Returns null for invalid input. */

  function ageFromDob(dobISO, todayISOString) {

    const dob = HN_EXT.parseISODate(dobISO);
    const today = HN_EXT.parseISODate(todayISOString);

    if (!dob || !today || dob > today) {
      return null;
    }

    let months =
      (today.getFullYear() - dob.getFullYear()) * 12 +
      (today.getMonth() - dob.getMonth());

    if (today.getDate() < dob.getDate()) {
      months -= 1;
    }

    return {
      years: Math.floor(months / 12),
      months: months % 12
    };

  }

  function bmiValue(cm, kg) {

    const meters = cm / 100;

    return kg / (meters * meters);

  }

  function adultCategory(bmi) {

    if (bmi < 18.5) return "bmi.catUnder";
    if (bmi < 25) return "bmi.catHealthy";
    if (bmi < 30) return "bmi.catOver";
    if (bmi < 35) return "bmi.catObese1";
    if (bmi < 40) return "bmi.catObese2";

    return "bmi.catObese3";

  }

  function healthyWeightRange(cm) {

    const meters = cm / 100;

    return {
      min: 18.5 * meters * meters,
      max: 24.9 * meters * meters
    };

  }

  /* "adult" | "child" | "under5" */

  function ageGroup(years) {

    if (years >= ADULT_MIN_AGE) return "adult";
    if (years < 5) return "under5";

    return "child";

  }

  function bmr(ageYears, kg, cm, sex) {

    if (
      ageYears < ADULT_MIN_AGE ||
      (sex !== "male" && sex !== "female")
    ) {
      return null;
    }

    return Math.round(
      10 * kg + 6.25 * cm - 5 * ageYears +
      (sex === "male" ? 5 : -161)
    );

  }

  /* Full interpretation used by the form and by tests. */

  function interpret(input, today = HN_EXT.localDate()) {

    let years;

    if (input.dob) {

      const dob = HN_EXT.parseISODate(input.dob);

      if (!dob) return { error: "bmi.errAge" };

      const age = ageFromDob(input.dob, today);

      if (!age) return { error: "bmi.errDob" };

      years = age.years;

    } else {

      years = Number(input.age);

      if (
        input.age === "" || input.age === undefined ||
        !Number.isFinite(years) || years < 0 || years > 120
      ) {
        return { error: "bmi.errAge" };
      }

      years = Math.floor(years);

    }

    if (years > 120) return { error: "bmi.errAge" };

    const height = toCm({
      unit: input.heightUnit,
      cm: input.cm,
      feet: input.feet,
      inches: input.inches
    });

    if (height.error) return { error: height.error };

    const weight = toKg({
      unit: input.weightUnit,
      value: input.weight
    });

    if (weight.error) return { error: weight.error };

    const bmi = bmiValue(height.cm, weight.kg);

    const group = ageGroup(years);

    const result = {
      years,
      group,
      cm: height.cm,
      kg: weight.kg,
      bmi,
      pregnant: !!input.pregnant,
      category: null,
      range: null,
      bmr: null
    };

    if (group === "adult" && !result.pregnant) {

      result.category = adultCategory(bmi);
      result.range = healthyWeightRange(height.cm);

    }

    /* Mifflin–St Jeor is not validated for pregnancy or
       breastfeeding, so no BMR is shown in those cases. */

    if (group === "adult" && !result.pregnant) {
      result.bmr = bmr(years, weight.kg, height.cm, input.sex);
    }

    return result;

  }


  /* ---------- UI ---------- */

  function profilePrefill() {

    const profile = storageGet(APP.keys.profile, {}) || {};

    const pick = value =>
      value === undefined || value === null ? "" : value;

    return {
      age: pick(profile.age),
      sex: profile.sex === "male" || profile.sex === "female" ? profile.sex : "female",
      cm: pick(profile.height),
      weight: pick(profile.weight)
    };

  }

  function formHTML() {

    const p = profilePrefill();

    return `
      <p class="muted small">${esc(t("bmi.intro"))}</p>

      <form data-ext-form="bmi-calc" novalidate>

        <div class="form-grid two">
          <div>
            <label for="bmiDob">${esc(t("bmi.dob"))}</label>
            <input id="bmiDob" name="dob" type="date" max="${esc(HN_EXT.localDate())}">
          </div>
          <div>
            <label for="bmiAgeY">${esc(t("bmi.ageYears"))}</label>
            <input id="bmiAgeY" name="age" type="number" min="0" max="120" step="1" value="${esc(p.age)}">
          </div>
        </div>
        <p class="small muted">${esc(t("bmi.ageHint"))}</p>

        <div>
          <label for="bmiSexSel">${esc(t("bmi.sex"))}</label>
          <select id="bmiSexSel" name="sex">
            <option value="female" ${p.sex === "female" ? "selected" : ""}>${esc(t("bmi.sexFemale"))}</option>
            <option value="male" ${p.sex === "male" ? "selected" : ""}>${esc(t("bmi.sexMale"))}</option>
            <option value="none">${esc(t("bmi.sexNone"))}</option>
          </select>
        </div>

        <div>
          <label for="bmiHUnit">${esc(t("bmi.heightUnit"))}</label>
          <select id="bmiHUnit" name="heightUnit" data-ext-change="bmi-unit">
            <option value="cm">${esc(t("bmi.cm"))}</option>
            <option value="ftin">${esc(t("bmi.ftin"))}</option>
          </select>
        </div>

        <div id="bmiCmGroup">
          <label for="bmiCm">${esc(t("bmi.height"))}</label>
          <input id="bmiCm" name="cm" type="number" min="50" max="250" step="0.1" value="${esc(p.cm)}">
        </div>

        <div id="bmiFtGroup" class="form-grid two" hidden>
          <div>
            <label for="bmiFt">${esc(t("bmi.feet"))}</label>
            <input id="bmiFt" name="feet" type="number" min="1" max="8" step="1">
          </div>
          <div>
            <label for="bmiIn">${esc(t("bmi.inches"))}</label>
            <input id="bmiIn" name="inches" type="number" min="0" max="11.9" step="0.1">
          </div>
        </div>

        <div class="form-grid two">
          <div>
            <label for="bmiW">${esc(t("bmi.weight"))}</label>
            <input id="bmiW" name="weight" type="number" min="1" max="1100" step="0.1" value="${esc(p.weight)}">
          </div>
          <div>
            <label for="bmiWUnit">${esc(t("bmi.weightUnit"))}</label>
            <select id="bmiWUnit" name="weightUnit">
              <option value="kg">${esc(t("bmi.kg"))}</option>
              <option value="lb">${esc(t("bmi.lb"))}</option>
            </select>
          </div>
        </div>

        <label>
          <input type="checkbox" name="pregnant" value="1">
          ${esc(t("bmi.pregnant"))}
        </label>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit">${esc(t("bmi.calculate"))}</button>
          <button class="btn btn-secondary" type="button" data-action="close-modal">${esc(t("bmi.close"))}</button>
        </div>

      </form>

      <div id="bmiResult" class="section" aria-live="polite"></div>
    `;

  }

  function obesityConditionId() {

    const list =
      (APP.data && Array.isArray(APP.data.conditions))
        ? APP.data.conditions
        : [];

    const found =
      list.find(item => item.name_en === "Obesity");

    return found ? found.id : null;

  }

  function resultHTML(result) {

    const parts = [];

    parts.push(`
      <section class="card">
        <span class="small muted">${esc(t("bmi.resultBMI"))}</span>
        <strong style="font-size:1.6rem;display:block">${esc(HN_EXT.number(result.bmi, 1))}</strong>
        <p class="small muted">
          ${esc(t("bmi.convertedHeight", { cm: HN_EXT.number(result.cm, 1) }))} •
          ${esc(t("bmi.convertedWeight", { kg: HN_EXT.number(result.kg, 1) }))}
        </p>
    `);

    if (result.group === "child") {

      parts.push(`<div class="ext-warn">${esc(t("bmi.childUnavailable"))}</div>`);

    } else if (result.group === "under5") {

      parts.push(`<div class="ext-warn">${esc(t("bmi.under5"))}</div>`);

    } else if (result.pregnant) {

      parts.push(`<div class="ext-warn">${esc(t("bmi.pregnantNote"))}</div>`);

    } else if (result.category) {

      parts.push(`
        <p><strong>${esc(t(result.category))}</strong></p>
        <p class="small">${esc(t("bmi.healthyRange", {
          min: HN_EXT.number(result.range.min, 1),
          max: HN_EXT.number(result.range.max, 1)
        }))}</p>
        <p class="small muted">${esc(t("bmi.asianNote"))}</p>
      `);

      /* Food guidance only from verified dataset relationships. */

      let food = "";

      if (result.bmi >= 30 && obesityConditionId() !== null) {

        food = `
          <button class="btn btn-secondary" type="button"
            data-ext-action="bmi-obesity">${esc(t("bmi.foodObesityLink"))}</button>
          <p class="small muted">${esc(t("bmi.foodNoClaim"))}</p>
        `;

      } else if (result.category === "bmi.catHealthy") {

        food = `<p class="small">${esc(t("bmi.foodHealthy"))}</p>`;

      } else {

        food = `<p class="small">${esc(t("bmi.foodNone"))}</p>`;

      }

      parts.push(food);

    }

    if (result.bmr !== null) {

      parts.push(`
        <p><strong>${esc(t("bmi.bmr", { n: result.bmr }))}</strong></p>
        <p class="small muted">${esc(t("bmi.bmrNote"))}</p>
      `);

    }

    parts.push(`
      </section>
      <p class="small muted">${esc(t("bmi.limits"))}</p>
      <p class="small muted">${esc(t("bmi.safe"))}</p>
      <p class="small muted">${esc(t("bmi.source"))}</p>
    `);

    return parts.join("");

  }

  HN_EXT.tool("bmi", () => {

    HN_EXT.modal(t("bmi.title"), formHTML());

  });

  HN_EXT.input("bmi-unit", element => {

    const feet = element.value === "ftin";

    const cmGroup = document.getElementById("bmiCmGroup");
    const ftGroup = document.getElementById("bmiFtGroup");

    if (cmGroup) cmGroup.hidden = feet;
    if (ftGroup) ftGroup.hidden = !feet;

  });

  HN_EXT.form("bmi-calc", data => {

    const result = interpret(data);

    if (result.error) {

      HN_EXT.setHTML(
        "#bmiResult",
        `<div class="error-state" role="alert">${esc(t(result.error))}</div>`
      );

      return;

    }

    HN_EXT.setHTML("#bmiResult", resultHTML(result));

  });

  HN_EXT.action("bmi-obesity", () => {

    const id = obesityConditionId();

    if (id !== null && window.HN_CONDITIONS) {
      window.HN_CONDITIONS.open(id);
    }

  });


  window.HN_BMI = {
    toCm,
    toKg,
    ageFromDob,
    bmiValue,
    adultCategory,
    healthyWeightRange,
    ageGroup,
    bmr,
    interpret
  };

})();
