/* =========================================================
   HARI GURU — script
   ---------------------------------------------------------
   KUSTOMISASI CEPAT:
   Ubah nama di dalam CONFIG di bawah, simpan, lalu buka
   index.html di browser. Nama akan otomatis muncul di
   judul, surat, dan footer.
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    namaDia: "Sayang",     // ganti dengan nama dia
    namaKamu: "aku",       // ganti dengan nama kamu
    tanggal: "25 November" // Hari Guru Nasional
  };

  /* ---------- teks dinamis ---------- */
  document.querySelectorAll("[data-dia]").forEach((el) => {
    el.textContent = CONFIG.namaDia;
  });
  document.querySelectorAll("[data-sender]").forEach((el) => {
    el.textContent = CONFIG.namaKamu;
  });
  document.querySelectorAll("[data-tanggal]").forEach((el) => {
    el.textContent = CONFIG.tanggal;
  });
  document.title = `Selamat Hari Guru, ${CONFIG.namaDia} 💌`;

  /* ---------- referensi elemen ---------- */
  const body = document.body;
  const gate = document.getElementById("gate");
  const envelopeBtn = document.getElementById("openLetter");
  const mainEl = document.getElementById("main");
  const footerEl = document.querySelector(".footer");
  const musicBtn = document.getElementById("musicToggle");
  const toastEl = document.getElementById("toast");
  const heartRainLayer = document.getElementById("heartRain");
  const hugCountEl = document.getElementById("hugCount");
  const garden = document.getElementById("garden");
  const flowerCountEl = document.getElementById("flowerCount");
  const resetGardenBtn = document.getElementById("resetGarden");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     LATAR: hati-hati kecil yang melayang
     ========================================================= */
  const floatersLayer = document.getElementById("floaters");
  const floaterSymbols = ["💗", "✨", "🌸", "🌼", "💛", "💕"];

  for (let i = 0; i < 14; i += 1) {
    const floater = document.createElement("span");
    floater.className = "floater";
    floater.textContent = floaterSymbols[i % floaterSymbols.length];
    floater.style.left = `${Math.random() * 96}%`;
    floater.style.top = `${Math.random() * 100}%`;
    floater.style.fontSize = `${12 + Math.random() * 14}px`;
    floater.style.opacity = (0.18 + Math.random() * 0.24).toFixed(2);
    floater.style.setProperty("--dur", `${10 + Math.random() * 10}s`);
    floater.style.setProperty("--delay", `${-Math.random() * 12}s`);
    floater.style.setProperty("--rot", `${Math.random() * 30 - 15}deg`);
    floatersLayer.appendChild(floater);
  }

  /* =========================================================
     AMPLOP PEMBUKA
     ========================================================= */
  let gateOpened = false;

  /* Saat amplop masih tertutup, konten di belakangnya tidak
     perlu bisa di-fokus (aksesibilitas keyboard). */
  if (gate && musicBtn && mainEl && footerEl) {
    musicBtn.setAttribute("inert", "");
    mainEl.setAttribute("inert", "");
    footerEl.setAttribute("inert", "");
  }

  function openGate() {
    if (gateOpened || !gate || !envelopeBtn) return;
    gateOpened = true;

    setMusic(true);
    envelopeBtn.classList.add("is-open");

    const r = envelopeBtn.getBoundingClientRect();
    burst(
      r.left + r.width / 2,
      r.top + r.height / 2,
      22,
      ["💗", "💖", "💕", "✨", "🌸"]
    );

    const revealDelay = reduceMotion ? 200 : 950;

    window.setTimeout(() => {
      gate.classList.add("is-open");
      body.classList.remove("gate-open");
      body.classList.add("ready");

      [musicBtn, mainEl, footerEl].forEach((el) => {
        if (el) el.removeAttribute("inert");
      });

      burst(window.innerWidth / 2, window.innerHeight * 0.42, 14, ["💗", "✨", "🌸"]);
      mainEl.focus({ preventScroll: true });

      window.setTimeout(() => {
        gate.remove();
      }, 900);
    }, revealDelay);
  }

  if (envelopeBtn) {
    envelopeBtn.addEventListener("click", openGate);
  }

  /* =========================================================
     REVEAL SAAT DI-SCROLL
     ========================================================= */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* =========================================================
     MUSIK LATAR (dibuat dengan Web Audio, tanpa file mp3)
     ========================================================= */
  const NOTE_SEMITONES = {
    C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
    "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11
  };

  const MELODY = [
    ["E5", 1], ["G5", 1], ["A5", 1], ["G5", 1],
    ["E5", 1], ["D5", 1], ["C5", 2],
    ["D5", 1], ["E5", 1], ["G5", 1], ["E5", 1],
    ["D5", 2], ["C5", 1], [null, 1],
    ["E5", 1], ["G5", 1], ["A5", 1], ["C6", 1],
    ["A5", 1], ["G5", 1], ["E5", 2],
    ["D5", 1], ["E5", 1], ["G5", 1], ["A5", 1],
    ["G5", 2], ["E5", 1], [null, 1]
  ];

  const TEMPO = 70;
  const BEAT = 60 / TEMPO;

  let audioCtx = null;
  let masterGain = null;
  let echoNode = null;
  let musicTimer = null;
  let nextNoteTime = 0;
  let noteIndex = 0;
  let musicOn = false;

  function noteToFrequency(note) {
    const match = /^([A-G]#?)(\d)$/.exec(note);
    if (!match) return 0;
    const midi = NOTE_SEMITONES[match[1]] + (Number(match[2]) + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function setupAudio() {
    if (audioCtx) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    try {
      audioCtx = new AudioCtor();

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.0001;
      masterGain.connect(audioCtx.destination);

      echoNode = audioCtx.createDelay(1);
      echoNode.delayTime.value = 0.33;

      const feedback = audioCtx.createGain();
      feedback.gain.value = 0.25;

      const wet = audioCtx.createGain();
      wet.gain.value = 0.24;

      echoNode.connect(feedback);
      feedback.connect(echoNode);
      echoNode.connect(wet);
      wet.connect(masterGain);
    } catch (error) {
      audioCtx = null;
      masterGain = null;
      echoNode = null;
    }
  }

  function playNote(note, when, beats) {
    if (!audioCtx || !masterGain) return;

    const freq = noteToFrequency(note);
    if (!freq) return;

    const duration = Math.max(0.5, beats * BEAT);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.16, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration * 1.9);

    osc.connect(gain);
    gain.connect(masterGain);
    if (echoNode) gain.connect(echoNode);

    osc.start(when);
    osc.stop(when + duration * 2 + 0.1);

    /* kilau nada satu oktaf di atasnya, sangat pelan */
    const shimmer = audioCtx.createOscillator();
    const shimmerGain = audioCtx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2;

    shimmerGain.gain.setValueAtTime(0.0001, when);
    shimmerGain.gain.exponentialRampToValueAtTime(0.03, when + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(when);
    shimmer.stop(when + 0.7);
  }

  function scheduleMusic() {
    if (!audioCtx || !musicOn) return;

    if (nextNoteTime < audioCtx.currentTime) {
      nextNoteTime = audioCtx.currentTime + 0.05;
    }

    const horizon = audioCtx.currentTime + 0.35;

    while (nextNoteTime < horizon) {
      const [note, beats] = MELODY[noteIndex];
      if (note) {
        playNote(note, Math.max(nextNoteTime, audioCtx.currentTime + 0.02), beats);
      }
      nextNoteTime += beats * BEAT;
      noteIndex = (noteIndex + 1) % MELODY.length;
    }
  }

  function updateMusicUI() {
    if (!musicBtn) return;
    musicBtn.setAttribute("aria-pressed", String(musicOn));
    musicBtn.setAttribute("aria-label", musicOn ? "Matikan musik latar" : "Nyalakan musik latar");
    const icon = musicBtn.querySelector(".music-ico");
    if (icon) icon.textContent = musicOn ? "🎶" : "🎵";
  }

  function setMusic(on) {
    setupAudio();
    musicOn = on;
    updateMusicUI();

    if (!audioCtx || !masterGain) return;

    if (on) {
      audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.exponentialRampToValueAtTime(0.62, now + 0.6);

      if (!musicTimer) {
        nextNoteTime = now + 0.15;
        noteIndex = 0;
        musicTimer = window.setInterval(scheduleMusic, 80);
        scheduleMusic();
      }
    } else {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.1);
      if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    }
  }

  if (musicBtn) {
    musicBtn.addEventListener("click", () => setMusic(!musicOn));
  }

  /* nada kecil saat menanam bunga (kalau musik menyala) */
  function plink() {
    if (!audioCtx || !musicOn || audioCtx.state !== "running") return;
    const notes = ["C5", "D5", "E5", "G5", "A5", "C6"];
    const note = notes[Math.floor(Math.random() * notes.length)];
    playNote(note, audioCtx.currentTime + 0.02, 0.55);
  }

  /* =========================================================
     EFEK HATI
     ========================================================= */
  function burst(x, y, count = 16, emojis = ["💗", "💖", "💕", "✨", "🌸"]) {
    for (let i = 0; i < count; i += 1) {
      const heart = document.createElement("span");
      heart.className = "burst-heart";
      heart.setAttribute("aria-hidden", "true");
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.fontSize = `${14 + Math.random() * 14}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 150;

      heart.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      heart.style.setProperty("--ty", `${Math.sin(angle) * distance - 35}px`);
      heart.style.setProperty("--rot", `${Math.random() * 260 - 130}deg`);
      heart.style.setProperty("--sc", (0.7 + Math.random() * 0.9).toFixed(2));

      body.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  }

  function heartRain(total = 32) {
    if (!heartRainLayer) return;
    const symbols = ["💗", "💕", "🤍", "✨", "🌸"];

    for (let i = 0; i < total; i += 1) {
      const heart = document.createElement("span");
      heart.className = "rain-heart";
      heart.setAttribute("aria-hidden", "true");
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.style.left = `${Math.random() * 100}vw`;
      heart.style.fontSize = `${16 + Math.random() * 16}px`;
      heart.style.setProperty("--dur", `${3 + Math.random() * 2.8}s`);
      heart.style.setProperty("--delay", `${Math.random() * 0.9}s`);
      heart.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
      heart.style.setProperty("--rot", `${Math.random() * 360 - 180}deg`);

      heartRainLayer.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  }

  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("show");
    }, 3000);
  }

  /* =========================================================
     PELUKAN
     ========================================================= */
  const HUG_KEY = "hariGuruHugsV2";
  let hugCount = 0;

  /* hapus hitungan versi lama supaya mulai dari 0 lagi */
  try {
    window.localStorage.removeItem("hariGuruHugs");
  } catch (error) {
    /* abaikan kalau localStorage diblokir */
  }

  try {
    const stored = Number(window.localStorage.getItem(HUG_KEY));
    if (Number.isFinite(stored) && stored > 0) hugCount = stored;
  } catch (error) {
    hugCount = 0;
  }

  function renderHugCount(pop) {
    if (!hugCountEl) return;
    hugCountEl.textContent = String(hugCount);
    if (pop) {
      hugCountEl.classList.remove("pop");
      void hugCountEl.offsetWidth;
      hugCountEl.classList.add("pop");
    }
  }

  renderHugCount(false);

  function giveHug(button, withRain) {
    hugCount += 1;

    try {
      window.localStorage.setItem(HUG_KEY, String(hugCount));
    } catch (error) {
      /* localStorage bisa diblokir di beberapa browser; abaikan */
    }

    renderHugCount(true);

    const rect = button.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 22, [
      "💗", "💖", "💕", "🤗", "✨"
    ]);

    if (withRain) heartRain(34);

    const messages = [
      `Pelukan ke-${hugCount} sudah terkirim! 💗`,
      "Pelukan hangat untuk guru TK terbaik 💞",
      "Satu pelukan lagi… jangan lupa istirahat ya 🌙",
      "Kamu hebat, Bu Guru. Aku bangga banget 🤍",
      `Pelukan ke-${hugCount} mendarat tepat di hati 💌`
    ];

    showToast(messages[Math.floor(Math.random() * messages.length)]);
  }

  document.querySelectorAll("[data-hug]").forEach((button) => {
    button.addEventListener("click", () => {
      giveHug(button, button.dataset.hug === "rain");
    });
  });

  /* =========================================================
     TAMAN BUNGA INTERAKTIF
     ========================================================= */
  let flowerCount = 0;
  let gardenSeeded = false;

  const FLOWER_COLORS = [
    "#F58EA6", "#F6B26B", "#E3A4D8", "#F4D06F", "#F29BB9",
    "#B9A6E8", "#F28B82", "#FFB3C7", "#8FD3B6"
  ];

  function flowerMarkup(petalColor) {
    const angles = [0, 60, 120, 180, 240, 300];
    const petals = angles
      .map(
        (angle) =>
          `<ellipse cx="40" cy="23" rx="9.5" ry="14" fill="${petalColor}" transform="rotate(${angle} 40 40)"/>`
      )
      .join("");

    return `
      <svg viewBox="0 0 80 150" aria-hidden="true">
        <path d="M40 149 C 34 120 46 96 40 62" stroke="#6FAE85" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M40 122 C 28 120 22 112 22 104 C 33 104 40 110 40 122 Z" fill="#8DC7A2"/>
        <path d="M41 104 C 53 102 59 94 59 86 C 48 86 41 92 41 104 Z" fill="#7FBE96"/>
        ${petals}
        <circle cx="40" cy="40" r="11" fill="#FFE0A0" stroke="#F0BF66" stroke-width="1.5"/>
        <circle cx="36.5" cy="38" r="1.4" fill="#8A5A36"/>
        <circle cx="43.5" cy="38" r="1.4" fill="#8A5A36"/>
        <path d="M36.5 43 Q40 46 43.5 43" stroke="#B07B45" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }

  function pickColor() {
    return FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
  }

  function updateFlowerCount() {
    if (!flowerCountEl) return;
    flowerCountEl.textContent = String(flowerCount);
    if (typeof flowerCountEl.animate === "function") {
      flowerCountEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35)" },
          { transform: "scale(1)" }
        ],
        { duration: 320, easing: "ease-out" }
      );
    }
  }

  function plantFlower(left, bottom, height, color, delay = 0) {
    if (!garden) return;

    const flower = document.createElement("div");
    flower.className = "flower";
    flower.style.left = `${left}px`;
    flower.style.bottom = `${bottom}px`;
    flower.style.setProperty("--h", `${height}px`);
    flower.style.setProperty("--sway", `${(3.2 + Math.random() * 2.2).toFixed(2)}s`);
    flower.style.setProperty("--grow-delay", `${delay}s`);
    flower.innerHTML = flowerMarkup(color);

    garden.appendChild(flower);
    flowerCount += 1;
    updateFlowerCount();
  }

  function seedGarden() {
    if (gardenSeeded || !garden) return;
    gardenSeeded = true;

    const width = garden.clientWidth;
    const initialFlowers = [
      { x: 0.1, bottom: 72, height: 116, color: "#F58EA6" },
      { x: 0.24, bottom: 36, height: 96, color: "#F4D06F" },
      { x: 0.57, bottom: 52, height: 88, color: "#FFB3C7" },
      { x: 0.76, bottom: 86, height: 124, color: "#B9A6E8" },
      { x: 0.9, bottom: 32, height: 90, color: "#8FD3B6" }
    ];

    initialFlowers.forEach((item, index) => {
      const left = Math.max(30, Math.min(width * item.x, width - 30));
      const height = Math.min(item.height, garden.clientHeight - item.bottom - 18);
      plantFlower(left, item.bottom, height, item.color, 0.2 + index * 0.11);
    });
  }

  if (garden) {
    garden.addEventListener("click", (event) => {
      if (flowerCount >= 60) {
        showToast("Tamannya sudah penuh bunga cantik 🌷");
        return;
      }

      const rect = garden.getBoundingClientRect();
      const height = 76 + Math.random() * 58;
      const rawBottom = rect.height - (event.clientY - rect.top) - 6;
      const maxBottom = Math.max(20, rect.height - height - 20);
      const bottom = Math.max(14, Math.min(rawBottom, maxBottom));
      const left = Math.max(28, Math.min(event.clientX - rect.left, rect.width - 28));

      plantFlower(left, bottom, height, pickColor());
      plink();

      if (!reduceMotion) {
        burst(event.clientX, event.clientY, 6, ["✨", "✦", "🌼"]);
      }
    });

    garden.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();

      if (flowerCount >= 60) {
        showToast("Tamannya sudah penuh bunga cantik 🌷");
        return;
      }

      const rect = garden.getBoundingClientRect();
      const height = 90 + Math.random() * 40;
      const bottom = 20 + Math.random() * 70;
      const left = rect.width * (0.25 + Math.random() * 0.5);

      plantFlower(left, bottom, height, pickColor());
      plink();

      if (!reduceMotion) {
        burst(rect.left + left, rect.top + rect.height - bottom - height * 0.6, 6, ["✨", "🌷", "💛"]);
      }
    });

    if ("IntersectionObserver" in window) {
      const gardenObserver = new IntersectionObserver(
        (entries, observer) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            seedGarden();
            observer.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      gardenObserver.observe(garden);
    } else {
      seedGarden();
    }
  }

  if (resetGardenBtn && garden) {
    resetGardenBtn.addEventListener("click", () => {
      garden.querySelectorAll(".flower").forEach((flower) => flower.remove());
      flowerCount = 0;
      updateFlowerCount();
      showToast("Taman siap ditanami lagi 🌱");
    });
  }
})();
