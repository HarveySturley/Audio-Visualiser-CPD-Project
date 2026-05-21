
// FrequencyBarsVisualiser — draws the FFT magnitude spectrum as bars.

import { Visualiser } from "./Visualiser.js";

export class FrequencyBarsVisualiser extends Visualiser {
  constructor() {
    super();
    this._barCount = 80;
    // Decay rate for the peak-hold: fraction of full height a bar may fall
    // per frame. Lower = slower, more "floaty" decay.
    this._decayPerFrame = 0.02;
    // Per-bar peak memory, normalised 0..1. Lazily sized on first draw.
    this._peaks = null;
  }

  get name() {
    return "Frequency bars (log)";
  }

  /**
   * Compute the bin index at the start of bar `i` using geometric spacing.
   * Equal steps in log-space map to geometric steps in bin-space, which is
   * what gives us the logarithmic frequency axis.
   * @private
   */
  _binForBar(i, logMin, logMax, barCount) {
    return Math.floor(Math.exp(logMin + ((logMax - logMin) * i) / barCount));
  }

  draw(engine, ctx, width, height) {
    const data = engine.getFrequencyData();
    if (data.length === 0) return;

    if (!this._peaks || this._peaks.length !== this._barCount) {
      this._peaks = new Float32Array(this._barCount);
    }

    this.clear(ctx, width, height);

    const binCount = data.length;
    const gap = 2;
    const barWidth = width / this._barCount - gap;

    // Bin 0 is the DC (0 Hz) component — no musical info, so start at bin 1.
    const logMin = Math.log(1);
    const logMax = Math.log(binCount - 1);

    for (let i = 0; i < this._barCount; i++) {
      const startBin = this._binForBar(i, logMin, logMax, this._barCount);
      // Next bar's start is this bar's end; guarantee at least one bin wide.
      let endBin = this._binForBar(i + 1, logMin, logMax, this._barCount);
      if (endBin <= startBin) endBin = startBin + 1;

      // Take the loudest bin in this bar's range (peak, not average). Peaks
      // read better on a log axis where low bars cover 1 bin and high bars
      // cover dozens — averaging would wash the high end out.
      let magnitude = 0;
      for (let b = startBin; b < endBin && b < binCount; b++) {
        if (data[b] > magnitude) magnitude = data[b];
      }
      const normalised = magnitude / 255; // 0..1

      // Peak-hold: jump up instantly to a new peak, otherwise decay slowly.
      if (normalised > this._peaks[i]) {
        this._peaks[i] = normalised;
      } else {
        this._peaks[i] = Math.max(0, this._peaks[i] - this._decayPerFrame);
      }

      const barHeight = this._peaks[i] * height;
      const hue = 240 - (i / this._barCount) * 240; // blue (low) -> red (high)
      ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;

      const x = i * (barWidth + gap);
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    }
  }
}
