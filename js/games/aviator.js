/* Jogo do Aviador com curva exponencial em tempo real e aviao dinamico */

import { wallet } from '../state/wallet.js';
import { sound } from '../core/audio.js';
import { ProbabilityEngine } from '../core/probability.js';
import { ICONS } from '../core/icons.js';

export class AviatorGame {
  constructor(app) {
    this.app = app;
    this.bet = 20;
    this.active = false;
    this.cashedOut = false;
    this.multiplier = 1.00;
    this.crashPoint = 1.00;
    this.startTime = null;
    this.animationId = null;

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.multiplierEl = null;
    this.actionBtn = null;
    this.betInput = null;
    this.bannerOverlay = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this.render();
    this.bindEvents();
    this.setupCanvas();
    this.drawIdleState();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-card-container">
        <div class="control-sidebar">
          <div class="bet-control-panel">
            <span class="bet-label">Valor da Aposta</span>
            <div class="bet-input-wrapper">
              <span class="currency-prefix">R$</span>
              <input type="number" class="bet-field" id="aviator-bet-val" min="1" step="5" value="${this.bet}">
            </div>
            <div class="quick-chips-row">
              <button class="chip-btn" data-action="half">1/2</button>
              <button class="chip-btn" data-action="double">2X</button>
              <button class="chip-btn" data-action="add10">+10</button>
              <button class="chip-btn" data-action="add50">+50</button>
              <button class="chip-btn" data-action="max">MÁX</button>
            </div>
          </div>

          <button class="btn-action-primary btn-green" id="aviator-main-action">Decolar</button>

          <button class="btn-sim-trigger" id="aviator-sim-btn">
            ${ICONS.chart} Simular este Jogo (Monte Carlo)
          </button>
        </div>

        <div class="display-viewport">
          <div class="aviator-canvas-wrap">
            <canvas class="aviator-canvas" id="aviator-canvas-el"></canvas>
            <div class="aviator-overlay-stats">
              <div class="aviator-multiplier-text" id="aviator-mult-display">1.00x</div>
            </div>
          </div>

          <!-- Overlay de resultado em destaque -->
          <div class="result-banner-overlay" id="aviator-banner-overlay">
            <div class="result-banner-box">
              <div class="result-tag" id="aviator-banner-tag">VITÓRIA</div>
              <div class="result-amount" id="aviator-banner-amount">+ R$ 0,00</div>
              <div class="result-sub" id="aviator-banner-sub">Multiplicador: 1.00x</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#aviator-canvas-el');
    this.ctx = this.canvas.getContext('2d');
    this.multiplierEl = this.container.querySelector('#aviator-mult-display');
    this.actionBtn = this.container.querySelector('#aviator-main-action');
    this.betInput = this.container.querySelector('#aviator-bet-val');
    this.bannerOverlay = this.container.querySelector('#aviator-banner-overlay');
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 600) * dpr;
    this.canvas.height = (rect.height || 440) * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width || 600;
    this.displayHeight = rect.height || 440;
  }

  bindEvents() {
    this.actionBtn.addEventListener('click', () => {
      if (!this.active) {
        this.startFlight();
      } else if (!this.cashedOut) {
        this.cashout();
      }
    });

    this.container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.active) return;
        const action = e.target.dataset.action;
        let current = parseFloat(this.betInput.value) || 0;
        if (action === 'half') current = Math.max(1, Math.floor(current / 2));
        if (action === 'double') current = current * 2;
        if (action === 'add10') current = current + 10;
        if (action === 'add50') current = current + 50;
        if (action === 'max') current = wallet.getBalance();
        this.betInput.value = current;
        sound.playClick();
      });
    });

    const simBtn = this.container.querySelector('#aviator-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.app.openSimulationModal('Aviador');
      });
    }

    window.addEventListener('resize', () => {
      if (!this.active) {
        this.setupCanvas();
        this.drawIdleState();
      }
    });
  }

  drawIdleState() {
    const w = this.displayWidth;
    const h = this.displayHeight;
    this.ctx.clearRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 40; y < h; y += 60) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = 'rgba(212, 163, 75, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(30, h - 30);
    this.ctx.lineTo(w - 30, h - 30);
    this.ctx.stroke();
  }

  startFlight() {
    const betVal = parseFloat(this.betInput.value) || 0;
    if (betVal <= 0) {
      this.app.showToast('Insira um valor de aposta valido.');
      return;
    }
    if (!wallet.canAfford(betVal)) {
      this.app.showToast('Saldo insuficiente para esta aposta.');
      return;
    }

    this.hideBanner();
    wallet.deduct(betVal);
    this.bet = betVal;
    this.active = true;
    this.cashedOut = false;
    this.multiplier = 1.00;

    const currentMode = this.app.getMode();
    this.crashPoint = ProbabilityEngine.getAviatorCrashPoint(currentMode, this.bet);

    this.multiplierEl.className = 'aviator-multiplier-text';
    this.multiplierEl.textContent = '1.00x';
    this.actionBtn.textContent = `Encerrar (${wallet.constructor.formatBRL(this.bet)})`;
    this.actionBtn.className = 'btn-action-primary btn-cashout-gold';
    this.actionBtn.disabled = false;

    this.startTime = performance.now();
    sound.playClick();
    this.animateFlight();
  }

  animateFlight() {
    if (!this.active) return;

    const now = performance.now();
    const elapsedSeconds = (now - this.startTime) / 1000;

    const speed = 0.08;
    this.multiplier = Math.pow(Math.E, speed * elapsedSeconds);

    if (this.multiplier >= this.crashPoint) {
      this.triggerCrash();
      return;
    }

    this.multiplierEl.textContent = `${this.multiplier.toFixed(2)}x`;
    if (!this.cashedOut) {
      const currentWin = this.bet * this.multiplier;
      this.actionBtn.textContent = `Encerrar (${wallet.constructor.formatBRL(currentWin)})`;
    }

    this.renderFlightCanvas(elapsedSeconds);
    this.animationId = requestAnimationFrame(() => this.animateFlight());
  }

  renderFlightCanvas(elapsedSeconds) {
    const w = this.displayWidth;
    const h = this.displayHeight;
    this.ctx.clearRect(0, 0, w, h);

    const startX = 30;
    const startY = h - 30;
    const progress = Math.min(1, elapsedSeconds / 12);
    const endX = startX + progress * (w - 110);
    const endY = startY - Math.min(h - 90, Math.pow(progress, 1.45) * (h - 90));

    const grad = this.ctx.createLinearGradient(0, endY, 0, startY);
    grad.addColorStop(0, 'rgba(212, 163, 75, 0.28)');
    grad.addColorStop(1, 'rgba(212, 163, 75, 0.00)');

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.quadraticCurveTo(startX + (endX - startX) * 0.6, startY, endX, endY);
    this.ctx.lineTo(endX, startY);
    this.ctx.closePath();
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.quadraticCurveTo(startX + (endX - startX) * 0.6, startY, endX, endY);
    this.ctx.strokeStyle = '#d4a34b';
    this.ctx.lineWidth = 3.5;
    this.ctx.stroke();

    /* Desenho do aviao em voo ascendente */
    this.drawJet(endX, endY);
  }

  drawJet(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(-0.35);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    /* Asas do aviao */
    this.ctx.fillStyle = '#d4a34b';
    this.ctx.beginPath();
    this.ctx.moveTo(-2, -2);
    this.ctx.lineTo(4, -14);
    this.ctx.lineTo(8, -2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(-2, 2);
    this.ctx.lineTo(4, 14);
    this.ctx.lineTo(8, 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  cashout() {
    if (!this.active || this.cashedOut) return;
    this.cashedOut = true;
    this.active = false;
    cancelAnimationFrame(this.animationId);

    const winAmount = this.bet * this.multiplier;
    wallet.award(winAmount);
    sound.playSuccess();

    this.actionBtn.textContent = 'Decolar Novamente';
    this.actionBtn.className = 'btn-action-primary btn-green';
    this.actionBtn.disabled = false;

    this.showBanner(true, winAmount, this.multiplier);
  }

  triggerCrash() {
    if (this.cashedOut) return;

    cancelAnimationFrame(this.animationId);
    this.active = false;
    sound.playBoom();

    this.multiplierEl.textContent = `${this.crashPoint.toFixed(2)}x`;
    this.multiplierEl.classList.add('crashed');

    this.actionBtn.textContent = 'Decolar Novamente';
    this.actionBtn.className = 'btn-action-primary btn-green';
    this.actionBtn.disabled = false;

    this.showBanner(false, this.bet, this.crashPoint);
  }

  showBanner(isWin, amount, mult) {
    this.bannerOverlay.className = `result-banner-overlay show ${isWin ? 'banner-win' : 'banner-loss'}`;
    const tagEl = this.container.querySelector('#aviator-banner-tag');
    const amountEl = this.container.querySelector('#aviator-banner-amount');
    const subEl = this.container.querySelector('#aviator-banner-sub');

    if (isWin) {
      tagEl.textContent = 'VITÓRIA';
      amountEl.textContent = `+ ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = `Retirada realizada em ${mult.toFixed(2)}x`;
    } else {
      tagEl.textContent = 'O AVIÃO QUEBROU';
      amountEl.textContent = `- ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = `Ponto de parada foi em ${mult.toFixed(2)}x`;
    }

    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.hideBanner();
    }, 2400);
  }

  hideBanner() {
    if (this.bannerOverlay) {
      this.bannerOverlay.classList.remove('show');
    }
  }
}
