/**
 * GAME 3: SPECIAL NUMBERS ANGLER — RETRO ARCADE FISHING ENGINE
 * Cambridge Year 4 Special Numbers (Square, Triangular, Cubes)
 * StuCent Sandboxed Runtime Compatible
 */

(() => {
  'use strict';

  const doc = typeof root !== 'undefined' ? root : document;
  const gameCtx = typeof game !== 'undefined' ? game : (window.game || null);

  const safeStorage = {
    getItem(key) {
      try { return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem(key) : null; } catch (e) { return null; }
    },
    setItem(key, val) {
      try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, val); } catch (e) {}
    }
  };

  function getEl(id) {
    try {
      if (doc && typeof doc.getElementById === 'function') {
        const el = doc.getElementById(id);
        if (el) return el;
      }
      if (doc && typeof doc.querySelector === 'function') {
        const el = doc.querySelector('#' + id);
        if (el) return el;
      }
    } catch (e) {}
    try {
      if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
        return document.getElementById(id);
      }
    } catch (e) {}
    return null;
  }

  function queryAll(sel) {
    try {
      if (doc && typeof doc.querySelectorAll === 'function') {
        const res = doc.querySelectorAll(sel);
        if (res && res.length > 0) return res;
      }
    } catch (e) {}
    try {
      if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
        return document.querySelectorAll(sel);
      }
    } catch (e) {}
    return [];
  }

  // 1. TROPICAL SOUND & PROCEDURAL OCEAN BGM SYNTHESIZER
  // ==========================================================================
  let audioCtx = null;
  let isMuted = safeStorage.getItem('math_games_sound') === 'false';
  let bgmMasterGain = null;
  let bgmInterval = null;
  let bgmStep = 0;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        bgmMasterGain = audioCtx.createGain();
        bgmMasterGain.gain.setValueAtTime(isMuted ? 0 : 0.05, audioCtx.currentTime);
        bgmMasterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startOceanBGM() {
    initAudio();
    if (!audioCtx || bgmInterval) return;

    // Upbeat Island Calypso Melody (108 BPM)
    const bassline = [
      196, 0, 293.6, 0,  246.9, 0, 293.6, 0,
      220, 0, 293.6, 0,  196, 0, 246.9, 0,
      196, 0, 293.6, 0,  329.6, 0, 293.6, 0,
      220, 0, 246.9, 0,  196, 0, 293.6, 0
    ];

    const leadPluck = [
      392, 0, 493.88, 0, 587.33, 0, 493.88, 0,
      440, 0, 587.33, 0, 392, 0, 493.88, 0,
      392, 0, 587.33, 0, 659.25, 0, 587.33, 0,
      440, 0, 493.88, 0, 392, 0, 0, 0
    ];

    const stepDuration = (60 / 108) / 4;
    bgmStep = 0;

    bgmInterval = setInterval(() => {
      if (isMuted || !audioCtx || !isPlaying || isGameOver) return;
      const t = audioCtx.currentTime;
      const idx = bgmStep % 32;

      // Bass note
      const bFreq = bassline[idx];
      if (bFreq > 0) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bFreq, t);
          gain.gain.setValueAtTime(0.065, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.6);
        } catch (e) {}
      }

      // Marimba/Ukulele lead tone
      const lFreq = leadPluck[idx];
      if (lFreq > 0) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(lFreq, t);
          gain.gain.setValueAtTime(0.038, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.4);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.5);
        } catch (e) {}
      }

      bgmStep++;
    }, stepDuration * 1000);
  }

  function stopOceanBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function beep(freq, durationMs, type = 'sine', vol = 0.15, delaySec = 0) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const t = audioCtx.currentTime + delaySec;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + durationMs / 1000);
    } catch (e) {}
  }

  function playSplashSound() {
    beep(480, 80, 'sine', 0.22);
    beep(720, 110, 'sine', 0.16, 0.04);
  }

  function playHookDropSound() {
    beep(600, 70, 'triangle', 0.12);
  }

  function playEscapeSound() {
    beep(180, 260, 'sawtooth', 0.25);
    beep(130, 260, 'square', 0.2, 0.08);
    triggerScreenShake(12, 16);
  }

  function playCatchVictorySound(comboMult = 1) {
    const base = 523.25 + comboMult * 45;
    [base, base * 1.25, base * 1.5, base * 2].forEach((f, i) => {
      beep(f, 160, 'sine', 0.18, i * 0.07);
    });
    triggerScreenShake(6, 12);
  }

  let screenShakeIntensity = 0;

  function triggerScreenShake(intensity = 10, frames = 15) {
    screenShakeIntensity = intensity;
  }

  // ==========================================================================
  // 2. CAMBRIDGE YEAR 4 SPECIAL NUMBERS DATA (10 EXPEDITION ROUNDS)
  // ==========================================================================
  const FISHING_ROUNDS = [
    {
      roundNum: 1,
      badge: 'REEF 01 • SQUARE NUMBERS (1-5)',
      title: 'CATCH SQUARE NUMBERS (n × n)',
      tip: 'Square numbers: 1 (1×1), 4 (2×2), 9 (3×3), 16 (4×4), 25 (5×5)',
      quota: 3,
      fishSpeed: 1.0,
      test: (n) => [1, 4, 9, 16, 25].includes(n),
      explain: (n) => `${n} is not a square number. (1²=1, 2²=4, 3²=9, 4²=16, 5²=25).`,
      pool: [1, 4, 9, 16, 25],
      distractors: [2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 18, 20, 24]
    },
    {
      roundNum: 2,
      badge: 'REEF 02 • MID SQUARE NUMBERS (6-10)',
      title: 'CATCH SQUARE NUMBERS (6² to 10²)',
      tip: '36 (6×6), 49 (7×7), 64 (8×8), 81 (9×9), 100 (10×10)',
      quota: 3,
      fishSpeed: 1.15,
      test: (n) => [36, 49, 64, 81, 100].includes(n),
      explain: (n) => `${n} is not in the squares: 6²=36, 7²=49, 8²=64, 9²=81, 10²=100.`,
      pool: [36, 49, 64, 81, 100],
      distractors: [30, 35, 42, 48, 54, 60, 70, 72, 80, 90, 99]
    },
    {
      roundNum: 3,
      badge: 'REEF 03 • TRIANGULAR NUMBERS',
      title: 'CATCH A TRIANGULAR NUMBER! (1, 3, 6, 10, 15)',
      tip: 'Formed by adding consecutive numbers: 1, 1+2=3, 1+2+3=6, 1+2+3+4=10, 1+2+3+4+5=15',
      quota: 3,
      fishSpeed: 1.2,
      test: (n) => [1, 3, 6, 10, 15].includes(n),
      explain: (n) => `${n} is not a triangular number. (Triangular: 1, 3, 6, 10, 15, 21...).`,
      pool: [1, 3, 6, 10, 15],
      distractors: [2, 4, 5, 7, 8, 9, 11, 12, 13, 14, 16]
    },
    {
      roundNum: 4,
      badge: 'REEF 04 • MID TRIANGULAR NUMBERS',
      title: 'CATCH A TRIANGULAR NUMBER! (21, 28, 36, 45, 55)',
      tip: 'Continuing the pattern: 15+6=21, 21+7=28, 28+8=36, 36+9=45, 45+10=55',
      quota: 3,
      fishSpeed: 1.25,
      test: (n) => [21, 28, 36, 45, 55].includes(n),
      explain: (n) => `${n} is not triangular. (Next triangular numbers are 21, 28, 36, 45, 55).`,
      pool: [21, 28, 36, 45, 55],
      distractors: [20, 24, 26, 30, 32, 35, 40, 44, 50, 54]
    },
    {
      roundNum: 5,
      badge: 'REEF 05 • SQUARE & TRIANGULAR',
      title: 'CATCH A NUMBER THAT IS BOTH SQUARE AND TRIANGULAR!',
      tip: 'Special numbers on BOTH lists: 1 and 36 (6×6 = 36, and 1+2+...+8 = 36!)',
      quota: 2,
      fishSpeed: 1.3,
      test: (n) => [1, 36].includes(n),
      explain: (n) => `${n} is not BOTH square and triangular. Only 1 and 36 qualify in this range!`,
      pool: [1, 36],
      distractors: [4, 9, 10, 15, 16, 21, 25, 28, 45, 49]
    },
    {
      roundNum: 6,
      badge: 'REEF 06 • CUBE NUMBERS',
      title: 'CATCH A CUBE NUMBER! (n × n × n)',
      tip: '1 (1³), 8 (2×2×2), 27 (3×3×3), 64 (4×4×4)',
      quota: 3,
      fishSpeed: 1.35,
      test: (n) => [1, 8, 27, 64].includes(n),
      explain: (n) => `${n} is not a cube number. (1³=1, 2³=8, 3³=27, 4³=64).`,
      pool: [1, 8, 27, 64],
      distractors: [4, 9, 12, 16, 18, 24, 32, 36, 48, 50, 60]
    },
    {
      roundNum: 7,
      badge: 'REEF 07 • SQUARE VS DOUBLE',
      title: 'CATCH SQUARE NUMBERS (NOT DOUBLES)!',
      tip: 'Don\'t confuse 4² = 16 with 4 × 2 = 8!',
      quota: 4,
      fishSpeed: 1.4,
      test: (n) => [4, 9, 16, 25, 36, 49, 64].includes(n),
      explain: (n) => `${n} is a double or simple even number, not a square product (n × n).`,
      pool: [4, 9, 16, 25, 36, 49, 64],
      distractors: [6, 8, 10, 12, 14, 18, 20, 22, 26, 30]
    },
    {
      roundNum: 8,
      badge: 'REEF 08 • LARGE SQUARES',
      title: 'CATCH LARGE SQUARE NUMBERS (81, 100, 121, 144)',
      tip: '9²=81, 10²=100, 11²=121, 12²=144',
      quota: 3,
      fishSpeed: 1.45,
      test: (n) => [81, 100, 121, 144].includes(n),
      explain: (n) => `${n} is not in the large square table: 9²=81, 10²=100, 11²=121, 12²=144.`,
      pool: [81, 100, 121, 144],
      distractors: [75, 80, 90, 110, 115, 120, 130, 140, 150]
    },
    {
      roundNum: 9,
      badge: 'REEF 09 • MIXED SPECIAL NUMBERS',
      title: 'CATCH SQUARE OR CUBE NUMBERS!',
      tip: 'Any number that is a Square OR Cube (n² or n³)',
      quota: 4,
      fishSpeed: 1.5,
      test: (n) => [1, 4, 8, 9, 16, 25, 27, 36, 49, 64, 81, 100].includes(n),
      explain: (n) => `${n} is not a square (n²) or cube (n³) number.`,
      pool: [4, 8, 9, 16, 25, 27, 36, 49, 64, 81],
      distractors: [10, 12, 14, 15, 18, 20, 22, 26, 28, 30, 35]
    },
    {
      roundNum: 10,
      badge: 'REEF 10 • MASTER ANGLER FINALE',
      title: 'CATCH ANY SPECIAL NUMBER!',
      tip: 'Catch squares, cubes, or triangular numbers!',
      quota: 5,
      fishSpeed: 1.6,
      test: (n) => [1, 3, 4, 6, 8, 9, 10, 15, 16, 21, 25, 27, 28, 36, 45, 49, 55, 64].includes(n),
      explain: (n) => `${n} is a standard composite number that is not square, triangular, or cube.`,
      pool: [3, 4, 6, 8, 9, 10, 15, 16, 21, 25, 27, 28, 36, 45, 49, 55, 64],
      distractors: [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
    }
  ];

  // ==========================================================================
  // 3. GAME STATE & ANGLER VARIABLES
  // ==========================================================================
  let currentRoundIdx = 0;
  let score = 0;
  let lives = 3;
  let combo = 1;
  let bestCombo = 1;
  let totalCaught = 0;
  let totalAttempts = 0;
  let roundCaughtCount = 0;
  let timeRemaining = 75;
  let gameTimerInterval = null;
  let gameStartTime = 0;
  let isPlaying = false;
  let isGameOver = false;

  const boat = {
    x: 400,
    y: 85,
    width: 90,
    height: 36,
    targetX: 400,
    speed: 7
  };

  const hook = {
    x: 400,
    y: 110,
    lineLength: 0,
    isDropping: false,
    isReeling: false,
    caughtFish: null,
    dropSpeed: 8,
    reelSpeed: 10
  };

  let fishes = [];
  let bubbles = [];
  let particles = [];
  let floatingTexts = [];

  let canvas = null;
  let ctx = null;
  let animationFrameId = null;

  const FISH_SPECIES = [
    { body: '#f59e0b', fins: '#d97706' },
    { body: '#ec4899', fins: '#be185d' },
    { body: '#06b6d4', fins: '#0891b2' },
    { body: '#a855f7', fins: '#7e22ce' },
    { body: '#10b981', fins: '#047857' }
  ];

  // ==========================================================================
  // 4. SCREEN & HUD MANAGEMENT
  // ==========================================================================
  function setScreen(screenId) {
    const screens = ['start-screen', 'countdown-screen', 'instructions-modal', 'game-over-screen'];
    screens.forEach(id => {
      const el = getEl(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
          el.classList.add('active');
        } else {
          el.classList.add('hidden');
          el.classList.remove('active');
        }
      }
    });
  }

  function updateHUD() {
    const scoreEl = getEl('score-display');
    const timerEl = getEl('timer-display');
    const roundEl = getEl('round-display');
    const comboEl = getEl('combo-display');
    const quotaEl = getEl('round-quota');

    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (timerEl) timerEl.textContent = String(Math.max(0, timeRemaining)).padStart(3, '0');
    if (roundEl) roundEl.textContent = `${String(currentRoundIdx + 1).padStart(2, '0')} / 10`;
    if (comboEl) comboEl.textContent = `${combo}x`;

    const rData = FISHING_ROUNDS[currentRoundIdx];
    if (quotaEl && rData) {
      quotaEl.textContent = `TARGET: ${roundCaughtCount} / ${rData.quota}`;
    }

    const heartsContainer = getEl('lives-container');
    if (heartsContainer) {
      let heartsHtml = '';
      for (let i = 0; i < 3; i++) {
        const isFull = i < lives;
        heartsHtml += `<span class="arcade-heart ${isFull ? 'heart-full' : 'heart-empty'}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>`;
      }
      heartsContainer.innerHTML = heartsHtml;
    }
  }

  function updateMissionBanner() {
    const rData = FISHING_ROUNDS[currentRoundIdx];
    if (!rData) return;

    const badgeEl = getEl('question-badge');
    const promptEl = getEl('question-prompt');
    const tipEl = getEl('question-tip');

    if (badgeEl) badgeEl.textContent = rData.badge;
    if (promptEl) promptEl.textContent = rData.title;
    if (tipEl) tipEl.textContent = rData.tip;

    updateHUD();
  }

  function showHint(text) {
    const hintBanner = getEl('hint-banner');
    const hintText = getEl('hint-text');
    if (hintBanner && hintText) {
      hintText.textContent = text;
      hintBanner.classList.remove('hidden');
      setTimeout(() => {
        hintBanner.classList.add('hidden');
      }, 3800);
    }
  }

  // ==========================================================================
  // 5. FISH SPAWNING & REEF LOGIC
  // ==========================================================================
  function spawnFish() {
    const rData = FISHING_ROUNDS[currentRoundIdx];
    if (!rData) return;

    const isTarget = Math.random() < 0.55;
    const pool = isTarget ? rData.pool : rData.distractors;
    const number = pool[Math.floor(Math.random() * pool.length)];

    const direction = Math.random() < 0.5 ? 1 : -1;
    const startX = direction === 1 ? -60 : canvas.width + 60;
    const depthY = 170 + Math.random() * (canvas.height - 230);

    const species = FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)];

    fishes.push({
      x: startX,
      y: depthY,
      width: 64,
      height: 38,
      number: number,
      isTarget: isTarget,
      direction: direction,
      speed: (1.2 + Math.random() * 0.9) * rData.fishSpeed * direction,
      species: species,
      tailWiggle: Math.random() * Math.PI * 2,
      isHooked: false
    });
  }

  function castHook() {
    if (!isPlaying || isGameOver || hook.isDropping || hook.isReeling) return;

    hook.isDropping = true;
    hook.caughtFish = null;
    playHookDropSound();
  }

  // ==========================================================================
  // 6. CATCH EVALUATION
  // ==========================================================================
  function evaluateCatch(fish) {
    totalAttempts++;
    const rData = FISHING_ROUNDS[currentRoundIdx];

    if (fish.isTarget) {
      // CORRECT CATCH!
      playSplashSound();
      totalCaught++;
      roundCaughtCount++;

      const pts = 55 * combo;
      score += pts;
      combo = Math.min(8, combo + 1);
      if (combo > bestCombo) bestCombo = combo;

      floatingTexts.push({
        x: boat.x,
        y: boat.y - 30,
        text: `+${pts} PTS! PERFECT CATCH!`,
        color: '#fbbf24',
        alpha: 1,
        life: 45
      });

      for (let i = 0; i < 20; i++) {
        particles.push({
          x: boat.x,
          y: 110,
          vx: (Math.random() - 0.5) * 6,
          vy: -2 - Math.random() * 5,
          radius: 3 + Math.random() * 4,
          color: '#38bdf8',
          alpha: 1,
          life: 30
        });
      }

      if (roundCaughtCount >= rData.quota) {
        if (currentRoundIdx + 1 < FISHING_ROUNDS.length) {
          currentRoundIdx++;
          roundCaughtCount = 0;
          playCatchVictorySound();
          floatingTexts.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            text: `REEF ${currentRoundIdx} EXPLORED!`,
            color: '#10b981',
            alpha: 1,
            life: 60
          });
          updateMissionBanner();
        } else {
          endGame(true);
        }
      } else {
        updateHUD();
      }

    } else {
      // WRONG FISH CAUGHT
      playEscapeSound();
      lives--;
      combo = 1;

      floatingTexts.push({
        x: boat.x,
        y: boat.y - 30,
        text: `NOT A SPECIAL NUMBER! -1 LIFE`,
        color: '#ef4444',
        alpha: 1,
        life: 50
      });

      showHint(rData.explain(fish.number));
      updateHUD();

      if (lives <= 0) {
        endGame(false);
      }
    }
  }

  // ==========================================================================
  // 7. RENDER & UPDATE LOOP
  // ==========================================================================
  function update() {
    if (!isPlaying || isGameOver) return;

    const dx = boat.targetX - boat.x;
    boat.x += dx * 0.18;
    boat.x = Math.max(boat.width / 2 + 10, Math.min(canvas.width - boat.width / 2 - 10, boat.x));
    hook.x = boat.x + 35;

    // Hook Drop / Reel
    if (hook.isDropping) {
      hook.y += hook.dropSpeed;
      if (hook.y >= canvas.height - 40) {
        hook.isDropping = false;
        hook.isReeling = true;
      }

      for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        if (!f.isHooked && Math.hypot(hook.x - f.x, hook.y - f.y) < 28) {
          f.isHooked = true;
          hook.caughtFish = f;
          hook.isDropping = false;
          hook.isReeling = true;
          break;
        }
      }
    } else if (hook.isReeling) {
      hook.y -= hook.reelSpeed;
      if (hook.caughtFish) {
        hook.caughtFish.x = hook.x;
        hook.caughtFish.y = hook.y + 16;
      }

      if (hook.y <= 110) {
        hook.y = 110;
        hook.isReeling = false;
        if (hook.caughtFish) {
          evaluateCatch(hook.caughtFish);
          const fIdx = fishes.indexOf(hook.caughtFish);
          if (fIdx !== -1) fishes.splice(fIdx, 1);
          hook.caughtFish = null;
        }
      }
    } else {
      hook.y = 110;
    }

    if (fishes.length < 6 && Math.random() < 0.035) {
      spawnFish();
    }

    // Update Fishes
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      if (!f.isHooked) {
        f.x += f.speed;
        f.tailWiggle += 0.15;

        if ((f.direction === 1 && f.x > canvas.width + 70) || (f.direction === -1 && f.x < -70)) {
          fishes.splice(i, 1);
        }
      }
    }

    // Sea Bubbles
    if (Math.random() < 0.08) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        radius: 2 + Math.random() * 4,
        speedY: 1 + Math.random() * 2,
        alpha: 0.7
      });
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.speedY;
      b.alpha -= 0.003;
      if (b.y < 120 || b.alpha <= 0) {
        bubbles.splice(i, 1);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.alpha -= 0.03;
      p.life--;
      if (p.life <= 0 || p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1;
      ft.alpha -= 0.02;
      ft.life--;
      if (ft.life <= 0 || ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    if (screenShakeIntensity > 0.1) {
      screenShakeIntensity *= 0.88;
    } else {
      screenShakeIntensity = 0;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * screenShakeIntensity;
      const sy = (Math.random() - 0.5) * screenShakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. Sky Surface Zone
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 115);
    skyGrad.addColorStop(0, '#091326');
    skyGrad.addColorStop(1, '#0f244a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 115);

    // Stars / Constellations in night sky
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 67 + 23) % canvas.width);
      const sy = ((i * 31 + 11) % 80);
      ctx.fillRect(sx, sy, 2, 2);
    }

    // 2. Deep Luminous Arcade Reef Water Gradient
    const waterGrad = ctx.createLinearGradient(0, 115, 0, canvas.height);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(0.35, '#0369a1');
    waterGrad.addColorStop(0.8, '#0f172a');
    waterGrad.addColorStop(1, '#020617');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 115, canvas.width, canvas.height - 115);

    // Light Shafts breaking through water
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    for (let i = 0; i < 4; i++) {
      const sx = canvas.width * 0.2 + i * 200;
      ctx.beginPath();
      ctx.moveTo(sx, 115);
      ctx.lineTo(sx + 80, 115);
      ctx.lineTo(sx + 140, canvas.height);
      ctx.lineTo(sx - 20, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    // Sea Surface Wave Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 30) {
      const wy = 115 + Math.sin(x * 0.05 + Date.now() * 0.003) * 3;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Sea Floor Sandy Reef
    ctx.fillStyle = '#0f1d38';
    ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
    ctx.fillStyle = '#1e3a6a';
    ctx.fillRect(0, canvas.height - 24, canvas.width, 3);

    // Glowing Neon Coral Silhouette
    for (let i = 40; i < canvas.width; i += 110) {
      ctx.fillStyle = (i % 220 === 0) ? '#ec4899' : '#10b981';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(i, canvas.height - 20, 16, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 3. Render Bubbles
    bubbles.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 4. Render Swimming Fishes
    fishes.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      if (f.direction === -1) ctx.scale(-1, 1);

      // Tail
      const tailWiggle = Math.sin(f.tailWiggle) * 6;
      ctx.fillStyle = f.species.fins;
      ctx.beginPath();
      ctx.moveTo(-f.width / 2, 0);
      ctx.lineTo(-f.width / 2 - 16, -14 + tailWiggle);
      ctx.lineTo(-f.width / 2 - 16, 14 + tailWiggle);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = f.species.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.width / 2, f.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = f.species.fins;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(18, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Number Tag
      ctx.save();
      if (f.direction === -1) ctx.scale(-1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 19px 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(f.number, 0, 1);
      ctx.restore();

      ctx.restore();
    });

    // 5. Render Line & Hook
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boat.x + 35, 75);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();

    // Hook
    ctx.save();
    ctx.translate(hook.x, hook.y);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.arc(-5, 12, 5, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // 6. Render Boat & Angler
    ctx.save();
    ctx.translate(boat.x, boat.y);

    // Boat Hull
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-boat.width / 2, 0);
    ctx.lineTo(boat.width / 2, 0);
    ctx.lineTo(boat.width / 2 - 12, boat.height);
    ctx.lineTo(-boat.width / 2 + 12, boat.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Angler Character
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-10, -18, 20, 20);

    ctx.beginPath();
    ctx.arc(0, -28, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa';
    ctx.fill();

    // Sou'wester Hat
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-16, -34, 32, 6);
    ctx.beginPath();
    ctx.arc(0, -34, 10, Math.PI, 0);
    ctx.fill();

    // Fishing Rod
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(5, -15);
    ctx.lineTo(35, -15);
    ctx.stroke();

    ctx.restore();

    // 7. Render Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. Render Floating Texts
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = "900 20px 'Fredoka', cursive, sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function gameLoop() {
    update();
    render();
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // ==========================================================================
  // 8. START & END GAME
  // ==========================================================================
  function startGame() {
    currentRoundIdx = 0;
    score = 0;
    lives = 3;
    combo = 1;
    bestCombo = 1;
    totalCaught = 0;
    totalAttempts = 0;
    roundCaughtCount = 0;
    timeRemaining = 75;
    fishes = [];
    bubbles = [];
    particles = [];
    floatingTexts = [];
    isPlaying = true;
    isGameOver = false;
    gameStartTime = Date.now();

    hook.isDropping = false;
    hook.isReeling = false;
    hook.caughtFish = null;
    hook.y = 110;

    setScreen(null);
    updateMissionBanner();
    startOceanBGM();

    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      if (!isPlaying || isGameOver) return;
      timeRemaining--;
      updateHUD();
      if (timeRemaining <= 0) {
        endGame(totalCaught >= 6);
      }
    }, 1000);

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function startCountdown() {
    initAudio();
    setScreen('countdown-screen');
    let count = 3;
    const numEl = getEl('countdown-number');
    if (numEl) numEl.textContent = count;
    beep(440, 100, 'sine', 0.15);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (numEl) numEl.textContent = count;
        beep(440, 100, 'sine', 0.15);
      } else {
        clearInterval(interval);
        beep(880, 250, 'sine', 0.2);
        startGame();
      }
    }, 750);
  }

  function endGame(isVictory) {
    isPlaying = false;
    isGameOver = true;
    stopOceanBGM();
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const totalTimeTaken = Math.round((Date.now() - gameStartTime) / 1000);
    const accuracy = totalAttempts > 0 ? Math.round((totalCaught / totalAttempts) * 100) : 100;

    let stars = 1;
    if (score >= 460 && lives >= 2) stars = 3;
    else if (score >= 250) stars = 2;

    safeStorage.setItem('math_fishing_stars', stars);

    if (isVictory) {
      playCatchVictorySound();
    } else {
      playEscapeSound();
    }

    const badgeEl = getEl('game-over-badge');
    const titleEl = getEl('game-over-title');
    const scoreEl = getEl('final-score');
    const roundsEl = getEl('final-rounds');
    const accuracyEl = getEl('final-accuracy');
    const comboEl = getEl('final-combo');
    const timeEl = getEl('final-time');
    const starsContainer = getEl('stars-container');

    if (badgeEl) badgeEl.textContent = isVictory ? 'MASTER ANGLER!' : 'REEF EXPEDITION FINISHED';
    if (titleEl) titleEl.textContent = isVictory ? 'LEGENDARY CATCH!' : 'GOOD EFFORT!';
    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (roundsEl) roundsEl.textContent = `${Math.min(10, currentRoundIdx + (isVictory ? 1 : 0))} / 10`;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    if (comboEl) comboEl.textContent = `${bestCombo}x`;
    if (timeEl) timeEl.textContent = `${totalTimeTaken}s`;

    if (starsContainer) {
      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        const active = s <= stars ? 'star-active' : '';
        starsHtml += `<span class="arcade-star ${active}"><svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></span>`;
      }
      starsContainer.innerHTML = starsHtml;
    }

    setScreen('game-over-screen');

    // StuCent Reporting Contract
    if (gameCtx && typeof gameCtx.end === 'function') {
      const targetMax = (gameCtx.config && gameCtx.config.maxPoints) || 100;
      const normalizedScore = Math.min(targetMax, Math.round((score / 800) * targetMax));
      gameCtx.end({
        score: normalizedScore,
        maxScore: targetMax,
        timeTaken: totalTimeTaken,
        success: isVictory || normalizedScore >= 50
      });
    }
  }

  // ==========================================================================
  // 9. CONTROLS & RESIZING
  // ==========================================================================
  function resizeCanvas() {
    if (!canvas) {
      canvas = getEl('game-canvas');
      if (canvas) ctx = canvas.getContext('2d');
    }
    const container = getEl('canvas-viewport');
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || (window.innerHeight - 180);

    boat.x = canvas.width / 2;
    boat.targetX = boat.x;
  }

  function setupControls() {
    window.addEventListener('resize', resizeCanvas);

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (!isPlaying || isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        boat.targetX -= 40;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        boat.targetX += 40;
      } else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        castHook();
      }
    });

    // Touch Buttons
    const btnLeft = getEl('btn-left');
    const btnRight = getEl('btn-right');
    const btnCast = getEl('btn-cast');

    let moveInterval = null;

    if (btnLeft) {
      btnLeft.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        boat.targetX -= 35;
        moveInterval = setInterval(() => { boat.targetX -= 35; }, 100);
      });
      btnLeft.addEventListener('pointerup', () => clearInterval(moveInterval));
      btnLeft.addEventListener('pointercancel', () => clearInterval(moveInterval));
    }

    if (btnRight) {
      btnRight.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        boat.targetX += 35;
        moveInterval = setInterval(() => { boat.targetX += 35; }, 100);
      });
      btnRight.addEventListener('pointerup', () => clearInterval(moveInterval));
      btnRight.addEventListener('pointercancel', () => clearInterval(moveInterval));
    }

    if (btnCast) {
      btnCast.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        castHook();
      });
    }

    // Canvas Pointer Aim / Cast
    if (canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        if (!isPlaying || isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        boat.targetX = clientX;
        castHook();
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!isPlaying || isGameOver) return;
        if (e.buttons > 0) {
          const rect = canvas.getBoundingClientRect();
          boat.targetX = e.clientX - rect.left;
        }
      });
    }

    // Modal Buttons
    const startBtn = getEl('start-game-btn');
    const howToBtn = getEl('how-to-play-btn');
    const hudRulesBtn = getEl('hud-how-to-play-btn');
    const closeInstBtn = getEl('close-instructions-btn');
    const startFromInstBtn = getEl('start-from-instructions-btn');
    const playAgainBtn = getEl('play-again-btn');
    const soundBtn = getEl('sound-toggle-btn');

    if (startBtn) startBtn.addEventListener('click', startCountdown);
    if (howToBtn) howToBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (hudRulesBtn) hudRulesBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (closeInstBtn) closeInstBtn.addEventListener('click', () => setScreen('start-screen'));
    if (startFromInstBtn) startFromInstBtn.addEventListener('click', startCountdown);
    if (playAgainBtn) playAgainBtn.addEventListener('click', startCountdown);

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        safeStorage.setItem('math_games_sound', isMuted ? 'false' : 'true');
        if (isMuted) {
          stopOceanBGM();
        } else if (isPlaying && !isGameOver) {
          startOceanBGM();
        }
      });
    }
  }

  // ==========================================================================
  // 10. STUCENT INIT & BOOTSTRAP
  // ==========================================================================
  window.game = window.game || {};
  window.game.init = function (config) {
    window.game.config = config || {};
  };

  function init() {
    canvas = getEl('game-canvas');
    if (canvas) ctx = canvas.getContext('2d');
    resizeCanvas();
    setupControls();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
