# Implementation Plan

[Overview]
Unified deployment of React frontend and Flask backend in a single Render web service container by building the Vite frontend during Docker build and serving static assets directly via Flask.

[Types]
- No new types or database schema changes required.

[Files]
- `/workspaces/Dockerfile.render`: Update to install Node.js and build frontend assets (`npm install && npm run build`).
- `/workspaces/src/app.py`: Add static route handling to serve built React files and handle SPA client-side routing fallback (`index.html`).

[Functions]
- Catch-all static file serving route in `/workspaces/src/app.py`.

[Classes]
- None.

[Dependencies]
- Node.js & npm (added in Dockerfile.render).

[Testing]
- Verify local frontend build and Flask static routing.

[Implementation Order]
1. Update Dockerfile.render.
2. Update src/app.py.
3. Test build and deployment configuration.
