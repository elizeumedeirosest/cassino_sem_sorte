/* Jogo da Roleta Europeia com renderizacao em Canvas e fisica de giro */

import { wallet } from '../state/wallet.js';
import { sound } from '../core/audio.js';
import { ProbabilityEngine } from '../core/probability.js';
import { ICONS } from '../core/icons.js';

export class RouletteGame {
  constructor(app) {
    this.app = app;
    this.bet = 20;
    this.selectedBetType = 'red';
    this.spinning = false;
    this.wheelAngle = 0;

    this.pockets = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
      5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.spinBtn = null;
    this.betInput = null;
    this.singleNumInput = null;
    this.resultEl = null;
    this.bannerOverlay = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this.render();
    this.bindEvents();
    this.drawWheel(this.wheelAngle);
  }

  render() {
    this.container.innerHTML = `
      <div class="game-card-container">
        <div class="control-sidebar">
          <div class="bet-control-panel">
            <span class="bet-label">Valor da Aposta</span>
            <div class="bet-input-wrapper">
              <span class="currency-prefix">R$</span>
              <input type="number" class="bet-field" id="roulette-bet-val" min="1" step="5" value="${this.bet}">
            </div>
            <div class="quick-chips-row">
              <button class="chip-btn" data-action="half">1/2</button>
              <button class="chip-btn" data-action="double">2X</button>
              <button class="chip-btn" data-action="add10">+10</button>
              <button class="chip-btn" data-action="add50">+50</button>
              <button class="chip-btn" data-action="max">MÁX</button>
            </div>
          </div>

          <div class="bet-control-panel">
            <span class="bet-label">Tipo de Aposta</span>
            <div class="roulette-board" id="roulette-bet-chips">
              <button class="roulette-bet-chip selected" data-type="red">Vermelho (1:1)</button>
              <button class="roulette-bet-chip" data-type="black">Preto (1:1)</button>
              <button class="roulette-bet-chip" data-type="even">Par (1:1)</button>
              <button class="roulette-bet-chip" data-type="odd">Ímpar (1:1)</button>
              <button class="roulette-bet-chip" data-type="low">1 a 18 (1:1)</button>
              <button class="roulette-bet-chip" data-type="high">19 a 36 (1:1)</button>
            </div>
          </div>

          <div class="bet-control-panel">
            <span class="bet-label">Aposta Direta em Número (Opcional, 35:1)</span>
            <div class="bet-input-wrapper">
              <input type="number" class="bet-field" id="roulette-single-num" min="0" max="36" placeholder="0 a 36">
            </div>
          </div>

          <button class="btn-action-primary btn-green" id="roulette-spin-btn">Girar Roleta</button>

          <button class="btn-sim-trigger" id="roulette-sim-btn">
            ${ICONS.chart} Simular este Jogo (Monte Carlo)
          </button>
        </div>

        <div class="display-viewport">
          <div class="roulette-container">
            <canvas class="roulette-wheel-canvas" id="roulette-wheel-canvas" width="280" height="280"></canvas>
            <div id="roulette-result-display" style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 700; color: var(--accent-gold); margin-top: 10px;">
              Selecione sua aposta
            </div>
          </div>

          <!-- Overlay de resultado em destaque -->
          <div class="result-banner-overlay" id="roulette-banner-overlay">
            <div class="result-banner-box">
              <div class="result-tag" id="roulette-banner-tag">VITÓRIA NA MESA</div>
              <div class="result-amount" id="roulette-banner-amount">+ R$ 0,00</div>
              <div class="result-sub" id="roulette-banner-sub">Número sorteado: 0</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#roulette-wheel-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.spinBtn = this.container.querySelector('#roulette-spin-btn');
    this.betInput = this.container.querySelector('#roulette-bet-val');
    this.singleNumInput = this.container.querySelector('#roulette-single-num');
    this.resultEl = this.container.querySelector('#roulette-result-display');
    this.bannerOverlay = this.container.querySelector('#roulette-banner-overlay');
  }

  bindEvents() {
    this.spinBtn.addEventListener('click', () => {
      if (!this.spinning) {
        this.spin();
      }
    });

    this.container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.spinning) return;
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

    this.container.querySelectorAll('.roulette-bet-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.spinning) return;
        this.container.querySelectorAll('.roulette-bet-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedBetType = chip.dataset.type;
        this.singleNumInput.value = '';
        sound.playClick();
      });
    });

    this.singleNumInput.addEventListener('input', () => {
      if (this.singleNumInput.value !== '') {
        this.container.querySelectorAll('.roulette-bet-chip').forEach(c => c.classList.remove('selected'));
        this.selectedBetType = 'straight';
      }
    });

    const simBtn = this.container.querySelector('#roulette-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.app.openSimulationModal('Roleta');
      });
    }
  }

  drawWheel(angle = 0) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = cx - 8;
    const sliceAngle = (Math.PI * 2) / this.pockets.length;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);

    for (let i = 0; i < this.pockets.length; i++) {
      const num = this.pockets[i];
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.closePath();

      if (num === 0) {
        this.ctx.fillStyle = '#10b981';
      } else if (this.redNumbers.includes(num)) {
        this.ctx.fillStyle = '#ef4444';
      } else {
        this.ctx.fillStyle = '#1e2330';
      }
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.stroke();

      this.ctx.save();
      this.ctx.rotate(startAngle + sliceAngle / 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '11px -apple-system, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(num.toString(), radius - 8, 4);
      this.ctx.restore();
    }

    this.ctx.beginPath();
    this.ctx.arc(0, 0, 32, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0a0d14';
    this.ctx.fill();
    this.ctx.strokeStyle = '#d4a34b';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();

    /* Marcador fixo superior estilo flecha apontando para o topo da roda */
    this.ctx.fillStyle = '#d4a34b';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, 22);
    this.ctx.lineTo(cx - 8, 4);
    this.ctx.lineTo(cx + 8, 4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  spin() {
    const betVal = parseFloat(this.betInput.value) || 0;
    if (betVal <= 0) {
      this.app.showToast('Insira um valor de aposta valido.');
      return;
    }
    if (!wallet.canAfford(betVal)) {
      this.app.showToast('Saldo insuficiente para esta aposta.');
      return;
    }

    let activeBets = [];
    if (this.selectedBetType === 'straight') {
      const num = parseInt(this.singleNumInput.value, 10);
      if (isNaN(num) || num < 0 || num > 36) {
        this.app.showToast('Escolha um numero valido entre 0 e 36.');
        return;
      }
      activeBets.push({ type: 'straight', value: num });
    } else {
      activeBets.push({ type: this.selectedBetType });
    }

    this.hideBanner();
    wallet.deduct(betVal);
    this.bet = betVal;
    this.spinning = true;
    this.spinBtn.disabled = true;
    this.resultEl.textContent = 'Girando a roleta...';

    const currentMode = this.app.getMode();
    const winningNumber = ProbabilityEngine.getRouletteOutcome(currentMode, activeBets);

    /* Calculo trigonometrico exato para alinhar o numero sob o ponteiro superior */
    const targetIndex = this.pockets.indexOf(winningNumber);
    const sliceAngle = (Math.PI * 2) / this.pockets.length;
    const twoPi = Math.PI * 2;

    /* O ponteiro superior esta no angulo menos pi sobre dois */
    const targetAngle = -Math.PI / 2 - (targetIndex * sliceAngle + sliceAngle / 2);
    const normalizedTarget = ((targetAngle % twoPi) + twoPi) % twoPi;
    const normalizedCurrent = ((this.wheelAngle % twoPi) + twoPi) % twoPi;

    let diff = normalizedTarget - normalizedCurrent;
    if (diff <= 0) {
      diff += twoPi;
    }

    const fullSpins = 6;
    const totalSpin = fullSpins * twoPi + diff;
    const startAngle = this.wheelAngle;

    const startTime = performance.now();
    const duration = 3200;

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalSpin * easeOut;

      this.drawWheel(currentAngle);
      if (Math.floor(elapsed / 110) % 2 === 0) {
        sound.playTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.wheelAngle = startAngle + totalSpin;
        this.drawWheel(this.wheelAngle);
        this.evaluateResult(winningNumber, activeBets);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  evaluateResult(winningNumber, activeBets) {
    this.spinning = false;
    this.spinBtn.disabled = false;

    const won = ProbabilityEngine.isRouletteWinner(winningNumber, activeBets);
    const colorLabel = winningNumber === 0 ? 'Verde' : (this.redNumbers.includes(winningNumber) ? 'Vermelho' : 'Preto');
    this.resultEl.textContent = `Resultado: ${winningNumber} (${colorLabel})`;

    if (won) {
      const multiplier = this.selectedBetType === 'straight' ? 36 : 2;
      const payout = this.bet * multiplier;
      wallet.award(payout);
      sound.playSuccess();
      this.showBanner(true, payout, winningNumber, colorLabel);
    } else {
      sound.playBoom();
      this.showBanner(false, this.bet, winningNumber, colorLabel);
    }
  }

  showBanner(isWin, amount, num, colorLabel) {
    this.bannerOverlay.className = `result-banner-overlay show ${isWin ? 'banner-win' : 'banner-loss'}`;
    const tagEl = this.container.querySelector('#roulette-banner-tag');
    const amountEl = this.container.querySelector('#roulette-banner-amount');
    const subEl = this.container.querySelector('#roulette-banner-sub');

    if (isWin) {
      tagEl.textContent = 'VITÓRIA NA MESA';
      amountEl.textContent = `+ ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = `A bola caiu no ${num} (${colorLabel})`;
    } else {
      tagEl.textContent = 'A BANCA RECOLHEU';
      amountEl.textContent = `- ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = `A bola caiu no ${num} (${colorLabel})`;
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
