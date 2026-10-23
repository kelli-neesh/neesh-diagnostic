// The NEESH Diagnostic: questions, factors, scoring and on-screen wording.
// Everything Kelli might want to change lives in this file.
// The full factor paragraphs for the emailed report live in src/report-copy.js,
// so they are never sent to the browser.

// ---------------------------------------------------------------------------
// FACTORS: shown in this order everywhere.
// "questions" lists which question numbers count towards each factor.
// The mapping was inferred by theme. Change the numbers to remap.
// ---------------------------------------------------------------------------
export const FACTORS = [
  { key: "experience",       name: "Experience",       questions: [1, 2, 3] },
  { key: "demand",           name: "Demand",           questions: [4, 5, 6] },
  { key: "reach",            name: "Reach",            questions: [7, 8, 9] },
  { key: "commercial_value", name: "Commercial Value", questions: [10, 11, 12] },
  { key: "enjoyment",        name: "Enjoyment",        questions: [13, 14, 15] },
];

// ---------------------------------------------------------------------------
// SCORING
// Each question has four answers, strongest first. The first answer scores
// 3 points, the second 2, the third 1, the last 0.
// Each factor has three questions, so a factor scores 0 to 9 points.
// ---------------------------------------------------------------------------
export const POINTS = [3, 2, 1, 0];

// Factor bands, in points out of 9. No sums needed:
//
//   Points out of 9   Band     Shows as
//   0, 1, 2, 3        Low      0%, 11%, 22%, 33%
//   4, 5, 6           Medium   44%, 56%, 67%
//   7, 8, 9           High     78%, 89%, 100%
//
// To change a band, change the lowest number of points it starts at.
export const BANDS = [
  { name: "High",   fromPoints: 7 },
  { name: "Medium", fromPoints: 4 },
  { name: "Low",    fromPoints: 0 },
];

// Overall score: the average of the five factor percentages, rounded.
// Verdict: the first row whose starting percentage the overall score reaches.
//
//   Overall score   Verdict
//   65 to 100       Lean In
//   35 to 64        Sharpen
//   0 to 34         Reconsider
//
// These match Kelli's Niche Evaluation Scoring Sheet: 18 out of 25 and above
// is "Move forward", 12 to 17 is "Potential, with gaps", below 12 is
// "Something fundamental is missing". Her sheet scores 1 to 5 per factor, so
// it starts at 5, not 0: (18 - 5) / 20 = 65%, (12 - 5) / 20 = 35%.
//
// Worked example: factors of 33%, 44%, 78%, 67% and 100% average 64.4,
// which rounds to 64, which is Sharpen.
export const VERDICTS = [
  {
    name: "Lean In",
    fromPercent: 65,
    // From Kelli's scoring sheet
    line: "This has the foundations of a strong niche. The gaps that exist are manageable. Stop deliberating and start building.",
  },
  {
    name: "Sharpen",
    fromPercent: 35,
    // From Kelli's scoring sheet
    line: "Look at your lowest scoring factor. What would need to change to improve it by one point? Come back in 30 days with real data, not assumptions.",
  },
  {
    name: "Reconsider",
    fromPercent: 0,
    // From Kelli's scoring sheet
    line: "This is not necessarily a no. It is a pause. Identify what is weakest before committing significant time and energy.",
  },
];

// The most characters kept from "Describe your niche". It travels in the
// results link, so it is capped to keep links a sensible length.
export const NICHE_MAX_CHARS = 300;

// ---------------------------------------------------------------------------
// FREE RESULTS: the headline sentence shown for each factor and band.
// Each is the first sentence of Kelli's full paragraph in src/report-copy.js.
// The tests check they still match, so change both together.
// ---------------------------------------------------------------------------
export const HEADLINES = {
  experience: {
    High: "Experience is a strength.",
    Medium: "Experience is sufficient but not standout.",
    Low: "Experience is underweight.",
  },
  demand: {
    High: "Demand is strong.",
    Medium: "Demand is present but not yet robust.",
    Low: "Demand is weak.",
  },
  reach: {
    High: "Reach is strong.",
    Medium: "Reach is patchy.",
    Low: "Reach is limited.",
  },
  commercial_value: {
    High: "Commercial value is high.",
    Medium: "Commercial value is middling.",
    Low: "Commercial value is low.",
  },
  enjoyment: {
    High: "Enjoyment is high.",
    Medium: "Enjoyment is variable.",
    Low: "Enjoyment is low.",
  },
};

