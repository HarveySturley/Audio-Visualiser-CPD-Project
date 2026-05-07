/**
 * audio.js — Week 1 prototype
 * ==========================================================================
 *
 * Goal: capture microphone input and draw the raw audio waveform on a canvas.
 *
 * Concepts introduced:
 *   1. getUserMedia()  — browser permission API for accessing the mic
 *   2. AudioContext    — the entry point to the Web Audio API
 *   3. MediaStreamSource — wraps a mic stream as an audio node
 *   4. AnalyserNode    — gives us access to time-domain (and later frequency)
 *                        data. In Week 1 we only use time-domain.
 *   5. requestAnimationFrame — browser-paced render loop (~60 FPS)
 *
 * Software engineering note:
 *   This module exposes a small public API (start / stop) and keeps all
 *   state encapsulated in module-level variables. That's the start of
 *   modular design — a Week 2 refactor will extract the visualiser into
 *   its own module so we can swap waveform → frequency-bar visualisations
 *   without touching the audio capture code (separation of concerns).
 */

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {AudioContext | null} */
let audioContext = null;

/** @type {MediaStream | null} */
let mediaStream = null;

/** @type {AnalyserNode | null} */
let analyser = null;

/** @type {Uint8Array | null} */
let timeDomainData = null;

/** @type {number | null} ID returned by requestAnimationFrame, used to cancel. */
let animationFrameId = null;

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("waveformCanvas")
);
const canvasCtx = canvas.getContext("2d");

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request mic access, wire up the Web Audio graph, and start the render loop.
 */
async function start() {
  try {
    setStatus("Requesting microphone access…");

    // 1. Ask the browser for the microphone. This prompts the user.
    //    The promise resolves with a MediaStream once they grant permission.
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // 2. Create an AudioContext. This is the central object of the Web Audio
    //    API — it represents an audio-processing graph. Browsers require it
    //    to be created in response to a user gesture (button click), which
    //    is why we don't create it on page load.
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 3. Wrap the microphone stream as an input node in the graph.
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 4. Create an AnalyserNode. This gives us read access to the audio
    //    samples passing through it.
    //
    //    fftSize controls how many samples we read per "frame":
    //      - Must be a power of 2 between 32 and 32768.
    //      - 2048 is a sensible default for waveforms — fine resolution
    //        without burning CPU.
    //    For Week 2 (frequency analysis) we'll revisit this value.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    // 5. Connect: mic → analyser. We deliberately DO NOT connect the
    //    analyser to audioContext.destination — that would route the mic
    //    back to the speakers and cause feedback howl.
    source.connect(analyser);

    // 6. Allocate a reusable buffer for sample data.
    //    `frequencyBinCount` is always fftSize / 2 for frequency data, but
    //    `getByteTimeDomainData()` fills `fftSize` entries. To keep things
    //    simple in Week 1, we use fftSize directly.
    timeDomainData = new Uint8Array(analyser.fftSize);

    // 7. Kick off the render loop.
    setStatus("Listening — speak or play audio near the mic.");
    startBtn.disabled = true;
    stopBtn.disabled = false;
    draw();
  } catch (err) {
    // Common reasons this fails:
    //   - User clicked "Block" on the permission prompt
    //   - Page is served over plain http:// (not https:// or localhost)
    //   - No microphone connected
    console.error("Failed to start audio capture:", err);
    setStatus(`Error: ${err.message}`, /* isError */ true);
    cleanup();
  }
}

/**
 * Tear down the audio graph and stop the render loop.
 */
function stop() {
  cleanup();
  setStatus("Stopped. Click 'Start microphone' to resume.");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

/**
 * Called once per browser frame (~60 FPS). Reads the latest samples from the
 * analyser and draws them as a waveform on the canvas.
 *
 * Why requestAnimationFrame and not setInterval?
 *   - The browser pauses rAF callbacks when the tab is hidden, saving CPU.
 *   - rAF is synchronised with the display's refresh rate, avoiding tearing.
 */
function draw() {
  animationFrameId = requestAnimationFrame(draw);

  // Pull the latest fftSize samples into our reusable buffer.
  // Each byte represents one audio sample, mapped to 0..255 with 128 = silence.
  analyser.getByteTimeDomainData(timeDomainData);

  // Clear the canvas with a solid background.
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the waveform as a single continuous line.
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "#4f9eff";
  canvasCtx.beginPath();

  const sliceWidth = canvas.width / timeDomainData.length;
  let x = 0;

  for (let i = 0; i < timeDomainData.length; i++) {
    // Map sample byte (0..255) → vertical position on canvas.
    // Subtracting 128 centres silence on the canvas's vertical midline.
    const v = timeDomainData[i] / 128.0; // 0..2, with 1.0 = silence
    const y = (v * canvas.height) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  // Finish at the right edge so the line spans the full width.
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Release every audio resource and stop the render loop.
 *
 * It's important to:
 *   - Cancel the animation frame so we stop calling draw() on a torn-down graph.
 *   - Stop each track on the MediaStream so the browser's mic indicator
 *     turns off (privacy + UX).
 *   - Close the AudioContext so the browser can reclaim audio-thread resources.
 */
function cleanup() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  audioContext = null;
  analyser = null;
  timeDomainData = null;

  // Clear the canvas back to black so we don't leave a frozen waveform.
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

// ---------------------------------------------------------------------------
// Wire up button handlers
// ---------------------------------------------------------------------------

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
