const { desktopCapturer, screen } = require("electron");
const { getSetting } = require("./database");

let lastScreenHash = "";

/**
 * Capture the primary display and return a base64-encoded PNG.
 * Returns null if screen capture is disabled or screen hasn't changed enough.
 */
async function captureScreen() {
  const enabled = getSetting("privacy_screen_capture");
  if (enabled === "false") return null;

  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: Math.round(width / 2), height: Math.round(height / 2) },
    });

    if (!sources || sources.length === 0) return null;

    const source = sources[0];
    const image = source.thumbnail;

    if (image.isEmpty()) return null;

    const pngBuffer = image.toPNG();
    const base64 = pngBuffer.toString("base64");

    // Simple change detection via hash of first 1000 bytes
    const quickHash = simpleHash(base64.substring(0, 2000));
    if (quickHash === lastScreenHash) {
      return null; // Screen hasn't changed
    }
    lastScreenHash = quickHash;

    return {
      base64,
      width: Math.round(width / 2),
      height: Math.round(height / 2),
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error("[CaptureEngine] Error capturing screen:", err.message);
    return null;
  }
}

/**
 * Send the screenshot to an AI vision model and get a concise context description.
 */
async function analyzeScreenContext(captureData) {
  const apiKey = getSetting("api_key");
  const provider = getSetting("api_provider") || "openai";

  if (!apiKey) {
    // Return a mock analysis for demo/testing
    return mockAnalysis();
  }

  try {
    if (provider === "openai") {
      return await analyzeWithOpenAI(apiKey, captureData);
    }
    // Fallback: mock
    return mockAnalysis();
  } catch (err) {
    console.error("[CaptureEngine] AI analysis error:", err.message);
    return mockAnalysis();
  }
}

async function analyzeWithOpenAI(apiKey, captureData) {
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe in 1-2 sentences what the user appears to be working on. Include: the app name visible, the type of work (writing a doc, reviewing code, in a meeting, browsing Slack, designing in Figma, looking at analytics, etc.), and any visible product/business context. Be concise. Respond with JSON: {"app": "...", "work_type": "...", "topics": ["..."], "description": "..."}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${captureData.base64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content || "";

  try {
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to text parsing
  }

  return {
    app: "unknown",
    work_type: "general",
    topics: [],
    description: text,
  };
}

function mockAnalysis() {
  const scenarios = [
    {
      app: "Google Docs",
      work_type: "writing a product spec",
      topics: ["product spec", "prd", "requirements", "planning"],
      description: "User is writing a product requirements document in Google Docs.",
    },
    {
      app: "Figma",
      work_type: "designing a user interface",
      topics: ["design", "figma", "ui", "prototype"],
      description: "User is designing a user interface in Figma.",
    },
    {
      app: "Slack",
      work_type: "messaging in a product channel",
      topics: ["slack", "communication", "team", "product"],
      description: "User is reading messages in a Slack product channel.",
    },
    {
      app: "Linear",
      work_type: "managing tasks and tickets",
      topics: ["linear", "tickets", "backlog", "sprint planning", "prioritization"],
      description: "User is reviewing and prioritizing tickets in Linear.",
    },
    {
      app: "Amplitude",
      work_type: "reviewing analytics",
      topics: ["analytics", "metrics", "dashboard", "data", "funnel"],
      description: "User is looking at analytics dashboards in Amplitude.",
    },
    {
      app: "Notion",
      work_type: "writing a strategy document",
      topics: ["strategy", "planning", "roadmap", "notion"],
      description: "User is working on a strategy document in Notion.",
    },
    {
      app: "Calendar",
      work_type: "reviewing meeting schedule",
      topics: ["meeting", "1:1", "calendar", "schedule"],
      description: "User is reviewing their meeting schedule in Calendar.",
    },
  ];

  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

module.exports = { captureScreen, analyzeScreenContext };
