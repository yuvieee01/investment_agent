We are building an AI Investment Research Agent with this stack:
- Next.js 15 (App Router) — frontend + backend in one repo
- LangGraph.js — stateful multi-node agent graph
- Google Gemini 2.5 Flash — primary LLM (via @langchain/google-genai)
- Tavily Search — web research tool (via @langchain/community)
- Groq as optional fallback
- Deploying on Vercel

AGENT GRAPH:
company name
      │
      ▼
1. resolveCompany ← finds ticker, sector, full name

2. i. financials ii. news iii. competitors iv. industry   ← parallel nodes

3. analyzeAll ← synthesizes all research into structured insight

4. makeDecision  ← INVEST / PASS / MONITOR + score + reasoning

resolveCompany → [researchFinancials, researchNews, 
researchCompetitors, researchIndustry] (parallel) 
→ analyzeAll → makeDecision

The State Object (lib/graph/state.ts)
This is the spine of the whole agent. Every node reads from it and writes to it:
typescriptexport interface AgentState {
  company: string;
  ticker?: string;
  sector?: string;

  // Each research node writes to its own field
  financialData?: string;
  newsData?: string;
  competitorData?: string;
  industryData?: string;

  // Analysis node synthesizes all four above
  analysis?: string;

  // Final decision node output
  decision?: "INVEST" | "PASS" | "MONITOR";
  confidence?: number;       // 0–100
  reasoning?: string;
  bullishFactors?: string[];
  bearishFactors?: string[];

  // UI tracking
  completedSteps: string[];
  currentStep?: string;
}

What Each Node Does:
resolveCompany — Takes "Apple" and returns { ticker: "AAPL", fullName: "Apple Inc.", sector: "Technology" } so every subsequent node has precise context for searching.
researchFinancials — Calls Tavily with queries like "AAPL revenue growth 2024 2025 earnings", "Apple Inc P/E ratio debt free cash flow". Returns a structured summary of financial health.
researchNews — Searches recent headlines, analyst ratings, regulatory news. Tavily's topic: "news" param filters to fresh results.
researchCompetitors — Looks at market share, competitive moat, industry dynamics.
researchIndustry — Macro trends for the sector — growth rate, headwinds, tailwinds.
analyzeAll — Takes all four research outputs, sends them together to Gemini (this is where the 1M context window pays off) and produces a structured investment thesis.
makeDecision — Outputs the final INVEST / PASS / MONITOR verdict with a 0–100 confidence score, bullish factors, bearish factors, and the reasoning paragraph shown in the UI.

investment-agent/
│
├── app/
│   ├── api/
│   │   └── research/
│   │       └── route.ts          ← streaming SSE endpoint
│   │
│   ├── components/
│   │   ├── CompanySearch.tsx     ← input + submit
│   │   ├── ResearchTimeline.tsx  ← live node-by-node progress
│   │   ├── DecisionCard.tsx      ← INVEST/PASS verdict + score
│   │   └── FactorsGrid.tsx       ← key reasons + risks
│   │
│   ├── page.tsx
│   └── layout.tsx
│
├── lib/
│   ├── graph/
│   │   ├── state.ts              ← AgentState type + channel annotations
│   │   ├── graph.ts              ← graph assembly, compile, export
│   │   └── nodes/
│   │       ├── resolveCompany.ts
│   │       ├── researchFinancials.ts
│   │       ├── researchNews.ts
│   │       ├── researchCompetitors.ts
│   │       ├── researchIndustry.ts
│   │       ├── analyzeAll.ts
│   │       └── makeDecision.ts
│   │
│   ├── tools/
│   │   └── search.ts             ← Tavily wrapper (reused across nodes)
│   │
│   └── llm.ts                    ← Gemini 2.5 Flash setup, exported
│
├── .env.local                    ← GOOGLE_API_KEY, TAVILY_API_KEY
├── package.json
└── README.md

SPECIAL FEATURE: 
- First 3 searches use env keys (GOOGLE_API_KEY, TAVILY_API_KEY)
- After 3 searches, prompt user for their own keys via a UI form
- Keys stored in localStorage, passed with each API request
- Server uses user-provided keys if present, env keys otherwise

Streaming (the UX detail that impresses)
The API route in app/api/research/route.ts uses the Web Streams API with ReadableStream to push server-sent events to the frontend. As each LangGraph node completes, the frontend receives an event and updates the timeline in real time — instead of a blank spinner for 20 seconds.
User types "Tesla" → hits submit
→ "🔍 Resolving company..." appears
→ "📊 Researching financials..." appears
→ "📰 Fetching news..." appears (parallel with above)
→ "🏁 Analyzing competitors..." appears
→ "🧠 Synthesizing analysis..." appears
→ "⚖️ Making investment decision..." appears
→ Full DecisionCard renders: PASS · 38/100 confidence

Git Usage:
1. Use git commands
2. Always commit the changes to the git repository after creating or updating a file
3. Use the commit message as "[Task Name] - [Description]"

Build Order (step by step)
This is the order that minimizes dead ends:

1. Scaffold — npx create-next-app@latest with TypeScript and App Router
2. Install deps — @langchain/google-genai, @langchain/langgraph, @langchain/core, @langchain/community (for Tavily)
3. lib/llm.ts — configure Gemini, test it with a hello world call
4. lib/tools/search.ts — wrap Tavily, test a search query
5. lib/graph/state.ts — define the state interface and channel reducers
6. Nodes one at a time — resolveCompany → researchFinancials → test the graph up to this point before adding more
7. Add remaining nodes — news, competitors, industry, analyzeAll, makeDecision
8. Wire the graph — graph.ts assembles all nodes, defines parallel edges, compiles
app/api/research/route.ts — streaming endpoint that runs the graph and pushes events
9. Frontend — CompanySearch input → ResearchTimeline live updates → DecisionCard final output
10. Vercel deploy
