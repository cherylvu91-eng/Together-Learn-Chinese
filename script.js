// ============ DATA ============
let VOCAB = [];

fetch("data/vocab.json")
  .then((res) => res.json())
  .then((data) => {
    VOCAB = data;
    renderList();
    setupFlashcards();
  })
  .catch((err) => {
    console.error("Không tải được data/vocab.json:", err);
    document.getElementById("cardGrid").innerHTML =
      "<p>Không tải được dữ liệu từ vựng. Kiểm tra lại file data/vocab.json.</p>";
  });

// ============ TAB SWITCHING ============
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ============ TAB 1: DANH SÁCH / TÌM KIẾM / LỌC ============
const searchInput = document.getElementById("searchInput");
const hskFilter = document.getElementById("hskFilter");
const cardGrid = document.getElementById("cardGrid");
const resultCount = document.getElementById("resultCount");

function normalize(str) {
  return (str || "").toString().toLowerCase();
}

function filterVocab() {
  const keyword = normalize(searchInput.value);
  const level = hskFilter.value;

  return VOCAB.filter((w) => {
    const matchLevel = level === "all" || String(w.hsk) === level;
    const matchKeyword =
      !keyword ||
      normalize(w.hanzi).includes(keyword) ||
      normalize(w.pinyin).includes(keyword) ||
      normalize(w.nghia).includes(keyword);
    return matchLevel && matchKeyword;
  });
}

function renderList() {
  const filtered = filterVocab();
  resultCount.textContent = `Tìm thấy ${filtered.length} từ`;
  cardGrid.innerHTML = filtered
    .map(
      (w) => `
    <div class="vocab-card" data-hanzi="${w.hanzi}">
      ${w.hsk ? `<span class="hsk-badge">HSK ${w.hsk}</span>` : ""}
      <div class="hanzi">${w.hanzi}</div>
      <div class="pinyin">${w.pinyin || ""}</div>
      ${w.hanviet ? `<div class="hanviet">${w.hanviet}</div>` : ""}
      <div class="nghia">${w.nghia || ""}</div>
      ${w.loai_tu ? `<span class="loai">${w.loai_tu}</span>` : ""}
      ${w.vidu ? `<div class="vidu">${w.vidu}</div>` : ""}
      ${w.audio ? `<button class="audio-btn" data-audio="${w.audio}">🔊 Phát âm</button>` : ""}
    </div>
  `
    )
    .join("");

  // Click vào thẻ -> mở tab Xem nét chữ với chữ đầu tiên
  document.querySelectorAll(".vocab-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("audio-btn")) return;
      const hanzi = card.dataset.hanzi;
      openWriterTab(hanzi);
    });
  });

  // Nút phát âm
  document.querySelectorAll(".audio-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const file = btn.dataset.audio;
      playAudio(file);
    });
  });
}

function playAudio(fileName) {
  const player = document.getElementById("audioPlayer");
  player.src = "assets/audio/" + fileName;
  player.play().catch(() => {
    alert("Không phát được audio. Kiểm tra lại file trong assets/audio/" + fileName);
  });
}

searchInput.addEventListener("input", renderList);
hskFilter.addEventListener("change", renderList);

// ============ TAB 2: FLASHCARD ============
let flashList = [];
let flashIndex = 0;
let flashShowingBack = false;

const flashHskFilter = document.getElementById("flashHskFilter");
const flashcardEl = document.getElementById("flashcard");
const flashProgress = document.getElementById("flashProgress");

function setupFlashcards() {
  buildFlashList();
  renderFlashcard();
}

function buildFlashList() {
  const level = flashHskFilter.value;
  flashList =
    level === "all" ? [...VOCAB] : VOCAB.filter((w) => String(w.hsk) === level);
  flashIndex = 0;
  flashShowingBack = false;
}

function renderFlashcard() {
  if (flashList.length === 0) {
    flashcardEl.innerHTML = "<p>Không có từ nào ở cấp độ này.</p>";
    flashProgress.textContent = "";
    return;
  }
  const w = flashList[flashIndex];
  flashProgress.textContent = `${flashIndex + 1} / ${flashList.length}`;

  if (!flashShowingBack) {
    flashcardEl.innerHTML = `<div class="flashcard-face flashcard-front">
      <div class="flash-hanzi">${w.hanzi}</div>
    </div>`;
  } else {
    flashcardEl.innerHTML = `<div class="flashcard-face flash-back">
      <div class="flash-hanzi">${w.hanzi}</div>
      <div class="flash-pinyin">${w.pinyin || ""}</div>
      <div class="flash-meaning">${w.nghia || ""}</div>
    </div>`;
  }
}

