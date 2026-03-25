const { desktopCapturer, screen, BrowserWindow } = require("electron");
const { getSetting } = require("./database");
const { execSync } = require("child_process");

let lastScreenHash = "";
let lastWindowTitle = "";

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

    // Simple change detection via hash of first 2000 chars
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
 * Get the foreground window title using native Windows API via PowerShell.
 * This always returns the full title (e.g., "Page Title - Google Chrome")
 * even in packaged Electron apps where desktopCapturer may truncate titles.
 */
function getActiveWindowTitleNative() {
  try {
    const ps = `Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
}
"@
$h = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[void][Win32]::GetWindowText($h, $sb, 512)
$sb.ToString()`;

    const result = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, " ")}"`, {
      encoding: "utf-8",
      timeout: 3000,
      windowsHide: true,
    });
    return result.trim() || null;
  } catch (err) {
    console.error("[CaptureEngine] Native window title error:", err.message);
    return null;
  }
}

/**
 * Detect the active window. Uses native Windows API first (full page titles),
 * falls back to desktopCapturer if native method fails.
 */
async function detectActiveWindow() {
  // Try native Windows API first — always gets the full title
  const nativeTitle = getActiveWindowTitleNative();
  if (nativeTitle) {
    const lower = nativeTitle.toLowerCase();
    // Skip our own windows
    if (!lower.includes("productghost") && !lower.includes("devtools")) {
      console.log("[CaptureEngine] Native window title:", nativeTitle);
      return nativeTitle;
    }
  }

  // Fallback: desktopCapturer
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width: 1, height: 1 },
    });

    if (!sources || sources.length === 0) return null;

    const externalWindows = sources.filter((s) => {
      const name = s.name.toLowerCase();
      if (name.includes("productghost")) return false;
      if (name.includes("devtools")) return false;
      if (name === "") return false;
      return true;
    });

    if (externalWindows.length > 0) {
      return externalWindows[0].name;
    }

    return sources[0]?.name || null;
  } catch (err) {
    console.error("[CaptureEngine] Error detecting active window:", err.message);
    return null;
  }
}

/**
 * Analyze screen context. Uses real window detection + optional AI vision.
 */
async function analyzeScreenContext(captureData) {
  // Always try to detect the real active window first
  const windowTitle = await detectActiveWindow();
  console.log("[CaptureEngine] Active window:", windowTitle);

  // Parse real context from the window title
  const realContext = parseWindowTitle(windowTitle);

  // If we have an API key and screenshot, enhance with AI vision
  const apiKey = getSetting("api_key");
  const provider = getSetting("api_provider") || "openai";

  if (apiKey && captureData) {
    try {
      if (provider === "openai") {
        const aiContext = await analyzeWithOpenAI(apiKey, captureData);
        // Merge: AI analysis is richer, but use real app name as ground truth
        return {
          app: realContext.app || aiContext.app,
          work_type: aiContext.work_type || realContext.work_type,
          topics: [...new Set([...(aiContext.topics || []), ...realContext.topics])],
          description: aiContext.description || realContext.description,
        };
      }
    } catch (err) {
      console.error("[CaptureEngine] AI analysis error:", err.message);
    }
  }

  // No API key: return real window-based context (no random mocking!)
  if (realContext.app) {
    lastWindowTitle = windowTitle;
    return realContext;
  }

  // Absolute fallback if we couldn't detect anything
  return {
    app: "Desktop",
    work_type: "general work",
    topics: ["productivity"],
    description: "User is working on their desktop.",
  };
}

/**
 * Parse a window title into structured context.
 * This is the core "no-API-needed" intelligence — maps real window titles
 * to PM-relevant context that the matching engine can use.
 */
