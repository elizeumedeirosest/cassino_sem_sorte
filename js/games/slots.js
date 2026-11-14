/* Jogo do Caca Niquel com tres cilindros e efeito quase vitoria */

import { wallet } from '../state/wallet.js';
import { sound } from '../core/audio.js';
import { ProbabilityEngine } from '../core/probability.js';
import { ICONS } from '../core/icons.js';

export class SlotsGame {
  constructor(app) {
    this.app = app;
    this.bet = 20;
    this.spinning = false;
    this.symbols = ['7️⃣', '💎', '⭐', '🔔', '🍀', '🍒'];
    this.multipliers = {
      '7️⃣': 25,
      '💎': 15,
      '⭐': 10,
      '🔔': 6,
      '🍀': 4,
      '🍒': 2
    };

    this.container = null;
    this.reelEls = [];
    this.spinBtn = null;
    this.betInput = null;
    this.statusEl = null;
    this.bannerOverlay = null;
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
              <input type="number" class="bet-field" id="slots-bet-val" min="1" step="5" value="${this.bet}">
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
            <span class="bet-label">Tabela de Pagamentos (3 iguais)</span>
            <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
              7️⃣ 7️⃣ 7️⃣ = 25x<br>
              💎 💎 💎 = 15x<br>
              ⭐ ⭐ ⭐ = 10x<br>
              🔔 🔔 🔔 = 6x<br>
              🍀 🍀 🍀 = 4x<br>
              🍒 🍒 🍒 = 2x
            </div>
          </div>

          <button class="btn-action-primary btn-green" id="slots-spin-btn">Puxar Alavanca</button>

          <button class="btn-sim-trigger" id="slots-sim-btn">
            ${ICONS.chart} Simular este Jogo (Monte Carlo)
          </button>
        </div>

        <div class="display-viewport">
          <div class="slots-reels-box">
            <div class="slot-reel" id="slot-reel-0">7️⃣</div>
            <div class="slot-reel" id="slot-reel-1">💎</div>
            <div class="slot-reel" id="slot-reel-2">⭐</div>
          </div>
          <div id="slots-status-text" style="margin-top: 24px; font-family: var(--font-mono); font-size: 1.2rem; font-weight: 600; color: var(--accent-gold);">
            Alinhe 3 símbolos para vencer
          </div>

          <!-- Overlay de resultado em destaque -->
          <div class="result-banner-overlay" id="slots-banner-overlay">
            <div class="result-banner-box">
              <div class="result-tag" id="slots-banner-tag">VITÓRIA</div>
              <div class="result-amount" id="slots-banner-amount">+ R$ 0,00</div>
              <div class="result-sub" id="slots-banner-sub">Combinação tripla</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.reelEls = [
      this.container.querySelector('#slot-reel-0'),
      this.container.querySelector('#slot-reel-1'),
      this.container.querySelector('#slot-reel-2')
    ];
    this.spinBtn = this.container.querySelector('#slots-spin-btn');
    this.betInput = this.container.querySelector('#slots-bet-val');
    this.statusEl = this.container.querySelector('#slots-status-text');
    this.bannerOverlay = this.container.querySelector('#slots-banner-overlay');
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

    const simBtn = this.container.querySelector('#slots-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        this.app.openSimulationModal('Slots');
      });
    }
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

    this.hideBanner();
    wallet.deduct(betVal);
    this.bet = betVal;
    this.spinning = true;
    this.spinBtn.disabled = true;
    this.statusEl.textContent = 'Girando os cilindros...';

    const currentMode = this.app.getMode();
    const finalOutcome = ProbabilityEngine.getSlotsOutcome(currentMode, this.symbols);

    this.reelEls.forEach(el => el.classList.add('spinning'));

    const tickInterval = setInterval(() => {
      sound.playTick();
    }, 90);

    setTimeout(() => {
      this.stopReel(0, finalOutcome[0]);
    }, 600);

    setTimeout(() => {
      this.stopReel(1, finalOutcome[1]);
    }, 1200);

    setTimeout(() => {
      clearInterval(tickInterval);
      this.stopReel(2, finalOutcome[2]);
      this.evaluateOutcome(finalOutcome);
    }, 1800);
  }

  stopReel(index, symbol) {
    this.reelEls[index].classList.remove('spinning');
    this.reelEls[index].textContent = symbol;
    sound.playClick();
  }

  evaluateOutcome(outcome) {
    this.spinning = false;
    this.spinBtn.disabled = false;

    const [s1, s2, s3] = outcome;
    const isJackpot = (s1 === s2 && s2 === s3);
    const isPair = (s1 === s2 || s2 === s3 || s1 === s3);

    if (isJackpot) {
      const mult = this.multipliers[s1] || 5;
      const win = this.bet * mult;
      wallet.award(win);
      sound.playSuccess();
      this.statusEl.textContent = `Vitoria Tripla! Ganho: ${wallet.constructor.formatBRL(win)} (${mult}x)`;
      this.showBanner(true, win, `3x ${s1} combinados!`);
    } else if (isPair) {
      sound.playBoom();
      this.statusEl.textContent = 'Quase lá! 2 símbolos combinados.';
      this.showBanner(false, this.bet, 'Quase vitória (efeito near miss)');
    } else {
      sound.playBoom();
      this.statusEl.textContent = 'Sem combinações desta vez.';
      this.showBanner(false, this.bet, 'Cilindros desalinhados');
    }
  }

  showBanner(isWin, amount, subText) {
    this.bannerOverlay.className = `result-banner-overlay show ${isWin ? 'banner-win' : 'banner-loss'}`;
    const tagEl = this.container.querySelector('#slots-banner-tag');
    const amountEl = this.container.querySelector('#slots-banner-amount');
    const subEl = this.container.querySelector('#slots-banner-sub');

    if (isWin) {
      tagEl.textContent = 'VITÓRIA TRIPLA';
      amountEl.textContent = `+ ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = subText;
    } else {
      tagEl.textContent = 'A CASA RETEVE';
      amountEl.textContent = `- ${wallet.constructor.formatBRL(amount)}`;
      subEl.textContent = subText;
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
