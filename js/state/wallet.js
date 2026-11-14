/* Gestao de saldo e historico financeiro da banca */

import { DEFAULT_CONFIG } from '../config.js';

class Wallet {
  constructor() {
    this.storageKey = 'cassino_sem_sorte_balance';
    this.initialBalance = DEFAULT_CONFIG.initialBalance;
    this.balance = this.loadBalance();
    this.listeners = [];
  }

  /* Carrega o saldo armazenado ou define o padrao */
  loadBalance() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return this.initialBalance;
  }

  /* Salva o saldo no armazenamento local */
  saveBalance() {
    localStorage.setItem(this.storageKey, this.balance.toString());
    this.notify();
  }

  /* Retorna o saldo corrente formatado */
  getBalance() {
    return this.balance;
  }

  /* Define um novo saldo manualmente */
  setBalance(amount) {
    const val = Math.max(0, parseFloat(amount) || 0);
    this.balance = Math.round(val * 100) / 100;
    this.saveBalance();
  }

  /* Redefine para o saldo inicial */
  reset(amount = this.initialBalance) {
    this.setBalance(amount);
  }

  /* Verifica se o usuario possui saldo suficiente */
  canAfford(amount) {
    return this.balance >= amount && amount > 0;
  }

  /* Deduz o valor da aposta */
  deduct(amount) {
    if (!this.canAfford(amount)) {
      return false;
    }
    this.balance = Math.round((this.balance - amount) * 100) / 100;
    this.saveBalance();
    return true;
  }

  /* Adiciona o premio ganho */
  award(amount) {
    if (amount <= 0) return;
    this.balance = Math.round((this.balance + amount) * 100) / 100;
    this.saveBalance();
  }

  /* Registra ouvintes para atualizacao reativa */
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.balance);
  }

  /* Notifica todos os componentes sobre mudanca de saldo */
  notify() {
    for (const callback of this.listeners) {
      callback(this.balance);
    }
  }

  /* Formatacao monetaria padrao real brasileiro */
  static formatBRL(amount) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }
}

export const wallet = new Wallet();
