/**
 * CircularVisualiser — draws the FFT spectrum radially around a centre point.
 * ==========================================================================
 *
 * This is the Week 3 "third visualiser". Its real purpose is to demonstrate
 * that the Week 2 architecture pays off: adding an entirely new visualisation
 * required ONE new file and TWO lines elsewhere (register it in main.js, add
 * a dropdown <option>). The AudioEngine was not touched at all.
 *
 * It reuses the same getFrequencyData() the bars use, but arranges the bins
 * around a circle: each bin becomes a spoke radiating from the centre, whose
 * length grows with that frequency's magnitude.
 */

import { Visualiser } from "./Visualiser.js";

export class CircularVisualiser extends Visualiser {
  constructor() {
    super();
    this._spokes = 120; // how many spokes around the circle
  }

  get name() {
    return "Circular spectrum";
  }

  draw(engine, ctx, width, height) {
    const data = engine.getFrequencyData();
    if (data.length === 0) return;

    this.clear(ctx, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.18;
    const maxReach = Math.min(width, height) * 0.32;

    // Use the lower portion of the spectrum where most musical energy sits.
    const usableBins = Math.floor(data.length * 0.5);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for (let i = 0; i < this._spokes; i++) {
      const binIndex = Math.floor((i / this._spokes) * usableBins);
      const magnitude = data[binIndex] / 255; // 0..1

      // Spread spokes evenly around the full circle.
      const angle = (i / this._spokes) * Math.PI * 2;
      const inner = baseRadius;
      const outer = baseRadius + magnitude * maxReach;

      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * outer;
      const y2 = cy + Math.sin(angle) * outer;

      const hue = (i / this._spokes) * 360; // full colour wheel around the ring
      ctx.strokeStyle = `hsl(${hue}, 75%, 55%)`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}