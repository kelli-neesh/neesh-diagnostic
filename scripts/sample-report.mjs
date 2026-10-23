// Writes sample-report.html: the email GHL would send, for a made-up answer set.
// Run: npm run sample-report
import { writeFileSync } from "node:fs";
import { buildReport } from "../src/report.js";
import { encodeToken } from "../public/lib/token.js";

const answers = [0, 3, 3, 0, 2, 3, 0, 0, 2, 1, 1, 1, 0, 0, 0];
const niche = "Independent dental practices in the Midlands";
const base = process.argv[2] || "https://diagnostic.neesh.agency";
const r = buildReport({
  answers, niche, firstName: "Sam",
  bookingUrl: "", privacyUrl: "https://neesh.agency/privacy",
  resultsUrl: `${base}/?r=${encodeToken(answers, niche)}`,
  logoUrl: process.argv[3] || `${base}/neesh-logo-white.png`,
});
writeFileSync("sample-report.html", r.html);
console.log("Wrote sample-report.html. Subject:", r.subject);
