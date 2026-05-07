# Development Log

A running log of design decisions, implementation notes, challenges, and
reflections for the COMP4060 CPD project: Real-Time Audio Visualiser with
Backend Analytics.

This log is the primary source material for the Reflective Learning Portfolio
(due 7 June 2026).

---

## Week 1 — Research and Initial Prototype

**Dates:** May 2026
**Milestone targeted:** M1 — System Design Complete
**Proposal outcome:** Architecture + tech stack defined; basic audio capture and simple visual output.

### What was completed

1. **Tech stack selection** with documented trade-offs.
2. **Repository scaffolded** with frontend / backend / docs separation.
3. **Architecture diagram** drawn (`docs/architecture.svg`) showing the three-tier system and which week each component is added.
4. **Working prototype**: an HTML page that captures microphone audio via the Web Audio API and draws a real-time waveform on a `<canvas>` element.

### Tech stack and reasoning

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Vanilla JS + Web Audio API + Canvas | Direct access to FFT primitives; no framework abstractions to wrestle with while learning. |
| Backend | Python 3 + Flask | Lightweight; explicit about HTTP semantics; strong audio/data ecosystem (NumPy, SciPy) if extensions are added. |
| Database | PostgreSQL | Industry-standard SQL; transferable to graduate roles. |
| Cloud | AWS (EC2 + RDS) | Most common in target job ads. |
| Tools | Git, ESLint/Prettier (frontend), `black` + `flake8` (backend) | Standard quality gates. |

**Software engineering concept — technology selection**: Picking a stack is part of the architecture phase. The skill being practised here is *justifying choices against requirements*, not just picking what's familiar. This addresses JBSE 4.10 ("design from first principles" — currently *Limited*) and SWEBOK Software Architecture (currently 5/10).

### Key concepts learnt — Web Audio API

The Web Audio API is built around the idea of a **node graph**. You create
nodes (sources, filters, analysers, destinations) and connect them with
`.connect()`. Audio flows through the graph in real time, processed off the
main thread by the browser's audio engine.

For Week 1 the graph is minimal:

```
MediaStreamSource (mic)  →  AnalyserNode  →  (no destination)
```

Notably the analyser is *not* connected to `audioContext.destination`. If it
were, the mic would route to the speakers and feedback would happen
immediately. This was the first non-obvious thing learnt.

The `AnalyserNode` is the bridge between the audio engine and the rendering
code. Every animation frame, `getByteTimeDomainData()` fills a typed array
with the most recent samples, which the canvas then plots as a polyline.

`requestAnimationFrame` was preferred over `setInterval` because:
- it pauses when the tab is hidden (saves CPU and microphone resource);
- it syncs with the display refresh, avoiding tearing;
- it is the idiomatic browser primitive for animation.

### Challenges

- **HTTPS / secure context requirement**: `getUserMedia()` only works on
  `https://` pages or `localhost`. Opening the file directly via `file://`
  fails silently. Fix: always run via `python3 -m http.server`.
- **AudioContext autoplay policy**: browsers block creating an `AudioContext`
  without a user gesture. The "Start" button is a deliberate part of the UI,
  not just decoration — it satisfies that policy.
- **Resource cleanup**: stopping the mic correctly requires calling `.stop()`
  on every track *and* closing the `AudioContext`, otherwise the browser's
  recording indicator stays on. This is documented in `cleanup()` in `audio.js`.

### Design decisions

- **Module-level state vs class**: chose module-level state for now. The
  prototype is small enough that a class adds ceremony without benefit.
  Will revisit in Week 2 when a second visualiser (frequency bars) is added —
  at that point a class with a clear interface will be justified by
  separation of concerns.
- **Canvas over SVG / WebGL**: Canvas 2D is the right tool for redrawing the
  whole frame at 60 FPS with simple shapes. SVG retains a DOM element per
  shape, which is wasteful for an animated waveform; WebGL would be overkill
  at this complexity.
- **No build tooling yet**: deliberately avoiding Webpack/Vite/etc. for
  Week 1. The prototype runs from a single `python3 -m http.server` and
  three files. Adding a build step is a Week 3 problem if it becomes one.

### Mapping to learning outcomes

| Learning outcome | Week 1 evidence |
|------------------|-----------------|
| Real-time audio processing using the Web Audio API | Working `getUserMedia` → AnalyserNode → canvas pipeline. |
| Modular software design | Clear separation of `frontend/`, `backend/`, `docs/`; `audio.js` exposes only `start` / `stop`. |
| Self-learning + project management | Followed the proposed Week 1 plan; produced architecture diagram + dev log on schedule. |

Backend, database, and cloud outcomes are scheduled for later weeks per the
approved timeline.

### Open questions for next week

- What `fftSize` gives the best balance of frequency resolution vs latency
  when we move to a frequency-bar visualisation? (Will be tested in Week 2.)
- How should we smooth the bars? `AnalyserNode.smoothingTimeConstant`
  exists — what is its default and how does it interact with the render loop?
- Should the FFT visualisation use a logarithmic frequency axis (more
  perceptually accurate for music) or linear (simpler)?

### Time spent

Approximately 4 hours (target for Week 1 was around 5 hours per the 40-hour
project budget). Slightly under because Week 1 is intentionally light —
research and scaffolding rather than feature work.

---

## Week 2 — *(not yet started)*

## Week 3 — *(not yet started)*

## Week 4 — *(not yet started)*

## Week 5 — *(not yet started)*

## Week 6 — *(not yet started)*

## Week 7 — *(not yet started)*

## Week 8 — *(not yet started)*
