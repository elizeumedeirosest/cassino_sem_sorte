# Cassino Sem Sorte

Plataforma interativa de simulação probabilística desenvolvida para demonstrações acadêmicas e eventos de Estatística. O projeto ilustra o comportamento da Lei dos Grandes Números, o Teorema da Ruína do Apostador e o efeito da Vantagem da Casa por meio de jogos clássicos de azar e um simulador Monte Carlo em tempo real.

## Modos de Operação

* **Modo Neutro (Fair Play)**: Probabilidades matemáticas e distribuições teóricas sem manipulação adicional além da margem natural do jogo.
* **Modo Ralo (Aspirador de Saldo)**: Algoritmo enviesado que amplifica perdas, simula falsas sensações de quase vitória e drena a banca do jogador em curto prazo.

## Jogos Disponíveis

1. **Mina**: Matriz 5x5 com cálculo combinatorial de risco por diamante descoberto.
2. **Aviador**: Processo estocástico exponencial com multiplicador contínuo e ponto de quebra aleatório.
3. **Roleta**: Roleta europeia padrão com 37 números e retorno padronizado.
4. **Slots**: Caça níquel de três cilindros com pesos de símbolos e dispersão controlada.

## Módulo de Simulação

Permite ao participante definir uma banca inicial e executar baterias de rodadas (50, 100, 1000 ou valores arbitrários) comparando simultaneamente a curva patrimonial teórica contra a curva do Modo Ralo.

```

Acesse em seu navegador o endereço: `http://localhost:8000`
