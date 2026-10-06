# K Naga Hemanth Reddy - 3D Cyber Security Portfolio

Black and red 3D portfolio: Three.js wireframe core + network nodes, matrix rain, glitch title, scanline photo frame.

- **Frontend:** HTML, CSS, JavaScript, Three.js (`frontend/`)
- **Backend:** Node.js + Express (`backend/`) - serves the site, `/api/profile`, and `/api/contact` (rate-limited, saved to `backend/data/messages.json`)

## Run locally
```bash
npm install
npm start        # http://localhost:3000
```

## Customise
- Edit your content in `backend/data/profile.json` (projects, skills, links).
- Put your resume at `frontend/assets/resume.pdf`.
- Replace `frontend/assets/photo.png` to change your photo.

## Deploy
Render / Railway / any Node host: build command `npm install`, start command `npm start`.
