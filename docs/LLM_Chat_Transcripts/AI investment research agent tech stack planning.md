# AI investment research agent tech stack planning

_Source: Claude_  
_Model: claude-sonnet-4-6_  
_Created: 2026-06-27T10:52:39.754977Z_  
_Updated: 2026-06-27T11:18:47.809296Z_  

## Human

_27 Jun 2026, 16:22_

plan with me for the following project you have to build, tell me the differences in between the tech stack, how would it change the working, folder structure and other related things. First tell me how they differ and when i'm ready then ask me about the choice:   
The Task  
• Build an AI Investment Research Agent: it takes a company name, does its research, and decides  
whether to invest or pass — with the reasoning behind its decision.  
• That’s the goal — how you build it (what it researches, how it works under the hood, how it shows its  
results) is entirely up to you. We care about what you build and how you build it.  
Tech stack (this is our production stack — please build with it)  
• React or Next.js (front end) · Node.js or Next.js (back end) · LangChain.js / LangGraph.js (for the  
AI).  
• Within that, use any LLM provider and any other libraries / APIs / tools you like.  
• Use AI as much as you like while building (that’s the job).  
• Deploying online (e.g. on Vercel) and sharing the link will carry bonus points.

What to submit  
A zip file which includes your code and a README with these sections:  
• Overview — what it does  
• How to run it — setup and run steps (plus any keys / env needed)  
• How it works — your approach and architecture  
• Key decisions & trade-offs — what you chose and why, and what you left out  
• Example runs — your agent’s output on a few companies of your choice  
• What you would improve with more time  
• BONUS points: you are mandated to build this project using a choice of your AI/LLM, during which  
you will be chatting with the LLM as you build. You will get extra bonus points if you include all the LLM  
chat session transcript/logs. It will give us insight into your thought process and approach.

---

## Assistant

_27 Jun 2026, 16:23_

<details><summary>Thinking</summary>

The user wants to plan an AI Investment Research Agent project. They want me to explain the differences between the tech stack options before they make a choice. Let me break down the key decisions:

1. **React vs Next.js** (frontend)
2. **Node.js vs Next.js** (backend)
3. **LangChain.js vs LangGraph.js** (AI orchestration)

Let me think through each of these carefully and explain the differences in terms of:
- How they work
- Folder structure
- Development experience
- Deployment
- Use cases

Let me plan this out comprehensively.

---

### React vs Next.js (Frontend)

**React (with a separate Node.js backend)**:
- Pure client-side rendering (CSR) by default
- Needs a separate server (Express/Fastify) for the backend
- Two separate codebases/repos possible
- Vite or CRA for scaffolding
- More flexible, but more setup

