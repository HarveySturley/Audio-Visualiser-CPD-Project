/**
 * WaveformVisualiser — draws the raw time-domain signal as a line.
 * ==========================================================================
 *
 * This is the Week 1 visualisation, now extracted into its own strategy.
 * It asks the engine for time-domain data and plots it as a continuous
 * polyline, with silence centred on the canvas midline.
 */

import { Visualiser } from "./Visualiser.js";

export class WaveformVisualiser extends Visualiser {
  get name() {
    return "Waveform";
  }

  draw(engine, ctx, width, height) {
    const data = engine.getTimeDomainData();
    if (data.length === 0) return;

    this.clear(ctx, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4f9eff";
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      // Each sample is 0..255 with 128 = silence. Dividing by 128 gives a
      // value around 1.0 for silence; multiplying by half-height centres it.
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }
}
