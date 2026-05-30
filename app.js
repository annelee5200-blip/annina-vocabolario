const STORAGE_KEY = "annina-vocabolario-v2";
const OLD_STORAGE_KEY = "annina-vocabolario-v1";

const uid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const seedArchive = {
  categories: [
    {
      id: uid(),
      name: "名词",
      subcategories: [
        { id: uid(), name: "生活类：吃饭" },
        { id: uid(), name: "生活类：撩仔" },
      ],
    },
    {
      id: uid(),
      name: "动词",
      subcategories: [
        { id: uid(), name: "生活类：吃饭" },
        { id: uid(), name: "生活类：工作" },
      ],
    },
    {
      id: uid(),
      name: "形容词",
      subcategories: [
        { id: uid(), name: "生活类：撩仔" },
      ],
    },
  ],
  words: [],
  studyLog: [],
};

function seedWithWords() {
  const archive = JSON.parse(JSON.stringify(seedArchive));
  const find = (catName, subName) => {
    const category = archive.categories.find((item) => item.name === catName);
    const subcategory = category.subcategories.find((item) => item.name === subName);
    return { categoryId: category.id, subcategoryId: subcategory.id };
  };

  archive.words = [
    { id: uid(), meaning: "爱；爱情", italian: "amore", ...find("名词", "生活类：撩仔") },
    { id: uid(), meaning: "吃", italian: "mangiare", ...find("动词", "生活类：吃饭") },
    { id: uid(), meaning: "甜的；温柔的", italian: "dolce", ...find("形容词", "生活类：撩仔") },
    { id: uid(), meaning: "工作", italian: "lavorare", ...find("动词", "生活类：工作") },
    { id: uid(), meaning: "咖啡", italian: "caffè", ...find("名词", "生活类：吃饭") },
    { id: uid(), meaning: "漂亮的；美好的", italian: "bello", ...find("形容词", "生活类：撩仔") },
  ];

  return archive;
}

const state = {
  archive: loadArchive(),
  openCategories: new Set(),
  openSubcategories: new Set(),
  calendarMonthOffset: 0,
  calendarTouchStartX: null,
  addMode: "single",
  quiz: null,
  confirmAction: null,
};

const el = {
  homeView: document.querySelector("#homeView"),
  quizView: document.querySelector("#quizView"),
  wordCount: document.querySelector("#wordCount"),
  categoryCount: document.querySelector("#categoryCount"),
  folderList: document.querySelector("#folderList"),
  monthLabel: document.querySelector("#monthLabel"),
  monthSummary: document.querySelector("#monthSummary"),
  calendarGrid: document.querySelector("#calendarGrid"),
  monthRing: document.querySelector("#monthRing"),
  monthDaysCount: document.querySelector("#monthDaysCount"),
  learnedWordsCount: document.querySelector("#learnedWordsCount"),
  openSettings: document.querySelector("#openSettings"),
  settingsModal: document.querySelector("#settingsModal"),
  closeSettings: document.querySelector("#closeSettings"),
  backupApp: document.querySelector("#backupApp"),
  restoreApp: document.querySelector("#restoreApp"),
  restoreFile: document.querySelector("#restoreFile"),
  storageInfo: document.querySelector("#storageInfo"),
  openAddModal: document.querySelector("#openAddModal"),
  wordModal: document.querySelector("#wordModal"),
  closeWordModal: document.querySelector("#closeWordModal"),
  wordForm: document.querySelector("#wordForm"),
  categoryInput: document.querySelector("#categoryInput"),
  subcategoryInput: document.querySelector("#subcategoryInput"),
  categoryOptions: document.querySelector("#categoryOptions"),
  subcategoryOptions: document.querySelector("#subcategoryOptions"),
  singleMode: document.querySelector("#singleMode"),
  batchMode: document.querySelector("#batchMode"),
  singleFields: document.querySelector("#singleFields"),
  batchFields: document.querySelector("#batchFields"),
  meaningInput: document.querySelector("#meaningInput"),
  italianInput: document.querySelector("#italianInput"),
  csvInput: document.querySelector("#csvInput"),
  manageModal: document.querySelector("#manageModal"),
  closeManageModal: document.querySelector("#closeManageModal"),
  manageTitle: document.querySelector("#manageTitle"),
  manageBody: document.querySelector("#manageBody"),
  confirmModal: document.querySelector("#confirmModal"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmNo: document.querySelector("#confirmNo"),
  confirmYes: document.querySelector("#confirmYes"),
  brunoModal: document.querySelector("#brunoModal"),
  brunoMessage: document.querySelector("#brunoMessage"),
  brunoImage: document.querySelector("#brunoImage"),
  closeBrunoModal: document.querySelector("#closeBrunoModal"),
  backHome: document.querySelector("#backHome"),
  quizTitle: document.querySelector("#quizTitle"),
  quizProgress: document.querySelector("#quizProgress"),
  quizScore: document.querySelector("#quizScore"),
  quizCard: document.querySelector("#quizCard"),
  questionMeaning: document.querySelector("#questionMeaning"),
  answerInput: document.querySelector("#answerInput"),
  feedback: document.querySelector("#feedback"),
  checkAnswer: document.querySelector("#checkAnswer"),
  nextQuestion: document.querySelector("#nextQuestion"),
};

function loadArchive() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.categories && parsed?.words) return normalizeArchive(parsed);
    } catch {
      return seedWithWords();
    }
  }

  const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldSaved) {
    try {
      const oldWords = JSON.parse(oldSaved);
      if (Array.isArray(oldWords)) return migrateOldWords(oldWords);
    } catch {
      return seedWithWords();
    }
  }

  return seedWithWords();
}

