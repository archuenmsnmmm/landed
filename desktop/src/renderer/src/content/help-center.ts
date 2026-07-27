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
        a: "Download Landed for Mac from https://landed-ai.com/download. Open the DMG and drag Landed to Applications. Sign in with email or Google to get started.",
      },
      {
        q: "Who is Landed for?",
        a: "Anyone who wants to stop getting stuck debugging — screen-aware help while coding, fixing bugs, or working on docs, without switching windows or using a mic.",
      },
      {
        q: "Is Landed free?",
        a: "Landed offers a free starter tier with 10 screen asks on gpt-4o-mini. Pro and Lifetime unlock unlimited questions, a stronger coding model, invisible overlay on screen share, and 24/7 support. Lifetime is a one-time purchase.",
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
        a: "No. Landed is text-first so you can stay focused. Type into the overlay and press Enter (or Cmd/Ctrl + Enter) to ask.",
      },
      {
        q: "How do I get an answer?",
        a: "Type into the top ask bar and press Enter. Landed reads what’s on screen and streams an answer below the bar.",
      },
      {
        q: "Is Landed a human coach?",
        a: "No. This is an AI-powered conversation, not a human. It may make mistakes — always review suggestions before you use or repeat them. See Terms → AI Outputs for details.",
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
        a: "No. Landed does not sell your Personal Information and does not use your content to train Landed models or public third-party foundation models. AI providers process content to generate outputs under their terms.",
      },
      {
        q: "Where is my data stored?",
        a: "Account and session data sync to your Landed cloud workspace.",
      },
      {
        q: "Can other people see the overlay if I share my screen?",
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
        a: "Confirm Screen Recording is enabled for Landed in System Settings → Privacy & Security, then ask again. Make sure you’re signed in so Landed can reach the AI service.",
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
    title: "Ask about what’s on screen",
    body: "Type a question in the overlay and press Enter — Landed uses what’s on screen to answer.",
  },
  {
    title: "Start Landed first",
    body: "Allow Screen Recording so Landed can see what's on screen when you ask.",
  },
  {
    title: "Stay invisible on share",
    body: "On Pro, hide the overlay from screen share so only you see Landed.",
  },
] as const;
