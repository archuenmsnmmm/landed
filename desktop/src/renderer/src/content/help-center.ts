export interface HelpArticle {
  q: string;
  a: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    articles: [
      {
        q: "How do I download and install Landed?",
        a: "Download Landed for Mac from https://landed-ai.com/download. On Mac, open the DMG and drag Landed to Applications. Windows builds are also available from the same page. Sign in with email or Google to get started.",
      },
      {
        q: "Who is Landed for?",
        a: "Candidates in technical interviews — coding rounds, system design, take-homes, and live problem-solving — who want invisible, screen-aware help without switching windows or using a mic.",
      },
      {
        q: "Is Landed free?",
        a: "Landed offers a free starter tier with 15 AI questions on gpt-4o-mini. Pro and Lifetime unlock unlimited questions, a stronger coding model, invisible overlay on screen share, and 24/7 support. Lifetime is a one-time purchase.",
      },
      {
        q: "How do I start my first session?",
        a: "After login, the overlay opens automatically. Grant Screen Recording when prompted, then type a question about the problem on your screen. Use the gear icon for settings.",
      },
    ],
  },
  {
    id: "using-landed",
    title: "Using Landed",
    articles: [
      {
        q: "How does Landed see my screen?",
        a: "When you ask a question, Landed captures what’s on your display (coding pad, prompt, or docs) and uses that context to answer. Frames are only sent when you ask — not continuously recorded.",
      },
      {
        q: "Do I need a microphone?",
        a: "No. Landed is text-first so you can stay silent in the technical interview. Type into the overlay and press Enter (or Cmd/Ctrl + Enter) to ask.",
      },
      {
        q: "How do I get an answer?",
        a: "Type into the top ask bar and press Enter. Landed reads the technical interview problem on screen and streams an answer below the bar.",
      },
      {
        q: "How do I move or hide the overlay?",
        a: "Use Cmd/Ctrl + arrow keys to move the overlay. Press Cmd/Ctrl + \\ to hide or show it. See Settings > Keybinds for the full list.",
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Privacy & Security",
    articles: [
      {
        q: "Is my history saved?",
        a: "Sessions are saved in your dashboard so you can review past asks and answers.",
      },
      {
        q: "Does Landed sell or train on my data?",
        a: "No. Landed does not sell your data or use your content to train public third-party AI models.",
      },
      {
        q: "Where is my data stored?",
        a: "Account and session data sync to your Landed cloud workspace.",
      },
      {
        q: "Can the interviewer see the overlay if I share my screen?",
        a: "On Pro and Lifetime, enable hide-from-screen-share in Settings so only you see Landed — that’s the invisible part.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    articles: [
      {
        q: "What's included in Pro?",
        a: "Unlimited AI questions, stronger coding model (gpt-4.1-mini), invisible overlay on screen share, 24/7 support, and everything in Starter. Lifetime includes the same Pro features for a one-time payment.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    articles: [
      {
        q: "Answers don’t mention what’s on my screen",
        a: "Confirm Screen Recording is enabled for Landed in System Settings → Privacy & Security, then ask again. Packaged builds use the Landed API — make sure you’re signed in. Local dev also needs OPENAI_API_KEY on the site server (or VITE_OPENAI_API_KEY for offline desktop-only testing).",
      },
      {
        q: "The overlay isn't appearing",
        a: "Landed opens the overlay automatically after setup. Grant Screen Recording when prompted. If it’s hidden, click Show overlay from settings.",
      },
    ],
  },
];

export const HELP_QUICK_TIPS = [
  {
    title: "Ask during the technical interview",
    body: "Type a question in the overlay and press Enter — Landed uses the coding problem on screen to answer.",
  },
  {
    title: "Start before the round",
    body: "Allow Screen Recording, then ask from the overlay — no mic needed.",
  },
  {
    title: "Stay invisible on share",
    body: "On Pro, hide the overlay from screen share so only you see Landed.",
  },
] as const;