document.getElementById("flashFlip").addEventListener("click", () => {
  flashShowingBack = !flashShowingBack;
  renderFlashcard();
});

flashcardEl.addEventListener("click", () => {
  flashShowingBack = !flashShowingBack;
  renderFlashcard();
});

document.getElementById("flashPrev").addEventListener("click", () => {
  if (flashList.length === 0) return;
  flashIndex = (flashIndex - 1 + flashList.length) % flashList.length;
  flashShowingBack = false;
  renderFlashcard();
});

document.getElementById("flashNext").addEventListener("click", () => {
  if (flashList.length === 0) return;
  flashIndex = (flashIndex + 1) % flashList.length;
  flashShowingBack = false;
  renderFlashcard();
});

flashHskFilter.addEventListener("change", () => {
  buildFlashList();
  renderFlashcard();
});

// ============ TAB 3: TRẮC NGHIỆM ============
const quizHskFilter = document.getElementById("quizHskFilter");
const quizArea = document.getElementById("quizArea");
const quizScoreEl = document.getElementById("quizScore");
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz() {
  const level = quizHskFilter.value;
  const pool = level === "all" ? VOCAB : VOCAB.filter((w) => String(w.hsk) === level);

  if (pool.length < 4) {
    quizArea.innerHTML = "<p>Cần ít nhất 4 từ ở cấp độ này để làm trắc nghiệm.</p>";
    quizScoreEl.textContent = "";
    return;
  }

  quizQuestions = shuffle(pool).slice(0, Math.min(10, pool.length)).map((correct) => {
    const wrongPool = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3);
    const options = shuffle([correct, ...wrongPool]);
    return { correct, options };
  });

  quizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizQuestions.length) {
    quizArea.innerHTML = `<p style="text-align:center;">Hoàn thành!</p>`;
    quizScoreEl.textContent = `Kết quả: ${quizScore} / ${quizQuestions.length}`;
    return;
  }

  const q = quizQuestions[quizIndex];
  quizScoreEl.textContent = `Câu ${quizIndex + 1} / ${quizQuestions.length} — Điểm: ${quizScore}`;

  quizArea.innerHTML = `
    <div class="quiz-question">
      <div class="hanzi">${q.correct.hanzi}</div>
      <div class="pinyin">${q.correct.pinyin || ""}</div>
    </div>
    <div class="quiz-options">
      ${q.options
        .map(
          (opt, i) =>
            `<button class="quiz-option" data-id="${opt.id}">${opt.nghia}</button>`
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosenId = Number(btn.dataset.id);
      const isCorrect = chosenId === q.correct.id;
      document.querySelectorAll(".quiz-option").forEach((b) => {
        b.disabled = true;
        if (Number(b.dataset.id) === q.correct.id) b.classList.add("correct");
        else if (b === btn) b.classList.add("wrong");
      });
      if (isCorrect) quizScore++;
      setTimeout(() => {
        quizIndex++;
        renderQuizQuestion();
      }, 700);
    });
  });
}

document.getElementById("quizStart").addEventListener("click", buildQuiz);

// ============ TAB 4: HANZI WRITER (XEM NÉT CHỮ) ============
const writerInput = document.getElementById("writerInput");
const writerTarget = document.getElementById("writerTarget");

function openWriterTab(hanzi) {
  tabButtons.forEach((b) => b.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="writer"]').classList.add("active");
  document.getElementById("tab-writer").classList.add("active");
  writerInput.value = hanzi;
  drawHanzi(hanzi);
}

function drawHanzi(hanzi) {
  writerTarget.innerHTML = "";
  if (!hanzi) return;
  const firstChar = hanzi.trim()[0];
  if (!firstChar) return;

  const el = document.createElement("div");
  el.id = "hanzi-writer-target";
  writerTarget.appendChild(el);

  try {
    HanziWriter.create("hanzi-writer-target", firstChar, {
      width: 220,
      height: 220,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 300,
    }).animateCharacter();
  } catch (e) {
    writerTarget.innerHTML = "<p>Không tìm thấy dữ liệu nét chữ cho ký tự này.</p>";
  }
}

document.getElementById("writerBtn").addEventListener("click", () => {
  drawHanzi(writerInput.value);
});

writerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") drawHanzi(writerInput.value);
});
