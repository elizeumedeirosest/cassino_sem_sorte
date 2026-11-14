/* Configuracoes globais do sistema */

export const MODES = {
  NEUTRAL: 'neutral',
  RALO: 'ralo'
};

export const MODE_LABELS = {
  neutral: 'Modo Neutro (Fair Play)',
  ralo: 'Modo Ralo (Aspirador de Saldo)'
};

export const DEFAULT_CONFIG = {
  initialBalance: 1000,
  defaultBet: 20,
  minBet: 1,
  maxBet: 50000,
  currentMode: MODES.NEUTRAL
};

export const HOUSE_EDGE = {
  neutralMines: 0.02,
  neutralAviator: 0.03,
  neutralRoulette: 0.027,
  neutralSlots: 0.04
};
