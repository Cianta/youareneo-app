# 🛸 Mission Control — NEO Academy Agent OS

> A premium, browser-based AI Agent Operating System built with Next.js 15, sacred geometry design, and a unified multi-agent memory architecture.

---

## ✨ What's Inside

| Module | Description |
|--------|-------------|
| **Mission Control** | Central dashboard — all agents, API status, live metrics |
| **Shared Memory** | Unified Markdown/JSON knowledge base synced across all agents |
| **Kanban Board** | Drag-and-drop task board — agents can autonomously create & update tasks |
| **SEO Strategy Hub** | Keyword research via SERP API + AI content generation + multi-domain deploy |
| **Media Studio** | TTS (ElevenLabs/OpenAI), podcast script generation, video processing bridge |
| **Shopify Hub** | AI-generated product pages, blog posts, and pages — direct publish to Shopify API |
| **Settings** | API key management, agent configs, memory sync settings |

## 🤖 Connected Agents

| Agent | Provider | Speciality |
|-------|----------|------------|
| **Hermes** ⚡ | OpenAI GPT-4o | SEO research, content strategy, speed |
| **Claude** 🧠 | Anthropic | Long-form writing, reasoning, code |
| **OpenClaw** 🦅 | Ollama (local) | Offline execution, technical tasks |
| **Gemini** 💎 | Google AI | Multimodal, media scripts, creativity |

All agents share a **single unified memory database** (`data/memory/`). When any agent writes `[MEMORY]`, `KEY INSIGHT:`, or `IMPORTANT FACT:` in its response, the fact is automatically extracted and available to every other agent.

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+ (`node --version`)
- npm or pnpm

### 1. Clone & Install

```bash
cd "Visual Studio - Video Editor/mission-control"
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
nano .env.local
```

Required keys (add at least one agent):
- `ANTHROPIC_API_KEY` — for Claude
- `OPENAI_API_KEY` — for Hermes (GPT-4o)
- `GOOGLE_AI_API_KEY` — for Gemini

Optional:
- `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ADMIN_API_TOKEN`
- `SERP_API_KEY` — for live keyword data
- `ELEVENLABS_API_KEY` — for premium TTS

### 3. Launch

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → you'll be redirected to Mission Control.

---

## 🐳 Docker Deployment

### Local Docker

```bash
docker compose up --build -d
```

Access at `http://localhost:3000`

### VPS / Cloud (with HTTPS)

1. Point your domain DNS to the server IP
2. Uncomment the Traefik section in `docker-compose.yml`
3. Update `traefik` config with your domain and email
4. Run:

```bash
docker compose up --build -d
```

---

## 📁 Project Structure

```
mission-control/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          ← Mission Control overview
│   │   ├── kanban/           ← Drag-and-drop task board
│   │   ├── memory/           ← Shared knowledge browser
│   │   ├── seo/              ← Keyword research + deploy
│   │   ├── media/            ← Audio/TTS/podcast
│   │   ├── shopify/          ← Shopify content publisher
│   │   └── settings/         ← API keys + agent configs
│   └── api/
│       ├── agents/           ← Agent status + chat
│       ├── memory/           ← CRUD for shared memory
│       ├── kanban/           ← Task management
│       ├── seo/              ← SEO + content gen
│       ├── shopify/          ← Shopify API bridge
│       └── media/tts/        ← TTS generation
├── components/
│   ├── sacred-geometry/      ← Metatron's Cube, Flower of Life
│   ├── layout/               ← Sidebar, TopBar, NotebookPanel
│   ├── dashboard/            ← AgentCard, MetricsGrid
│   ├── kanban/               ← KanbanBoard, TaskCard
│   ├── memory/               ← MemoryBrowser
│   ├── seo/                  ← SEOModule
│   ├── media/                ← MediaStudio
│   └── shopify/              ← ShopifyHub
├── lib/
│   ├── db.ts                 ← File-based JSON database
│   ├── store.ts              ← Zustand state management
│   └── agents/base.ts        ← Multi-agent dispatcher
├── data/
│   ├── agents.json           ← Agent configurations
│   ├── kanban.json           ← Kanban board state
│   ├── notebook.json         ← Daily goals + journal
│   └── memory/               ← Individual memory entries
└── types/index.ts            ← All TypeScript types
```

---

## 🔮 Memory System Architecture

Every agent gets the last 50 memory entries injected into its system prompt automatically. Memory is stored as individual JSON files in `data/memory/` for portability and easy inspection.

**Auto-extraction triggers:**
- Agent response contains `[MEMORY]`
- Agent response contains `KEY INSIGHT:`
- Agent response contains `IMPORTANT FACT:`

**Manual entry:** Use the Shared Memory page to add facts directly.

---

## 🎨 Design System

- **Primary**: Deep Forest Green (`#0A110D` → `#68BC8C`)
- **Surface**: Anthracite (`#111111` → `#333333`)
- **Accent**: Sacred Gold (`#C9A84C` / `#E2C97E`)
- **Geometry**: Metatron's Cube (logo), Flower of Life (background)
- **Glass morphism** throughout with subtle borders
- **Framer Motion** animations — 60fps, spring physics

---

## 🔧 Adding a New Agent

1. Edit `data/agents.json` and add your agent config
2. If it's a new provider, add an adapter in `lib/agents/base.ts`
3. The agent appears in the dashboard automatically

---

## 📜 License

Private — NEO Academy Internal Tool
