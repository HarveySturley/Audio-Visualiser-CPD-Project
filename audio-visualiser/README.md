# Real-Time Audio Visualiser with Backend Analytics

A full-stack web application that captures microphone audio, processes it in real-time using FFT (Fast Fourier Transform), visualises the result in the browser, and stores session analytics via a Flask backend with PostgreSQL.

Developed as a Continuing Professional Development (CPD) project for **COMP4060 Advanced Software Engineering** at Macquarie University.

**Author:** Harvey Sturley (47737085)
**Session:** 2026 Session 1

---

## Project Goals

- Implement real-time audio processing using the Web Audio API and FFT
- Develop a RESTful backend API for storing session data
- Integrate PostgreSQL for persistent storage of session analytics
- Deploy the full system to AWS
- Apply modular software design principles across frontend and backend

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Vanilla JS, HTML5 Canvas, Web Audio API | Direct access to FFT primitives; no framework overhead during learning |
| Backend | Python 3 + Flask | Lightweight, explicit, strong audio/data ecosystem |
| Database | PostgreSQL | Industry-standard relational DB; transferable SQL skills |
| Cloud | AWS (EC2 + RDS) | Most common cloud platform in target job listings |

## Project Structure

```
audio-visualiser/
├── frontend/        # Browser client — Web Audio capture + visualisation
├── backend/         # Flask REST API
├── docs/            # Architecture diagrams, dev log, design decisions
└── README.md
```

## Running the Project (Week 1 prototype)

The Week 1 prototype is frontend-only. To run it:

```bash
cd frontend
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser and grant microphone permission.

> **Note:** The Web Audio API requires HTTPS *or* `localhost`. Opening the HTML file directly via `file://` will not work for microphone access.

## Development Status

See [`docs/devlog.md`](docs/devlog.md) for a week-by-week development log.

| Week | Status | Milestone |
|------|--------|-----------|
| 1 | ✅ In progress | M1: System Design + Initial Prototype |
| 2 | ⬜ Not started | M2: Visualiser Functional |
| 3 | ⬜ Not started | M3: Frontend Complete |
| 4 | ⬜ Not started | M4: Backend Operational |
| 5 | ⬜ Not started | M5: Full Integration |
| 6 | ⬜ Not started | M6: Deployment Complete |
| 7 | ⬜ Not started | M7: Final System |
