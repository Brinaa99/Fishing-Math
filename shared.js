/**
 * NUMBERLAND — SHARED GAME FEEL & FEEDBACK SYSTEM
 * Standard 3 Mathematics Arcade Collection
 * 
 * Reusable feedback, audio synthesis, particles, combos, and animations.
 * Framework-free, lightweight, high performance (60 FPS).
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. SOUND SYSTEM & PROCEDURAL WEB AUDIO SYNTHESIZER
  // ==========================================================================
  class NumberlandAudioSystem {
    constructor() {
      // Unify sound preference across all games
      const pref = localStorage.getItem('math_games_sound') ?? localStorage.getItem('math_runner_sound');
      this.enabled = pref !== 'false';
      this.ctx = null;
      this.audioCache = {};
      this.audioLoadStatus = {};
      
      // Known sound paths relative to project root / subfolder
      this.soundMap = {
        'correct': ['assets/sounds/correct.mp3', '../../assets/sounds/correct.mp3'],
        'wrong': ['assets/sounds/wrong.mp3', '../../assets/sounds/wrong.mp3'],
        'life-lost': ['assets/sounds/life-lost.mp3', '../../assets/sounds/life-lost.mp3'],
        'click': ['assets/sounds/click.mp3', '../../assets/sounds/click.mp3'],
        'combo': ['assets/sounds/combo.mp3', '../../assets/sounds/combo.mp3'],
        'gameover': ['assets/sounds/gameover.mp3', '../../assets/sounds/gameover.mp3'],
        'victory': ['assets/sounds/victory.mp3', '../../assets/sounds/victory.mp3']
      };
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    isSoundEnabled() {
      const pref = localStorage.getItem('math_games_sound') ?? localStorage.getItem('math_runner_sound');
      return pref !== 'false';
    }

    setSoundEnabled(enabled) {
      this.enabled = !!enabled;
      localStorage.setItem('math_games_sound', this.enabled ? 'true' : 'false');
      localStorage.setItem('math_runner_sound', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    toggleSound() {
      return this.setSoundEnabled(!this.isSoundEnabled());
    }

    play(soundName, pitchMultiplier = 1.0) {
      if (!this.isSoundEnabled()) return;

      // Try playing MP3 if available; fallback seamlessly to Web Audio synth
      const paths = this.soundMap[soundName] || [`assets/sounds/${soundName}.mp3`, `../../assets/sounds/${soundName}.mp3`];
      const audioKey = soundName;

      if (!this.audioCache[audioKey]) {
        // Attempt loading first valid path
        const audio = new Audio();
        let pathIdx = 0;
        audio.src = paths[pathIdx];
        audio.preload = 'auto';

        audio.addEventListener('canplaythrough', () => {
          this.audioLoadStatus[audioKey] = true;
        }, { once: true });

        audio.addEventListener('error', () => {
          pathIdx++;
          if (pathIdx < paths.length) {
            audio.src = paths[pathIdx];
          } else {
            this.audioLoadStatus[audioKey] = false;
          }
        });

        this.audioCache[audioKey] = audio;
      }

      const cachedAudio = this.audioCache[audioKey];
      if (this.audioLoadStatus[audioKey] && cachedAudio) {
        try {
          cachedAudio.currentTime = 0;
          if (pitchMultiplier !== 1.0 && cachedAudio.playbackRate !== undefined) {
            cachedAudio.playbackRate = Math.min(2.0, Math.max(0.5, pitchMultiplier));
          }
          const promise = cachedAudio.play();
          if (promise !== undefined) {
            promise.catch(() => {
              this.synthSound(soundName, pitchMultiplier);
            });
          }
          return;
        } catch (e) {
          this.synthSound(soundName, pitchMultiplier);
          return;
        }
      }

      // Default to instant procedural synth
      this.synthSound(soundName, pitchMultiplier);
    }

    playTone(freq, type = 'sine', duration = 0.12, volume = 0.1, startTime = null) {
      if (!this.isSoundEnabled()) return;
      this.initContext();
      if (!this.ctx) return;

      try {
        const start = startTime || this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      } catch (e) {}
    }

    synthSound(name, multiplier = 1.0) {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      switch (name) {
        case 'correct': {
          // Cheerful rising major arpeggio
          const notes = [523.25, 659.25, 783.99, 1046.50].map(f => f * multiplier);
          notes.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.16, 0.12, now + idx * 0.05);
          });
          break;
        }
        case 'wrong': {
          // Low buzzing wobble down
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
          } catch (e) {}
          break;
        }
        case 'life-lost': {
          // Heartbreak drop tone
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
          } catch (e) {}
          break;
        }
        case 'click': {
          this.playTone(600 * multiplier, 'sine', 0.06, 0.08, now);
          break;
        }
        case 'combo': {
          // High celebratory double tone
          const comboBase = 587.33 * multiplier;
          this.playTone(comboBase, 'triangle', 0.12, 0.14, now);
          this.playTone(comboBase * 1.5, 'sine', 0.18, 0.12, now + 0.08);
          break;
        }
        case 'chest-open': {
          // Creak + ascending triumphant golden chimes
          const chimes = [440, 554.37, 659.25, 880, 1108.73, 1318.51].map(f => f * multiplier);
          chimes.forEach((freq, idx) => {
            this.playTone(freq, 'sine', 0.22, 0.12, now + idx * 0.07);
          });
          break;
        }
        case 'star-reward': {
          // Bright sparkle bells
          const stars = [1046.50, 1318.51, 1567.98, 2093.00].map(f => f * multiplier);
          stars.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.2, 0.14, now + idx * 0.06);
          });
          break;
        }
        case 'level-up': {
          // Grand triumphant fanfare
          const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].map(f => f * multiplier);
          notes.forEach((freq, idx) => {
            this.playTone(freq, 'sawtooth', 0.26, 0.16, now + idx * 0.08);
          });
          break;
        }
        case 'gameover': {
          const notes = [392.00, 349.23, 311.13, 261.63];
          notes.forEach((freq, idx) => {
            this.playTone(freq, 'sawtooth', 0.22, 0.14, now + idx * 0.12);
          });
          break;
        }
        case 'victory': {
          const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
          fanfare.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.28, 0.15, now + idx * 0.08);
          });
          break;
        }
        default:
          this.playTone(440, 'sine', 0.1, 0.08, now);
      }
    }
  }

  const audio = new NumberlandAudioSystem();

  // ==========================================================================
  // 2. COMBO TRACKER
  // ==========================================================================
  let currentCombo = 0;
  let maxCombo = 0;

  function incrementCombo() {
    currentCombo++;
    if (currentCombo > maxCombo) maxCombo = currentCombo;
    return currentCombo;
  }

  function resetCombo() {
    currentCombo = 0;
    return currentCombo;
  }

  function getCombo() {
    return currentCombo;
  }

  // ==========================================================================
  // 3. DOM HELPER UTILITIES
  // ==========================================================================
  function getTargetContainer(targetEl) {
    if (targetEl instanceof HTMLElement) {
      return targetEl.closest('#game-container') || targetEl.closest('.game-container') || targetEl.parentElement || document.body;
    }
    return document.getElementById('game-container') || document.querySelector('.game-container') || document.body;
  }

  function getElementCenter(el, relativeTo) {
    if (!el || !(el instanceof HTMLElement)) return null;
    const elRect = el.getBoundingClientRect();
    const parentRect = (relativeTo || document.body).getBoundingClientRect();

    return {
      x: elRect.left - parentRect.left + elRect.width / 2,
      y: elRect.top - parentRect.top + elRect.height / 2
    };
  }

  // ==========================================================================
  // 4. SCREEN SHAKE & SCREEN FLASH
  // ==========================================================================
  function shakeScreen(containerEl, intensity = 'normal') {
    const target = containerEl || document.getElementById('game-container') || document.querySelector('.game-container') || document.body;
    if (!target) return;

    target.classList.remove('screen-shake');
    void target.offsetWidth;
    target.classList.add('screen-shake');

    setTimeout(() => {
      target.classList.remove('screen-shake');
    }, 450);
  }

  function flashScreen(type = 'green', containerEl) {
    const target = containerEl || document.getElementById('game-container') || document.querySelector('.game-container') || document.body;
    if (!target) return;

    const cls = type === 'green' ? 'screen-flash-green' : 'screen-flash-red';
    target.classList.remove('screen-flash-green', 'screen-flash-red');
    void target.offsetWidth;
    target.classList.add(cls);

    setTimeout(() => {
      target.classList.remove(cls);
    }, 380);
  }

  // ==========================================================================
  // 5. LIGHTWEIGHT PARTICLES (DOM-BASED, 60 FPS)
  // ==========================================================================
  function createParticles(x, y, options = {}) {
    const count = options.count || 12;
    const shapes = options.shapes || ['⭐', '✦', '●', '◆'];
    const colors = options.colors || ['#fbbf24', '#38bdf8', '#34d399', '#f472b6', '#a78bfa'];
    const container = options.container || document.getElementById('game-container') || document.body;

    let particleHost = container.querySelector('.particle-container');
    if (!particleHost) {
      particleHost = document.createElement('div');
      particleHost.className = 'particle-container';
      container.appendChild(particleHost);
    }

    const startX = typeof x === 'number' ? x : (container.clientWidth / 2);
    const startY = typeof y === 'number' ? y : (container.clientHeight / 2);

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const isShape = Math.random() > 0.4;
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const distance = 40 + Math.random() * 80;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - (15 + Math.random() * 25);
      const rot = (Math.random() * 360 - 180) + 'deg';
      const duration = (0.45 + Math.random() * 0.25).toFixed(2) + 's';
      const color = colors[Math.floor(Math.random() * colors.length)];

      p.className = 'particle';
      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.setProperty('--p-tx', `${tx}px`);
      p.style.setProperty('--p-ty', `${ty}px`);
      p.style.setProperty('--p-rot', rot);
      p.style.setProperty('--p-dur', duration);
      p.style.setProperty('--p-color', color);

      if (isShape) {
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        p.style.color = color;
      } else {
        const shapeType = Math.random() > 0.5 ? 'particle-dot' : 'particle-diamond';
        p.classList.add(shapeType);
      }

      particleHost.appendChild(p);

      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 700);
    }
  }

  // ==========================================================================
  // 6. SCORE POPUP
  // ==========================================================================
  function showScorePopup(amount = 100, targetEl = null, options = {}) {
    const container = options.container || getTargetContainer(targetEl);
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${amount}`;

    let posX = container.clientWidth / 2;
    let posY = container.clientHeight * 0.45;

    if (targetEl && targetEl instanceof HTMLElement) {
      const center = getElementCenter(targetEl, container);
      if (center) {
        posX = center.x;
        posY = center.y;
      }
    } else if (options.x !== undefined && options.y !== undefined) {
      posX = options.x;
      posY = options.y;
    }

    popup.style.left = `${posX}px`;
    popup.style.top = `${posY}px`;

    container.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 750);
  }

  // ==========================================================================
  // 7. SCORE ANIMATION (NUMBER INTERPOLATION)
  // ==========================================================================
  function animateScore(element, startVal, endVal, duration = 350) {
    if (!element) return;
    const start = parseInt(startVal, 10) || 0;
    const end = parseInt(endVal, 10) || 0;
    if (start === end) {
      element.textContent = end;
      return;
    }

    const startTime = performance.now();
    const diff = end - start;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + diff * easeProgress);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = end;
      }
    }

    requestAnimationFrame(step);
  }

  // ==========================================================================
  // 8. CORRECT ANSWER FEEDBACK
  // ==========================================================================
  function showCorrectFeedback(targetElOrOptions = null, options = {}) {
    let targetEl = null;
    let opts = options;

    if (targetElOrOptions instanceof HTMLElement) {
      targetEl = targetElOrOptions;
    } else if (targetElOrOptions && typeof targetElOrOptions === 'object') {
      opts = targetElOrOptions;
      targetEl = opts.targetEl || null;
    }

    const container = opts.container || getTargetContainer(targetEl);
    const points = opts.points || 100;
    const message = opts.message || 'CORRECT!';

    const comboCount = incrementCombo();
    const pitch = 1.0 + Math.min(comboCount - 1, 6) * 0.08;
    audio.play('correct', pitch);

    if (targetEl && targetEl.classList) {
      targetEl.classList.remove('feedback-bounce-success');
      void targetEl.offsetWidth;
      targetEl.classList.add('feedback-bounce-success');
      setTimeout(() => targetEl.classList.remove('feedback-bounce-success'), 400);
    }

    flashScreen('green', container);

    let posX = container.clientWidth / 2;
    let posY = container.clientHeight * 0.5;

    if (targetEl) {
      const center = getElementCenter(targetEl, container);
      if (center) {
        posX = center.x;
        posY = center.y;
      }
    } else if (opts.x !== undefined && opts.y !== undefined) {
      posX = opts.x;
      posY = opts.y;
    }

    createParticles(posX, posY, {
      container: container,
      count: 14,
      colors: ['#fbbf24', '#34d399', '#38bdf8', '#f472b6']
    });

    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'correct-feedback';
    feedbackBox.innerHTML = `
      <div class="correct-score">+${points} PTS</div>
      <div class="correct-msg">${message}</div>
    `;

    container.appendChild(feedbackBox);
    setTimeout(() => {
      if (feedbackBox.parentNode) feedbackBox.parentNode.removeChild(feedbackBox);
    }, 800);

    if (comboCount >= 2) {
      setTimeout(() => {
        showCombo(comboCount, targetEl, { container });
      }, 150);
    }
  }

  // ==========================================================================
  // 9. WRONG ANSWER FEEDBACK
  // ==========================================================================
  function showWrongFeedback(targetElOrOptions = null, options = {}) {
    let targetEl = null;
    let opts = options;

    if (targetElOrOptions instanceof HTMLElement) {
      targetEl = targetElOrOptions;
    } else if (targetElOrOptions && typeof targetElOrOptions === 'object') {
      opts = targetElOrOptions;
      targetEl = opts.targetEl || null;
    }

    const container = opts.container || getTargetContainer(targetEl);
    const message = opts.message || '-1 LIFE';
    const shakeIntensity = opts.intensity || 'normal';

    resetCombo();
    audio.play('wrong');

    shakeScreen(container, shakeIntensity);
    flashScreen('red', container);

    if (targetEl && targetEl.classList) {
      targetEl.classList.remove('feedback-shake-wrong');
      void targetEl.offsetWidth;
      targetEl.classList.add('feedback-shake-wrong');
      setTimeout(() => targetEl.classList.remove('feedback-shake-wrong'), 450);
    }

    let posX = container.clientWidth / 2;
    let posY = container.clientHeight * 0.5;

    if (targetEl) {
      const center = getElementCenter(targetEl, container);
      if (center) {
        posX = center.x;
        posY = center.y;
      }
    } else if (opts.x !== undefined && opts.y !== undefined) {
      posX = opts.x;
      posY = opts.y;
    }

    createParticles(posX, posY, {
      container: container,
      count: 10,
      shapes: ['✕', '●', '✦'],
      colors: ['#f43f5e', '#fb7185', '#fda4af']
    });

    const wrongBox = document.createElement('div');
    wrongBox.className = 'wrong-feedback';
    wrongBox.innerHTML = `
      <div class="wrong-badge">${message}</div>
    `;

    container.appendChild(wrongBox);
    setTimeout(() => {
      if (wrongBox.parentNode) wrongBox.parentNode.removeChild(wrongBox);
    }, 700);

    if (opts.heartEl) {
      showLifeLost(opts.heartEl, { container });
    }
  }

  // ==========================================================================
  // 10. LIFE LOST ANIMATION
  // ==========================================================================
  function showLifeLost(heartEl, options = {}) {
    const container = options.container || getTargetContainer(heartEl);

    if (heartEl && heartEl instanceof HTMLElement) {
      heartEl.classList.remove('heart-shaking');
      void heartEl.offsetWidth;
      heartEl.classList.add('heart-shaking');

      const center = getElementCenter(heartEl, container);
      if (center && container) {
        const floatLost = document.createElement('div');
        floatLost.className = 'life-lost';
        floatLost.textContent = '-1';
        floatLost.style.left = `${center.x}px`;
        floatLost.style.top = `${center.y}px`;
        container.appendChild(floatLost);

        setTimeout(() => {
          if (floatLost.parentNode) floatLost.parentNode.removeChild(floatLost);
        }, 800);
      }
    }
  }

  // ==========================================================================
  // 11. COMBO POPUP
  // ==========================================================================
  function showCombo(comboCount, targetEl = null, options = {}) {
    const container = options.container || getTargetContainer(targetEl);
    if (!container || comboCount < 2) return;

    audio.play('combo', 1.0 + Math.min(comboCount - 2, 4) * 0.15);

    const comboEl = document.createElement('div');
    comboEl.className = 'combo-popup';
    comboEl.innerHTML = `COMBO x${comboCount}!`;

    container.appendChild(comboEl);
    setTimeout(() => {
      if (comboEl.parentNode) comboEl.parentNode.removeChild(comboEl);
    }, 750);
  }

  // ==========================================================================
  // 12. CHALLENGE TRANSITION
  // ==========================================================================
  function showChallengeTransition(message = '✓ GREAT JOB!', options = {}) {
    const container = options.container || document.getElementById('game-container') || document.body;
    if (!container) return;

    const transEl = document.createElement('div');
    transEl.className = 'challenge-transition';
    transEl.textContent = message;

    container.appendChild(transEl);
    setTimeout(() => {
      if (transEl.parentNode) transEl.parentNode.removeChild(transEl);
    }, 800);
  }

  // ==========================================================================
  // 13. TIMER FEEDBACK & LOW TIME WARNING
  // ==========================================================================
  function updateTimerWarning(timerEl, secondsRemaining, options = {}) {
    if (!timerEl) return;
    const isUrgent = secondsRemaining <= 10 && secondsRemaining > 0;
    const parentBox = timerEl.closest('.hud-timer') || timerEl.parentElement;

    if (isUrgent) {
      if (!timerEl.classList.contains('timer-warning')) {
        timerEl.classList.add('timer-warning');
        if (parentBox) parentBox.classList.add('timer-warning-box');
      }
      if (options.playSound && isUrgent) {
        audio.play('click', 1.5);
      }
    } else {
      timerEl.classList.remove('timer-warning');
      if (parentBox) parentBox.classList.remove('timer-warning-box');
    }
  }

  function playGameSound(soundName, options = {}) {
    const pitch = options.pitch || 1.0;
    audio.play(soundName, pitch);
  }

  // ==========================================================================
  // 14. NUMBERLAND GLOBAL PROFILE SYSTEM
  // ==========================================================================
  const GAMES_META = [
    { id: 'runner', title: 'Math Runner', icon: '🏃', key: 'math_runner_stars', scoreKey: 'math_runner_highscore' },
    { id: 'pop', title: 'Number Pop', icon: '🎈', key: 'math_pop_stars', scoreKey: 'math_pop_highscore' },
    { id: 'fishing', title: 'Fishing Math', icon: '🎣', key: 'math_fishing_stars', scoreKey: 'math_fishing_highscore' },
    { id: 'racer', title: 'Math Racer', icon: '🏎️', key: 'math_racer_stars', scoreKey: 'math_racer_highscore' },
    { id: 'shop', title: 'Math Shop', icon: '🛒', key: 'math_shop_stars', scoreKey: 'math_shop_highscore' },
    { id: 'treasure', title: 'Treasure Hunt', icon: '🏝️', key: 'math_treasure_stars', scoreKey: 'math_treasure_highscore' }
  ];

  const AVATAR_LIST = ['🤠', '🧒', '👧', '🧭', '⭐', '🦁', '🦊', '🚀', '👑', '⚡'];

  class NumberlandProfileManager {
    constructor() {
      this.listeners = [];
      this.initPlayTimeTracker();
    }

    initPlayTimeTracker() {
      // Accumulate real session playtime every 30 seconds
      if (typeof window !== 'undefined') {
        setInterval(() => {
          if (!document.hidden) {
            this.addPlayTimeSeconds(30);
          }
        }, 30000);
      }
    }

    addPlayTimeSeconds(sec) {
      const curSec = parseInt(localStorage.getItem('numberland_play_time_sec') || '0', 10) + sec;
      localStorage.setItem('numberland_play_time_sec', curSec.toString());
      const mins = Math.floor(curSec / 60);
      localStorage.setItem('numberland_play_time_mins', mins.toString());
    }

    getProfile() {
      let totalStars = 0;
      let gamesCompleted = 0;
      let totalScore = 0;
      const gameProgress = {};

      GAMES_META.forEach(g => {
        const stars = Math.min(3, Math.max(0, parseInt(localStorage.getItem(g.key) || '0', 10)));
        const score = parseInt(localStorage.getItem(g.scoreKey) || '0', 10);
        totalStars += stars;
        if (stars > 0) gamesCompleted++;
        totalScore += score;
        gameProgress[g.id] = { stars, score, title: g.title, icon: g.icon };
      });

      const xp = parseInt(localStorage.getItem('numberland_player_xp') || '0', 10);
      const level = 1 + Math.floor(xp / 300);
      const xpInLevel = xp % 300;
      const xpToNext = 300;
      const name = localStorage.getItem('numberland_player_name') || 'Sabrina';
      const role = localStorage.getItem('numberland_player_role') || 'Numberland Explorer';
      const avatar = localStorage.getItem('numberland_player_avatar') || '🤠';
      const playTimeMins = parseInt(localStorage.getItem('numberland_play_time_mins') || '0', 10);

      return {
        name,
        role,
        avatar,
        level,
        xp,
        xpInLevel,
        xpToNext,
        totalStars,
        gamesCompleted,
        totalScore,
        playTime: playTimeMins,
        gameProgress
      };
    }

    setName(newName) {
      const cleanName = (newName || '').trim() || 'Sabrina';
      localStorage.setItem('numberland_player_name', cleanName);
      this.notifyUpdate();
      return cleanName;
    }

    setAvatar(newAvatar) {
      localStorage.setItem('numberland_player_avatar', newAvatar || '🤠');
      this.notifyUpdate();
    }

    addXP(amount) {
      const curXP = parseInt(localStorage.getItem('numberland_player_xp') || '0', 10);
      const oldLevel = 1 + Math.floor(curXP / 300);
      const newXP = curXP + Math.max(0, amount);
      const newLevel = 1 + Math.floor(newXP / 300);

      localStorage.setItem('numberland_player_xp', newXP.toString());

      if (newLevel > oldLevel) {
        audio.play('level-up');
        showScorePopup(`LEVEL UP! LEVEL ${newLevel}`, null, { message: 'LEVEL UP!' });
      }

      this.notifyUpdate();
      return { oldLevel, newLevel, newXP };
    }

    recordGameResult(gameId, score = 0, stars = 0, timeSeconds = 0) {
      const meta = GAMES_META.find(g => g.id === gameId);
      if (meta) {
        const curStars = parseInt(localStorage.getItem(meta.key) || '0', 10);
        const curScore = parseInt(localStorage.getItem(meta.scoreKey) || '0', 10);

        if (stars > curStars) {
          localStorage.setItem(meta.key, Math.min(3, stars).toString());
        }
        if (score > curScore) {
          localStorage.setItem(meta.scoreKey, score.toString());
        }
      }

      if (timeSeconds > 0) {
        this.addPlayTimeSeconds(timeSeconds);
      }

      // XP reward: 60 XP per star + score-based XP
      const earnedXP = (stars * 60) + Math.floor(score / 5);
      if (earnedXP > 0) {
        this.addXP(earnedXP);
      } else {
        this.notifyUpdate();
      }
    }

    notifyUpdate() {
      const p = this.getProfile();
      window.dispatchEvent(new CustomEvent('numberland:profileUpdated', { detail: p }));
      this.updateDOMNav();
    }

    updateDOMNav() {
      const p = this.getProfile();
      const profileNameLabels = document.querySelectorAll('.nl-nav-profile-name, #header-profile-name');
      profileNameLabels.forEach(el => {
        el.innerHTML = `<span class="profile-avatar-tag">${p.avatar}</span> <span class="profile-name-tag">${p.name}</span> <span class="profile-level-badge">Lv.${p.level}</span>`;
      });
    }

    openModal() {
      audio.play('click');
      let backdrop = document.getElementById('nl-profile-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'nl-profile-modal-backdrop';
        backdrop.className = 'nl-modal-backdrop';
        document.body.appendChild(backdrop);
      }

      const p = this.getProfile();
      const xpPercent = Math.min(100, Math.round((p.xpInLevel / p.xpToNext) * 100));

      let gamesBreakdownHtml = '';
      GAMES_META.forEach(g => {
        const prog = p.gameProgress[g.id];
        let starsHtml = '';
        for (let i = 1; i <= 3; i++) {
          starsHtml += i <= prog.stars 
            ? '<span style="color: #fbbf24; text-shadow: 0 0 6px rgba(251, 191, 36, 0.6);">★</span>' 
            : '<span style="color: #475569;">☆</span>';
        }
        gamesBreakdownHtml += `
          <div class="nl-game-item">
            <span class="nl-game-item-name">${g.title}</span>
            <span class="nl-game-item-stars">${starsHtml}</span>
          </div>
        `;
      });

      let avatarOptionsHtml = AVATAR_LIST.map(av => `
        <button class="nl-avatar-opt ${av === p.avatar ? 'selected' : ''}" data-avatar="${av}" title="Choose ${av}">${av}</button>
      `).join('');

      backdrop.innerHTML = `
        <div class="nl-modal-card" role="dialog" aria-label="Explorer Profile">
          <div class="nl-modal-header">
            <div class="nl-modal-title-wrap">
              <div>
                <h2 class="nl-modal-title">Explorer Profile</h2>
                <div class="nl-modal-subtitle">Numberland Math Passport</div>
              </div>
            </div>
            <button class="nl-modal-close-btn" id="nl-profile-close-btn" aria-label="Close Profile">✕</button>
          </div>

          <div class="nl-modal-body">
            <!-- Explorer Hero Banner -->
            <div class="nl-profile-hero">
              <div class="nl-avatar-wrapper">
                <div class="nl-avatar-box" id="nl-current-avatar" title="Click to change avatar">
                  ${p.avatar}
                </div>
                <span class="nl-avatar-edit-tag">EDIT</span>
              </div>

              <div class="nl-profile-info">
                <div class="nl-profile-name-row">
                  <input type="text" id="nl-profile-name-input" class="nl-profile-name-input" value="${p.name}" maxlength="18" aria-label="Explorer Name">
                  <button id="nl-profile-save-name-btn" class="nl-btn nl-btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">Save</button>
                </div>
                <div class="nl-profile-role-badge">${p.role}</div>

                <div class="nl-level-xp-wrap">
                  <div class="nl-level-text-row">
                    <span class="nl-level-badge">Level ${p.level}</span>
                    <span class="nl-xp-counter">${p.xpInLevel} / ${p.xpToNext} XP</span>
                  </div>
                  <div class="nl-xp-bar-bg">
                    <div class="nl-xp-bar-fill" style="width: ${xpPercent}%;"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Avatar Picker Drawer (hidden by default) -->
            <div id="nl-avatar-drawer" class="nl-avatar-picker" style="display: none;">
              ${avatarOptionsHtml}
            </div>

            <!-- 2x2 Stats Grid -->
            <div class="nl-stats-grid">
              <div class="nl-stat-card">
                <div class="nl-stat-content">
                  <span class="nl-stat-label">Total Stars</span>
                  <span class="nl-stat-value" style="color: #fbbf24;">${p.totalStars} / 18</span>
                  <span class="nl-stat-sub">Across 6 Games</span>
                </div>
              </div>

              <div class="nl-stat-card">
                <div class="nl-stat-content">
                  <span class="nl-stat-label">Games Completed</span>
                  <span class="nl-stat-value" style="color: #38bdf8;">${p.gamesCompleted} / 6</span>
                  <span class="nl-stat-sub">Math Worlds</span>
                </div>
              </div>

              <div class="nl-stat-card">
                <div class="nl-stat-content">
                  <span class="nl-stat-label">Total Score</span>
                  <span class="nl-stat-value" style="color: #34d399;">${p.totalScore}</span>
                  <span class="nl-stat-sub">Combined Highscore</span>
                </div>
              </div>

              <div class="nl-stat-card">
                <div class="nl-stat-content">
                  <span class="nl-stat-label">Play Time</span>
                  <span class="nl-stat-value" style="color: #a78bfa;">${p.playTime} min</span>
                  <span class="nl-stat-sub">Time Spent Learning</span>
                </div>
              </div>
            </div>

            <!-- 6 Games Star Breakdown -->
            <div class="nl-games-breakdown">
              <div class="nl-breakdown-title">Game Badges &amp; Stars</div>
              <div class="nl-breakdown-list">
                ${gamesBreakdownHtml}
              </div>
            </div>
          </div>

          <div class="nl-modal-footer">
            <button class="nl-btn nl-btn-primary" id="nl-profile-done-btn">Done</button>
          </div>
        </div>
      `;

      void backdrop.offsetWidth;
      backdrop.classList.add('active');

      // Bind interactions
      const closeBtn = backdrop.querySelector('#nl-profile-close-btn');
      const doneBtn = backdrop.querySelector('#nl-profile-done-btn');
      const nameInput = backdrop.querySelector('#nl-profile-name-input');
      const saveNameBtn = backdrop.querySelector('#nl-profile-save-name-btn');
      const avatarBox = backdrop.querySelector('#nl-current-avatar');
      const avatarDrawer = backdrop.querySelector('#nl-avatar-drawer');

      const handleClose = () => {
        if (nameInput) {
          this.setName(nameInput.value);
        }
        backdrop.classList.remove('active');
        audio.play('click');
      };

      closeBtn.addEventListener('click', handleClose);
      doneBtn.addEventListener('click', handleClose);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });

      // Name saving
      const saveName = () => {
        const val = this.setName(nameInput.value);
        nameInput.value = val;
        audio.play('click', 1.2);
        saveNameBtn.textContent = 'SAVED! ✔';
        setTimeout(() => {
          if (saveNameBtn) saveNameBtn.textContent = 'SAVE';
        }, 1200);
      };

      saveNameBtn.addEventListener('click', saveName);
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveName();
      });
      nameInput.addEventListener('blur', () => this.setName(nameInput.value));

      // Avatar selection drawer toggle
      avatarBox.addEventListener('click', () => {
        const isHidden = avatarDrawer.style.display === 'none';
        avatarDrawer.style.display = isHidden ? 'flex' : 'none';
        audio.play('click');
      });

      const avatarBtns = backdrop.querySelectorAll('.nl-avatar-opt');
      avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const chosen = btn.getAttribute('data-avatar');
          this.setAvatar(chosen);
          avatarBox.textContent = chosen;
          avatarBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          avatarDrawer.style.display = 'none';
          audio.play('star-reward', 1.2);
        });
      });
    }
  }

  const profileManager = new NumberlandProfileManager();

  // ==========================================================================
  // 15. NUMBERLAND ANIMATED "HOW TO PLAY" TUTORIAL SYSTEM
  // ==========================================================================
  class NumberlandTutorialManager {
    constructor() {
      this.currentStep = 1;
      this.totalSteps = 4;
      this.stepsData = [
        {
          num: 1,
          icon: '🎮',
          badge: 'STEP 1 OF 4',
          title: 'Choose a Game',
          desc: 'Explore 6 exciting math worlds across Numberland! Pick Runner, Number Pop, Fishing, Racer, Math Shop, or Treasure Hunt.',
          renderAnim: () => `
            <div class="nl-anim-games-grid">
              <div class="nl-anim-game-pill active">
                <span style="font-size: 26px;">🏃</span>
                <span>Runner</span>
              </div>
              <div class="nl-anim-game-pill">
                <span style="font-size: 26px;">🎈</span>
                <span>Pop</span>
              </div>
              <div class="nl-anim-game-pill">
                <span style="font-size: 26px;">🎣</span>
                <span>Fishing</span>
              </div>
              <div class="nl-anim-game-pill">
                <span style="font-size: 26px;">🏝️</span>
                <span>Treasure</span>
              </div>
            </div>
          `
        },
        {
          num: 2,
          icon: '🧠',
          badge: 'STEP 2 OF 4',
          title: 'Solve the Challenge',
          desc: 'Read the math question and tap or steer towards the correct answer. Think carefully and protect your 3 lives!',
          renderAnim: () => `
            <div class="nl-anim-equation-wrap">
              <div class="nl-anim-math-q">24 + 18 = ?</div>
              <div class="nl-anim-choices">
                <button class="nl-anim-btn">32</button>
                <button class="nl-anim-btn correct">42 ✔</button>
                <button class="nl-anim-btn">52</button>
              </div>
            </div>
          `
        },
        {
          num: 3,
          icon: '⭐',
          badge: 'STEP 3 OF 4',
          title: 'Earn Stars',
          desc: 'Solve all challenges quickly and accurately before time runs out to unlock up to 3 shiny gold stars in each game!',
          renderAnim: () => `
            <div class="nl-anim-stars-row">
              <span class="nl-anim-star">★</span>
              <span class="nl-anim-star">★</span>
              <span class="nl-anim-star">★</span>
            </div>
          `
        },
        {
          num: 4,
          icon: '🏆',
          badge: 'STEP 4 OF 4',
          title: 'Complete the Games',
          desc: 'Level up your Global Explorer Profile, collect all 18 stars, and become the Grand Master of Numberland!',
          renderAnim: () => `
            <div class="nl-anim-trophy-box">
              <div class="nl-anim-trophy-icon">🏆 💎 👑</div>
              <div class="nl-anim-progress-outer">
                <div class="nl-anim-progress-inner"></div>
              </div>
              <span style="font-size: 0.85rem; color: #fbbf24; font-weight: 800;">18 / 18 STARS UNLOCKED!</span>
            </div>
          `
        }
      ];
    }

    openModal(initialStep = 1) {
      this.currentStep = initialStep;
      audio.play('click');

      let backdrop = document.getElementById('nl-tutorial-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'nl-tutorial-modal-backdrop';
        backdrop.className = 'nl-modal-backdrop';
        document.body.appendChild(backdrop);
      }

      this.renderStep(backdrop);
      void backdrop.offsetWidth;
      backdrop.classList.add('active');
    }

    renderStep(backdrop) {
      const step = this.stepsData[this.currentStep - 1];

      let dotsHtml = '';
      for (let i = 1; i <= this.totalSteps; i++) {
        dotsHtml += `<div class="nl-dot ${i === this.currentStep ? 'active' : ''}" data-step="${i}"></div>`;
      }

      backdrop.innerHTML = `
        <div class="nl-modal-card nl-tutorial-card" role="dialog" aria-label="How to Play Tutorial">
          <div class="nl-modal-header">
            <div class="nl-modal-title-wrap">
              <span class="nl-modal-title-icon">❓</span>
              <div>
                <h2 class="nl-modal-title">HOW TO PLAY</h2>
                <div class="nl-modal-subtitle">Explore Numberland, play the games and collect stars!</div>
              </div>
            </div>
            <button class="nl-modal-close-btn" id="nl-tutorial-close-btn" aria-label="Close Tutorial">✖</button>
          </div>

          <div class="nl-modal-body">
            <div class="nl-tutorial-step-container">
              <div class="nl-step-content" key="step-${this.currentStep}">
                <div class="nl-step-badge">${step.badge}</div>
                <h3 class="nl-step-title">${step.icon} ${step.title}</h3>
                <p class="nl-step-desc">${step.desc}</p>
                
                <div class="nl-tutorial-anim-box">
                  ${step.renderAnim()}
                </div>
              </div>
            </div>
          </div>

          <div class="nl-modal-footer">
            <div class="nl-tutorial-pagination">
              ${dotsHtml}
            </div>

            <button class="nl-btn nl-btn-secondary" id="nl-tutorial-skip-btn">Skip</button>
            <button class="nl-btn nl-btn-secondary" id="nl-tutorial-prev-btn" ${this.currentStep === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Previous</button>
            <button class="nl-btn nl-btn-gold" id="nl-tutorial-next-btn">
              ${this.currentStep === this.totalSteps ? "Let's Play! 🚀" : 'Next ▶'}
            </button>
          </div>
        </div>
      `;

      // Bind events
      const closeBtn = backdrop.querySelector('#nl-tutorial-close-btn');
      const skipBtn = backdrop.querySelector('#nl-tutorial-skip-btn');
      const prevBtn = backdrop.querySelector('#nl-tutorial-prev-btn');
      const nextBtn = backdrop.querySelector('#nl-tutorial-next-btn');
      const dots = backdrop.querySelectorAll('.nl-dot');

      const closeTutorial = () => {
        backdrop.classList.remove('active');
        audio.play('click');
      };

      closeBtn.addEventListener('click', closeTutorial);
      skipBtn.addEventListener('click', closeTutorial);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeTutorial();
      });

      if (prevBtn && this.currentStep > 1) {
        prevBtn.addEventListener('click', () => {
          this.currentStep--;
          audio.play('click');
          this.renderStep(backdrop);
        });
      }

      nextBtn.addEventListener('click', () => {
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          audio.play('click');
          this.renderStep(backdrop);
        } else {
          closeTutorial();
        }
      });

      dots.forEach(d => {
        d.addEventListener('click', () => {
          const s = parseInt(d.getAttribute('data-step'), 10);
          if (s && s !== this.currentStep) {
            this.currentStep = s;
            audio.play('click');
            this.renderStep(backdrop);
          }
        });
      });
    }
  }

  const tutorialManager = new NumberlandTutorialManager();

  // ==========================================================================
  // 16. GLOBAL SETTINGS MODAL
  // ==========================================================================
  // ==========================================================================
  // 16. GLOBAL SETTINGS MODAL
  // ==========================================================================
  function openSettingsModal() {
    audio.play('click');
    let backdrop = document.getElementById('nl-settings-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'nl-settings-modal-backdrop';
      backdrop.className = 'nl-modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const soundOn = audio.isSoundEnabled();
    const p = profileManager.getProfile();

    backdrop.innerHTML = `
      <div class="nl-modal-card" style="max-width: 480px;" role="dialog" aria-label="Game Settings">
        <div class="nl-modal-header">
          <div class="nl-modal-title-wrap">
            <div>
              <h2 class="nl-modal-title">Settings</h2>
              <div class="nl-modal-subtitle">Audio &amp; Game Preferences</div>
            </div>
          </div>
          <button class="nl-modal-close-btn" id="nl-settings-close-btn">✕</button>
        </div>

        <div class="nl-modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Sound Toggle Row -->
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(30, 41, 59, 0.6); padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div>
              <div style="font-weight: 800; color: #ffffff;">Sound Effects &amp; Audio</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">Game sounds and audio feedback</div>
            </div>
            <button id="nl-setting-sound-toggle" class="nl-btn ${soundOn ? 'nl-btn-primary' : 'nl-btn-secondary'}" style="padding: 6px 16px; font-size: 0.85rem; font-weight: 800;">
              ${soundOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Profile Quick Action -->
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(30, 41, 59, 0.6); padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div>
              <div style="font-weight: 800; color: #ffffff;">Explorer Profile</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">Name: ${p.name} (${p.avatar})</div>
            </div>
            <button id="nl-setting-open-profile" class="nl-btn nl-btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; font-weight: 800;">
              Edit Profile
            </button>
          </div>

          <!-- Reset Progress Action -->
          <div style="background: rgba(244, 63, 94, 0.08); padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(244, 63, 94, 0.3); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 800; color: #f43f5e;">Reset Progress</div>
              <div style="font-size: 0.75rem; color: #fda4af;">Clear stars &amp; highscores</div>
            </div>
            <button id="nl-setting-reset-btn" class="nl-btn" style="background: rgba(244, 63, 94, 0.2); border: 1.5px solid #f43f5e; color: #f43f5e; padding: 6px 14px; font-size: 0.8rem; font-weight: 800;">
              Reset
            </button>
          </div>
        </div>

        <div class="nl-modal-footer">
          <button class="nl-btn nl-btn-primary" id="nl-settings-done-btn">Done</button>
        </div>
      </div>
    `;

    void backdrop.offsetWidth;
    backdrop.classList.add('active');

    const closeBtn = backdrop.querySelector('#nl-settings-close-btn');
    const doneBtn = backdrop.querySelector('#nl-settings-done-btn');
    const soundToggle = backdrop.querySelector('#nl-setting-sound-toggle');
    const openProf = backdrop.querySelector('#nl-setting-open-profile');
    const resetBtn = backdrop.querySelector('#nl-setting-reset-btn');

    const closeSettings = () => {
      backdrop.classList.remove('active');
      audio.play('click');
    };

    closeBtn.addEventListener('click', closeSettings);
    doneBtn.addEventListener('click', closeSettings);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSettings();
    });

    soundToggle.addEventListener('click', () => {
      const isEnabled = audio.toggleSound();
      soundToggle.className = `nl-btn ${isEnabled ? 'nl-btn-primary' : 'nl-btn-secondary'}`;
      soundToggle.textContent = isEnabled ? 'ON' : 'OFF';
      if (isEnabled) audio.play('click');
      // Update global DOM sound toggles
      const soundBtns = document.querySelectorAll('#sound-toggle-btn');
      soundBtns.forEach(btn => {
        const text = btn.querySelector('#sound-text');
        if (text) text.textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
      });
    });

    openProf.addEventListener('click', () => {
      closeSettings();
      setTimeout(() => profileManager.openModal(), 100);
    });

    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all game stars and scores?')) {
        GAMES_META.forEach(g => {
          localStorage.removeItem(g.key);
          localStorage.removeItem(g.scoreKey);
        });
        localStorage.removeItem('numberland_player_xp');
        audio.play('wrong');
        profileManager.notifyUpdate();
        closeSettings();
        location.reload();
      }
    });
  }

  // ==========================================================================
  // 17. PUBLIC EXPORTS (Window Object & Standalone Globals)
  // ==========================================================================
  const NumberlandFeedback = {
    audio,
    playGameSound,
    showCorrectFeedback,
    showWrongFeedback,
    showScorePopup,
    showLifeLost,
    shakeScreen,
    flashScreen,
    createParticles,
    showCombo,
    showChallengeTransition,
    animateScore,
    updateTimerWarning,
    incrementCombo,
    resetCombo,
    getCombo,
    toggleSound: () => audio.toggleSound(),
    isSoundEnabled: () => audio.isSoundEnabled(),
    setSoundEnabled: (val) => audio.setSoundEnabled(val),
    openProfile: () => profileManager.openModal(),
    openTutorial: (step) => tutorialManager.openModal(step),
    openSettings: () => openSettingsModal(),
    getProfile: () => profileManager.getProfile(),
    setName: (name) => profileManager.setName(name),
    setAvatar: (avatar) => profileManager.setAvatar(avatar),
    addXP: (amount) => profileManager.addXP(amount),
    recordGameResult: (gameId, score, stars, time) => profileManager.recordGameResult(gameId, score, stars, time)
  };

  // Expose global APIs
  window.NumberlandFeedback = NumberlandFeedback;
  window.NumberlandProfile = profileManager;
  window.NumberlandTutorial = tutorialManager;
  window.playGameSound = playGameSound;
  window.showCorrectFeedback = showCorrectFeedback;
  window.showWrongFeedback = showWrongFeedback;
  window.showScorePopup = showScorePopup;
  window.showLifeLost = showLifeLost;
  window.shakeScreen = shakeScreen;
  window.createParticles = createParticles;
  window.showCombo = showCombo;
  window.showChallengeTransition = showChallengeTransition;
  window.animateScore = animateScore;
  window.updateTimerWarning = updateTimerWarning;

  // Auto-init navigation handlers on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    profileManager.updateDOMNav();

    // Auto-hook elements with specific IDs if they exist
    const profileBtns = document.querySelectorAll('#profile-btn, #header-profile-btn, .btn-profile, [data-action="profile"]');
    profileBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        profileManager.openModal();
      });
    });

    const tutorialBtns = document.querySelectorAll('[data-action="global-tutorial"]');
    tutorialBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        tutorialManager.openModal();
      });
    });

    const settingsBtns = document.querySelectorAll('#settings-btn, #header-settings-btn, .btn-settings, [data-action="settings"]');
    settingsBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettingsModal();
      });
    });
  });

})();

