/**
 * FISHING MATH — STANDARD 3 FRACTIONS & PLACE VALUE GAME ENGINE
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. AUDIO SYNTHESIZER
  // ==========================================================================
  class AudioManager {
    constructor() {
      this.enabled = localStorage.getItem('math_games_sound') !== 'false';
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, gainVal = 0.1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playSplash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (e) {}
    }

    playCatch() {
      [440, 554.37, 659.25, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 70);
      });
    }

    playWrong() {
      this.playTone(150, 'sawtooth', 0.3, 0.15);
    }

    playVictory() {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.2, 0.15), i * 80);
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('math_games_sound', this.enabled);
      return this.enabled;
    }
  }

  const audio = new AudioManager();

  // ==========================================================================
  // 2. FRACTION & PLACE VALUE CHALLENGES
  // ==========================================================================
  const CHALLENGES = [
    { q: "Catch Fraction Equivalent to 1/2", target: "2/4", pool: ["2/4", "1/4", "3/4", "1/3", "2/5"], hint: "1/2 is equal to 2 out of 4 slices!" },
    { q: "Catch Fraction: Three Quarters", target: "3/4", pool: ["3/4", "1/4", "2/4", "1/2", "3/8"], hint: "Three quarters is 3 over 4." },
    { q: "Catch Fraction Equivalent to 1/4", target: "2/8", pool: ["2/8", "1/2", "3/4", "2/4", "1/3"], hint: "2/8 simplifies to 1/4!" },
    { q: "Catch Place Value of 7 in 4,725", target: "700", pool: ["700", "70", "7", "7000", "725"], hint: "7 is in the hundreds position (7 × 100)." },
    { q: "Catch Fraction: One Third", target: "1/3", pool: ["1/3", "1/2", "1/4", "2/3", "3/1"], hint: "One part out of three equal parts." },
    { q: "Catch Fraction Equivalent to 1 Whole", target: "4/4", pool: ["4/4", "3/4", "2/4", "1/4", "5/4"], hint: "When numerator equals denominator, it's 1 whole!" },
    { q: "Catch Place Value of 9 in 9,140", target: "9000", pool: ["9000", "900", "90", "9", "90000"], hint: "9 is in the thousands place." },
    { q: "Catch Fraction: Two Fifths", target: "2/5", pool: ["2/5", "1/5", "3/5", "5/2", "2/4"], hint: "2 parts out of 5." },
    { q: "Catch Place Value of 8 in 582", target: "80", pool: ["80", "8", "800", "8000", "580"], hint: "8 is in the tens place (8 × 10)." },
    { q: "Catch Fraction Equivalent to 2/3", target: "4/6", pool: ["4/6", "2/4", "3/6", "1/3", "5/6"], hint: "Multiply top and bottom by 2: 2×2=4, 3×2=6." }
  ];

  // ==========================================================================
  // 3. FISHING ENGINE
  // ==========================================================================
  class FishingGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      this.score = 0;
      this.lives = 3;
      this.timeLeft = 60;
      this.caughtCount = 0;
      this.challengeIndex = 0;
      this.isPlaying = false;

      // Boat & Rod
      this.boatX = 400;
      this.boatSpeed = 350;
      this.boatY = 135;
      this.moveDir = 0;

      // Hook Line
      this.hookX = 400;
      this.hookY = 145;
      this.hookState = 'idle'; // 'idle', 'dropping', 'reeling'
      this.hookSpeed = 320;
      this.caughtFish = null;

      this.fishList = [];
      this.particles = [];
      this.floatingTexts = [];
      this.bubbles = [];

      this.lastTime = 0;
      this.timerInterval = null;

      this.fishColors = ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#c084fc', '#f97316'];

      this.initEvents();
      this.resizeCanvas();
      this.initBubbles();
    }

    resizeCanvas() {
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 1000, height: 700 };
      const w = Math.max(800, rect.width || 1000);
      const h = Math.max(600, rect.height || 700);
      this.canvas.width = w;
      this.canvas.height = h;
      this.boatX = w * 0.5;
      this.hookX = this.boatX + 15;
    }

    initBubbles() {
      this.bubbles = [];
      const cw = this.canvas.width || 1000;
      for (let i = 0; i < 25; i++) {
        this.bubbles.push({
          x: Math.random() * cw,
          y: Math.random() * 400 + 180,
          radius: Math.random() * 4 + 2,
          speedY: Math.random() * 30 + 15,
          alpha: Math.random() * 0.4 + 0.2
        });
      }
    }

    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      // Keyboard
      window.addEventListener('keydown', (e) => {
        if (!this.isPlaying) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveDir = -1;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveDir = 1;
        if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') this.castLine();
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') if (this.moveDir === -1) this.moveDir = 0;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') if (this.moveDir === 1) this.moveDir = 0;
      });

      // Mobile Buttons
      const btnLeft = document.getElementById('btn-left');
      const btnRight = document.getElementById('btn-right');
      const btnCast = document.getElementById('btn-cast');

      if (btnLeft) {
        btnLeft.addEventListener('pointerdown', () => this.moveDir = -1);
        btnLeft.addEventListener('pointerup', () => { if (this.moveDir === -1) this.moveDir = 0; });
      }
      if (btnRight) {
        btnRight.addEventListener('pointerdown', () => this.moveDir = 1);
        btnRight.addEventListener('pointerup', () => { if (this.moveDir === 1) this.moveDir = 0; });
      }
      if (btnCast) {
        btnCast.addEventListener('pointerdown', () => this.castLine());
      }

      // Start & Restart & Instructions
      const startBtn = document.getElementById('start-game-btn');
      const restartBtn = document.getElementById('play-again-btn');
      const soundBtn = document.getElementById('sound-toggle-btn');
      const howToPlayBtn = document.getElementById('how-to-play-btn');
      const hudHowToPlayBtn = document.getElementById('hud-how-to-play-btn');
      const closeInstBtn = document.getElementById('close-instructions-btn');
      const startFromInstBtn = document.getElementById('start-from-instructions-btn');
      const instModal = document.getElementById('instructions-modal');

      const showInst = () => {
        if (instModal) {
          instModal.classList.remove('hidden');
          instModal.classList.add('active');
        }
      };

      const hideInst = () => {
        if (instModal) {
          instModal.classList.remove('active');
          instModal.classList.add('hidden');
        }
      };

      if (howToPlayBtn) howToPlayBtn.addEventListener('click', showInst);
      if (hudHowToPlayBtn) hudHowToPlayBtn.addEventListener('click', showInst);
      if (closeInstBtn) closeInstBtn.addEventListener('click', hideInst);
      if (startFromInstBtn) {
        startFromInstBtn.addEventListener('click', () => {
          hideInst();
          this.start();
        });
      }

      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (restartBtn) restartBtn.addEventListener('click', () => this.start());
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          const on = audio.toggle();
          const icon = document.getElementById('sound-icon');
          if (icon) icon.textContent = on ? 'Sound: ON' : 'Sound: OFF';
        });
      }
    }

    start() {
      document.getElementById('start-screen').classList.add('hidden');
      document.getElementById('end-screen').classList.add('hidden');
      const instModal = document.getElementById('instructions-modal');
      if (instModal) {
        instModal.classList.remove('active');
        instModal.classList.add('hidden');
      }

      this.score = 0;
      this.lives = 3;
      this.timeLeft = 60;
      this.caughtCount = 0;
      this.challengeIndex = 0;
      this.isPlaying = true;
      this.hookState = 'idle';
      this.hookY = this.boatY + 10;
      this.caughtFish = null;
      this.particles = [];
      this.floatingTexts = [];

      if (window.NumberlandFeedback) {
        window.NumberlandFeedback.resetCombo();
      }

      this.updateHUD();
      this.loadQuestion();

      const timerEl = document.getElementById('timer-display');
      if (typeof updateTimerWarning === 'function') {
        updateTimerWarning(timerEl, this.timeLeft);
      }

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (!this.isPlaying) return;
        this.timeLeft--;
        if (timerEl) timerEl.textContent = `${this.timeLeft}s`;

        if (typeof updateTimerWarning === 'function') {
          updateTimerWarning(timerEl, this.timeLeft);
        }

        if (this.timeLeft <= 0) {
          this.gameOver(true);
        }
      }, 1000);

      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    loadQuestion() {
      if (this.challengeIndex >= CHALLENGES.length) {
        this.challengeIndex = 0;
      }

      if (this.challengeIndex > 0 && typeof showChallengeTransition === 'function') {
        showChallengeTransition(`CATCH ${this.challengeIndex + 1}/10`, { container: document.getElementById('game-container') });
      }

      const cur = CHALLENGES[this.challengeIndex];
      const qText = document.getElementById('question-text');
      const qHint = document.getElementById('question-hint');
      if (qText) qText.textContent = cur.q;
      if (qHint) qHint.textContent = cur.hint;

      // Spawn fish swimming at varied depths
      this.fishList = [];
      cur.pool.forEach((val, i) => {
        const depth = 220 + (i % 4) * 80;
        const dir = (i % 2 === 0) ? 1 : -1;
        const startX = dir === 1 ? -100 - i * 90 : 900 + i * 90;
        const color = this.fishColors[i % this.fishColors.length];

        this.fishList.push({
          x: startX,
          y: depth,
          val,
          isTarget: val === cur.target,
          dir,
          speed: Math.random() * 40 + 70,
          color,
          width: 70,
          height: 38,
          caught: false,
          tailWiggle: Math.random() * Math.PI * 2
        });
      });
    }

    castLine() {
      if (this.hookState === 'idle') {
        this.hookState = 'dropping';
        this.hookX = this.boatX;
        audio.playSplash();
      }
    }

    addSplashParticles(x, y) {
      for (let i = 0; i < 15; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const speed = Math.random() * 120 + 40;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: '#e0f2fe',
          alpha: 1,
          life: 0.5
        });
      }
    }

    addFloatingText(text, x, y, color = '#fff') {
      this.floatingTexts.push({ text, x, y, color, alpha: 1, life: 0.9 });
    }

    updateHUD() {
      const scoreEl = document.getElementById('score-display');
      const caughtEl = document.getElementById('caught-display');
      const livesContainer = document.getElementById('lives-container');

      if (scoreEl && typeof animateScore !== 'function') scoreEl.textContent = this.score;
      if (caughtEl) caughtEl.textContent = `${this.caughtCount}/10`;
      if (livesContainer) {
        const hearts = livesContainer.querySelectorAll('.heart');
        if (hearts.length === 3) {
          hearts.forEach((h, idx) => {
            if (idx < this.lives) {
              h.classList.remove('lost');
            } else {
              h.classList.add('lost');
            }
          });
        } else {
          livesContainer.innerHTML = '<span class="heart">❤️</span>'.repeat(Math.max(0, this.lives)) + '<span class="heart lost">❤️</span>'.repeat(Math.max(0, 3 - this.lives));
        }
      }
    }

    gameOver(timeOut = false) {
      this.isPlaying = false;
      if (this.timerInterval) clearInterval(this.timerInterval);

      if (typeof updateTimerWarning === 'function') {
        updateTimerWarning(document.getElementById('timer-display'), 60);
      }

      let stars = 1;
      if (this.score >= 600) stars = 2;
      if (this.score >= 900 && this.lives >= 2) stars = 3;

      if (typeof playGameSound === 'function') {
        playGameSound(stars >= 1 ? 'victory' : 'gameover');
      } else {
        audio.playVictory();
      }

      // Save to Numberland Profile & localStorage
      if (window.NumberlandProfile) {
        window.NumberlandProfile.recordGameResult('fishing', this.score, stars, Math.max(0, 60 - this.timeLeft));
      } else {
        localStorage.setItem('math_fishing_highscore', Math.max(this.score, parseInt(localStorage.getItem('math_fishing_highscore') || '0', 10)));
        localStorage.setItem('math_fishing_stars', Math.max(stars, parseInt(localStorage.getItem('math_fishing_stars') || '0', 10)));
      }

      document.getElementById('final-score-val').textContent = this.score;
      document.getElementById('final-caught-val').textContent = `${this.caughtCount} / 10`;
      document.getElementById('final-lives-val').textContent = '❤️'.repeat(Math.max(0, this.lives)) || '💔';
      document.getElementById('final-time-val').textContent = `${Math.max(0, this.timeLeft)}s`;

      const slots = document.querySelectorAll('#end-screen .star-slot');
      slots.forEach((slot, i) => {
        slot.classList.remove('earned');
        if (i < stars) {
          setTimeout(() => slot.classList.add('earned'), 300 + i * 250);
        }
      });

      document.getElementById('end-screen').classList.remove('hidden');
    }

    update(dt) {
      // Move Boat
      if (this.hookState === 'idle') {
        this.boatX += this.moveDir * this.boatSpeed * dt;
        this.boatX = Math.max(60, Math.min(740, this.boatX));
        this.hookX = this.boatX;
      }

      // Update Hook
      if (this.hookState === 'dropping') {
        this.hookY += this.hookSpeed * dt;

        // Check collision with fish
        for (let f of this.fishList) {
          if (!f.caught) {
            const dist = Math.hypot(this.hookX - f.x, this.hookY - f.y);
            if (dist < 35) {
              f.caught = true;
              this.caughtFish = f;
              this.hookState = 'reeling';
              break;
            }
          }
        }

        if (this.hookY >= 560) {
          this.hookState = 'reeling';
        }
      } else if (this.hookState === 'reeling') {
        this.hookY -= this.hookSpeed * 1.2 * dt;
        if (this.caughtFish) {
          this.caughtFish.x = this.hookX;
          this.caughtFish.y = this.hookY + 15;
        }

        // Reached boat
        if (this.hookY <= this.boatY + 10) {
          this.hookY = this.boatY + 10;
          this.hookState = 'idle';

          if (this.caughtFish) {
            const container = document.getElementById('game-container');
            const targetX = (this.boatX / 800) * (container ? container.clientWidth : 800);
            const targetY = 160;

            if (this.caughtFish.isTarget) {
              const prevScore = this.score;
              this.score += 100;
              this.caughtCount++;

              if (typeof showCorrectFeedback === 'function') {
                showCorrectFeedback({
                  points: 100,
                  message: 'GREAT CATCH!',
                  container: container,
                  x: targetX,
                  y: targetY
                });
              } else {
                audio.playCatch();
                this.addFloatingText('+100 CATCH!', this.boatX, this.boatY - 30, '#34d399');
              }

              if (typeof animateScore === 'function') {
                animateScore(document.getElementById('score-display'), prevScore, this.score, 350);
              }

              this.addSplashParticles(this.boatX, this.boatY);
              this.challengeIndex++;
              this.updateHUD();

              if (this.caughtCount >= 10) {
                setTimeout(() => this.gameOver(false), 600);
              } else {
                setTimeout(() => { if (this.isPlaying) this.loadQuestion(); }, 500);
              }
            } else {
              const hearts = document.querySelectorAll('#lives-container .heart');
              const lostHeart = hearts[this.lives - 1] || null;

              this.lives--;

              if (typeof showWrongFeedback === 'function') {
                showWrongFeedback({
                  message: 'WRONG FISH! 💔',
                  container: container,
                  heartEl: lostHeart,
                  x: targetX,
                  y: targetY
                });
              } else {
                audio.playWrong();
                this.addFloatingText('WRONG FISH!', this.boatX, this.boatY - 30, '#fb7185');
              }

              this.updateHUD();
              if (this.lives <= 0) {
                this.gameOver(false);
              }
            }
            this.caughtFish = null;
          }
        }
      }

      // Update Fish Swimming
      this.fishList.forEach(f => {
        if (!f.caught) {
          f.x += f.dir * f.speed * dt;
          f.tailWiggle += 8 * dt;

          if (f.dir === 1 && f.x > 880) f.x = -80;
          if (f.dir === -1 && f.x < -80) f.x = 880;
        }
      });

      // Update Bubbles
      this.bubbles.forEach(b => {
        b.y -= b.speedY * dt;
        if (b.y < 160) {
          b.y = 580;
          b.x = Math.random() * 800;
        }
      });

      // Update Particles
      this.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 0.5);
      });
      this.particles = this.particles.filter(p => p.life > 0);

      // Update Floating Texts
      this.floatingTexts.forEach(ft => {
        ft.y -= 40 * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life / 0.9);
      });
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
    }

    render() {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      this.ctx.clearRect(0, 0, cw, ch);

      const waterSurfaceY = 160;

      // 1. Sky & Sun Glow Above Water
      const skyGrad = this.ctx.createLinearGradient(0, 0, 0, waterSurfaceY);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      this.ctx.fillStyle = skyGrad;
      this.ctx.fillRect(0, 0, cw, waterSurfaceY);

      // 2. Realistic Tropical Ocean Gradient
      const oceanGrad = this.ctx.createLinearGradient(0, waterSurfaceY, 0, ch);
      oceanGrad.addColorStop(0, '#0ea5e9');
      oceanGrad.addColorStop(0.2, '#0284c7');
      oceanGrad.addColorStop(0.5, '#0369a1');
      oceanGrad.addColorStop(0.85, '#075985');
      oceanGrad.addColorStop(1, '#082f49');
      this.ctx.fillStyle = oceanGrad;
      this.ctx.fillRect(0, waterSurfaceY, cw, ch - waterSurfaceY);

      // 3. Volumetric Caustic Sunbeams (God Rays)
      this.ctx.save();
      for (let i = 0; i < 6; i++) {
        const rayX = (cw * 0.2) + i * (cw * 0.14);
        const rayGrad = this.ctx.createLinearGradient(rayX, waterSurfaceY, rayX + 60, ch);
        rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
        rayGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = rayGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(rayX - 20, waterSurfaceY);
        this.ctx.lineTo(rayX + 30, waterSurfaceY);
        this.ctx.lineTo(rayX + 120, ch);
        this.ctx.lineTo(rayX + 20, ch);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();

      // 4. Sandy Seafloor & Swaying Kelp / Coral
      this.ctx.save();
      const sandGrad = this.ctx.createLinearGradient(0, ch - 50, 0, ch);
      sandGrad.addColorStop(0, '#d97706');
      sandGrad.addColorStop(1, '#78350f');
      this.ctx.fillStyle = sandGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(0, ch);
      this.ctx.lineTo(0, ch - 40);
      this.ctx.quadraticCurveTo(cw * 0.25, ch - 55, cw * 0.5, ch - 42);
      this.ctx.quadraticCurveTo(cw * 0.75, ch - 30, cw, ch - 48);
      this.ctx.lineTo(cw, ch);
      this.ctx.closePath();
      this.ctx.fill();

      // Swaying Seaweed Stalks
      const time = performance.now() * 0.002;
      for (let k = 40; k < cw; k += 80) {
        this.ctx.strokeStyle = k % 160 === 0 ? '#10b981' : '#059669';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(k, ch - 35);
        const sway = Math.sin(time + k) * 18;
        this.ctx.quadraticCurveTo(k + sway, ch - 90, k - sway * 0.5, ch - 140);
        this.ctx.stroke();
      }
      this.ctx.restore();

      // 5. Water Surface Wave Ripples & Foam
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      for (let x = 0; x < cw; x += 30) {
        const waveY = waterSurfaceY + Math.sin(time * 2 + x * 0.05) * 3;
        if (x === 0) this.ctx.moveTo(x, waveY);
        else this.ctx.lineTo(x, waveY);
      }
      this.ctx.stroke();
      this.ctx.restore();

      // 6. Draw Ambient Air Bubbles
      this.bubbles.forEach(b => {
        this.ctx.save();
        this.ctx.globalAlpha = b.alpha;
        this.ctx.strokeStyle = '#e0f2fe';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(b.x % cw, b.y, b.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
      });

      // 7. Fishing Line & Bobber with Concentric Ripple Rings
      this.ctx.beginPath();
      this.ctx.moveTo(this.boatX + 25, this.boatY - 30);
      this.ctx.lineTo(this.hookX, waterSurfaceY);
      this.ctx.lineTo(this.hookX, this.hookY);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.lineWidth = 1.8;
      this.ctx.stroke();

      // Realistic Red/White Bobber Float
      this.ctx.save();
      this.ctx.translate(this.hookX, waterSurfaceY);
      // Concentric surface ripples
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 1.5;
      const rippleR = 8 + (Math.sin(time * 4) + 1) * 6;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, rippleR * 1.6, rippleR * 0.6, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      // Bobber body
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(0, -6, 7, Math.PI, 0);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, -6, 7, 0, Math.PI);
      this.ctx.fill();
      this.ctx.restore();

      // Hook
      this.ctx.save();
      this.ctx.translate(this.hookX, this.hookY);
      this.ctx.strokeStyle = '#cbd5e1';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 8, 0, Math.PI);
      this.ctx.stroke();
      this.ctx.restore();

      // 8. Draw Swimming Realistic Tropical Fish
      this.fishList.forEach(f => {
        this.ctx.save();
        this.ctx.translate(f.x, f.y);
        if (f.dir === -1) this.ctx.scale(-1, 1);

        // Realistic Fish Body with Specular Gradient
        const fishGrad = this.ctx.createRadialGradient(-8, -4, 2, 0, 0, 36);
        fishGrad.addColorStop(0, '#ffffff');
        fishGrad.addColorStop(0.25, f.color);
        fishGrad.addColorStop(0.85, f.color);
        fishGrad.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = fishGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 36, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Realistic Stripe Patterns (Clownfish / Angelfish bands)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.beginPath();
        this.ctx.ellipse(-6, 0, 5, 18, 0, 0, Math.PI * 2);
        this.ctx.ellipse(10, 0, 4, 16, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Animated Translucent Tail Fin
        const tailOffset = Math.sin(f.tailWiggle) * 6;
        this.ctx.fillStyle = f.color;
        this.ctx.beginPath();
        this.ctx.moveTo(-32, 0);
        this.ctx.lineTo(-50, -18 + tailOffset);
        this.ctx.lineTo(-44, 0 + tailOffset * 0.5);
        this.ctx.lineTo(-50, 18 + tailOffset);
        this.ctx.closePath();
        this.ctx.fill();

        // Dorsal & Pectoral Fins
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -18);
        this.ctx.lineTo(8, -26);
        this.ctx.lineTo(12, -18);
        this.ctx.closePath();
        this.ctx.fill();

        // Fish Eye with Gloss Glint
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(20, -4, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(22, -4, 2.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(23, -5, 1, 0, Math.PI * 2);
        this.ctx.fill();

        // Pearlescent Fraction Readout Badge
        this.ctx.save();
        if (f.dir === -1) this.ctx.scale(-1, 1);
        this.ctx.font = '900 18px "Fredoka", "Outfit", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText(f.val, 0, 1);
        this.ctx.restore();

        this.ctx.restore();
      });

      // 9. Realistic Wooden Fishing Boat & Angler
      this.ctx.save();
      this.ctx.translate(this.boatX, this.boatY);

      // Wooden Boat Hull with Planks
      const boatGrad = this.ctx.createLinearGradient(0, 0, 0, 26);
      boatGrad.addColorStop(0, '#92400e');
      boatGrad.addColorStop(0.5, '#78350f');
      boatGrad.addColorStop(1, '#451a03');
      this.ctx.fillStyle = boatGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(-54, 0);
      this.ctx.lineTo(54, 0);
      this.ctx.lineTo(38, 24);
      this.ctx.lineTo(-38, 24);
      this.ctx.closePath();
      this.ctx.fill();

      // Boat Trim
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillRect(-58, -4, 116, 5);

      // Angler Avatar
      this.ctx.font = '36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🐧', 0, -2);

      // Carbon Fiber Fishing Rod
      this.ctx.strokeStyle = '#d97706';
      this.ctx.lineWidth = 3.5;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(8, -14);
      this.ctx.lineTo(30, -38);
      this.ctx.stroke();

      this.ctx.restore();

      // 10. Particles & Floating Texts
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      this.floatingTexts.forEach(ft => {
        this.ctx.save();
        this.ctx.globalAlpha = ft.alpha;
        this.ctx.font = '900 24px "Fredoka", sans-serif';
        this.ctx.fillStyle = ft.color;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(ft.text, ft.x, ft.y);
        this.ctx.restore();
      });
    }

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      if (this.isPlaying) {
        this.update(dt);
      }
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new FishingGame();
  });

})();
