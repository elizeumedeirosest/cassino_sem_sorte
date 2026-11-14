/* Renderizador grafico de alta performance para trajetorias patrimoniais */

export class ChartRenderer {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.width = 800;
    this.height = 310;
  }

  setupResolution() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width) || 800;
    const h = Math.floor(rect.height) || 310;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
  }

  /* Renderiza o grafico comparativo das duas trajetorias de Monte Carlo */
  renderComparison(data) {
    this.setupResolution();
    const { neutral, ralo, initialBankroll, roundsCount } = data;
    const w = this.width;
    const h = this.height;

    /* Margens protegidas para conter o grafico rigidamente */
    const padding = { top: 24, right: 30, bottom: 40, left: 78 };
    const plotWidth = Math.max(10, w - padding.left - padding.right);
    const plotHeight = Math.max(10, h - padding.top - padding.bottom);

    this.ctx.clearRect(0, 0, w, h);

    const allValues = [...neutral.trajectory, ...ralo.trajectory, initialBankroll];
    const maxVal = Math.max(...allValues) * 1.12;
    const minVal = 0;

    /* Grade horizontal e rotulos do eixo Y */
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    this.ctx.fillStyle = '#86868b';
    this.ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    this.ctx.textAlign = 'right';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = minVal + (maxVal - minVal) * (i / ySteps);
      const y = padding.top + plotHeight - (i / ySteps) * plotHeight;

      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(w - padding.right, y);
      this.ctx.stroke();

      this.ctx.fillText(`R$ ${Math.round(val)}`, padding.left - 10, y + 4);
    }

    /* Linha tracejada indicadora da banca inicial */
    const initialY = padding.top + plotHeight - ((initialBankroll - minVal) / (maxVal - minVal)) * plotHeight;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, initialY);
    this.ctx.lineTo(w - padding.right, initialY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    /* Traca a curva do Modo Neutro Fair Play em azul */
    this.drawTrajectory(neutral.trajectory, padding, plotWidth, plotHeight, maxVal, minVal, '#0ea5e9', 'rgba(14, 165, 233, 0.12)');

    /* Traca a curva do Modo Ralo em vermelho */
    this.drawTrajectory(ralo.trajectory, padding, plotWidth, plotHeight, maxVal, minVal, '#f43f5e', 'rgba(244, 63, 94, 0.16)');

    /* Marcacoes legiveis do eixo X */
    this.ctx.fillStyle = '#86868b';
    this.ctx.textAlign = 'center';
    this.ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';

    const xSteps = 4;
    for (let i = 0; i <= xSteps; i++) {
      const currentRound = Math.round((roundsCount / xSteps) * i);
      const x = padding.left + (i / xSteps) * plotWidth;
      const label = i === 0 ? '0' : `R${currentRound}`;
      this.ctx.fillText(label, x, h - 14);
    }
  }

  /* Traca uma linha individual garantindo que nao haja extrapolacao */
  drawTrajectory(trajectory, padding, plotWidth, plotHeight, maxVal, minVal, strokeColor, fillColor) {
    if (trajectory.length < 2) return;

    const count = trajectory.length - 1;
    const points = [];

    for (let i = 0; i <= count; i++) {
      const x = padding.left + (i / count) * plotWidth;
      const clampedVal = Math.max(minVal, Math.min(maxVal, trajectory[i]));
      const y = padding.top + plotHeight - ((clampedVal - minVal) / (maxVal - minVal)) * plotHeight;
      points.push({ x, y });
    }

    /* Preenchimento em gradiente inferior */
    const grad = this.ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, padding.top + plotHeight);
    for (const pt of points) {
      this.ctx.lineTo(pt.x, pt.y);
    }
    this.ctx.lineTo(points[points.length - 1].x, padding.top + plotHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    /* Linha principal */
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2.2;
    this.ctx.stroke();
  }
}