function migrateOldWords(oldWords) {
  const archive = { categories: [], words: [], studyLog: [] };
  oldWords.forEach((word) => {
    const category = ensureCategory(archive, word.part || "未分类");
    const subcategory = ensureSubcategory(category, word.topic || "未分类");
    archive.words.push({
      id: uid(),
      meaning: word.meaning || "",
      italian: word.italian || "",
      categoryId: category.id,
      subcategoryId: subcategory.id,
    });
  });
  return archive;
}

function normalizeArchive(archive) {
  return {
    categories: Array.isArray(archive.categories) ? archive.categories : [],
    words: Array.isArray(archive.words) ? archive.words : [],
    studyLog: Array.isArray(archive.studyLog) ? archive.studyLog : [],
  };
}

function saveArchive() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.archive));
}

function backupPayload() {
  return {
    app: "Annina Vocabolario",
    version: "2026-05-30",
    exportedAt: new Date().toISOString(),
    storageKey: STORAGE_KEY,
    archive: state.archive,
  };
}

function backupApp() {
  const payload = JSON.stringify(backupPayload(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `annina-vocabolario-backup-${localDateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function restoreAppFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(reader.result);
      const archive = data.archive || data;
      const restored = normalizeArchive(archive);
      if (!restored.categories.length && !restored.words.length) {
        throw new Error("Backup data is empty.");
      }
      showConfirm({
        title: "Restore backup?",
        message: "这会替换当前手机里的 Annina Vocabolario 资料。确定要继续吗？",
        onYes: () => {
          state.archive = restored;
          saveArchive();
          el.settingsModal.close();
          render();
        },
      });
    } catch {
      showConfirm({
        title: "Backup file unreadable",
        message: "这个文件不像 Annina Vocabolario 的 backup。请选之前下载的 JSON 备份。",
        onYes: () => {},
      });
    } finally {
      el.restoreFile.value = "";
    }
  });
  reader.readAsText(file);
}

function ensureCategory(archive, name) {
  const cleanName = name.trim();
  let category = archive.categories.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());
  if (!category) {
    category = { id: uid(), name: cleanName, subcategories: [] };
    archive.categories.push(category);
  }
  return category;
}

function ensureSubcategory(category, name) {
  const cleanName = name.trim();
  let subcategory = category.subcategories.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());
  if (!subcategory) {
    subcategory = { id: uid(), name: cleanName };
    category.subcategories.push(subcategory);
  }
  return subcategory;
}

function categoryById(id) {
  return state.archive.categories.find((category) => category.id === id);
}

function subcategoryById(categoryId, subcategoryId) {
  return categoryById(categoryId)?.subcategories.find((subcategory) => subcategory.id === subcategoryId);
}

function wordsInSubcategory(categoryId, subcategoryId) {
  return state.archive.words.filter((word) => word.categoryId === categoryId && word.subcategoryId === subcategoryId);
}

function wordsInCategory(categoryId) {
  return state.archive.words.filter((word) => word.categoryId === categoryId);
}

function wordById(wordId) {
  return state.archive.words.find((word) => word.id === wordId);
}

function subcategoryKey(categoryId, subcategoryId) {
  return `${categoryId}:${subcategoryId}`;
}

function normalizeAnswer(value) {
  return value.normalize("NFC").trim().toLocaleLowerCase("it-IT").replace(/\s+/g, " ");
}

function acceptedAnswers(word) {
  return word.italian.split(/[;,/]/).map(normalizeAnswer).filter(Boolean);
}

function render() {
  renderStats();
  renderOptions();
  renderFolders();
  renderRitualStats();
}

function renderStats() {
  el.wordCount.textContent = state.archive.words.length;
  el.categoryCount.textContent = state.archive.categories.length;
  el.storageInfo.textContent = `${state.archive.words.length} words · ${state.archive.categories.length} folders · ${state.archive.studyLog.length} study records saved locally.`;
}

function renderRitualStats() {
  const today = new Date();
  const displayDate = new Date(today.getFullYear(), today.getMonth() + state.calendarMonthOffset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const daysInDisplayMonth = new Date(year, month + 1, 0).getDate();
  const checkedDates = new Set(
    state.archive.studyLog
      .map((entry) => entry.date)
      .filter((date) => date?.startsWith(monthKey))
  );
  const checkedDays = checkedDates.size;
  const monthName = displayDate.toLocaleString("en", { month: "long", year: "numeric" }).toUpperCase();
  const progress = daysInDisplayMonth ? (checkedDays / daysInDisplayMonth) * 360 : 0;

  el.monthLabel.textContent = monthName;
  el.monthSummary.textContent = `${checkedDays} / ${daysInDisplayMonth} days checked`;
  el.monthDaysCount.textContent = checkedDays;
  el.monthRing.style.setProperty("--ring-progress", `${progress}deg`);
  el.learnedWordsCount.textContent = learnedWordsCount();
  renderCalendarGrid({ year, month, daysInDisplayMonth, checkedDates, today });
}

function renderCalendarGrid({ year, month, daysInDisplayMonth, checkedDates, today }) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayKey = localDateKey(today);
  el.calendarGrid.innerHTML = "";

  for (let i = 0; i < firstWeekday; i += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-day is-blank";
    el.calendarGrid.append(blank);
  }

  for (let day = 1; day <= daysInDisplayMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = localDateKey(date);
    const cell = document.createElement("span");
    cell.className = "calendar-day";
    if (checkedDates.has(dateKey)) cell.classList.add("is-checked");
    if (dateKey === todayKey) cell.classList.add("is-today");
    cell.textContent = day;
    cell.setAttribute("aria-label", `${dateKey}${checkedDates.has(dateKey) ? " checked" : ""}`);
    el.calendarGrid.append(cell);
  }
}

function shiftCalendarMonth(direction) {
  state.calendarMonthOffset += direction;
  renderRitualStats();
}

function learnedWordsCount() {
  const practiceCounts = new Map();
  state.archive.studyLog.forEach((entry) => {
    (entry.wordIds || []).forEach((wordId) => {
      practiceCounts.set(wordId, (practiceCounts.get(wordId) || 0) + 1);
    });
  });
  return [...practiceCounts.values()].filter((count) => count >= 5).length;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderOptions() {
  el.categoryOptions.innerHTML = "";
  state.archive.categories.forEach((category) => {
    el.categoryOptions.append(new Option(category.name, category.name));
  });
  updateSubcategoryOptions();
}

function updateSubcategoryOptions() {
  el.subcategoryOptions.innerHTML = "";
  const category = state.archive.categories.find((item) => item.name.toLowerCase() === el.categoryInput.value.trim().toLowerCase());
  if (!category) return;

  category.subcategories.forEach((subcategory) => {
    el.subcategoryOptions.append(new Option(subcategory.name, subcategory.name));
  });
}

function renderFolders() {
  el.folderList.innerHTML = "";

  if (!state.archive.categories.length) {
    el.folderList.innerHTML = `<div class="empty-note">No folders yet. Tap + to build Annina's archive.</div>`;
    return;
  }

  state.archive.categories.forEach((category) => {
    const isOpen = state.openCategories.has(category.id);
    const folder = document.createElement("article");
    folder.className = "folder";

    const header = document.createElement("div");
    header.className = "folder-header";
    header.innerHTML = `
      <button class="folder-toggle" type="button" aria-label="${isOpen ? "收起" : "展开"} ${escapeAttribute(category.name)}">${isOpen ? "▾" : "▸"}</button>
      <button class="folder-name" type="button">${escapeHtml(category.name)}</button>
      <span class="folder-count">${wordsInCategory(category.id).length}</span>
    `;
    header.querySelector(".folder-toggle").addEventListener("click", () => toggleCategory(category.id));
    header.querySelector(".folder-name").addEventListener("click", () => startCategoryQuiz(category.id));

    const tools = document.createElement("div");
    tools.className = "folder-tools";
    tools.innerHTML = `
      <button type="button" data-action="rename">rename</button>
      <button type="button" data-action="delete">delete</button>
    `;
    tools.addEventListener("click", (event) => handleCategoryTool(event, category.id));

    folder.append(header, tools);

    const subList = document.createElement("div");
    subList.className = `subfolder-list${isOpen ? "" : " is-hidden"}`;

    if (!category.subcategories.length) {
      subList.innerHTML = `<div class="empty-note">No subfolders inside.</div>`;
    } else {
      category.subcategories.forEach((subcategory) => {
        const words = wordsInSubcategory(category.id, subcategory.id);
        const isSubOpen = state.openSubcategories.has(subcategoryKey(category.id, subcategory.id));
        const entry = document.createElement("article");
        entry.className = "subfolder-entry";
        const row = document.createElement("div");
        row.className = "subfolder-row";
        row.innerHTML = `
          <button class="spark-button${isSubOpen ? " is-open" : ""}" type="button" aria-label="${isSubOpen ? "收起" : "展开"} ${escapeAttribute(subcategory.name)}">✦</button>
          <button class="subfolder-main" type="button">${escapeHtml(subcategory.name)}</button>
          <div class="subfolder-actions">
            <button class="icon-tool" type="button" data-action="edit" aria-label="编辑 ${escapeAttribute(subcategory.name)}">${iconSvg("edit")}</button>
            <button class="icon-tool" type="button" data-action="move" aria-label="移动 ${escapeAttribute(subcategory.name)}">${iconSvg("move")}</button>
            <button class="icon-tool danger-mini" type="button" data-action="delete" aria-label="删除 ${escapeAttribute(subcategory.name)}">${iconSvg("trash")}</button>
          </div>
        `;
        const drawer = document.createElement("div");
        drawer.className = `subword-list${isSubOpen ? "" : " is-hidden"}`;
        drawer.innerHTML = words.length
          ? words.map((word) => `
            <div class="subword-row">
              <span>${escapeHtml(word.meaning)}</span>
              <strong>${escapeHtml(word.italian)}</strong>
            </div>
          `).join("")
          : `<div class="empty-note">这个小分类还没有生词。</div>`;
        row.querySelector(".spark-button").addEventListener("click", () => toggleSubcategory(category.id, subcategory.id));
        row.querySelector(".subfolder-main").addEventListener("click", () => startQuiz(category.id, subcategory.id));
        row.addEventListener("click", (event) => handleSubcategoryTool(event, category.id, subcategory.id));
        entry.append(row, drawer);
        subList.append(entry);
      });
    }

    folder.append(subList);
    el.folderList.append(folder);
  });
}

function toggleCategory(categoryId) {
  if (state.openCategories.has(categoryId)) {
    state.openCategories.delete(categoryId);
  } else {
    state.openCategories.add(categoryId);
  }
  renderFolders();
}

function toggleSubcategory(categoryId, subcategoryId) {
  const key = subcategoryKey(categoryId, subcategoryId);
  if (state.openSubcategories.has(key)) {
    state.openSubcategories.delete(key);
  } else {
    state.openSubcategories.add(key);
  }
  renderFolders();
}

function handleCategoryTool(event, categoryId) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  event.stopPropagation();

  if (button.dataset.action === "rename") openCategoryManager(categoryId);
  if (button.dataset.action === "delete") requestDeleteCategory(categoryId);
}

