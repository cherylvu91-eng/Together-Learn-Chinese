// ============ DATA ============
let VOCAB = [];
let DIALOGUES = [];

fetch("data/vocab.json")
  .then((res) => res.json())
  .then((data) => {
    VOCAB = data;
    renderList();
    setupFlashcards();
  })
  .catch((err) => {
    console.error("Khong tai duoc data/vocab.json:", err);
    document.getElementById("cardGrid").innerHTML =
      "<p>Khong tai duoc du lieu tu vung.</p>";
  });

fetch("data/dialogues.json")
  .then((res) => res.json())
  .then((data) => {
    DIALOGUES = data;
    renderDialogues();
  })
  .catch((err) => {
    console.error("Khong tai duoc data/dialogues.json:", err);
    const el = document.getElementById("dialogueList");
    if (el) el.innerHTML = "<p>Khong tai duoc du lieu cau dam thoai.</p>";
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

// ============ TAB 1: DANH SACH / TIM KIEM / LOC ============
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
  resultCount.textContent = "Tim thay " + filtered.length + " tu";
  cardGrid.innerHTML = filtered
    .map(function (w) {
      return (
        '<div class="vocab-card" data-hanzi="' + w.hanzi + '">' +
        (w.hsk ? '<span class="hsk-badge">HSK ' + w.hsk + '</span>' : "") +
        '<div class="hanzi">' + w.hanzi + '</div>' +
        '<div class="pinyin">' + (w.pinyin || "") + '</div>' +
        '<div class="nghia">' + (w.nghia || "") + '</div>' +
        '</div>'
      );
    })
    .join("");

  document.querySelectorAll(".vocab-card").forEach((card) => {
    card.addEventListener("click", () => {
      const hanzi = card.dataset.hanzi;
      openVocabModal(hanzi);
    });
  });
}

function findVocabByHanzi(hanzi) {
  return VOCAB.find((w) => w.hanzi === hanzi);
}

function playAudio(fileName) {
  const player = document.getElementById("audioPlayer");
  player.src = "assets/audio/" + fileName;
  player.play().catch(() => {
    alert("Khong phat duoc audio: " + fileName);
  });
}

searchInput.addEventListener("input", renderList);
hskFilter.addEventListener("change", renderList);

// ============ MODAL CHI TIET TU VUNG (TAB 1) ============
const vocabModal = document.getElementById("vocabModal");
const modalHanzi = document.getElementById("modalHanzi");
const modalPinyin = document.getElementById("modalPinyin");
const modalHanviet = document.getElementById("modalHanviet");
const modalNghia = document.getElementById("modalNghia");
const modalViduBlock = document.getElementById("modalViduBlock");
const modalVidu = document.getElementById("modalVidu");
const modalAudioBtn = document.getElementById("modalAudioBtn");
const modalClose = document.getElementById("modalClose");
const modalWriterBtn = document.getElementById("modalWriterBtn");
const modalWriterTarget = document.getElementById("modalWriterTarget");

function openVocabModal(hanzi) {
  const w = findVocabByHanzi(hanzi);
  if (!w) return;

  modalHanzi.textContent = w.hanzi;
  modalPinyin.textContent = w.pinyin || "";
  modalHanviet.textContent = w.hanviet ? w.hanviet.toUpperCase() : "";
  modalHanviet.style.display = w.hanviet ? "block" : "none";
  modalNghia.textContent = w.nghia || "";

  if (w.vidu) {
    modalViduBlock.style.display = "block";
    modalVidu.textContent = w.vidu;
  } else {
    modalViduBlock.style.display = "none";
  }

  if (w.audio) {
    modalAudioBtn.style.display = "inline-block";
    modalAudioBtn.dataset.audio = w.audio;
  } else {
    modalAudioBtn.style.display = "none";
  }

  modalWriterTarget.innerHTML = "";
  vocabModal.classList.add("active");
}

function closeVocabModal() {
  vocabModal.classList.remove("active");
  modalWriterTarget.innerHTML = "";
}

modalClose.addEventListener("click", closeVocabModal);

vocabModal.addEventListener("click", (e) => {
  if (e.target === vocabModal) closeVocabModal();
});

modalAudioBtn.addEventListener("click", () => {
  const file = modalAudioBtn.dataset.audio;
  if (file) playAudio(file);
});

modalWriterBtn.addEventListener("click", () => {
  drawHanzi(modalHanzi.textContent, modalWriterTarget);
});

// ============ TAB 2: FLASHCARD ============
let flashList = [];
let flashIndex = 0;
let flashShowingBack = false;

const flashHskFilter = document.getElementById("flashHskFilter");
const flashcardEl = document.getElementById("flashcard");
const flashProgress = document.getElementById("flashProgress");
const flashLevelScreen = document.getElementById("flashLevelScreen");
const flashStudyScreen = document.getElementById("flashStudyScreen");

function setupFlashcards() {
  buildFlashList();
}

function buildFlashList() {
  const level = flashHskFilter.value;
  flashList =
    level === "all" ? VOCAB.slice() : VOCAB.filter((w) => String(w.hsk) === level);
  flashIndex = 0;
  flashShowingBack = false;
}

function renderFlashcard() {
  if (flashList.length === 0) {
    flashcardEl.innerHTML = "<p>Khong co tu nao o cap do nay.</p>";
    flashProgress.textContent = "";
    return;
  }
  const w = flashList[flashIndex];
  flashProgress.textContent = "The " + (flashIndex + 1) + " / " + flashList.length;

  if (!flashShowingBack) {
    flashcardEl.innerHTML = '<div class="flashcard-face flashcard-front"><div class="flash-hanzi">' + w.hanzi + '</div></div>';
  } else {
    flashcardEl.innerHTML =
      '<div class="flashcard-face flash-back">' +
      '<div class="flash-hanzi">' + w.hanzi + '</div>' +
      '<div class="flash-pinyin">' + (w.pinyin || "") + '</div>' +
      '<div class="flash-meaning">' + (w.nghia || "") + '</div>' +
      '</div>';
  }
}

document.getElementById("flashFlip") && document.getElementById("flashFlip").addEventListener("click", () => {
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

document.getElementById("flashShuffle").addEventListener("click", () => {
  if (flashList.length === 0) return;
  flashList = shuffle(flashList);
  flashIndex = 0;
  flashShowingBack = false;
  renderFlashcard();
});

document.getElementById("flashChangeLevel").addEventListener("click", () => {
  flashStudyScreen.style.display = "none";
  flashLevelScreen.style.display = "block";
});

flashHskFilter.addEventListener("change", () => {
  buildFlashList();
  renderFlashcard();
});

flashLevelScreen.querySelectorAll(".level-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    flashHskFilter.value = btn.dataset.level;
    buildFlashList();
    flashLevelScreen.style.display = "none";
    flashStudyScreen.style.display = "block";
    renderFlashcard();
  });
});