// ---------------------------------------------------------------------------
// QUESTIONS: answers strongest first. Keep this order; they are never shuffled.
// ---------------------------------------------------------------------------
export const QUESTIONS = [
  {
    n: 1,
    text: "How familiar are you with the way businesses in your chosen niche actually operate day to day?",
    answers: [
      "I understand the patterns, pressures and decisions they face without needing them explained.",
      "I have reasonable familiarity but there are gaps I'm still filling.",
      "I've worked with a few but I'm still learning the landscape.",
      "I don't have direct experience yet. I'm drawn to this niche but haven't worked in it.",
    ],
  },
  {
    n: 2,
    text: "How does your experience in this niche compare to a generalist accountant approaching the same client?",
    answers: [
      "Meaningfully better. I understand the context, the language and the common mistakes.",
      "Somewhat better in areas I've focused on, less so in others.",
      "Roughly similar at this stage, though I'm developing.",
      "Hard to say. I haven't yet tested the difference in practice.",
    ],
  },
  {
    n: 3,
    text: "When a client in your chosen niche describes a problem, how quickly can you add value?",
    answers: [
      "Immediately. I recognise the problem and know where to start without needing context.",
      "Fairly quickly, though some problems still require more background than I'd like.",
      "I can get there, but it takes more time than it would for a specialist.",
      "I'm still building the knowledge base. Most problems require significant groundwork first.",
    ],
  },
  {
    n: 4,
    text: "How many businesses fitting your niche exist in the market you intend to serve?",
    answers: [
      "Enough to sustain and grow a firm. New businesses enter this space regularly.",
      "A reasonable number, though I haven't fully mapped the size of the opportunity.",
      "Fewer than I'd like. The market exists but it's not large.",
      "I'm not sure. I haven't researched the market size yet.",
    ],
  },
  {
    n: 5,
    text: "Is your chosen niche growing, stable, or contracting?",
    answers: [
      "Growing. New businesses are entering the space and demand for advice is increasing.",
      "Stable. The market isn't shrinking but it isn't expanding dramatically either.",
      "Hard to read. There are signals in both directions.",
      "Contracting or unclear. I have concerns about the long-term trajectory.",
    ],
  },
  {
    n: 6,
    text: "Are the problems your niche faces ongoing, or do they tend to be one-off?",
    answers: [
      "Ongoing. The complexity, regulation or growth patterns create recurring financial needs.",
      "Mostly ongoing, with some one-off elements depending on the client's stage.",
      "A mix. Some recurring needs but not as consistently as I'd want.",
      "Largely one-off at this stage. I haven't identified the recurring need clearly yet.",
    ],
  },
  {
    n: 7,
    text: "Does your chosen niche have existing communities, associations, events or publications you could show up in?",
    answers: [
      "Yes. There are active spaces where this audience already gathers and conversations already happen.",
      "Some. There are spaces but they're not particularly active or easy to access.",
      "Limited. I've identified a few but the infrastructure is thin.",
      "Not that I've found. The community doesn't seem to have obvious gathering points.",
    ],
  },
  {
    n: 8,
    text: "How straightforward would it be to get in front of your target niche without relying on referrals?",
    answers: [
      "Straightforward. There are clear channels, events and communities I could build presence in.",
      "Possible but it would take time and experimentation to find what works.",
      "Difficult. The audience is hard to reach without warm introductions.",
      "I don't yet have a clear route to reach them deliberately.",
    ],
  },
  {
    n: 9,
    text: "Are other professional services already serving this niche, creating referral networks you could become part of?",
    answers: [
      "Yes. Lawyers, advisers or consultants already serve this group and referral relationships would be natural.",
      "Some. There are adjacent professionals but the networks aren't well established.",
      "A few, though the referral ecosystem is underdeveloped.",
      "Not that I'm aware of. This niche doesn't seem to have an established professional services community around it.",
    ],
  },
  {
    n: 10,
    text: "Do businesses in your chosen niche typically have the means and willingness to invest in professional advice?",
    answers: [
      "Yes. The financial stakes are high enough that good advice is genuinely valued and paid for.",
      "Generally yes, though price sensitivity varies across the niche.",
      "Mixed. Some do, some are reluctant to invest beyond basic compliance.",
      "Unclear or unlikely. The niche operates on thin margins or has a compliance-only mindset.",
    ],
  },
  {
    n: 11,
    text: "Does working with this niche give you the opportunity to move beyond compliance into genuine advisory work?",
    answers: [
      "Yes. The decisions they face create natural opportunities for strategic advice.",
      "Sometimes. There are advisory opportunities but they're not consistent across all clients.",
      "Occasionally. Most of the work stays at compliance level with limited advisory scope.",
      "Rarely. The niche doesn't naturally create the conditions for advisory relationships.",
    ],
  },
  {
    n: 12,
    text: "How does your pricing power compare when serving this niche versus a general client base?",
    answers: [
      "Stronger. Specialism commands a premium and clients accept it because the value is clear.",
      "Slightly stronger, though I haven't yet fully tested what the market will pay.",
      "Similar. I haven't found a way to command a premium yet.",
      "Weaker. Price sensitivity in this niche makes it harder to charge appropriately.",
    ],
  },
  {
    n: 13,
    text: "How do you feel after a working session focused on clients in this niche?",
    answers: [
      "Energised. The work is genuinely interesting and the conversations leave me thinking.",
      "Generally good. There are moments of real engagement even if it's not always stimulating.",
      "Neutral. The work is fine but it doesn't particularly energise me.",
      "Drained or flat. I find the work or the conversations harder to sustain than I expected.",
    ],
  },
  {
    n: 14,
    text: "How naturally does curiosity about this niche show up for you outside of client work?",
    answers: [
      "Naturally. I find myself reading about it, noticing relevant news and thinking about it without prompting.",
      "Sometimes. Interest shows up but it's not consistent.",
      "Rarely. I engage with it when I need to but it doesn't pull my attention otherwise.",
      "It doesn't. I don't find myself drawn to this niche beyond the work itself.",
    ],
  },
  {
    n: 15,
    text: "If you were serving only this type of client for the next three years, how would that feel?",
    answers: [
      "Good. The prospect of going deeper into this niche feels right, not limiting.",
      "Probably fine, though I have some reservations I haven't fully resolved.",
      "Uncertain. The idea is appealing in theory but I'm not sure in practice.",
      "Uncomfortable. Committing to this niche for that long doesn't feel sustainable.",
    ],
  },
];

