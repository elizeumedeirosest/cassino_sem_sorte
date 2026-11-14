/* Motor de simulacao estatistica Monte Carlo */

import { ProbabilityEngine } from '../core/probability.js';
import { MODES } from '../config.js';

export class MonteCarloSimulator {
  /* Executa simulacao comparativa entre Modo Neutro e Modo Ralo */
  static runComparativeSimulation(initialBankroll, betPerRound, roundsCount) {
    const neutralTrajectory = this.simulateSession(initialBankroll, betPerRound, roundsCount, MODES.NEUTRAL);
    const raloTrajectory = this.simulateSession(initialBankroll, betPerRound, roundsCount, MODES.RALO);

    const neutralMetrics = this.computeMetrics(initialBankroll, betPerRound, neutralTrajectory);
    const raloMetrics = this.computeMetrics(initialBankroll, betPerRound, raloTrajectory);

    return {
      roundsCount,
      initialBankroll,
      betPerRound,
      neutral: {
        trajectory: neutralTrajectory,
        metrics: neutralMetrics
      },
      ralo: {
        trajectory: raloTrajectory,
        metrics: raloMetrics
      }
    };
  }

  /* Simula uma sessao completa com limite de rodadas e parada na quebra */
  static simulateSession(initialBankroll, betPerRound, roundsCount, mode) {
    let currentBalance = initialBankroll;
    const trajectory = [currentBalance];

    for (let r = 1; r <= roundsCount; r++) {
      if (currentBalance <= 0) {
        trajectory.push(0);
        continue;
      }

      const activeBet = Math.min(currentBalance, betPerRound);
      currentBalance -= activeBet;

      /* Simula uma rodada probabilistica equivalente a Roleta Europeia */
      const outcome = ProbabilityEngine.getRouletteOutcome(mode, [{ type: 'red' }]);
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const won = redNumbers.includes(outcome);

      if (won) {
        currentBalance += activeBet * 2;
      }

      currentBalance = Math.round(currentBalance * 100) / 100;
      trajectory.push(currentBalance);
    }

    return trajectory;
  }

  /* Calcula metricas estatisticas fundamentais */
  static computeMetrics(initialBankroll, betPerRound, trajectory) {
    const finalBalance = trajectory[trajectory.length - 1];
    const totalProfit = finalBalance - initialBankroll;
    const totalRounds = trajectory.length - 1;

    let ruinRound = null;
    for (let i = 0; i < trajectory.length; i++) {
      if (trajectory[i] <= 0) {
        ruinRound = i;
        break;
      }
    }

    /* Estimativa de valor esperado por rodada */
    const expectedValue = totalRounds > 0 ? (totalProfit / totalRounds) : 0;
    const isRuined = finalBalance <= 0;

    return {
      finalBalance,
      totalProfit,
      expectedValue,
      isRuined,
      ruinRound
    };
  }
}
