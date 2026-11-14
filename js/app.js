/* Orquestracao principal e gerenciamento da interface do usuario */

import { MODES, MODE_LABELS } from './config.js';
import { wallet } from './state/wallet.js';
import { sound } from './core/audio.js';
import { ICONS } from './core/icons.js';
import { MinesGame } from './games/mines.js';
import { AviatorGame } from './games/aviator.js';
import { RouletteGame } from './games/roulette.js';
import { SlotsGame } from './games/slots.js';
import { MonteCarloSimulator } from './simulation/monte-carlo.js';
import { ChartRenderer } from './simulation/charts.js';

class App {
  constructor() {
    this.currentMode = MODES.NEUTRAL;
    this.games = {};
    this.activeView = 'lobby';
    this.chartRenderer = null;
    this.simRounds = 100;
    this.activeSimGameName = 'Roleta';
  }

  init() {
    this.bindWallet();
    this.bindModeSwitch();
    this.bindLobbyAndNavigation();
    this.bindModals();
    this.initGames();
    this.initSimulationModal();
    this.renderLobbyIcons();
    this.goToView('lobby');
  }

  /* Conexao reativa com o saldo da carteira */
  bindWallet() {
    const balanceEl = document.getElementById('wallet-display-val');
    wallet.subscribe((balance) => {
      if (balanceEl) {
        balanceEl.textContent = wallet.constructor.formatBRL(balance);
      }
    });

    const walletBtn = document.getElementById('wallet-badge-btn');
    const modal = document.getElementById('wallet-modal');
    if (walletBtn && modal) {
      walletBtn.addEventListener('click', () => {
        document.getElementById('custom-balance-input').value = wallet.getBalance();
        modal.classList.add('open');
        sound.playClick();
      });
    }
  }

  /* Alternador de Modo Neutro e Modo Ralo */
  bindModeSwitch() {
    const neutralBtn = document.getElementById('btn-mode-neutral');
    const raloBtn = document.getElementById('btn-mode-ralo');

    const updateModeUI = () => {
      if (this.currentMode === MODES.NEUTRAL) {
        neutralBtn.className = 'mode-btn active-neutral';
        raloBtn.className = 'mode-btn';
      } else {
        neutralBtn.className = 'mode-btn';
        raloBtn.className = 'mode-btn active-ralo';
      }
    };

    neutralBtn.addEventListener('click', () => {
      this.currentMode = MODES.NEUTRAL;
      updateModeUI();
      sound.playClick();
      this.showToast('Modo Neutro (Fair Play) ativado: Probabilidades reais.');
    });

    raloBtn.addEventListener('click', () => {
      this.currentMode = MODES.RALO;
      updateModeUI();
      sound.playClick();
      this.showToast('Modo Ralo (Aspirador de Saldo) ativado: Vantagem desleal da casa.');
    });

    updateModeUI();
  }