function handleSubcategoryTool(event, categoryId, subcategoryId) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  event.stopPropagation();

  const action = button.dataset.action;
  if (action === "edit") openSubcategoryManager(categoryId, subcategoryId);
  if (action === "move") openMoveSubcategory(categoryId, subcategoryId);
  if (action === "delete") requestDeleteSubcategory(categoryId, subcategoryId);
}

function openCategoryManager(categoryId) {
  const category = categoryById(categoryId);
  el.manageTitle.textContent = "编辑大分类";
  el.manageBody.innerHTML = `
    <label>
      <span>folder name</span>
      <input id="manageCategoryName" value="${escapeAttribute(category.name)}">
    </label>
    <button class="primary-button wide" id="saveCategoryName" type="button">SAVE NAME</button>
  `;
  if (!el.manageModal.open) el.manageModal.showModal();
  document.querySelector("#saveCategoryName").addEventListener("click", () => {
    const nextName = document.querySelector("#manageCategoryName").value.trim();
    if (!nextName) return;
    category.name = nextName;
    saveArchive();
    el.manageModal.close();
    render();
  });
}

function openSubcategoryManager(categoryId, subcategoryId) {
  const subcategory = subcategoryById(categoryId, subcategoryId);
  const words = wordsInSubcategory(categoryId, subcategoryId);
  el.manageTitle.textContent = "编辑小分类";
  el.manageBody.innerHTML = `
    <label>
      <span>subfolder name</span>
      <input id="manageSubcategoryName" value="${escapeAttribute(subcategory.name)}">
    </label>
    <div class="word-editor-list">
      ${words.length ? words.map((word) => `
        <article class="word-editor-row" data-word-id="${word.id}">
          <label>
            <span>华语</span>
            <input class="edit-meaning" value="${escapeAttribute(word.meaning)}">
          </label>
          <label>
            <span>Italiano</span>
            <input class="edit-italian" value="${escapeAttribute(word.italian)}">
          </label>
          <button class="mini-button danger-mini delete-edit-word" type="button">del</button>
        </article>
      `).join("") : `<p class="muted-line">这个小分类还没有生词。</p>`}
    </div>
    <button class="secondary-button wide" id="addEditWord" type="button">+ WORD</button>
    <button class="primary-button wide" id="saveSubcategoryName" type="button">SAVE CHANGES</button>
  `;
  if (!el.manageModal.open) el.manageModal.showModal();
  el.manageBody.querySelectorAll(".delete-edit-word").forEach((button) => {
    button.addEventListener("click", (event) => {
      const row = event.target.closest(".word-editor-row");
      const word = wordById(row.dataset.wordId);
      showConfirm({
        title: "删除这个生词？",
        message: `${word.meaning} → ${word.italian}`,
        onYes: () => {
          state.archive.words = state.archive.words.filter((item) => item.id !== word.id);
          saveArchive();
          openSubcategoryManager(categoryId, subcategoryId);
          render();
        },
      });
    });
  });
  document.querySelector("#addEditWord").addEventListener("click", () => {
    addBlankWordEditorRow();
  });
  document.querySelector("#saveSubcategoryName").addEventListener("click", () => {
    const nextName = document.querySelector("#manageSubcategoryName").value.trim();
    if (!nextName) return;
    subcategory.name = nextName;
    el.manageBody.querySelectorAll(".word-editor-row").forEach((row) => {
      const word = wordById(row.dataset.wordId);
      if (!word) return;
      const meaning = row.querySelector(".edit-meaning").value.trim();
      const italian = row.querySelector(".edit-italian").value.trim();
      if (meaning && italian) {
        word.meaning = meaning;
        word.italian = italian;
      }
    });
    el.manageBody.querySelectorAll(".word-editor-row[data-new-word='true']").forEach((row) => {
      const meaning = row.querySelector(".edit-meaning").value.trim();
      const italian = row.querySelector(".edit-italian").value.trim();
      if (!meaning || !italian) return;
      state.archive.words.unshift({
        id: uid(),
        categoryId,
        subcategoryId,
        meaning,
        italian,
      });
    });
    saveArchive();
    el.manageModal.close();
    render();
  });
}

