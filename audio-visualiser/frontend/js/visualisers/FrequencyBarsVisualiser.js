/**
 * FrequencyBarsVisualiser — draws the FFT magnitude spectrum as bars.
 * ==========================================================================
 *
 * This is the new Week 2 visualisation. It asks the engine for frequency
 * data (the FFT output) and draws one bar per frequency bin: low frequencies
 * on the left, high frequencies on the right, bar height = how much of that
 * frequency is present in the current audio.
 *
 * Two practical decisions worth noting:
 *
 *   1. We don't draw every bin. With fftSize=2048 there are 1024 bins, far
 *      more than we have horizontal pixels for and mostly empty at the high
 *      end (most everyday sound energy sits well below 22 kHz). We draw a
 *      capped number of bars and skip the sparse upper bins.
 *
 *   2. Colour encodes position in the spectrum (hue shifts across the bars),
 *      which makes the visualisation readable at a glance. This is a
 *      presentation choice and lives here in the visualiser, NOT in the
 *      engine — the engine only ever deals in raw numbers.
 */

import { Visualiser } from "./Visualiser.js";

export class FrequencyBarsVisualiser extends Visualiser {
  constructor() {
    super();
    // How many bars to draw. Capped so bars stay wide enough to see.
    this._maxBars = 96;
    // Fraction of the available bins to actually use. The top ~40% of bins
    // are usually near-silent for typical audio, so we ignore them to make
    // better use of the horizontal space.
    this._usableBinFraction = 0.6;
  }

  get name() {
    return "Frequency bars";
  }

  draw(engine, ctx, width, height) {
    const data = engine.getFrequencyData();
    if (data.length === 0) return;

    this.clear(ctx, width, height);

    const usableBins = Math.floor(data.length * this._usableBinFraction);
    const barCount = Math.min(this._maxBars, usableBins);
    const binsPerBar = Math.floor(usableBins / barCount);
    const gap = 2;
    const barWidth = width / barCount - gap;

    for (let i = 0; i < barCount; i++) {
      // Average the bins that fall into this bar, so reducing the bar count
      // doesn't just throw away data — it summarises it.
      let sum = 0;
      for (let j = 0; j < binsPerBar; j++) {
        sum += data[i * binsPerBar + j];
      }
      const magnitude = sum / binsPerBar; // 0..255
      const barHeight = (magnitude / 255) * height;

      // Hue shifts from blue (low freq) through to red (high freq).
      const hue = (i / barCount) * 240;
      ctx.fillStyle = `hsl(${240 - hue}, 80%, 55%)`;

      const x = i * (barWidth + gap);
      const y = height - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}
