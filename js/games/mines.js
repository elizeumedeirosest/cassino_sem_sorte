/* Jogo da Mina com matriz interativa e calculo combinatorio */

import { wallet } from '../state/wallet.js';
import { sound } from '../core/audio.js';
import { ProbabilityEngine } from '../core/probability.js';
import { MODES } from '../config.js';
import { ICONS } from '../core/icons.js';

export class MinesGame {
  constructor(app) {
    this.app = app;
    this.totalTiles = 25;
    this.mineCount = 3;
    this.bet = 20;
    this.active = false;
    this.revealedCount = 0;
    this.bombLocations = new Set();

    this.container = null;
    this.gridEl = null;
    this.actionBtn = null;
    this.multiplierDisplay = null;
    this.payoutDisplay = null;
    this.betInput = null;
    this.mineCountSelect = null;
    this.bannerOverlay = null;
    this.bannerBox = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-card-container">
        <div class="control-sidebar">
          <div class="bet-control-panel">
            <span class="bet-label">Valor da Aposta</span>
            <div class="bet-input-wrapper">
              <span class="currency-prefix">R$</span>
              <input type="number" class="bet-field" id="mines-bet-val" min="1" step="5" value="${this.bet}">
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
            <span class="bet-label">Quantidade de Minas</span>
            <select class="bet-input-wrapper bet-field" id="mines-count-sel" style="background: rgba(0,0,0,0.45); cursor: pointer;">
              <option value="1">1 Mina (Risco Baixo)</option>
              <option value="3" selected>3 Minas (Equilibrado)</option>
              <option value="5">5 Minas (Risco Médio)</option>
              <option value="10">10 Minas (Alto Risco)</option>
              <option value="20">20 Minas (Extremo)</option>
            </select>
          </div>

          <div class="bet-control-panel">
            <span class="bet-label">Multiplicador Atual</span>
            <div style="font-family: var(--font-mono); font-size: 1.8rem; font-weight: 700; color: var(--accent-gold);" id="mines-mult-val">1.00x</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);" id="mines-payout-val">Ganho Potencial: R$ 0,00</div>
          </div>

          <button class="btn-action-primary btn-green" id="mines-main-action">Começar Rodada</button>
          
          <button class="btn-sim-trigger" id="mines-sim-btn">
            ${ICONS.chart} Simular este Jogo (Monte Carlo)
          </button>
        </div>

        <div class="display-viewport">
          <div class="mines-grid" id="mines-board"></div>

          <!-- Overlay de resultado em destaque -->
          <div class="result-banner-overlay" id="mines-banner-overlay">
            <div class="result-banner-box" id="mines-banner-box">
              <div class="result-tag" id="mines-banner-tag">VITÓRIA</div>
              <div class="result-amount" id="mines-banner-amount">+ R$ 0,00</div>
              <div class="result-sub" id="mines-banner-sub">Multiplicador: 1.00x</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#mines-board');
    this.actionBtn = this.container.querySelector('#mines-main-action');
    this.multiplierDisplay = this.container.querySelector('#mines-mult-val');
    this.payoutDisplay = this.container.querySelector('#mines-payout-val');
    this.betInput = this.container.querySelector('#mines-bet-val');
    this.mineCountSelect = this.container.querySelector('#mines-count-sel');
    this.bannerOverlay = this.container.querySelector('#mines-banner-overlay');
    this.bannerBox = this.container.querySelector('#mines-banner-box');