function parseWindowTitle(title) {
  if (!title) return { app: null, work_type: "unknown", topics: [], description: "" };

  const t = title.toLowerCase();

  // ── App detection rules ──────────────────────────────────────────
  const appRules = [
    // Browsers (check URL/title patterns)
    { match: (t) => t.includes("figma.com") || t.includes("figma -") || t.includes("- figma"),
      app: "Figma", work_type: "designing", topics: ["design", "figma", "ui", "prototype", "wireframe"] },
    { match: (t) => t.includes("linear") && (t.includes("issue") || t.includes("project") || t.includes("linear app")),
      app: "Linear", work_type: "managing tasks", topics: ["linear", "tickets", "backlog", "sprint planning", "prioritization", "task list"] },
    { match: (t) => t.includes("jira") || t.includes("atlassian"),
      app: "Jira", work_type: "managing tasks", topics: ["jira", "tickets", "backlog", "sprint planning", "prioritization", "task list"] },
    { match: (t) => t.includes("asana"),
      app: "Asana", work_type: "managing tasks", topics: ["asana", "task list", "prioritization", "project management"] },
    { match: (t) => t.includes("trello"),
      app: "Trello", work_type: "managing tasks", topics: ["trello", "task list", "prioritization", "todo"] },
    { match: (t) => t.includes("notion.so") || t.includes("notion -"),
      app: "Notion", work_type: "writing a document", topics: ["notion", "planning", "strategy", "product spec", "prd"] },
    { match: (t) => t.includes("google docs") || t.includes("docs.google"),
      app: "Google Docs", work_type: "writing a document", topics: ["google docs", "product spec", "prd", "planning", "writing"] },
    { match: (t) => t.includes("google sheets") || t.includes("sheets.google"),
      app: "Google Sheets", work_type: "working with data", topics: ["analytics", "metrics", "data", "spreadsheet"] },
    { match: (t) => t.includes("google slides") || t.includes("slides.google"),
      app: "Google Slides", work_type: "making a presentation", topics: ["presentation", "pitch deck", "strategy"] },

    // Slack
    { match: (t) => t.includes("slack"),
      app: "Slack", work_type: "messaging", topics: ["slack", "communication", "team", "feedback"] },
    // Microsoft Teams
    { match: (t) => t.includes("microsoft teams") || t.includes("teams -"),
      app: "Microsoft Teams", work_type: "messaging or meeting", topics: ["meeting", "communication", "team", "1:1"] },

    // Analytics
    { match: (t) => t.includes("amplitude"),
      app: "Amplitude", work_type: "reviewing analytics", topics: ["analytics", "metrics", "dashboard", "data", "funnel", "retention"] },
    { match: (t) => t.includes("mixpanel"),
      app: "Mixpanel", work_type: "reviewing analytics", topics: ["analytics", "metrics", "dashboard", "data", "funnel"] },
    { match: (t) => t.includes("looker") || t.includes("data studio") || t.includes("metabase"),
      app: "Analytics Dashboard", work_type: "reviewing analytics", topics: ["analytics", "metrics", "dashboard", "kpi", "data"] },
    { match: (t) => t.includes("tableau"),
      app: "Tableau", work_type: "reviewing analytics", topics: ["analytics", "metrics", "dashboard", "data"] },
    { match: (t) => t.includes("grafana"),
      app: "Grafana", work_type: "monitoring dashboards", topics: ["analytics", "metrics", "dashboard", "monitoring"] },

    // Code editors
    { match: (t) => t.includes("visual studio code") || t.includes("- vscode") || t.includes("vs code"),
      app: "VS Code", work_type: "writing code", topics: ["coding", "development", "engineering"] },
    { match: (t) => t.includes("cursor"),
      app: "Cursor", work_type: "writing code", topics: ["coding", "development", "engineering"] },

    // Design
    { match: (t) => t.includes("miro"),
      app: "Miro", work_type: "whiteboarding", topics: ["miro", "figjam", "brainstorm", "discovery", "wireframe"] },
    { match: (t) => t.includes("figjam"),
      app: "FigJam", work_type: "whiteboarding", topics: ["figjam", "brainstorm", "discovery", "kickoff"] },

    // Calendar / Meetings
    { match: (t) => t.includes("calendar") || t.includes("google calendar") || t.includes("outlook calendar"),
      app: "Calendar", work_type: "reviewing schedule", topics: ["meeting", "1:1", "calendar", "schedule"] },
    { match: (t) => t.includes("zoom"),
      app: "Zoom", work_type: "in a meeting", topics: ["meeting", "1:1", "communication"] },
    { match: (t) => t.includes("google meet"),
      app: "Google Meet", work_type: "in a meeting", topics: ["meeting", "1:1", "communication"] },

    // CRM / Sales
    { match: (t) => t.includes("salesforce") || t.includes("hubspot"),
      app: "CRM", work_type: "managing sales pipeline", topics: ["sales", "crm", "pipeline", "enterprise", "deal"] },

    // Email
    { match: (t) => t.includes("gmail") || t.includes("outlook") || t.includes("mail"),
      app: "Email", work_type: "reading email", topics: ["communication", "feedback", "stakeholder"] },

    // Product tools
    { match: (t) => t.includes("productboard"),
      app: "Productboard", work_type: "managing product feedback", topics: ["feedback", "prioritization", "roadmap", "feature request"] },
    { match: (t) => t.includes("dovetail"),
      app: "Dovetail", work_type: "analyzing user research", topics: ["user research", "customer interview", "discovery"] },
    { match: (t) => t.includes("typeform") || t.includes("survey"),
      app: "Survey Tool", work_type: "working with surveys", topics: ["survey", "user research", "feedback", "nps"] },

    // Microsoft Office
    { match: (t) => t.includes("word") && (t.includes(".doc") || t.includes("microsoft word")),
      app: "Microsoft Word", work_type: "writing a document", topics: ["writing", "product spec", "prd", "planning"] },
    { match: (t) => t.includes("powerpoint") || t.includes(".pptx"),
      app: "PowerPoint", work_type: "making a presentation", topics: ["presentation", "pitch deck", "strategy"] },
    { match: (t) => t.includes("excel") || t.includes(".xlsx"),
      app: "Excel", work_type: "working with data", topics: ["analytics", "metrics", "data", "spreadsheet"] },

    // Browsers with context clues in the title
    { match: (t) => t.includes("github") || t.includes("pull request") || t.includes("merge"),
      app: "GitHub", work_type: "reviewing code", topics: ["coding", "development", "review"] },
    { match: (t) => t.includes("stackoverflow") || t.includes("stack overflow"),
      app: "Stack Overflow", work_type: "researching code", topics: ["coding", "development"] },
    { match: (t) => t.includes("analytics") || t.includes("dashboard"),
      app: "Analytics", work_type: "reviewing analytics", topics: ["analytics", "metrics", "dashboard", "kpi"] },

    // Browsers: extract context from the PAGE TITLE (the text before "- Google Chrome" etc.)
    // This is the key rule — Chrome shows "Page Title - Google Chrome" so we parse the page title
    { match: (t) => t.includes("chrome") || t.includes("firefox") || t.includes("edge") || t.includes("safari") || t.includes("brave"),
      app: "BROWSER_PARSE_TITLE",  // special marker — handled below
      work_type: "browsing", topics: [] },

    // Terminal / CLI
    { match: (t) => t.includes("terminal") || t.includes("command prompt") || t.includes("powershell") || t.includes("cmd"),
      app: "Terminal", work_type: "using command line", topics: ["coding", "development", "engineering"] },

    // File explorer
    { match: (t) => t.includes("file explorer") || t.includes("finder"),
      app: "File Explorer", work_type: "managing files", topics: ["organization"] },
  ];

  for (const rule of appRules) {
    if (rule.match(t)) {
      // Special handling for browsers: parse the PAGE TITLE for content context
      if (rule.app === "BROWSER_PARSE_TITLE") {
        return parseBrowserTitle(title, t);
      }

      return {
        app: rule.app,
        work_type: rule.work_type,
        topics: rule.topics,
        description: `User is ${rule.work_type} in ${rule.app}. Window: "${title}"`,
      };
    }
  }

  // ── Keyword extraction from unknown window titles ────────────────
  const contextKeywords = extractContextKeywords(t);
  if (contextKeywords.length > 0) {
    return {
      app: title.split(" - ").pop()?.trim() || "Unknown App",
      work_type: "working",
      topics: contextKeywords,
      description: `User is working in "${title}"`,
    };
  }

  return {
    app: title.split(" - ").pop()?.trim() || "Unknown App",
    work_type: "general work",
    topics: ["productivity"],
    description: `User is working in "${title}"`,
  };
}