function addBlankWordEditorRow() {
  const list = el.manageBody.querySelector(".word-editor-list");
  const emptyNote = list.querySelector(".muted-line");
  if (emptyNote) emptyNote.remove();

  const row = document.createElement("article");
  row.className = "word-editor-row";
  row.dataset.newWord = "true";
  row.innerHTML = `
    <label>
      <span>华语</span>
      <input class="edit-meaning" placeholder="新的华语意思">
    </label>
    <label>
      <span>Italiano</span>
      <input class="edit-italian" placeholder="nuova parola">
    </label>
    <button class="mini-button danger-mini delete-edit-word" type="button">del</button>
  `;
  row.querySelector(".delete-edit-word").addEventListener("click", () => row.remove());
  list.append(row);
  row.querySelector(".edit-meaning").focus();
}

function openMoveSubcategory(categoryId, subcategoryId) {
  const category = categoryById(categoryId);
  const subcategory = subcategoryById(categoryId, subcategoryId);
  const options = state.archive.categories
    .filter((item) => item.id !== categoryId)
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
    .join("");

  el.manageTitle.textContent = "移动小分类";
  el.manageBody.innerHTML = options
    ? `
      <p class="muted-line">${escapeHtml(subcategory.name)} is inside ${escapeHtml(category.name)}.</p>
      <label>
        <span>move to folder</span>
        <select id="moveTarget">${options}</select>
      </label>
      <button class="primary-button wide" id="moveSubcategory" type="button">MOVE SUBFOLDER</button>
    `
    : `<p class="muted-line">先创建另一个大分类，才可以移动小分类。</p>`;
  if (!el.manageModal.open) el.manageModal.showModal();

  const moveButton = document.querySelector("#moveSubcategory");
  if (!moveButton) return;

  moveButton.addEventListener("click", () => {
    const targetId = document.querySelector("#moveTarget").value;
    showConfirm({
      title: "移动这个小分类？",
      message: `里面的 ${wordsInSubcategory(categoryId, subcategoryId).length} 个生词会一起移动。`,
      onYes: () => moveSubcategory(categoryId, subcategoryId, targetId),
    });
  });
}

