/* Motor matematico de probabilidades e geracao aleatoria */

import { MODES, HOUSE_EDGE } from '../config.js';

export class ProbabilityEngine {
  /* Gera numero decimal aleatorio uniforme entre min e max */
  static randomFloat(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
  }

  /* Gera numero inteiro aleatorio uniforme entre min e max inclusivo */
  static randomInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  /* Embaralha array com algoritmo Fisher Yates */
  static shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* Fator multiplicador teorico da Mina pela hipergeometrica */
  static getMinesMultiplier(totalTiles, mineCount, revealedCount, houseEdge = HOUSE_EDGE.neutralMines) {
    let prob = 1;
    for (let i = 0; i < revealedCount; i++) {
      prob *= (totalTiles - mineCount - i) / (totalTiles - i);
    }
    const rawMultiplier = (1 - houseEdge) / prob;
    return Math.max(1, Math.round(rawMultiplier * 100) / 100);
  }

  /* Gera o ponto de quebra do Aviador conforme o modo de operacao */
  static getAviatorCrashPoint(mode, betAmount = 0) {
    if (mode === MODES.NEUTRAL) {
      /* Distribuicao classica de crash com vantagem fixa da casa */
      const edge = HOUSE_EDGE.neutralAviator;
      const r = Math.random();
      if (r < edge) {
        return 1.00;
      }
      const multiplier = (100 * (1 - edge)) / (Math.random() * 100);
      return Math.max(1.01, Math.round(multiplier * 100) / 100);
    } else {
      /* Modo Ralo manipula para quebrar rapido */
      const rand = Math.random();
      if (rand < 0.25) {
        return 1.00;
      }
      if (rand < 0.75) {
        return Math.round((1.01 + Math.random() * 0.35) * 100) / 100;
      }
      return Math.round((1.36 + Math.random() * 0.45) * 100) / 100;
    }
  }

  /* Sorteio da Roleta Europeia de 0 a 36 */
  static getRouletteOutcome(mode, activeBets = []) {
    const totalPockets = 37;
    if (mode === MODES.NEUTRAL || activeBets.length === 0) {
      return this.randomInt(0, 36);
    } else {
      /* Modo Ralo favorece numeros fora da cobertura do jogador */
      const numbers = Array.from({ length: totalPockets }, (_, i) => i);
      const losingNumbers = numbers.filter(n => !this.isRouletteWinner(n, activeBets));
      if (losingNumbers.length > 0 && Math.random() < 0.88) {
        return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      }
      return this.randomInt(0, 36);
    }
  }

  /* Avalia se um numero vence as apostas ativas na roleta */
  static isRouletteWinner(number, activeBets) {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    for (const bet of activeBets) {
      if (bet.type === 'straight' && bet.value === number) return true;
      if (number === 0) continue;
      if (bet.type === 'red' && redNumbers.includes(number)) return true;
      if (bet.type === 'black' && !redNumbers.includes(number)) return true;
      if (bet.type === 'even' && number % 2 === 0) return true;
      if (bet.type === 'odd' && number % 2 !== 0) return true;
      if (bet.type === 'low' && number >= 1 && number <= 18) return true;
      if (bet.type === 'high' && number >= 19 && number <= 36) return true;
    }
    return false;
  }

  /* Sorteio dos Slots com mecanica de quase vitoria no Modo Ralo */
  static getSlotsOutcome(mode, symbols) {
    if (mode === MODES.NEUTRAL) {
      const r1 = symbols[Math.floor(Math.random() * symbols.length)];
      const r2 = symbols[Math.floor(Math.random() * symbols.length)];
      const r3 = symbols[Math.floor(Math.random() * symbols.length)];
      return [r1, r2, r3];
    } else {
      /* Modo Ralo produz ilusao de quase acerto com dois iguais e o terceiro diferente */
      const highSymbols = symbols.slice(0, 3);
      const chosen = highSymbols[Math.floor(Math.random() * highSymbols.length)];
      const others = symbols.filter(s => s !== chosen);
      const different = others[Math.floor(Math.random() * others.length)];
      
      const probNearMiss = 0.65;
      if (Math.random() < probNearMiss) {
        return [chosen, chosen, different];
      }
      return [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
    }
  }
}