/**
 * Parse a browser window title to extract the actual page content.
 * Chrome titles look like: "Page Title - Google Chrome"
 * Edge: "Page Title - Microsoft Edge"
 * Firefox: "Page Title — Mozilla Firefox"
 */
function parseBrowserTitle(fullTitle, t) {
  // Strip the browser name suffix to get the actual page title
  const browserSuffixes = [
    " - google chrome", " - mozilla firefox", " – mozilla firefox",
    " - microsoft edge", " - brave", " - safari", " - opera",
  ];

  let pageTitle = t;
  let browserName = "Browser";
  for (const suffix of browserSuffixes) {
    if (t.endsWith(suffix)) {
      pageTitle = t.slice(0, -suffix.length);
      browserName = suffix.replace(/^ - | – /g, "").trim();
      browserName = browserName.charAt(0).toUpperCase() + browserName.slice(1);
      break;
    }
  }

  // Now extract meaningful keywords from the page title
  const pageKeywords = extractContextKeywords(pageTitle);
  const topics = [...pageKeywords];

  // Determine what kind of content the user is reading
  let work_type = "browsing the web";

  if (pageTitle.includes("doc") || pageTitle.includes("spec") || pageTitle.includes("prd")) {
    work_type = "reading a document";
    topics.push("product spec", "prd", "planning");
  } else if (pageTitle.includes("analytics") || pageTitle.includes("dashboard") || pageTitle.includes("metric")) {
    work_type = "reviewing analytics";
    topics.push("analytics", "metrics", "dashboard");
  } else if (pageTitle.includes("slack") || pageTitle.includes("message") || pageTitle.includes("chat")) {
    work_type = "messaging";
    topics.push("communication", "team");
  } else if (pageTitle.includes("mail") || pageTitle.includes("inbox")) {
    work_type = "reading email";
    topics.push("communication", "stakeholder");
  } else if (pageTitle.includes("jira") || pageTitle.includes("linear") || pageTitle.includes("issue") || pageTitle.includes("ticket")) {
    work_type = "managing tasks";
    topics.push("tickets", "prioritization", "backlog");
  } else if (pageTitle.includes("figma") || pageTitle.includes("design")) {
    work_type = "reviewing designs";
    topics.push("design", "prototype");
  } else if (pageTitle.includes("youtube") || pageTitle.includes("video")) {
    work_type = "watching a video";
  } else if (pageTitle.includes("blog") || pageTitle.includes("article") || pageTitle.includes("post")) {
    work_type = "reading an article";
    topics.push("research");
  } else if (pageTitle.includes("search") || pageTitle.includes("google")) {
    work_type = "searching the web";
    topics.push("research");
  }

  // Add general browsing context if no specific topics found
  if (topics.length === 0) {
    topics.push("research", "browsing");
  }

  const cleanPageTitle = fullTitle.split(" - ").slice(0, -1).join(" - ") || fullTitle;

  return {
    app: browserName,
    work_type,
    topics: [...new Set(topics)],
    description: `User is ${work_type} in ${browserName}. Page: "${cleanPageTitle}"`,
  };
}