function moveSubcategory(categoryId, subcategoryId, targetId) {
  const source = categoryById(categoryId);
  const target = categoryById(targetId);
  const index = source.subcategories.findIndex((item) => item.id === subcategoryId);
  if (index < 0 || !target) return;

  const [subcategory] = source.subcategories.splice(index, 1);
  const duplicate = target.subcategories.find((item) => item.name.toLowerCase() === subcategory.name.toLowerCase());
  const finalSubcategory = duplicate || subcategory;
  if (!duplicate) target.subcategories.push(finalSubcategory);

  state.archive.words.forEach((word) => {
    if (word.categoryId === categoryId && word.subcategoryId === subcategoryId) {
      word.categoryId = target.id;
      word.subcategoryId = finalSubcategory.id;
    }
  });

  state.openCategories.add(target.id);
  saveArchive();
  el.manageModal.close();
  render();
}

function requestDeleteCategory(categoryId) {
  const category = categoryById(categoryId);
  const count = wordsInCategory(categoryId).length;
  showConfirm({
    title: "删除这个大分类？",
    message: count ? `${category.name} 里面有 ${count} 个生词，会一起删除。` : `${category.name} 是空的。`,
    onYes: () => {
      state.archive.categories = state.archive.categories.filter((item) => item.id !== categoryId);
      state.archive.words = state.archive.words.filter((word) => word.categoryId !== categoryId);
      state.openCategories.delete(categoryId);
      saveArchive();
      render();
    },
  });
}

