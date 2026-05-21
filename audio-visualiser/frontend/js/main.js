/**
 * main.js — application entry point.
 * ==========================================================================
 *
 * Responsibilities (and ONLY these):
 *   - own the single AudioEngine instance
 *   - hold a reference to the currently-selected visualiser
 *   - run the requestAnimationFrame render loop
 *   - wire DOM controls (buttons, dropdown, sliders) to engine + visualiser
 *
 * Note how little logic is here. Audio capture lives in AudioEngine; drawing
 * lives in the visualisers. This file just connects them to the page. That
 * thinness is the goal — it means the interesting code is testable in
 * isolation and this glue rarely needs to change.
 */

import { AudioEngine } from "./AudioEngine.js";
import { WaveformVisualiser } from "./visualisers/WaveformVisualiser.js";
import { FrequencyBarsVisualiser } from "./visualisers/FrequencyBarsVisualiser.js";

// --- State -----------------------------------------------------------------

const engine = new AudioEngine();

// All available visualisers, keyed by an id used in the dropdown.
const visualisers = {
  waveform: new WaveformVisualiser(),
  frequency: new FrequencyBarsVisualiser(),
};

let currentVisualiser = visualisers.frequency;
let animationFrameId = null;

// --- DOM references --------------------------------------------------------

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const visSelect = document.getElementById("visSelect");
const fftSelect = document.getElementById("fftSelect");
const smoothingSlider = document.getElementById("smoothingSlider");
const smoothingValue = document.getElementById("smoothingValue");
const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("visualiserCanvas")
);
const ctx = canvas.getContext("2d");

// --- Render loop -----------------------------------------------------------

function renderLoop() {
  animationFrameId = requestAnimationFrame(renderLoop);
  currentVisualiser.draw(engine, ctx, canvas.width, canvas.height);
}

// --- Control handlers ------------------------------------------------------

async function handleStart() {
  try {
    setStatus("Requesting microphone access…");
    await engine.start();
    setStatus(`Listening — visualising with "${currentVisualiser.name}".`);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    renderLoop();
  } catch (err) {
    console.error("Failed to start audio:", err);
    setStatus(`Error: ${err.message}`, true);
    handleStop();
  }
}

function handleStop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  engine.stop();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setStatus("Stopped. Click 'Start microphone' to resume.");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function handleVisualiserChange(event) {
  currentVisualiser = visualisers[event.target.value];
  if (engine.isRunning) {
    setStatus(`Listening — visualising with "${currentVisualiser.name}".`);
  }
}

function handleFftChange(event) {
  engine.setFftSize(Number(event.target.value));
}

function handleSmoothingChange(event) {
  const value = Number(event.target.value);
  engine.setSmoothing(value);
  smoothingValue.textContent = value.toFixed(2);
}

// --- Helpers ---------------------------------------------------------------

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

// --- Wire up ---------------------------------------------------------------

startBtn.addEventListener("click", handleStart);
stopBtn.addEventListener("click", handleStop);
visSelect.addEventListener("change", handleVisualiserChange);
fftSelect.addEventListener("change", handleFftChange);
smoothingSlider.addEventListener("input", handleSmoothingChange);