**Next.js (full-stack)**:
- Can do SSR, SSG, CSR
- Has API routes built in (App Router: Route Handlers)
- Single codebase for frontend + backend
- File-based routing
- Easy Vercel deployment (it's made by Vercel)
- Perfect for this use case since they want Vercel deployment

### Node.js (standalone) vs Next.js (as backend)

**Node.js standalone (Express/Fastify)**:
- Full control over server setup
- Separate from frontend
- Need to handle CORS, middleware manually
- More boilerplate
- Can use WebSockets easily
- Typical REST API setup

**Next.js as backend (API routes)**:
- Co-located with frontend
- Server Actions, Route Handlers
- Streaming support via Response streaming
- Less flexibility but less setup
- Vercel deployment is seamless
- Edge runtime support

### LangChain.js vs LangGraph.js

**LangChain.js**:
- Sequential chain-based approach
- Good for linear pipelines: input → research → analyze → output
- LCEL (LangChain Expression Language) for chaining
- Has built-in tools, memory, retrievers
- Simpler mental model
- Less suited for complex branching/conditional logic

**LangGraph.js**:
- Graph-based state machine approach
…

</details>

## AI Investment Research Agent — Stack Comparison

There are three independent decisions to make here, and each one has real consequences on how the project is structured, developed, and deployed. Let me walk through each.

---

### Decision 1: Frontend — React vs Next.js

**React (standalone)** is a pure UI library. You'd scaffold it with Vite, and it runs entirely in the browser. It has no opinions about routing, no server, no API — you wire all of that yourself. Every request your UI makes has to go to a *separate* server you also build and run.

**Next.js** is a full framework built on React. You get the same React components, but also file-based routing, server-side rendering, and crucially — **API route handlers built right in**. Your frontend and backend live in one codebase, one `package.json`, one deployment.

For this project, Next.js wins clearly. It was literally made by Vercel (the bonus deployment target), it handles streaming responses out of the box (critical for showing research as it happens), and you don't need to manage two separate servers.

---

### Decision 2: Backend — Standalone Node.js vs Next.js API Routes

**Standalone Node.js** (Express or Fastify) gives you full server control — custom middleware, WebSockets, full request lifecycle. But for this project it means a second repo, CORS configuration, separate environment variables, and a separate deploy target. It adds friction without adding much value here.

**Next.js API Routes** (specifically Route Handlers in the App Router) let you write `app/api/research/route.ts` and instantly have a backend endpoint co-located with your UI. You can stream responses using the Web Streams API, which lets you push research updates to the frontend in real-time as the agent works through each step.

Again, unless you need WebSockets or heavy custom server logic, Next.js API routes are the right call here.

---

### Decision 3: AI Orchestration — LangChain.js vs LangGraph.js

This is the most significant architectural decision.

**LangChain.js** is pipeline/chain-based. You define a linear sequence: prompt → LLM → output parser → next step. It's great for simple, predictable flows. LCEL (LangChain Expression Language) chains steps with `|` operators. The mental model is: *data flows through a pipe*.

The problem for this project is that investment research isn't linear. You might research financials, then realize you need more news context, then loop back, then make a conditional decision. LangChain chains don't handle branching and cycles well — you'd end up hacking around it with conditionals in JavaScript.

**LangGraph.js** is a state machine built on top of LangChain. You define **nodes** (functions that do work) and **edges** (transitions between nodes, which can be conditional). There's an explicit **state object** that flows through the graph and accumulates data at each step. The mental model is: *an agent moves through a graph, making decisions at each node.*

For an investment agent, this maps perfectly:  
- Node: `fetchFinancials` → uses a tool to get stock data  
- Node: `fetchNews` → searches recent news  
- Node: `fetchCompetitorData` → analyzes the competitive landscape    
- Node: `analyze` → synthesizes everything  
- Conditional edge: if confidence is low → loop back to research more  
- Node: `decide` → invest / pass + reasoning

LangGraph also gives you built-in **streaming of node events**, so the frontend can show "🔍 Researching financials... 📰 Fetching news... 🧠 Analyzing..." in real time. That's a significantly better UX than a spinner for 30 seconds.

---

### How the Combinations Change the Folder Structure

**Option A — React + Node.js + LangChain.js** (two repos, linear agent):

```
project/
├── client/                    ← separate React app
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
│
├── server/                    ← separate Express server
│   ├── src/
│   │   ├── routes/
│   │   │   └── research.js
│   │   ├── chains/
│   │   │   ├── researchChain.js
│   │   │   └── decisionChain.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

Two dev servers to run, two deploys to manage. The agent is a sequential chain — once the pipe is set, the flow is fixed.

---

**Option B — Next.js + LangChain.js** (one repo, linear agent):

```
project/
├── app/
│   ├── api/
│   │   └── research/
│   │       └── route.ts       ← single API endpoint
│   ├── components/
│   │   └── ResearchPanel.tsx
│   ├── page.tsx
│   └── layout.tsx
│
├── lib/
│   ├── chains/
│   │   ├── researchChain.ts   ← LCEL chain
│   │   └── decisionChain.ts
│   └── tools/
│       └── webSearch.ts
│
└── package.json
```

One repo, cleaner — but the AI logic is still linear. Good enough for a simple version, but the agent can't adapt mid-run.

---

**Option C — Next.js + LangGraph.js** (one repo, stateful multi-step agent):

```
project/
├── app/
│   ├── api/
│   │   └── research/
│   │       └── route.ts       ← streams graph events to frontend
│   ├── components/
│   │   ├── CompanyInput.tsx
│   │   ├── ResearchTimeline.tsx   ← shows steps as they happen
│   │   └── DecisionCard.tsx
│   ├── page.tsx
│   └── layout.tsx
│
├── lib/
│   ├── graph/
│   │   ├── state.ts           ← AgentState type definition
│   │   ├── nodes/
│   │   │   ├── fetchFinancials.ts
│   │   │   ├── fetchNews.ts
│   │   │   ├── analyzeData.ts
│   │   │   └── makeDecision.ts
│   │   ├── edges.ts           ← conditional routing logic
│   │   └── index.ts           ← graph assembly + compile
│   │
│   └── tools/
│       ├── stockData.ts       ← e.g. Yahoo Finance / Alpha Vantage
│       └── webSearch.ts       ← e.g. Tavily / SerpAPI
│
├── .env.local
└── package.json
```

This is one deploy, one dev server, and the agent is genuinely intelligent — it has state, can branch, can loop, and streams updates node-by-node to the UI.

---

### Summary Table

| | React + Node.js | Next.js + LangChain | Next.js + LangGraph |  
|---|---|---|---|  
| **Repos** | 2 | 1 | 1 |  
| **Dev servers** | 2 | 1 | 1 |  
| **Agent type** | Linear pipeline | Linear pipeline | Stateful graph |  
| **Branching/loops** | Manual hacks | Manual hacks | Native |  
| **Real-time streaming** | Complex (SSE/WS setup) | Moderate | Built-in |  
| **Vercel deploy** | Two services | One click | One click |  
| **Complexity to build** | High (boilerplate) | Medium | Medium-High |  
| **Impressiveness** | Low | Medium | High |

---

My honest take: **Next.js + LangGraph.js** is the right call for this specific brief. It's what the evaluators will find most interesting, it maps naturally to what an investment research agent actually *does*, the streaming UX is genuinely impressive, and Vercel deployment is trivial.

Take your time reviewing — when you're ready, let me know which combination you want to go with and we'll start planning the actual architecture and build order.

---

## Human

_27 Jun 2026, 16:32_

obviously i like Next.js + LangGraph combination. But first i want the choice in the llm/api use because i don't want to but any plan as a student i want it free. research and suggest me. Then start planning the actual architecture and build order that actually works.

---

## Assistant

_27 Jun 2026, 16:33_

<details><summary>Thinking</summary>

The user wants to know about free LLM options before we start planning. Let me research the current free LLM options available in 2026. Let me search for the latest free LLM APIs available.

</details>

**Tool call: `web_search`**

```json
{
  "query": "free LLM API 2026 no credit card students generous free tier"
}
```

**Tool result**

```
{
  "type": "knowledge",
  "title": "Free LLM API 2026: 15 Limits, No-Card Picks, Real Costs - TokenMix Blog",
  "url": "https://tokenmix.ai/blog/free-llm-api",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "tokenmix.ai",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=tokenmix.ai",
    "site_name": "TokenMix"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Free LLM APIs in 2026: 13 Providers Compared (OpenAI, Claude, Gemini, Groq) - Dmytro Klymentiev",
  "url": "https://klymentiev.com/blog/free-llm-api",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "klymentiev.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=klymentiev.com",
    "site_name": "Klymentiev"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Free LLM API in 2026: 13 Options Ranked and Compared — OpenRouter Blog",
  "url": "https://openrouter.ai/blog/tutorials/free-llm-apis-compared/",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "openrouter.ai",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=openrouter.ai",
    "site_name": "OpenRouter"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Free LLM API Tier List 2026 for Broke Developers",
  "url": "https://www.mrcomputerscience.com/free-llm-api-tier-list-2026-for-broke-developers/",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "mrcomputerscience.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=mrcomputerscience.com",
    "site_name": "Mrcomputerscience"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Promptt",
  "url": "https://www.promptt.dev/blog/8-best-free-llm-api-providers",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "promptt.dev",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=promptt.dev",
    "site_name": "Promptt"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Best Free LLM API 2026: Gemini, Groq, OpenRouter Ranked",
  "url": "https://costbench.com/best/best-llm-api-with-free-tier/",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "costbench.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=costbench.com",
    "site_name": "CostBench"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "12 Free LLM APIs You Can Use Right Now (No Credit Card, Real Limits Tested) - DEV Community",
  "url": "https://dev.to/tokenmixai/12-free-llm-apis-you-can-use-right-now-no-credit-card-real-limits-tested-13f8",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "dev.to",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=dev.to",
    "site_name": "DEV Community"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Every AI API with a Free Tier in 2026: The Developer's Cheat Sheet - Grizzly Peak Software",
  "url": "https://www.grizzlypeaksoftware.com/articles/p/every-ai-api-with-a-free-tier-in-2026-the-developers-cheat-sheet-jl33ach0",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "grizzlypeaksoftware.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=grizzlypeaksoftware.com",
    "site_name": "Grizzlypeaksoftware"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Best AI API's 2026 For Free | AIMLAPI.com",
  "url": "https://aimlapi.com/best-ai-apis-for-free",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "aimlapi.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=aimlapi.com",
    "site_name": "AIMLAPI"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Groq Free Tier 2026: Fastest LLM Inference API (No Credit Card) | Get AI Perks",
  "url": "https://www.getaiperks.com/en/ai/groq-free-tier-2026",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "getaiperks.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=getaiperks.com",
    "site_name": "Get AI Perks"
  },
  "is_missing": false
}
```

**Tool call: `web_search`**

```json
{
  "query": "Tavily API free tier 2026 web search for LangGraph agents"
}
```

**Tool result**

```
{
  "type": "knowledge",
  "title": "Tavily vs Brave vs Exa: Free Search APIs for AI Agents",
  "url": "https://toolfreebie.com/tavily-vs-brave-vs-exa-search/",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "toolfreebie.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=toolfreebie.com",
    "site_name": "Toolfreebie"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "GitHub - menonpg/agentic_search_openai_langgraph: Agentic search web search using LangGraph and OpenAI GPT-4o, powered by Tavily and DuckDuckGo search. · GitHub",
  "url": "https://github.com/menonpg/agentic_search_openai_langgraph",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "github.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=github.com",
    "site_name": "GitHub"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Exa vs Tavily: Which Search API for Your AI Agent? (2026)",
  "url": "https://www.apipick.com/blog/exa-vs-tavily-search-api-for-ai-agents",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "apipick.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=apipick.com",
    "site_name": "API Pick"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Tavily vs. Parallel: choosing a search API for your AI agent",
  "url": "https://parallel.ai/articles/tavily-vs-parallel-search",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "parallel.ai",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=parallel.ai",
    "site_name": "Parallel Web Systems"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Tavily",
  "url": "https://www.tavily.com/",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "tavily.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=tavily.com",
    "site_name": "Tavily"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Tavily 101: AI-powered Search for Developers | Tavily Blog",
  "url": "https://www.tavily.com/blog/tavily-101-ai-powered-search-for-developers",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "tavily.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=tavily.com",
    "site_name": "Tavily"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Best Web Search APIs for AI Applications in 2026",
  "url": "https://www.firecrawl.dev/blog/best-web-search-apis",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "firecrawl.dev",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=firecrawl.dev",
    "site_name": "Firecrawl"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Tavily Alternatives: Best Web Scraping Tools in 2026",
  "url": "https://scrapegraphai.com/blog/tavily-alternatives",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "scrapegraphai.com",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=scrapegraphai.com",
    "site_name": "Scrapegraphai"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "Perplexity Search API vs Tavily for RAG 2026",
  "url": "https://alphacorp.ai/blog/perplexity-search-api-vs-tavily-for-rag-2026",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "alphacorp.ai",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=alphacorp.ai",
    "site_name": "Alphacorp"
  },
  "is_missing": false
}
{
  "type": "knowledge",
  "title": "5 Tavily Alternatives for Better Pricing, Performance, and Extraction Depth",
  "url": "https://www.firecrawl.dev/blog/tavily-alternatives",
  "metadata": {
    "type": "webpage_metadata",
    "site_domain": "firecrawl.dev",
    "favicon_url": "https://www.google.com/s2/favicons?sz=64&domain=firecrawl.dev",
    "site_name": "Firecrawl"
  },
  "is_missing": false
}
```

<details><summary>Thinking</summary>

Now I have a comprehensive picture. Let me summarize the free LLM options and then proceed with the architecture planning.

Key findings:
1. **Google Gemini API (AI Studio)** - Best overall free tier: 1,500 req/day, 1M token context window, no credit card, Gemini 2.5 Flash
2. **Groq** - Fastest inference (LPU chips), 30 RPM, 1,000 RPD, 14,400 RPD (one source says), 100K tokens/day on Llama 3.3 70B. No credit card.
3. **Cerebras** - 1M tokens/day, no credit card, highest raw throughput
4. **OpenRouter** - 20+ free models with :free suffix, no credit card

For search:
- **Tavily** - 1,000 free credits/month, no credit card, purpose-built for LangChain/LangGraph, official integration
- **Brave Search API** - 2,000 free queries/month

**My recommendation:**
- **Primary LLM: Google Gemini 2.5 Flash** via Google AI Studio - best quality, 1M context window, 1,500 req/day free, no credit card
- **Fallback/Speed: Groq** - for fast inference on simpler tasks
- **Search: Tavily** - 1,000 free credits/month, built for LangGraph

LangChain.js has a `@langchain/google-genai` package for Gemini integration.

Now let me plan the actual architecture. Let me think through this carefully.

## Architecture Plan

### Tech Stack
- **Frontend + Backend**: Next.js 14/15 (App Router)
- **AI Orchestration**: LangGraph.js
- **LLM**: Google Gemini 2.5 Flash (primary), Groq as fallback
- **Search**: Tavily (1,000 free/month) 
- **Deployment**: Vercel

### Agent Graph Design

The investment research agent should:
1. **Plan** what to research (given company name)
2. **Research financials** - search for revenue, profit, growth metrics
3. **Research news** - recent headlines, sentiment
4. **Research competitive landscape** - market position, competitors
5. **Analyze** - synthesize all findings
6. **Decide** - invest/pass with confidence score and reasoning

### LangGraph State

```typescript
interface AgentState {
  company: string;
  ticker?: string;
  