/**
 * Extract PM-relevant keywords from any window title.
 */
function extractContextKeywords(title) {
  const keywordMap = {
    "roadmap": ["roadmap", "planning", "strategy"],
    "sprint": ["sprint planning", "prioritization", "backlog"],
    "backlog": ["backlog", "prioritization", "tickets"],
    "kanban": ["task list", "prioritization"],
    "metric": ["metrics", "analytics", "kpi"],
    "growth": ["growth", "acquisition", "funnel"],
    "retention": ["retention", "engagement", "churn"],
    "onboard": ["onboarding", "activation", "growth"],
    "churn": ["churn", "retention"],
    "funnel": ["funnel", "analytics", "conversion"],
    "conversion": ["conversion", "funnel", "growth"],
    "experiment": ["experiment", "a/b test", "growth experiment"],
    "interview": ["user interview", "research", "discovery"],
    "research": ["user research", "discovery"],
    "feedback": ["feedback", "user research"],
    "spec": ["product spec", "prd", "requirements"],
    "requirement": ["requirements", "product spec", "planning"],
    "strategy": ["strategy", "planning", "vision"],
    "okr": ["metrics", "kpi", "strategy"],
    "review": ["review", "feedback", "decision"],
    "priorit": ["prioritization", "backlog"],
    "design": ["design", "ui", "prototype"],
    "prototype": ["prototype", "design", "discovery"],
    "wireframe": ["wireframe", "design", "prototype"],
    "user test": ["user testing", "usability", "research"],
    "launch": ["launch", "ship", "mvp"],
    "release": ["launch", "ship", "release"],
    "pricing": ["pricing", "positioning", "strategy"],
    "competitor": ["competitive analysis", "strategy", "positioning"],
    "pitch": ["pitch deck", "strategy", "positioning"],
  };

  const found = [];
  for (const [keyword, topics] of Object.entries(keywordMap)) {
    if (title.includes(keyword)) {
      found.push(...topics);
    }
  }

  return [...new Set(found)];
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through
  }

  return {
    app: "unknown",
    work_type: "general",
    topics: [],
    description: text,
  };
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
