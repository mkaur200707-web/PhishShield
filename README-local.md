# PhishShield Bharat — React frontend

Premium React + Vite frontend for an India-focused scam awareness and message-analysis demo.

## Run locally
1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. In the terminal run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite (usually http://localhost:5173).

## Included
- Responsive landing page and dark navy / emerald dashboard
- Local rule-based message analysis with detailed indicator explanations
- Animated indicative risk meter (score is not a probability)
- Screenshot image upload and preview (OCR is not connected; paste extracted text to analyse)
- Scan history saved in browser `localStorage`, with risk filters, view and delete controls
- India-focused scam awareness centre with practical safety tips
- Mobile navigation

## Important demo limitations
- Analysis runs in the browser using simple demonstration rules. It is not connected to Gemini, Flask, a database, OCR, or URL reputation services.
- URL mode currently applies the demo text rules; it does not verify website reputation or visit the URL.
- Scan history stays in the current browser/device and can be removed if browser site data is cleared. It is not synced across devices.
- Do not enter real personal, banking, OTP, or password information. Risk scores are illustrative and are not a guarantee of safety or fraud.

## Suggested next integration steps
Move analysis to a Flask API, add Gemini contextual analysis server-side, implement screenshot OCR, validate URLs with a trusted threat-intelligence source, and add privacy-conscious user-consented server-side history if accounts are introduced.