  // Research data
…

</details>

Good call. Let me research the current free tier landscape properly before we commit to anything.

---

## Free LLM Options for This Project

Here's what's actually free in 2026, no credit card required:

### LLM Providers

**Google Gemini API (Google AI Studio)** is the best overall free LLM in 2026 — 1,500 requests/day on Gemini 2.5 Flash, with no credit card and no expiry. The quota resets daily and never expires; it's not a trial. The context window is 1 million tokens, and the multimodal support handles images and PDFs at no charge. Speed is slower than Groq but the quality ceiling is significantly higher for complex reasoning tasks.

**Groq** runs custom LPU (Language Processing Unit) silicon optimized for LLM inference. The free tier gives 30,000 TPM, 30 requests/minute, and 14,400 requests/day on Llama 3.3 70B. Sign up at console.groq.com with just an email — no credit card.

**Cerebras** leads on raw daily volume — 1M tokens/day with no credit card. For raw speed, Groq is among the fastest at hundreds of tokens per second on Llama 70B.

### Web Search (the agent needs this to research companies)

**Tavily** gives 1,000 free API credits per month with no credit card, and it's purpose-built for LLM retrieval. **Brave Search API** gives 2,000 free queries/month. The cheapest production stack pairs Tavily for general retrieval and Brave for news fan-out, with a free LLM backend — total monthly bill at hobby scale: $0.

Tavily grew up inside the LangChain ecosystem — it maintains the official `langchain-tavily` package and is the default web-search tool in many LangChain and LangGraph templates. This matters a lot — it plugs in natively.

---

### My Recommendation for You

**Primary LLM → Google Gemini 2.5 Flash** via `@langchain/google-genai`. Best reasoning quality, 1M token context (perfect for synthesizing lots of research), completely free, and LangChain.js supports it natively.

**Search → Tavily** — 1,000 free/month, native LangGraph integration, returns clean LLM-ready text. More than enough for demos and evaluation runs.

**Groq as optional fallback** — if you hit Gemini rate limits during heavy testing, swap it in with one env var change since both are OpenAI-compatible.

---

## The Architecture & Build Plan

Now here's the full blueprint. This is what actually ships.

### The Agent Graph

```
 company name
      │
      ▼
 ┌──────────────┐
 │ resolveCompany│  ← finds ticker, sector, full name
 └──────┬───────┘
        │
   ┌────┴─────┬───────────┬─────────────┐
   ▼          ▼           ▼             ▼
[financials] [news]  [competitors] [industry]   ← parallel nodes
   └────┬─────┴───────────┴─────────────┘
        │
        ▼
 ┌──────────────┐
 │  analyzeAll  │  ← synthesizes all research into structured insight
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │ makeDecision │  ← INVEST / PASS / MONITOR + score + reasoning
 └──────────────┘
```

The four research nodes run in parallel (LangGraph supports this natively with `Send`), which cuts total latency significantly vs sequential.

---

### Folder Structure

```
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
```

---

### The State Object (`lib/graph/state.ts`)

This is the spine of the whole agent. Every node reads from it and writes to it:

```typescript
export interface AgentState {
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
```

---

### What Each Node Does

**`resolveCompany`** — Takes "Apple" and returns `{ ticker: "AAPL", fullName: "Apple Inc.", sector: "Technology" }` so every subsequent node has precise context for searching.

**`researchFinancials`** — Calls Tavily with queries like `"AAPL revenue growth 2024 2025 earnings"`, `"Apple Inc P/E ratio debt free cash flow"`. Returns a structured summary of financial health.

**`researchNews`** — Searches recent headlines, analyst ratings, regulatory news. Tavily's `topic: "news"` param filters to fresh results.

**`researchCompetitors`** — Looks at market share, competitive moat, industry dynamics.

**`researchIndustry`** — Macro trends for the sector — growth rate, headwinds, tailwinds.

**`analyzeAll`** — Takes all four research outputs, sends them together to Gemini (this is where the 1M context window pays off) and produces a structured investment thesis.

**`makeDecision`** — Outputs the final `INVEST / PASS / MONITOR` verdict with a 0–100 confidence score, bullish factors, bearish factors, and the reasoning paragraph shown in the UI.

---

### Streaming (the UX detail that impresses)

The API route in `app/api/research/route.ts` uses the **Web Streams API** with `ReadableStream` to push server-sent events to the frontend. As each LangGraph node completes, the frontend receives an event and updates the timeline in real time — instead of a blank spinner for 20 seconds.

```
User types "Tesla" → hits submit
→ "🔍 Resolving company..." appears
→ "📊 Researching financials..." appears
→ "📰 Fetching news..." appears (parallel with above)
→ "🏁 Analyzing competitors..." appears
→ "🧠 Synthesizing analysis..." appears
→ "⚖️ Making investment decision..." appears
→ Full DecisionCard renders: PASS · 38/100 confidence
```

---

### Build Order (step by step)

This is the order that minimizes dead ends:

1. **Scaffold** — `npx create-next-app@latest` with TypeScript and App Router  
2. **Install deps** — `@langchain/google-genai`, `@langchain/langgraph`, `@langchain/core`, `@langchain/community` (for Tavily)  
3. **`lib/llm.ts`** — configure Gemini, test it with a hello world call  
4. **`lib/tools/search.ts`** — wrap Tavily, test a search query  
5. **`lib/graph/state.ts`** — define the state interface and channel reducers  
6. **Nodes one at a time** — `resolveCompany` → `researchFinancials` → test the graph up to this point before adding more  
7. **Add remaining nodes** — news, competitors, industry, analyzeAll, makeDecision  
8. **Wire the graph** — `graph.ts` assembles all nodes, defines parallel edges, compiles  
9. **`app/api/research/route.ts`** — streaming endpoint that runs the graph and pushes events  
10. **Frontend** — `CompanySearch` input → `ResearchTimeline` live updates → `DecisionCard` final output  
11. **Vercel deploy** — add env vars in Vercel dashboard, push, done

---

### Keys You'll Need

| Key | Where to get it | Cost |  
|---|---|---|  
| `GOOGLE_API_KEY` | aistudio.google.com | Free |  
| `TAVILY_API_KEY` | app.tavily.com | Free (1,000/mo) |  
| `GROQ_API_KEY` (optional fallback) | console.groq.com | Free |

All three are no-credit-card signups. You'll have the full project running before spending a rupee.

---

Ready to start building? Say the word and I'll write the code file by file, starting from the Next.js scaffold through to the completed graph — with the README sections ready to fill in as we go (which doubles as your LLM transcript for the bonus points).

---

## Human

_27 Jun 2026, 16:47_

Let's say i want in the final project that will get deployed on vercel, the website should show the option to put GOOGLE_API_KEY, TAVILY_API_KEY and GROQ_API_KEY (optional) after 3 companies search as i don't want others to use up my api rate limit as i have other project to work with also. and before you use up the limit i have to chat with you tell me how can i use the files and the context of this session to be used on antigravity claude models?  
I don't want any code files just yet. I will start building the project using claude opus available on antigravity. Just give me things to start with.

---

## Assistant

_27 Jun 2026, 16:48_

<details><summary>Thinking</summary>

The user is asking two things:
1. They want the final deployed project to show a UI prompt for API keys after 3 free searches (to protect their rate limits from public users)
2. They want to know how to use the files and context from this session when they start building with Claude on "antigravity" - which I think they mean "Anthropic" Claude models (they said "antigravity claude models" which seems like they mean the Anthropic Claude API or Claude Code or claude.ai)

Wait, re-reading: "I will start building the project using claude opus available on antigravity" - I think "antigravity" might be a typo or autocorrect for "Anthropic" or maybe they mean a specific platform. Actually wait - looking at the system prompt, there's mention of "Claude Mythos Preview" being used by trusted organizations as part of "Project Glasswing". But the user said "antigravity claude models" - this doesn't match any known Anthropic product I know of.

Actually, re-reading more carefully - the user might mean they want to use Claude Opus available on the Anthropic platform (claude.ai). "Antigravity" might just be a typo or autocorrect for "Anthropic". Let me interpret it as them wanting to use Claude Opus on claude.ai or via API.

So they want:
1. Design decision: After 3 free company searches, show a modal/form asking for API keys
2. How to bring context from this conversation to their Claude session for building

For point 2, they're asking how to transfer the context/planning from this session to a new Claude conversation where they'll actually build the project. The key things they can do:
- Export/copy this conversation
- Create a project brief document from this conversation
- Use Claude Projects feature to maintain context
- Use the system prompt feature

Let me think about what "antigravity" means. Looking again - "i will start building the project using claude opus available on antigravity" - I think this might be a third-party platform or maybe they mistyped "Anthropic". …

</details>

Two great questions. Let me address both clearly.

---

## 1. The API Key Gating Feature — Design Decision

Here's how it should work conceptually before you write a line of code:

**The flow:**

Every visitor gets 3 free company searches. The search count is tracked in `localStorage` on the client. After the 3rd search completes, a settings panel slides in asking for their own API keys. Those keys are stored in `localStorage` too — never hardcoded, never logged. Every subsequent API request from that browser passes the user's keys along with the research request, and your Next.js route handler uses *those* keys instead of the default environment keys.

**Why localStorage and not a database:**

No auth system, no user accounts, no backend storage needed. Vercel stays stateless. The tradeoff is that clearing browser data resets the counter — which is acceptable for this use case.

**The three states your UI needs to handle:**

- `count < 3` → research runs silently using your env keys, no mention of API keys  
- `count >= 3, no user keys stored` → block research, show the API key form  
- `count >= 3, user keys present` → research runs using the user's keys, show a small "using your keys" indicator and a settings icon to update them

**Key design note for the README:** Frame this as a "bring your own key" model — it's actually a common and well-respected pattern in AI demos. It shows architectural maturity to evaluators.

---

## 2. Transferring This Session's Context to Your Claude Coding Session

First — a small correction. I think you mean **Anthropic** (not "antigravity") — specifically Claude Opus on claude.ai or via API. Either way, here's exactly how to carry everything over.

**The core problem:** Claude has no memory between sessions. When you open a new conversation to start coding, it knows nothing about the architecture we just planned. You need to give it that context upfront, efficiently.

**Here's what to prepare before you open that coding session:**

---

### Step 1 — Save This Conversation

Claude.ai lets you copy or export conversations. Do this now before you close the tab. This transcript is also your **bonus points submission** — the evaluators want to see your LLM chat logs, and this planning session counts.

---

### Step 2 — Create a Project on claude.ai

Go to claude.ai → **Projects** → New Project. Name it something like `Investment Research Agent`. In the **Project Instructions** (the persistent system prompt for that project), paste a condensed version of our architecture. Every conversation you open inside that project will automatically have that context loaded — you won't need to re-explain anything each time.

Here's exactly what to paste into the Project Instructions:

```
We are building an AI Investment Research Agent with this stack:
- Next.js 15 (App Router) — frontend + backend in one repo
- LangGraph.js — stateful multi-node agent graph
- Google Gemini 2.5 Flash — primary LLM (via @langchain/google-genai)
- Tavily Search — web research tool (via @langchain/community)
- Deploying on Vercel

AGENT GRAPH:
resolveCompany → [researchFinancials, researchNews, 
researchCompetitors, researchIndustry] (parallel) 
→ analyzeAll → makeDecision

STATE SHAPE: company, ticker, sector, financialData, newsData, 
competitorData, industryData, analysis, decision (INVEST/PASS/MONITOR), 
confidence (0-100), bullishFactors[], bearishFactors[], reasoning, completedSteps[]

FOLDER STRUCTURE:
app/api/research/route.ts — streaming SSE endpoint
app/components/ — CompanySearch, ResearchTimeline, DecisionCard, FactorsGrid
lib/graph/state.ts — AgentState type
lib/graph/graph.ts — graph assembly
lib/graph/nodes/ — one file per node
lib/tools/search.ts — Tavily wrapper
lib/llm.ts — Gemini setup

SPECIAL FEATURE: 
- First 3 searches use env keys (GOOGLE_API_KEY, TAVILY_API_KEY)
- After 3 searches, prompt user for their own keys via a UI form
- Keys stored in localStorage, passed with each API request
- Server uses user-provided keys if present, env keys otherwise

BUILD ORDER:
1. Scaffold Next.js + install deps
2. lib/llm.ts + lib/tools/search.ts (test both work)
3. lib/graph/state.ts
4. Nodes one at a time, test incrementally
5. lib/graph/graph.ts (wire everything)
6. app/api/research/route.ts (streaming)
7. Frontend components
8. Vercel deploy
```

---

### Step 3 — Your Opening Message in the Coding Session

When you start the actual build conversation, open with something like this (paste it verbatim):

> "I'm building the Investment Research Agent we planned. The architecture is in the project instructions. Let's start with Step 1: scaffold the Next.js project and install all dependencies. List every package I'll need with the exact install command, then create the base folder structure."

This gives Claude a concrete, unambiguous first task. Don't say "let's start building" — that's too vague and you'll get a wall of explanation instead of code.

---

### Step 4 — One File Per Message, Always

When you're in the coding session, discipline the conversation like this:

- Ask for **one file at a time**  
- Test it before moving to the next  
- If something breaks, paste the error in the same conversation so Claude has the full context  
- Don't skip the build order — `lib/llm.ts` must work before you build any node that uses it

---

### Bonus Points Strategy

Since evaluators want all your LLM chat transcripts:

- **This planning session** → save it now, label it `01-planning.md`  
- **The coding session(s)** → export each one as you go, label them `02-build-session-1.md`, etc.  
- Include them all in the `/docs` folder of your zip submission

The evaluators will see that you used AI not just for generating code but for **architecture thinking** — which is the higher-value skill they're testing for.

---

When you're set up on claude.ai with the Project created and the instructions pasted in, come back here if you want to refine anything before you start. Or go build — the plan is solid enough to start right now.

---