// ---------------------------------------------------------------------------
// ON-SCREEN WORDING
// Lines marked DRAFT were written for the build because the brief did not
// supply them. Kelli to check. Everything else is Kelli's wording.
// ---------------------------------------------------------------------------
export const COPY = {
  // DRAFT
  introHeading: "The NEESH Diagnostic",
  // DRAFT
  introLine: "Test your chosen niche against five factors: experience, demand, reach, commercial value and enjoyment.",
  // DRAFT
  introTime: "15 questions. About 5 minutes.",
  // DRAFT
  startButton: "Start the Diagnostic",

  nicheLabel: "Describe your niche",
  // DRAFT
  nicheHint: "Who do you serve, or want to serve? A sentence or two is plenty.",

  resultsHeading: "Congratulations on completing Your NEESH Diagnostic",
  emailedLine: "Your full report has been emailed to",
  changeEmail: "Change email address",
  resultsIntro:
    "You've finished the NEESH Diagnostic. This is your evidence-based read on your chosen niche. Review your category scores below. Each section shows where your niche stands and where focus will make the biggest difference. Read each result carefully to see the gaps and strengths before you take next steps.",

  // DRAFT
  reportHeading: "Get your full report",
  // DRAFT
  reportLine:
    "We'll email you the full read on each factor, what to do next, and how every answer you gave was scored.",
  // DRAFT, adapted from Kelli's consent line now that consent is optional
  consentLabel: "Send me follow-up emails from Neesh. I can unsubscribe at any time.",
  // DRAFT
  privacyLine: "We use your email to send your report.",
  // DRAFT
  reportButton: "Email my full report",

  bookHeading: "Next Step: Book Your Results Call",
  bookText:
    "Ready to sharpen your niche or make your next strategic move? Schedule a 1-1 results call with Kelli Doorne-Millott to review your diagnostic in detail. Get direct feedback and clarity on what to focus on next. This is the fastest way to strengthen or validate your niche before you invest more time, effort, and resources.",
  bookButton: "Book Your Results Call",
  bookSmall:
    "This call is a practical review, not a sales pitch. Bring your questions and get commercial clarity on your next move.",
};
