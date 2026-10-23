// Kelli's full factor paragraphs. Used only in the emailed report, so they
// stay on the server and never reach the browser. Keep this wording exactly.
// The first sentence of each must match HEADLINES in public/lib/config.js.

export const FACTOR_COPY = {
  experience: {
    High: "Experience is a strength. You bring clear, relevant background to this niche. Clients will see you as credible and capable. Tighten your messaging to showcase this more directly. Keep collecting new stories and outcomes. Even strong experience can be sharpened; stay visible and specific.",
    Medium: "Experience is sufficient but not standout. You have some wins or relevant background, but it's not yet a clear differentiator. Identify where your story overlaps with the niche's big pain points. Build more visible proof, such as client outcomes, published insights, or relevant certifications. Keep closing the credibility gap.",
    Low: "Experience is underweight. You lack the depth or track record in this niche that clients expect. This gap increases risk and slows trust. Build case studies, testimonials, or relevant project history. Consider partnering with someone who brings stronger credibility to the table.",
  },
  demand: {
    High: "Demand is strong. The niche is active, with visible pain points and buyers seeking solutions. Leverage this momentum with targeted outreach and tight offers. Keep tracking demand trends and remain alert for shifts. Even in hot markets, demand can move quickly. Don't get complacent.",
    Medium: "Demand is present but not yet robust. There's some traction but not enough to drive consistent growth. Investigate segments within the niche that have stronger needs. Test messaging and offers to find higher-conversion angles. Monitor demand signals closely before you double down.",
    Low: "Demand is weak. The market is not showing clear signs of pain or urgency. Hard to grow in a niche without active need. Revalidate the core problems your service solves. Talk to prospects and review industry signals. If demand stays flat, consider pivoting or reframing your offer.",
  },
  reach: {
    High: "Reach is strong. You are present in the right channels and can consistently access your ideal clients. Tighten your process for nurturing and converting leads. Look for niche-specific platforms or referral loops to make reach even more efficient. Stay proactive to avoid reach decay over time.",
    Medium: "Reach is patchy. You have some access but not at scale or consistency. Identify the channels that work and double down. Eliminate wasted effort on low-value routes. Test partnerships to accelerate access. Getting to critical mass is the next step.",
    Low: "Reach is limited. Not enough access to decision-makers or channels that matter. Growth will be slow unless you open new routes in. Map out key associations, events, or influencers. Build or buy access where possible. Without better reach, even a good offer will stall.",
  },
  commercial_value: {
    High: "Commercial value is high. The niche supports premium pricing or scalable offers. Protect your margins and avoid commoditisation. Invest in service innovation and client experience to reinforce pricing power. Keep testing for new high-value problems to solve.",
    Medium: "Commercial value is middling. You can generate revenue but may struggle to scale profitably. Pressure test your pricing and service mix. Find upsell or cross-sell opportunities. Strengthen your value proposition to move up the value ladder.",
    Low: "Commercial value is low. The niche does not support strong pricing or healthy margins. Hard to build a high-value firm here. Review the economics. Can you reposition or repackage for better value? If not, consider higher-value sub-niches or related problems worth solving.",
  },
  enjoyment: {
    High: "Enjoyment is high. You have strong intrinsic motivation and enjoy working with these clients. Protect this as you grow. Set boundaries to keep your best-fit work at the centre. Even in a good niche, burnout is possible. Stay vigilant.",
    Medium: "Enjoyment is variable. Some parts of the work are rewarding, others are draining. Identify what energises you and what doesn't. Adjust your client or service mix accordingly. Sustainable growth is easier when you enjoy the journey.",
    Low: "Enjoyment is low. You're not energised by the work or the clients. This will undermine focus and resilience over time. Be honest about whether this is the right niche for you. If enjoyment can't be raised, reconsider before investing further.",
  },
};

