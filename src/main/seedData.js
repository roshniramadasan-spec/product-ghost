/**
 * 20 curated frameworks from Lenny Rachitsky's podcast & newsletter archive.
 * Each entry includes context_triggers used for keyword-level pre-filtering
 * before semantic similarity ranking.
 */
const seedEntries = [
  {
    id: "001",
    guest: "Shreyas Doshi",
    episode: "How to be more strategic",
    framework: "LNO Framework",
    tags: ["prioritization", "strategy", "time-management"],
    podcast_url: "https://www.lennysnewsletter.com/p/how-to-be-more-strategic-shreyas-doshi",
    quote:
      "Categorize every task as Leverage, Neutral, or Overhead. Spend 80% of your energy on Leverage tasks — they have 10x the impact of everything else.",
    advice:
      "When you're drowning in tasks, apply the LNO framework: label each task as Leverage (10x impact), Neutral (expected value), or Overhead (must-do but low impact). Then ruthlessly protect time for Leverage work.",
    context_triggers: [
      "task list", "prioritization", "todo", "jira", "linear", "asana",
      "trello", "backlog", "sprint planning", "tickets",
    ],
  },
  {
    id: "002",
    guest: "Brian Chesky",
    episode: "Founder Mode",
    framework: "Founder Mode",
    tags: ["leadership", "management", "culture", "founder"],
    podcast_url: "https://www.lennysnewsletter.com/p/founder-mode-brian-chesky",
    quote:
      "The conventional wisdom of 'hire good people and get out of their way' doesn't always work. Sometimes you need to go deep into the details.",
    advice:
      "Don't delegate everything — stay close to the product details that matter most. Great founders toggle between high-level vision and granular execution.",
    context_triggers: [
      "figma", "design review", "product review", "leadership",
      "delegation", "management", "roadmap", "vision",
    ],
  },
  {
    id: "003",
    guest: "Bangaly Kaba",
    episode: "The Adjacent User Theory",
    framework: "The Adjacent User",
    tags: ["growth", "users", "expansion", "product-market-fit"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-adjacent-user-theory",
    quote:
      "Your next phase of growth comes from the Adjacent User — someone who is aware of your product, maybe even tried it, but isn't a power user yet.",
    advice:
      "Identify the Adjacent User: someone at the edge of your current user base who faces specific barriers to adoption. Remove those barriers to unlock your next growth wave.",
    context_triggers: [
      "growth", "funnel", "activation", "onboarding", "churn",
      "conversion", "analytics", "amplitude", "mixpanel", "user segments",
    ],
  },
  {
    id: "004",
    guest: "Bob Moesta",
    episode: "Demand-Side Sales & JTBD",
    framework: "Jobs to Be Done",
    tags: ["user-research", "customer-interviews", "product-discovery"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-jobs-to-be-done-framework-bob-moesta",
    quote:
      "People don't buy products. They hire them to make progress in their lives. Understand the Job, and the solution becomes obvious.",
    advice:
      "Frame every product decision around the Job to Be Done: What progress is the user trying to make? What are they switching from? What anxieties hold them back?",
    context_triggers: [
      "user research", "customer interview", "survey", "feedback",
      "user needs", "persona", "dovetail", "typeform",
    ],
  },
  {
    id: "005",
    guest: "April Dunford",
    episode: "Obviously Awesome",
    framework: "Obviously Awesome Positioning",
    tags: ["positioning", "marketing", "messaging", "strategy"],
    podcast_url: "https://www.lennysnewsletter.com/p/positioning-april-dunford",
    quote:
      "Positioning is the act of deliberately defining how you are the best at something that a well-defined audience cares a lot about.",
    advice:
      "Re-examine your positioning: What's your competitive alternative? What unique attributes do you have? What value do those enable? Who cares the most? What market context makes this obvious?",
    context_triggers: [
      "positioning", "messaging", "landing page", "marketing",
      "competitive analysis", "pitch deck", "website copy", "homepage",
    ],
  },
  {
    id: "006",
    guest: "Lenny Rachitsky",
    episode: "The Racecar Growth Framework",
    framework: "Racecar Growth Framework",
    tags: ["growth", "strategy", "acquisition", "retention"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-racecar-growth-framework",
    quote:
      "Think of growth as a racecar: you need an engine (growth loops), turbo boosts (one-time accelerants), lubricants (optimizations), and fuel (investment).",
    advice:
      "Map your growth to the Racecar framework — identify your core engine (viral, content, paid, sales), add turbo boosts (launches, PR), optimize with lubricants (conversion), and fuel with investment.",
    context_triggers: [
      "growth strategy", "acquisition", "viral", "referral",
      "growth loops", "marketing strategy", "channel", "CAC",
    ],
  },
  {
    id: "007",
    guest: "Sean Ellis",
    episode: "Finding Product-Market Fit",
    framework: "ICE Scoring",
    tags: ["prioritization", "experimentation", "growth"],
    podcast_url: "https://www.lennysnewsletter.com/p/finding-product-market-fit-sean-ellis",
    quote:
      "Score every idea by Impact, Confidence, and Ease. It gives you a fast, democratic way to prioritize experiments.",
    advice:
      "Use ICE scoring (Impact × Confidence × Ease) to quickly rank competing ideas. It's especially powerful for growth experiments where speed matters more than precision.",
    context_triggers: [
      "experiment", "a/b test", "prioritization", "scoring",
      "hypothesis", "growth experiment", "backlog ranking",
    ],
  },
  {
    id: "008",
    guest: "Lenny Rachitsky",
    episode: "Minimum Lovable Product",
    framework: "Minimum Lovable Product",
    tags: ["shipping", "mvp", "product-development", "quality"],
    podcast_url: "https://www.lennysnewsletter.com/p/minimum-lovable-product",
    quote:
      "Don't ship a Minimum Viable Product — ship a Minimum Lovable Product. The bar isn't 'does it work?' but 'does anyone love this?'",
    advice:
      "Go beyond MVP: what's the smallest thing you can build that someone will love? Cut scope ruthlessly, but never cut the soul of the experience.",
    context_triggers: [
      "mvp", "launch", "ship", "v1", "scope", "feature cut",
      "product spec", "prd", "requirements",
    ],
  },
  {
    id: "009",
    guest: "Ian McAllister",
    episode: "Amazon's Working Backwards Process",
    framework: "Working Backwards (PR/FAQ)",
    tags: ["product-strategy", "planning", "amazon", "writing"],
    podcast_url: "https://www.lennysnewsletter.com/p/working-backwards-the-amazon-method",
    quote:
      "Start with the press release. If you can't write a compelling announcement, you don't yet understand what you're building or why it matters.",
    advice:
      "Write a mock press release before building: Who is the customer? What's the problem? What's the solution? What's the quote from a happy customer? This forces clarity of thought.",
    context_triggers: [
      "product spec", "prd", "strategy doc", "google docs",
      "notion", "planning", "press release", "product brief",
    ],
  },
  {
    id: "010",
    guest: "Intercom / Lenny Rachitsky",
    episode: "RICE: A Prioritization Framework",
    framework: "RICE Framework",
    tags: ["prioritization", "product-management", "scoring"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-rituals-of-great-teams",
    quote:
      "Reach × Impact × Confidence ÷ Effort. It's not perfect, but it forces you to think about each dimension separately instead of going with gut feel.",
    advice:
      "When debating priorities, use RICE: estimate Reach (how many users), Impact (how much per user), Confidence (how sure are you), and Effort (person-weeks). Divide to rank.",
    context_triggers: [
      "prioritization", "roadmap", "planning", "backlog",
      "jira", "linear", "product board", "feature request",
    ],
  },
  {
    id: "011",
    guest: "Jen Abel",
    episode: "Selling to Enterprise",
    framework: "Insight-Based Selling",
    tags: ["sales", "enterprise", "b2b", "go-to-market"],
    podcast_url: "https://www.lennysnewsletter.com/p/how-to-sell-your-product-jen-abel",
    quote:
      "Lead with an insight the buyer hasn't considered, not a product demo. You earn the right to sell by teaching them something new.",
    advice:
      "In enterprise sales conversations, lead with a unique insight about the buyer's world — not your product features. Teach, then sell.",
    context_triggers: [
      "sales", "enterprise", "b2b", "deal", "pipeline",
      "crm", "salesforce", "hubspot", "pitch", "demo",
    ],
  },
  {
    id: "012",
    guest: "Nir Eyal",
    episode: "Hooked: Building Habit-Forming Products",
    framework: "The Engagement Loop (Hook Model)",
    tags: ["retention", "engagement", "habits", "behavior-design"],
    podcast_url: "https://www.lennysnewsletter.com/p/how-to-build-a-habit-forming-product-nir-eyal",
    quote:
      "Every habit-forming product follows the same loop: Trigger → Action → Variable Reward → Investment. Design for all four.",
    advice:
      "Audit your product's engagement loop: What triggers bring users back? Is the core action simple enough? Does the reward vary? Does each session invest in future value?",
    context_triggers: [
      "retention", "engagement", "dau", "mau", "churn",
      "notification", "habit", "loop", "stickiness",
    ],
  },
  {
    id: "013",
    guest: "Rahul Vohra (Superhuman)",
    episode: "How Superhuman Built an Engine to Find PMF",
    framework: "Product-Market Fit Survey",
    tags: ["product-market-fit", "metrics", "survey", "growth"],
    podcast_url: "https://www.lennysnewsletter.com/p/how-superhuman-built-an-engine-to-find-product-market-fit",
    quote:
      "Ask users: 'How would you feel if you could no longer use this product?' If 40%+ say 'Very disappointed,' you have product-market fit.",
    advice:
      "Run the Sean Ellis PMF survey: if fewer than 40% of users would be 'very disappointed' without your product, you haven't hit PMF yet. Segment by persona to find where you're closest.",
    context_triggers: [
      "product-market fit", "pmf", "survey", "nps",
      "user feedback", "retention", "early stage", "startup",
    ],
  },
  {
    id: "014",
    guest: "Shreyas Doshi",
    episode: "The Art of Decision-Making",
    framework: "Speed vs. Quality Tradeoff",
    tags: ["execution", "decision-making", "speed", "quality"],
    podcast_url: "https://www.lennysnewsletter.com/p/how-to-be-more-strategic-shreyas-doshi",
    quote:
      "Most decisions are reversible. For those, optimize for speed. For the irreversible ones, slow down and get it right.",
    advice:
      "Classify decisions as one-way doors (irreversible, go slow) or two-way doors (reversible, go fast). Most teams move too slowly on two-way doors.",
    context_triggers: [
      "decision", "trade-off", "ship", "launch", "deadline",
      "debate", "alignment", "meeting", "review",
    ],
  },
  {
    id: "015",
    guest: "Christopher Lochhead",
    episode: "Category Design",
    framework: "Category Design",
    tags: ["strategy", "positioning", "market-creation"],
    podcast_url: "https://www.lennysnewsletter.com/p/category-design-christopher-lochhead",
    quote:
      "Category creators capture 76% of the total market cap in their space. Don't compete in an existing category — design a new one.",
    advice:
      "Instead of positioning against competitors, ask: can we define an entirely new category? Frame the problem differently, name it, and own the conversation.",
    context_triggers: [
      "strategy", "competitive", "market", "positioning",
      "category", "differentiation", "vision", "pitch deck",
    ],
  },
  {
    id: "016",
    guest: "Andrew Chen",
    episode: "The Cold Start Problem",
    framework: "Network Effects Playbook",
    tags: ["growth", "network-effects", "marketplace", "platform"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-cold-start-problem-andrew-chen",
    quote:
      "Every network-effect business faces the Cold Start Problem. You need to build the 'atomic network' — the smallest group that can sustain itself.",
    advice:
      "If you're building a network-effect product, focus on the atomic network first: what's the smallest viable cluster of users that creates value for each other?",
    context_triggers: [
      "marketplace", "network effect", "platform", "two-sided",
      "supply", "demand", "cold start", "community",
    ],
  },
  {
    id: "017",
    guest: "Teresa Torres",
    episode: "Continuous Discovery Habits",
    framework: "The Art of the User Interview",
    tags: ["user-research", "discovery", "interviews", "customer"],
    podcast_url: "https://www.lennysnewsletter.com/p/continuous-discovery-habits-teresa-torres",
    quote:
      "Talk to customers every week, not just during 'research phases.' The best product teams have continuous discovery habits.",
    advice:
      "Build a continuous discovery habit: talk to at least one customer per week. Ask about their recent experiences, not hypothetical futures. Map opportunities, not just solutions.",
    context_triggers: [
      "user interview", "research", "discovery", "customer call",
      "calendly", "zoom", "user testing", "usability",
    ],
  },
  {
    id: "018",
    guest: "Lenny Rachitsky",
    episode: "Metrics That Matter",
    framework: "Metrics That Matter",
    tags: ["analytics", "metrics", "kpis", "data"],
    podcast_url: "https://www.lennysnewsletter.com/p/metrics-that-matter",
    quote:
      "The best PMs distinguish between input metrics (things you can directly influence) and output metrics (the business results you want). Focus on inputs.",
    advice:
      "Track input metrics (actions you control) alongside output metrics (results you want). When an output metric drops, diagnose by inspecting your input metrics first.",
    context_triggers: [
      "analytics", "dashboard", "metrics", "kpi",
      "looker", "amplitude", "mixpanel", "tableau", "data studio", "grafana",
    ],
  },
  {
    id: "019",
    guest: "Julie Zhuo",
    episode: "The Making of a Manager",
    framework: "Building Trust in Teams",
    tags: ["management", "leadership", "trust", "team-building"],
    podcast_url: "https://www.lennysnewsletter.com/p/the-making-of-a-manager-julie-zhuo",
    quote:
      "Trust is built in small moments: following through on commitments, giving honest feedback, and admitting when you don't know something.",
    advice:
      "As a manager, build trust through consistency: do what you say you'll do, give feedback in private, praise in public, and be transparent about your own uncertainties.",
    context_triggers: [
      "1:1", "one-on-one", "meeting", "manager", "team",
      "feedback", "performance", "slack", "calendar",
    ],
  },
  {
    id: "020",
    guest: "Marty Cagan",
    episode: "Empowered Product Teams",
    framework: "The Discovery Sprint",
    tags: ["process", "discovery", "product-teams", "agile"],
    podcast_url: "https://www.lennysnewsletter.com/p/empowered-product-teams-marty-cagan",
    quote:
      "The best product teams spend at least 50% of their time on discovery — figuring out what to build — before committing to delivery.",
    advice:
      "Before jumping to build, run a discovery sprint: define the problem, explore solutions with prototypes, and validate with real users. Skip this, and you risk building the wrong thing.",
    context_triggers: [
      "sprint", "planning", "discovery", "prototype",
      "wireframe", "miro", "figjam", "kickoff", "project start",
    ],
  },
];

module.exports = { seedEntries };