// ============ TAB 3: TRAC NGHIEM ============
const quizHskFilter = document.getElementById("quizHskFilter");
const quizArea = document.getElementById("quizArea");
const quizScoreEl = document.getElementById("quizScore");
const quizLevelScreen = document.getElementById("quizLevelScreen");
const quizStudyScreen = document.getElementById("quizStudyScreen");
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function buildQuiz() {
  const level = quizHskFilter.value;
  const pool = level === "all" ? VOCAB : VOCAB.filter((w) => String(w.hsk) === level);

  if (pool.length < 4) {
    quizArea.innerHTML = "<p>Can it nhat 4 tu o cap do nay.</p>";
    quizScoreEl.textContent = "";
    return;
  }

  quizQuestions = shuffle(pool)
    .slice(0, Math.min(10, pool.length))
    .map((correct) => {
      const wrongPool = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3);
      const options = shuffle([correct].concat(wrongPool));
      return { correct: correct, options: options };
    });

  quizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizQuestions.length) {
    quizArea.innerHTML = '<p style="text-align:center;">Hoan thanh!</p>';
    quizScoreEl.textContent = "Ket qua: " + quizScore + " / " + quizQuestions.length;
    return;
  }

  const q = quizQuestions[quizIndex];
  quizScoreEl.textContent = "Cau " + (quizIndex + 1) + " / " + quizQuestions.length + " - Diem: " + quizScore;

  quizArea.innerHTML =
    '<div class="quiz-question">' +
    '<div class="hanzi">' + q.correct.hanzi + '</div>' +
    '<div class="pinyin">' + (q.correct.pinyin || "") + '</div>' +
    '</div>' +
    '<div class="quiz-options">' +
    q.options.map((opt) => '<button class="quiz-option" data-id="' + opt.id + '">' + opt.nghia + '</button>').join("") +
    '</div>';

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