  /* Navegacao entre lobby e jogos */
  bindLobbyAndNavigation() {
    const homeBtn = document.getElementById('nav-home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.goToView('lobby');
        sound.playClick();
      });
    }

    const lobbyCards = document.querySelectorAll('.lobby-game-card');
    lobbyCards.forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.target;
        if (target === 'simulation') {
          this.openSimulationModal('Geral');
        } else {
          this.goToView(target);
        }
        sound.playClick();
      });
    });
  }

  /* Muda a visualizacao ativa */
  goToView(viewId) {
    this.activeView = viewId;
    const views = document.querySelectorAll('.view-section');
    const homeBtn = document.getElementById('nav-home-btn');

    views.forEach(v => {
      if (v.id === `view-${viewId}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (homeBtn) {
      if (viewId === 'lobby') {
        homeBtn.style.opacity = '0.35';
        homeBtn.style.pointerEvents = 'none';
      } else {
        homeBtn.style.opacity = '1';
        homeBtn.style.pointerEvents = 'auto';
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Renderiza os icones SVG nos cards do lobby */
  renderLobbyIcons() {
    const homeBtn = document.getElementById('nav-home-btn');
    if (homeBtn) homeBtn.innerHTML = ICONS.home;

    const wIcon = document.getElementById('wallet-icon-slot');
    if (wIcon) wIcon.innerHTML = ICONS.wallet;

    const mIcon = document.getElementById('lobby-icon-mines');
    if (mIcon) mIcon.innerHTML = ICONS.minesLobby;

    const aIcon = document.getElementById('lobby-icon-aviator');
    if (aIcon) aIcon.innerHTML = ICONS.aviatorLobby;

    const rIcon = document.getElementById('lobby-icon-roulette');
    if (rIcon) rIcon.innerHTML = ICONS.rouletteLobby;

    const sIcon = document.getElementById('lobby-icon-slots');
    if (sIcon) sIcon.innerHTML = ICONS.slotsLobby;

    const simIcon = document.getElementById('lobby-icon-sim');
    if (simIcon) simIcon.innerHTML = ICONS.monteCarloLobby;
  }

  /* Controle dos modais de saldo e simulador */
  bindModals() {
    const walletModal = document.getElementById('wallet-modal');
    const closeWalletBtn = document.getElementById('close-wallet-modal');
    const saveWalletBtn = document.getElementById('save-balance-btn');
    const reset1kBtn = document.getElementById('reset-balance-1k');

    if (closeWalletBtn && walletModal) {
      closeWalletBtn.addEventListener('click', () => {
        walletModal.classList.remove('open');
      });
    }

    if (saveWalletBtn) {
      saveWalletBtn.addEventListener('click', () => {
        const val = parseFloat(document.getElementById('custom-balance-input').value) || 0;
        if (val >= 0) {
          wallet.setBalance(val);
          walletModal.classList.remove('open');
          this.showToast(`Banca atualizada para ${wallet.constructor.formatBRL(val)}`);
          sound.playClick();
        }
      });
    }

    if (reset1kBtn) {
      reset1kBtn.addEventListener('click', () => {
        wallet.reset(1000);
        walletModal.classList.remove('open');
        this.showToast('Banca restaurada para R$ 1.000,00');
        sound.playClick();
      });
    }
  }

  /* Inicializacao das instancias dos quatro jogos */
  initGames() {
    this.games.mines = new MinesGame(this);
    this.games.mines.init(document.getElementById('mines-game-container'));

    this.games.aviator = new AviatorGame(this);
    this.games.aviator.init(document.getElementById('aviator-game-container'));

    this.games.roulette = new RouletteGame(this);
    this.games.roulette.init(document.getElementById('roulette-game-container'));

    this.games.slots = new SlotsGame(this);
    this.games.slots.init(document.getElementById('slots-game-container'));
  }

  /* Inicializacao do modal de simulacao Monte Carlo */
  initSimulationModal() {
    const canvas = document.getElementById('sim-chart-canvas');
    if (canvas) {
      this.chartRenderer = new ChartRenderer(canvas);
    }

    const presetBtns = document.querySelectorAll('.preset-btn');
    const manualInput = document.getElementById('sim-custom-rounds-input');
    const runBtn = document.getElementById('run-sim-action-btn');
    const closeSimBtn = document.getElementById('close-sim-modal');
    const simModal = document.getElementById('sim-modal-overlay');

    if (closeSimBtn && simModal) {
      closeSimBtn.addEventListener('click', () => {
        simModal.classList.remove('open');
      });
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.simRounds = parseInt(btn.dataset.rounds, 10);
        manualInput.value = this.simRounds;
        sound.playClick();
      });
    });

    manualInput.addEventListener('input', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      const parsed = parseInt(manualInput.value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.simRounds = parsed;
      }
    });

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.executeMonteCarlo();
        sound.playClick();
      });
    }

    /* Redimensionamento responsivo para manter a fidelidade do grafico no mobile */
    window.addEventListener('resize', () => {
      const modal = document.getElementById('sim-modal-overlay');
      if (modal && modal.classList.contains('open') && this.lastSimResult) {
        if (this.chartRenderer) {
          this.chartRenderer.renderComparison(this.lastSimResult);
        }
      }
    });
  }

  /* Abre o modal de simulacao focado no jogo especificado */
  openSimulationModal(gameName = 'Roleta') {
    this.activeSimGameName = gameName;
    const modal = document.getElementById('sim-modal-overlay');
    const titleEl = document.getElementById('sim-modal-game-title');
    if (titleEl) {
      titleEl.textContent = `Simulação Monte Carlo: ${gameName}`;
    }
    if (modal) {
      modal.classList.add('open');
      sound.playClick();
      setTimeout(() => {
        this.executeMonteCarlo();
      }, 100);
    }
  }

  /* Executa a bateria de simulacao comparativa */
  executeMonteCarlo() {
    const currentBankroll = wallet.getBalance() || 1000;
    const betPerRound = Math.max(1, parseFloat(document.getElementById('sim-bet-input').value) || 20);
    const rounds = Math.max(10, Math.min(10000, this.simRounds));

    const result = MonteCarloSimulator.runComparativeSimulation(currentBankroll, betPerRound, rounds);
    this.lastSimResult = result;
    if (this.chartRenderer) {
      this.chartRenderer.renderComparison(result);
    }

    /* Coluna 1 Lucros Liquidos */
    const neutralProfitEl = document.getElementById('col-neutral-profit');
    const raloProfitEl = document.getElementById('col-ralo-profit');

    neutralProfitEl.textContent = wallet.constructor.formatBRL(result.neutral.metrics.totalProfit);
    neutralProfitEl.style.color = result.neutral.metrics.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';

    raloProfitEl.textContent = wallet.constructor.formatBRL(result.ralo.metrics.totalProfit);
    raloProfitEl.style.color = result.ralo.metrics.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';

    /* Coluna 2 Retorno Esperado */
    const neutralExpEl = document.getElementById('col-neutral-ev');
    const raloExpEl = document.getElementById('col-ralo-ev');

    neutralExpEl.textContent = `${wallet.constructor.formatBRL(result.neutral.metrics.expectedValue)} / jogada`;
    raloExpEl.textContent = `${wallet.constructor.formatBRL(result.ralo.metrics.expectedValue)} / jogada`;

    /* Coluna 3 Ruina e Ponto de Quebra */
    const ruinStatusEl = document.getElementById('col-ruin-status');
    const ruinRoundEl = document.getElementById('col-ruin-round');

    if (result.ralo.metrics.isRuined) {
      ruinStatusEl.textContent = 'Banca Liquidada (100%)';
      ruinStatusEl.style.color = 'var(--danger)';
      ruinRoundEl.textContent = `A ruína ocorreu na rodada ${result.ralo.metrics.ruinRound}`;
    } else {
      ruinStatusEl.textContent = 'Drenagem Contínua Ativa';
      ruinStatusEl.style.color = 'var(--accent-gold)';
      ruinRoundEl.textContent = `Saldo residual: ${wallet.constructor.formatBRL(result.ralo.metrics.finalBalance)}`;
    }

    this.showToast(`Bateria de ${rounds} rodadas calculada com sucesso.`);
  }

  getMode() {
    return this.currentMode;
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