    this.buildBlankGrid();
  }

  buildBlankGrid() {
    this.gridEl.innerHTML = '';
    for (let i = 0; i < this.totalTiles; i++) {
      const tile = document.createElement('div');
      tile.className = 'mine-tile';
      tile.dataset.index = i;
      this.gridEl.appendChild(tile);
    }
  }

  bindEvents() {
    this.actionBtn.addEventListener('click', () => {
      if (!this.active) {
        this.startGame();
      } else {
        this.cashout();
      }
    });

    this.gridEl.addEventListener('click', (e) => {
      const tile = e.target.closest('.mine-tile');
      if (!tile || !this.active) return;
      const index = parseInt(tile.dataset.index, 10);
      this.handleTileClick(index, tile);
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

    this.mineCountSelect.addEventListener('change', (e) => {
      if (this.active) return;
      this.mineCount = parseInt(e.target.value, 10);
    });

    const simBtn = this.container.querySelector('#mines-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.app.openSimulationModal('Mina');
      });
    }
  }

  startGame() {
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
    this.mineCount = parseInt(this.mineCountSelect.value, 10);
    this.active = true;
    this.revealedCount = 0;
    this.bombLocations.clear();

    const allIndices = Array.from({ length: this.totalTiles }, (_, i) => i);
    const shuffled = ProbabilityEngine.shuffle(allIndices);
    for (let i = 0; i < this.mineCount; i++) {
      this.bombLocations.add(shuffled[i]);
    }

    this.buildBlankGrid();
    this.actionBtn.textContent = 'Retirar Ganho';
    this.actionBtn.className = 'btn-action-primary btn-cashout-gold';
    this.multiplierDisplay.textContent = '1.00x';
    this.payoutDisplay.textContent = `Ganho Potencial: ${wallet.constructor.formatBRL(this.bet)}`;
    sound.playClick();
  }

  handleTileClick(index, tile) {
    if (tile.classList.contains('revealed-diamond') || tile.classList.contains('revealed-bomb')) {
      return;
    }

    const currentMode = this.app.getMode();

    if (currentMode === MODES.RALO && this.revealedCount >= 1) {
      const riggedThreshold = 0.78;
      if (Math.random() < riggedThreshold) {
        this.bombLocations.add(index);
      }
    }

    if (this.bombLocations.has(index)) {
      tile.classList.add('revealed-bomb');
      tile.innerHTML = ICONS.bomb;
      sound.playBoom();
      this.gameOver(false);
    } else {
      tile.classList.add('revealed-diamond');
      tile.innerHTML = ICONS.diamond;
      this.revealedCount++;
      sound.playSuccess();

      const mult = ProbabilityEngine.getMinesMultiplier(this.totalTiles, this.mineCount, this.revealedCount);
      const potentialPayout = this.bet * mult;
      this.multiplierDisplay.textContent = `${mult.toFixed(2)}x`;
      this.payoutDisplay.textContent = `Ganho Potencial: ${wallet.constructor.formatBRL(potentialPayout)}`;

      if (this.revealedCount === this.totalTiles - this.mineCount) {
        this.cashout();
      }
    }
  }

  cashout() {
    if (!this.active) return;
    const mult = ProbabilityEngine.getMinesMultiplier(this.totalTiles, this.mineCount, this.revealedCount);
    const payout = this.revealedCount === 0 ? this.bet : this.bet * mult;
    wallet.award(payout);
    sound.playSuccess();
    this.showBanner(true, payout, mult);
    this.gameOver(true);
  }

  gameOver(won) {
    this.active = false;
    this.actionBtn.textContent = 'Nova Rodada';
    this.actionBtn.className = 'btn-action-primary btn-green';

    const tiles = this.gridEl.querySelectorAll('.mine-tile');
    tiles.forEach((t, i) => {
      if (this.bombLocations.has(i)) {
        if (!t.classList.contains('revealed-bomb')) {
          t.innerHTML = ICONS.bomb;
          t.style.opacity = '0.5';
        }
      }
    });

    if (!won) {
      this.showBanner(false, this.bet, 0);
    }
  }

  showBanner(isWin, amount, mult) {
    this.bannerOverlay.className = `result-banner-overlay show ${isWin ? 'banner-win' : 'banner-loss'}`;
    const tagEl = this.container.querySelector('#mines-banner-tag');
    const amountEl = this.container.querySelector('#mines-banner-amount');
    const subEl = this.container.querySelector('#mines-banner-sub');

    if (isWin) {
      tagEl.textContent = 'VITÓRIA';
      amountEl.textContent = `+ ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = `Multiplicador alcançado: ${mult.toFixed(2)}x`;
    } else {
      tagEl.textContent = 'A CASA VENCEU';
      amountEl.textContent = `- ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = 'Você colidiu com uma mina';
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