document.getElementById("quizChangeLevel").addEventListener("click", () => {
  quizStudyScreen.style.display = "none";
  quizLevelScreen.style.display = "block";
});

quizLevelScreen.querySelectorAll(".level-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizHskFilter.value = btn.dataset.level;
    quizLevelScreen.style.display = "none";
    quizStudyScreen.style.display = "block";
    buildQuiz();
  });
});

// ============ TAB 4: HANZI WRITER (XEM NET CHU) ============
const writerInput = document.getElementById("writerInput");
const writerTarget = document.getElementById("writerTarget");

function openWriterTab(hanzi) {
  tabButtons.forEach((b) => b.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="writer"]').classList.add("active");
  document.getElementById("tab-writer").classList.add("active");
  writerInput.value = hanzi;
  drawHanzi(hanzi, writerTarget);
}

function drawHanzi(hanzi, targetEl) {
  const container = targetEl || writerTarget;
  container.innerHTML = "";
  if (!hanzi) return;
  const firstChar = hanzi.trim()[0];
  if (!firstChar) return;

  const el = document.createElement("div");
  el.id = "hanzi-writer-target-" + Date.now();
  container.appendChild(el);

  try {
    HanziWriter.create(el.id, firstChar, {
      width: 220,
      height: 220,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 300
    }).animateCharacter();
  } catch (e) {
    container.innerHTML = "<p>Khong tim thay du lieu net chu cho ky tu nay.</p>";
  }
}

document.getElementById("writerBtn").addEventListener("click", () => {
  drawHanzi(writerInput.value, writerTarget);
});

writerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") drawHanzi(writerInput.value, writerTarget);
});

// ============ TAB 5: CAU DAM THOAI ============
const dialogueSearchInput = document.getElementById("dialogueSearchInput");
const dialogueHskFilter = document.getElementById("dialogueHskFilter");
const dialogueList = document.getElementById("dialogueList");
const dialogueResultCount = document.getElementById("dialogueResultCount");

function filterDialogues() {
  const keyword = normalize(dialogueSearchInput.value);
  const level = dialogueHskFilter.value;

  return DIALOGUES.filter((d) => {
    const matchLevel = level === "all" || String(d.hsk) === level;
    const matchKeyword =
      !keyword ||
      normalize(d.hanzi).includes(keyword) ||
      normalize(d.pinyin).includes(keyword) ||
      normalize(d.nghia).includes(keyword);
    return matchLevel && matchKeyword;
  });
}

function renderDialogues() {
  if (!dialogueList) return;
  const filtered = filterDialogues();
  dialogueResultCount.textContent = "Tim thay " + filtered.length + " cau";
  dialogueList.innerHTML = filtered
    .map(function (d) {
      return (
        '<div class="dialogue-card">' +
        (d.hsk ? '<span class="hsk-badge">HSK ' + d.hsk + '</span>' : "") +
        '<div class="d-hanzi">' + d.hanzi + '</div>' +
        '<div class="d-pinyin">' + (d.pinyin || "") + '</div>' +
        '<div class="d-nghia">' + (d.nghia || "") + '</div>' +
        (d.related_word ? '<div class="d-related">Tu vung lien quan: ' + d.related_word + '</div>' : "") +
        (d.audio ? '<button class="audio-btn" data-audio="' + d.audio + '">Phat am</button>' : "") +
        '</div>'
      );
    })
    .join("");

  dialogueList.querySelectorAll(".audio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playAudio(btn.dataset.audio);
    });
  });
}

if (dialogueSearchInput) dialogueSearchInput.addEventListener("input", renderDialogues);
if (dialogueHskFilter) dialogueHskFilter.addEventListener("change", renderDialogues);