// The overall statement in the report email, one per verdict.
// DRAFT: written from Kelli's scoring sheet ("Move forward", "Potential, with
// gaps", "Something fundamental is missing") for Kelli to edit.
export const OVERALL_STATEMENTS = {
  "Lean In":
    "Move forward. Your niche holds up well across all five factors. It isn't perfect, and the sections below show where it is weaker, but the foundations are there, and more thinking won't make them stronger. Commit to it in public. Say who you serve on your website and on LinkedIn, and start building proof where you are weakest. Focus compounds. The sooner you start, the sooner it pays.",
  Sharpen:
    "There is potential here, with gaps. Your niche has real strengths, but at least one factor is holding it back. Don't drop the niche, and don't commit to it blindly. Find your lowest scoring factor below and work out what would improve it. Then go and get real evidence: talk to businesses in the niche, check the numbers, and find out where they gather. Take the Diagnostic again with what you've learned.",
  Reconsider:
    "Something fundamental is missing. This isn't a judgement on you or your idea. It's a read on the evidence you have today. Putting your marketing, pricing and time behind this niche now is a bigger risk than it needs to be. Find your weakest factor below and ask whether it can realistically change. If it can't, look at a related niche where you already have more experience, demand or enjoyment. Pausing now costs far less than changing direction later.",
};

// "How to test this": shown under each factor in the report email.
// Approved by Kelli 23 Oct 2026. The aim is to show how to validate a niche,
// not to dismiss it.
// Low and Medium factors get an opening line plus the guidance below.
// High factors get the short HIGH line instead.
export const VALIDATION = {
  opener: {
    Low: "{factor} is holding your score back.",
    Medium: "{factor} is not yet a clear strength.",
  },
  // DRAFT
  high: "{factor} scores high, which is a great sign. The Diagnostic only has your answers to go on, so keep checking this against what you see in real conversations with the niche.",
  guidance: {
    commercial_value:
      "That doesn't always mean the niche can't pay. It can mean the way you deliver doesn't fit what they can pay. Before you rule it out, test a different model: a fixed-fee package, a group programme, or a narrower service that solves one expensive problem well. Ask five businesses in the niche what that problem costs them today. If the numbers still don't work, you have your answer.",
    reach:
      "A niche that looks hard to reach is often one you haven't looked at closely enough yet. Spend two weeks looking: trade bodies, suppliers, the software they use, LinkedIn and Facebook groups, local events, and the advisers they already trust. Ask your existing clients in the niche where they go for ideas. If you still can't find anywhere they gather, reaching them will stay slow and expensive.",
    experience:
      "It can be built faster than most people think. Look at the clients you already have: are any of them close to this niche? Write up what you've learned, interview two or three businesses in the niche about how they work, or partner with someone who already serves them. Proof you can show is worth more than years you can claim.",
    enjoyment:
      "Take this one seriously, because you'll live with this niche every day. Notice what drains you. Is it the clients, the type of work, or the way you deliver it? Changing one of those can be enough. If it's the clients themselves, no strategy will fix that.",
    demand:
      "Check it before you trust it. Count the businesses: Companies House, trade body membership numbers and industry reports will tell you how many there are in the area you serve. Then ask a handful whether they'd pay for the help you have in mind. A small market can still work if the need is ongoing and the value is high. A shrinking one rarely does.",
  },
};

export function validationFor(f) {
  if (f.band === "High") return VALIDATION.high.replace("{factor}", f.name);
  return VALIDATION.opener[f.band].replace("{factor}", f.name) + " " + VALIDATION.guidance[f.key];
}

// Wording for the report email. DRAFT lines were written for the build;
// Kelli to check.
export const EMAIL_COPY = {
  // DRAFT
  subject: "Your NEESH Diagnostic report",
  // DRAFT. {first_name} is replaced with their first name.
  greeting: "Hi {first_name},",
  // DRAFT
  intro: "Here is your full NEESH Diagnostic report: the read on each factor, what to do next, and the answers you gave.",
  // DRAFT
  nicheLabel: "Your niche",
  // DRAFT
  overallLabel: "Overall score",
  // DRAFT
  overallStatementLabel: "What this means for your niche",
  // DRAFT
  validationLabel: "How to test this",
  // DRAFT
  breakdownLabel: "Your answers",
  // DRAFT
  answerLabel: "Your answer",
  // DRAFT
  resultsLink: "View your results page",
  // DRAFT
  footer: "You're receiving this because you asked for your NEESH Diagnostic report.",
};