function requestDeleteSubcategory(categoryId, subcategoryId) {
  const subcategory = subcategoryById(categoryId, subcategoryId);
  const count = wordsInSubcategory(categoryId, subcategoryId).length;
  showConfirm({
    title: "删除这个小分类？",
    message: count ? `${subcategory.name} 里面有 ${count} 个生词，会一起删除。` : `${subcategory.name} 是空的。`,
    onYes: () => {
      const category = categoryById(categoryId);
      category.subcategories = category.subcategories.filter((item) => item.id !== subcategoryId);
      state.archive.words = state.archive.words.filter((word) => word.subcategoryId !== subcategoryId);
      saveArchive();
      render();
    },
  });
}

function showConfirm({ title, message, onYes }) {
  state.confirmAction = onYes;
  el.confirmTitle.textContent = title;
  el.confirmMessage.textContent = message;
  el.confirmModal.showModal();
}

function setAddMode(mode) {
  state.addMode = mode;
  el.singleMode.classList.toggle("is-active", mode === "single");
  el.batchMode.classList.toggle("is-active", mode === "batch");
  el.singleFields.classList.toggle("is-hidden", mode !== "single");
  el.batchFields.classList.toggle("is-hidden", mode !== "batch");
}

function openWordModal() {
  renderOptions();
  el.wordModal.showModal();
  setTimeout(() => el.categoryInput.focus(), 0);
}

function closeWordModal() {
  el.wordModal.close();
}

