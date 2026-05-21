/**
 * AudioEngine — owns microphone capture and FFT analysis.
 * ==========================================================================
 *
 * Design intent (Week 2 refactor):
 *   In Week 1, audio.js mixed three responsibilities — capturing audio,
 *   reading samples, and drawing them. That was fine for one visualisation.
 *   Now that we have TWO visualisations (waveform + frequency bars), that
 *   coupling becomes a problem: the drawing code and the capture code change
 *   for different reasons and at different times.
 *
 *   This class isolates ONE responsibility: get audio in, expose analysis
 *   data out. It does not touch the canvas or the DOM. A visualiser asks it
 *   for data; how that data is drawn is none of the engine's business.
 *
 *   This is "separation of concerns" — and crucially, we're doing it because
 *   a real new requirement forced it, not for its own sake.
 *
 * Public API:
 *   await engine.start()              — request mic, build the audio graph
 *   engine.stop()                     — tear everything down
 *   engine.getTimeDomainData()        — Uint8Array of waveform samples
 *   engine.getFrequencyData()         — Uint8Array of FFT magnitudes (bins)
 *   engine.frequencyBinCount          — number of frequency bins
 *   engine.sampleRate                 — audio sample rate (Hz)
 *   engine.setFftSize(size)           — change FFT resolution live
 *   engine.setSmoothing(value)        — change temporal smoothing live
 *   engine.isRunning                  — boolean
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this._audioContext = null;
    /** @type {MediaStream | null} */
    this._mediaStream = null;
    /** @type {AnalyserNode | null} */
    this._analyser = null;
    /** @type {Uint8Array | null} Reused buffer for time-domain samples. */
    this._timeDomainBuffer = null;
    /** @type {Uint8Array | null} Reused buffer for frequency bins. */
    this._frequencyBuffer = null;

    // Configuration. These are applied to the analyser on start, and can be
    // changed live afterwards via the setters.
    this._fftSize = 2048;
    this._smoothing = 0.8;
  }

  get isRunning() {
    return this._audioContext !== null && this._audioContext.state !== "closed";
  }

  get frequencyBinCount() {
    return this._analyser ? this._analyser.frequencyBinCount : 0;
  }

  get sampleRate() {
    return this._audioContext ? this._audioContext.sampleRate : 0;
  }

  /**
   * Request microphone access and wire up the Web Audio graph:
   *   MediaStreamSource (mic) -> AnalyserNode
   * (Deliberately NOT connected to destination — that would cause feedback.)
   *
   * @throws if the user denies permission or no mic is available.
   */
  async start() {
    if (this.isRunning) return;

    this._mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    this._audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const source = this._audioContext.createMediaStreamSource(
      this._mediaStream,
    );

    this._analyser = this._audioContext.createAnalyser();
    this._analyser.fftSize = this._fftSize;
    this._analyser.smoothingTimeConstant = this._smoothing;

    source.connect(this._analyser);

    // Allocate reusable buffers sized to the current analyser config.
    // We reuse these every frame rather than allocating new arrays, which
    // would create garbage-collector pressure at 60 FPS.
    this._allocateBuffers();
  }

  /**
   * Release the microphone, close the audio context, and clear state.
   * Safe to call even if not running.
   */
  stop() {
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach((track) => track.stop());
      this._mediaStream = null;
    }

    if (this._audioContext && this._audioContext.state !== "closed") {
      this._audioContext.close();
    }

    this._audioContext = null;
    this._analyser = null;
    this._timeDomainBuffer = null;
    this._frequencyBuffer = null;
  }

  /**
   * Fill and return the time-domain (waveform) buffer.
   * Each value is 0..255 with 128 representing silence.
   * @returns {Uint8Array}
   */
  getTimeDomainData() {
    if (!this._analyser) return new Uint8Array(0);
    this._analyser.getByteTimeDomainData(this._timeDomainBuffer);
    return this._timeDomainBuffer;
  }

  /**
   * Fill and return the frequency-domain (FFT magnitude) buffer.
   * Each value is 0..255 representing the strength of that frequency bin.
   * @returns {Uint8Array}
   */
  getFrequencyData() {
    if (!this._analyser) return new Uint8Array(0);
    this._analyser.getByteFrequencyData(this._frequencyBuffer);
    return this._frequencyBuffer;
  }

  /**
   * Change the FFT size live. Must be a power of 2 between 32 and 32768.
   * Larger = finer frequency resolution but slower time response.
   * @param {number} size
   */
  setFftSize(size) {
    this._fftSize = size;
    if (this._analyser) {
      this._analyser.fftSize = size;
      this._allocateBuffers();
    }
  }

  /**
   * Change temporal smoothing live. 0 = raw/jittery, ~0.9 = smooth/laggy.
   * @param {number} value 0..1
   */
  setSmoothing(value) {
    this._smoothing = value;
    if (this._analyser) {
      this._analyser.smoothingTimeConstant = value;
    }
  }

  /**
   * (Re)allocate the sample buffers to match the current analyser config.
   * Called on start and whenever fftSize changes.
   * @private
   */
  _allocateBuffers() {
    if (!this._analyser) return;
    // Time-domain data fills fftSize entries.
    this._timeDomainBuffer = new Uint8Array(this._analyser.fftSize);
    // Frequency data fills frequencyBinCount (= fftSize / 2) entries.
    this._frequencyBuffer = new Uint8Array(this._analyser.frequencyBinCount);
  }
}
