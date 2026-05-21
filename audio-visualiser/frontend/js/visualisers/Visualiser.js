/**
 * Visualiser — base class defining the common interface.
 * ==========================================================================
 *
 * Every visualisation (waveform, frequency bars, and any we add later)
 * extends this class and implements draw(). Because they all share the same
 * interface, the main app can hold "a visualiser" without caring which one
 * it is, and swap between them at runtime by just changing the reference.
 *
 * This is the Strategy Pattern: the drawing algorithm is encapsulated behind
 * a stable interface, and is interchangeable. The benefit: adding a new
 * visualisation in a later week means writing ONE new file — no edits to the
 * engine or the main app loop.
 *
 * Subclasses must implement:
 *   draw(engine, ctx, width, height)
 *
 * Subclasses may override:
 *   get name()   — a human-readable label for the UI
 */

export class Visualiser {
  /**
   * @param {import('../AudioEngine.js').AudioEngine} _engine
   * @param {CanvasRenderingContext2D} _ctx
   * @param {number} _width  canvas width in pixels
   * @param {number} _height canvas height in pixels
   */
  // eslint-disable-next-line no-unused-vars
  draw(_engine, _ctx, _width, _height) {
    throw new Error("draw() must be implemented by a Visualiser subclass");
  }

  /** @returns {string} */
  get name() {
    return "Unnamed visualiser";
  }

  /**
   * Clear the canvas to a solid background. Shared helper so every
   * visualiser starts each frame from the same blank state.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  clear(ctx, width, height) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  }
}