function addWords(event) {
  event.preventDefault();
  const categoryName = el.categoryInput.value.trim();
  const subcategoryName = el.subcategoryInput.value.trim();
  if (!categoryName || !subcategoryName) return;

  const category = ensureCategory(state.archive, categoryName);
  const subcategory = ensureSubcategory(category, subcategoryName);
  const words = state.addMode === "single" ? singleWordPayload() : csvWordPayload();
  if (!words.length) return;

  words.forEach((word) => {
    state.archive.words.unshift({
      id: uid(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      meaning: word.meaning,
      italian: word.italian,
    });
  });

  state.openCategories.add(category.id);
  saveArchive();
  render();
  el.meaningInput.value = "";
  el.italianInput.value = "";
  el.csvInput.value = "";
  el.wordModal.close();
}

function singleWordPayload() {
  const meaning = el.meaningInput.value.trim();
  const italian = el.italianInput.value.trim();
  return meaning && italian ? [{ meaning, italian }] : [];
}

function csvWordPayload() {
  return el.csvInput.value
    .split(/\n+/)
    .map((line) => parseCsvLine(line))
    .filter((row) => row.length >= 2 && row[0].trim() && row[1].trim())
    .map((row) => ({ meaning: row[0].trim(), italian: row[1].trim() }));
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function startCategoryQuiz(categoryId) {
  const category = categoryById(categoryId);
  const pool = wordsInCategory(categoryId);
  startQuizFromPool({
    title: `${category.name} / all subfolders`,
    pool,
    emptyTitle: "这个大分类还没有词",
  });
}

function startQuiz(categoryId, subcategoryId) {
  const category = categoryById(categoryId);
  const subcategory = subcategoryById(categoryId, subcategoryId);
  const pool = wordsInSubcategory(categoryId, subcategoryId);
  startQuizFromPool({
    title: `${category.name} / ${subcategory.name}`,
    pool,
    emptyTitle: "这个小分类还没有词",
  });
}

function startQuizFromPool({ title, pool, emptyTitle }) {
  if (!pool.length) {
    showConfirm({
      title: emptyTitle,
      message: "先按 + 加几个生词，再来测验。",
      onYes: () => {},
    });
    return;
  }

  state.quiz = {
    title,
    words: shuffle(pool).slice(0, 10),
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
  };

  el.homeView.classList.add("is-hidden");
  el.quizView.classList.remove("is-hidden");
  el.openAddModal.classList.add("is-hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const quiz = state.quiz;
  const current = quiz.words[quiz.index];
  el.quizTitle.textContent = quiz.title;
  el.quizProgress.textContent = `${quiz.index + 1} / ${quiz.words.length}`;
  el.quizScore.textContent = `score ${quiz.score}`;
  el.questionMeaning.textContent = current.meaning;
  el.answerInput.value = "";
  el.answerInput.disabled = false;
  el.feedback.className = "feedback";
  el.feedback.textContent = "输入答案后按 CHECK。";
  el.checkAnswer.disabled = false;
  el.nextQuestion.disabled = true;
  setTimeout(() => el.answerInput.focus(), 0);
}

function checkAnswer() {
  if (!state.quiz || state.quiz.answered) return;
  const current = state.quiz.words[state.quiz.index];
  const typed = el.answerInput.value.trim();
  const correct = acceptedAnswers(current).includes(normalizeAnswer(typed));

  state.quiz.answered = true;
  el.answerInput.disabled = true;
  el.checkAnswer.disabled = true;
  el.nextQuestion.disabled = false;

  if (correct) {
    state.quiz.score += 1;
    el.feedback.className = "feedback correct";
    el.feedback.textContent = `correct: ${current.italian}`;
  } else {
    state.quiz.mistakes.push({ ...current, typed: typed || "空白" });
    el.feedback.className = "feedback wrong";
    el.feedback.textContent = `wrong. answer: ${current.italian}`;
  }

  el.quizScore.textContent = `score ${state.quiz.score}`;
}

function nextQuestion() {
  if (!state.quiz) return;

  if (state.quiz.complete) {
    restartQuiz();
    return;
  }

  if (state.quiz.index >= state.quiz.words.length - 1) {
    renderQuizResult();
    return;
  }

  state.quiz.index += 1;
  state.quiz.answered = false;
  renderQuizQuestion();
}

function renderQuizResult() {
  const quiz = state.quiz;
  recordQuizCompletion(quiz);
  quiz.complete = true;
  const mistakes = quiz.mistakes.map((word) => `${escapeHtml(word.meaning)} → ${escapeHtml(word.italian)}`).join("<br>");
  el.quizCard.innerHTML = `
    <p>final score</p>
    <strong>${quiz.score} / ${quiz.words.length}</strong>
    <small>${mistakes || "all clear. dreamy."}</small>
  `;
  el.feedback.className = "feedback";
  el.feedback.textContent = "测验结束，可以 BACK 回首页，也可以 NEXT 再测一次。";
  el.checkAnswer.disabled = true;
  el.nextQuestion.disabled = false;
  el.nextQuestion.textContent = "AGAIN";
  showBrunoMessage(quiz.score === quiz.words.length);
}

function recordQuizCompletion(quiz) {
  if (quiz.logged) return;
  quiz.logged = true;
  state.archive.studyLog.push({
    id: uid(),
    date: localDateKey(),
    completedAt: new Date().toISOString(),
    title: quiz.title,
    score: quiz.score,
    total: quiz.words.length,
    wordIds: quiz.words.map((word) => word.id),
  });
  saveArchive();
  renderRitualStats();
}

function showBrunoMessage(isPerfect) {
  el.brunoMessage.textContent = isPerfect
    ? "Bravissima, Annina. Ora sei dieci parole più vicina a me. 💋"
    : "Passo dopo passo, ci arriviamo❤️";
  el.brunoImage.src = isPerfect ? "assets/bruno-message-solo.png" : "assets/bruno-message-team.png";
  el.brunoImage.alt = isPerfect ? "Bruno pixel art" : "Three character pixel art";
  el.brunoModal.showModal();
}

function restartQuiz() {
  const quiz = state.quiz;
  state.quiz = {
    title: quiz.title,
    words: shuffle(quiz.words),
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
    complete: false,
  };
  el.quizCard.innerHTML = `<p>华语意思</p><strong id="questionMeaning"></strong>`;
  el.questionMeaning = document.querySelector("#questionMeaning");
  el.nextQuestion.textContent = "NEXT";
  renderQuizQuestion();
}

function backHome() {
  state.quiz = null;
  el.quizCard.innerHTML = `<p>华语意思</p><strong id="questionMeaning"></strong>`;
  el.questionMeaning = document.querySelector("#questionMeaning");
  el.nextQuestion.textContent = "NEXT";
  el.quizView.classList.add("is-hidden");
  el.homeView.classList.remove("is-hidden");
  el.openAddModal.classList.remove("is-hidden");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function iconSvg(name) {
  const icons = {
    edit: `<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path>`,
    move: `<path d="M3 6h7l2 3h9v9H3V6Z"></path>`,
    trash: `<path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M6 7l1 14h10l1-14"></path><path d="M9 7V4h6v3"></path>`,
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}

el.openAddModal.addEventListener("click", openWordModal);
el.closeWordModal.addEventListener("click", closeWordModal);
el.categoryInput.addEventListener("input", updateSubcategoryOptions);
el.singleMode.addEventListener("click", () => setAddMode("single"));
el.batchMode.addEventListener("click", () => setAddMode("batch"));
el.wordForm.addEventListener("submit", addWords);
el.closeManageModal.addEventListener("click", () => el.manageModal.close());
el.confirmNo.addEventListener("click", () => el.confirmModal.close());
el.confirmYes.addEventListener("click", () => {
  const action = state.confirmAction;
  state.confirmAction = null;
  el.confirmModal.close();
  if (action) action();
});
el.closeBrunoModal.addEventListener("click", () => el.brunoModal.close());
el.openSettings.addEventListener("click", () => el.settingsModal.showModal());
el.closeSettings.addEventListener("click", () => el.settingsModal.close());
el.backupApp.addEventListener("click", backupApp);
el.restoreApp.addEventListener("click", () => el.restoreFile.click());
el.restoreFile.addEventListener("change", () => restoreAppFromFile(el.restoreFile.files[0]));
el.calendarGrid.addEventListener("touchstart", (event) => {
  state.calendarTouchStartX = event.touches[0]?.clientX ?? null;
}, { passive: true });
el.calendarGrid.addEventListener("touchend", (event) => {
  if (state.calendarTouchStartX === null) return;
  const endX = event.changedTouches[0]?.clientX ?? state.calendarTouchStartX;
  const deltaX = endX - state.calendarTouchStartX;
  state.calendarTouchStartX = null;
  if (Math.abs(deltaX) < 48) return;
  shiftCalendarMonth(deltaX < 0 ? 1 : -1);
}, { passive: true });
el.backHome.addEventListener("click", backHome);
el.checkAnswer.addEventListener("click", checkAnswer);
el.nextQuestion.addEventListener("click", nextQuestion);
el.answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (state.quiz?.answered) {
      nextQuestion();
    } else {
      checkAnswer();
    }
  }
});

render();
