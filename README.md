# Plainpage

ATS-friendly resume maker. Collect a draft in the browser, switch among three single-column templates, rewrite summary and bullets without inventing facts, and export PDF or DOCX. No account. MongoDB is not required.

## What you get

- Builder at `/builder` with a live preview
- Templates: Classic (`classic-1`, Calibri), Traditional (`classic-2`, Times), Compact (`compact-1`, Arial)
- Hard ATS limits: one column, no tables, text boxes, icons, images, progress bars, or multi-column layouts
- Standard headings only: Summary, Experience, Projects, Education, Skills, Certifications, Achievements
- Drafts saved in `localStorage` under `resumeDraft`
- Reset restores the sample draft. Start blank clears it
- `POST /api/ai/rewrite` for summary, bullet, and section rewrites, rate limited
- `POST /api/export/pdf` via Puppeteer
- `POST /api/export/docx` via the `docx` library, headings and bullets, no tables

## Setup

Requires Node.js 20+.

```bash
cd resume-maker
npm install
cp server/.env.example server/.env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

`npm install` at the root installs both workspaces. `npm run dev` starts the Vite client on port 5173 and the Express API on port 5000. The client calls `/api` and Vite proxies that to the server, so the browser never needs to talk to port 5000 directly.

PDF export needs the Chrome build that Puppeteer downloads during install. The first PDF can take a few seconds while Chrome starts. If Chrome fails to launch with a missing `.so` library, install the dependencies listed in the [Puppeteer troubleshooting guide](https://pptr.dev/troubleshooting). On Linux, metric-compatible fonts improve the PDF:

```bash
sudo apt-get install -y fonts-crosextra-carlito fonts-liberation
```

Carlito stands in for Calibri. Liberation Sans and Liberation Serif stand in for Arial and Times.

## AI rewrite

All model calls stay on the server. Set these in `server/.env`:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

`AI_BASE_URL` can be any OpenAI-compatible `/v1` endpoint. If `AI_API_KEY` is empty, `/api/ai/rewrite` still returns the required JSON using a local rewriter. It tightens wording, refuses invented numbers, and suggests metric placeholders. It is not a substitute for a live model. The builder shows which mode is active.

The rewrite endpoint is limited to 30 requests per 15 minutes per IP.

The model is called with a fixed system prompt and a user prompt built from `mode`, `targetRole`, `jobDescription`, `existingSkills`, and `constraints`. The response must be JSON with `rewritten`, `keywords`, and `warnings`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Install root, client, and server dependencies |
| `npm run dev` | Client and server together |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | API only |
| `npm run start -w server` | API without file watch |

## API

`GET /api/health`

`GET /api/ai/status` → `{ mode: "live" | "local", model }`

`POST /api/ai/rewrite`

```json
{
  "mode": "summary",
  "text": "string",
  "targetRole": "string",
  "jobDescription": "string",
  "existingSkills": [],
  "constraints": {
    "noFabrication": true,
    "maxChars": 350,
    "tone": "professional",
    "bulletStyle": "achievement"
  }
}
```

`POST /api/export/pdf` and `POST /api/export/docx`

```json
{ "resumeData": {}, "templateId": "classic-1" }
```

Responses are file attachments.

`POST /api/parse/resume` — upload an existing resume and turn it into editable Resume JSON.

- `Content-Type: multipart/form-data` with `file` (PDF or DOCX, max 5MB) plus optional `targetRole` and `jobDescription` text fields.
- Success: `{ "resumeData": { …exact app schema… }, "warnings": ["…"] }`. Failure: `{ "error": "message" }`.
- Text is extracted with `pdf-parse` (PDF) or `mammoth` (DOCX), then structured by the live model when `AI_API_KEY` is set — using a parser system prompt that forbids fabrication — or by a built-in local parser otherwise. Unknown fields stay `""`/`[]`; nothing is invented. Rate limited to 10 uploads per 15 minutes.

## Download and upload in the builder

- **Export PDF / Export DOCX** render the selected template on the server and download it; a toast confirms success and shows the server's error message on failure.
- **Download JSON** saves the current `resumeData` object as `resumeData.json` straight from the browser (no server call).
- **Upload resume** accepts PDF, DOCX, or a `.json` file that already matches the app schema. Parsed content is shown in a "Replace current resume with uploaded resume?" confirmation with the parser's warnings before anything changes. Replace fills every form field and the preview, and saves to `resumeDraft` like manual edits.

## Persistence

The MVP does not use MongoDB. Refreshing the builder restores `resumeDraft` from this browser. Clearing site data, or choosing Start blank / Restore sample, replaces that draft.

## Project layout

```
resume-maker/
  client/     React + Vite + Tailwind + React Hook Form + Zod + Zustand
  server/     Express, AI rewrite, Puppeteer PDF, DOCX
```
