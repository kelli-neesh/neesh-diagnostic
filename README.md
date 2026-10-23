# The NEESH Diagnostic

A niche strategy questionnaire at **diagnostic.neesh.agency**. A UK accounting firm owner describes their niche, answers 15 questions, and gets free results on screen: an overall score, a verdict and a score for each of five factors. If they give their name and email, GHL emails them the full report.

It is a standalone app. It does not scan websites and has no connection to any other Neesh app.

## What's free and what's in the report

| On screen, no email needed | In the emailed report |
|---|---|
| Their niche, quoted | Everything on screen |
| Overall score (donut) and verdict | Kelli's full paragraph for each factor |
| Each factor: percentage, band, and the first sentence of Kelli's paragraph | Each question and the answer they picked (no points shown) |
| Booking call section | Booking call section |

The full paragraphs live only on the server (`src/report-copy.js`), so they never reach the browser.

## What's in here

| Path | What it is |
|---|---|
| `public/lib/config.js` | **The file to edit.** Questions, which question counts towards which factor, points, bands, verdicts, and on-screen wording |
| `src/report-copy.js` | Kelli's full factor paragraphs and the email wording |
| `public/index.html`, `public/app.js`, `public/styles.css` | The page |
| `public/neesh-logo-white.png` | The logo |
| `src/worker.js` | The small server: `/api/settings` and `/api/submit` (sends to GHL) |
| `src/report.js` | Builds the report email |
| `test/` | Tests (`npm test`) |
| `wrangler.toml` | Cloudflare settings: booking link, privacy link, results address |

## How scoring works

The five factors run in CREED order everywhere, questions included: Commercial Value (questions 1 to 3), Reach (4 to 6), Experience (7 to 9), Enjoyment (10 to 12), Demand (13 to 15).

Each answer scores 3, 2, 1 or 0 points, strongest first. Each factor has three questions, so 0 to 9 points.

| Points out of 9 | Band | Shows as |
|---|---|---|
| 0 to 3 | Low | 0%, 11%, 22%, 33% |
| 4 to 6 | Medium | 44%, 56%, 67% |
| 7 to 9 | High | 78%, 89%, 100% |

The overall score is the average of the five factor percentages, rounded.

| Overall score | Verdict |
|---|---|
| 65 to 100 | Lean In |
| 35 to 64 | Sharpen |
| 0 to 34 | Reconsider |

The verdict cut-offs and lines come from Kelli's Niche Evaluation Scoring Sheet (18 and 12 out of 25, converted to percentages). The band cut-offs were assumptions because the ScoreApp numbers weren't captured. Change them in `public/lib/config.js`. Run `npm test` after any change: the tests will fail if the expected results no longer match, so update the expected numbers in `test/scoring.test.mjs` to your new rules.

## Results links

The link looks like `diagnostic.neesh.agency/?r=1...`. It holds the 15 answers and the niche description (capped at 300 characters). It never holds a name or email. There is no database.

## Publishing

Publishing is manual and runs from GitHub. Pushing code never publishes.

1. Open the repo's **Actions** tab.
2. Pick **Publish diagnostic.neesh.agency**, click **Run workflow**, type `PUBLISH`, and run it.
3. The tests run first. If they pass, it publishes to Cloudflare and sets up diagnostic.neesh.agency.

This needs two repository secrets (Settings, Secrets and variables, Actions): `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Until GHL is connected, submitting an email works but nothing is sent. The payload is written to the Worker's logs instead.

To try it on your own computer: `npm install`, `npm run dev`, then open http://localhost:8787.

### Settings (in `wrangler.toml`, then publish again)

| Setting | What it does | Now |
|---|---|---|
| `BOOKING_URL` | The "Book Your Results Call" button, on screen and in the email | Empty (button shows but goes nowhere) |
| `PRIVACY_URL` | Privacy links | https://neesh.agency/privacy |
| `RESULTS_BASE_URL` | Start of the results link in emails | Empty (uses the address the visitor is on) |
| `GHL_WEBHOOK_URL` | Where submissions go. A secret: in Cloudflare, Workers & Pages, neesh-diagnostic, Settings, Variables and Secrets, add a Secret | Not set |

## What to create in GHL

1. **Workflow** with an **Inbound Webhook** trigger. Copy its URL and add it in Cloudflare as the secret `GHL_WEBHOOK_URL` (Workers & Pages, neesh-diagnostic, Settings, Variables and Secrets).
2. Submit one test report from the live page so GHL learns the fields.
3. In the workflow, **create or update the contact** from `first_name` and `email`.
4. **Custom fields** to map, one per payload field:

   | Field | Example |
   |---|---|
   | `niche_description` | Independent dental practices in the Midlands |
   | `score_experience`, `score_demand`, `score_reach`, `score_commercial_value`, `score_enjoyment` | 33 (a percentage) |
   | `band_experience`, `band_demand`, `band_reach`, `band_commercial_value`, `band_enjoyment` | Low, Medium or High |
   | `overall_score` | 64 |
   | `verdict` | Lean In, Sharpen or Reconsider |
   | `results_url` | Link back to their free results page |
   | `completed_at` | 2026-10-23T12:00:00.000Z |
   | `source` | neesh-diagnostic |

5. **Tags**:
   - `neesh-diagnostic` on everyone
   - One per verdict, for example `diagnostic-lean-in`, `diagnostic-sharpen`, `diagnostic-reconsider` (branch on `verdict`)
   - `consent_tag` as a tag: it is either `diagnostic-marketing-ok` or `diagnostic-no-marketing`
   - If `email_corrected` is true, tag `diagnostic-email-corrected`. This person fixed their address after a first send, so the earlier contact may be a fake address you can delete.
6. **The results email**: a Send Email action using `email_subject` as the subject and `report_html` as the body. That is the finished, branded report. `report_text` is a plain-text version if needed.
7. **Follow-up emails**: only add the contact to marketing or nurture emails when `marketing_consent` is true.
8. **Booking calendar**: put its link in `BOOKING_URL` in `wrangler.toml` and publish again.

## Wording to check

Lines marked `DRAFT` in `public/lib/config.js` and `src/report-copy.js` were written for the build because the brief didn't supply them: the intro screen, the niche hint, the "Get your full report" box, the follow-up consent line, and the email subject, greeting and labels.

## Good to know

- **No analytics, no cookies.** The only third party loaded is Google Fonts.
- **Nothing is stored.** Names and emails pass straight through to GHL.
- **Bots:** a hidden form field catches simple bots. There is no rate limit, as nothing costs money per submission.
- **The report can only be unlocked by email.** Because the report is built on the server and sent to GHL, it can't be revealed by editing the link.
