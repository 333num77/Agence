# Genesis Engine — README

> **AI-Native Product Intelligence Platform**  
> *Validate ideas before building them*

[![Status](https://img.shields.io/badge/status-foundation-blue)]()
[![Version](https://img.shields.io/badge/version-0.1.0-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🎯 What is Genesis?

**Genesis Engine** is an intelligent validation system that helps transform uncertain ideas into validated, production-ready execution blueprints.

Instead of asking:
> "How do I build this?"

Genesis first asks:
> **"Should this even be built?"**

Only after sufficient validation does Genesis generate implementation plans.

---

## ⚡ Quick Start

### For AI Coding Assistants

If you're an AI assistant (Qwen Code, Cursor, Cline, GPT-4, Claude, Gemini) working on this project:

**START HERE:** `docs/00_foundation/ai_bootstrap_prompt.md`

This is the **Constitution** that defines:
- How to behave as an Architecture Guardian
- What documents to read for each task (TCS - Targeted Context Strategy)
- Coding standards and patterns to follow
- When to ask for clarification vs. make decisions

### For Developers

```bash
# 1. Clone the repository
git clone <repository-url>
cd genesis-engine

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Run tests
npm test

# 5. Start development
npm run dev
```

---

## 📚 Documentation Structure

```
/docs
├── 00_foundation/
│   ├── project_vision.md          ← What & Why (start here)
│   ├── ai_bootstrap_prompt.md     ← AI Constitution (critical)
│   └── coding_standards.md        ← How to write code
│
├── 01_architecture/
│   ├── 00_system_overview.md      ← High-level design
│   ├── 01_layered_architecture.md ← 6-layer model
│   ├── 02_core_agents.md          ← Agent specifications
│   ├── 03_gateway_pattern.md      ← External integration
│   └── adr-*.md                   ← Decision records
│
├── 02_contracts/
│   ├── interfaces/                ← TypeScript interfaces
│   └── dtos/                      ← Data transfer objects
│
├── 03_agents/
│   ├── research_agent.md
│   ├── decision_agent.md
│   ├── planning_agent.md
│   └── output_agent.md
│
├── 04_infrastructure/
│   ├── gateway_adapters.md
│   ├── database_schema.md
│   └── deployment.md
│
└── 05_deployment/
    ├── docker_setup.md
    ├── ci_cd.md
    └── monitoring.md
```

---

## 🏗️ Architecture Overview

```
┌──────────────────────────┐
│   Web / Desktop Client   │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│       API Gateway        │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│      Orchestrator        │ ← Workflow brain
└──────┬──────┬──────┬─────┘
       │      │      │      │
       ▼      ▼      ▼      ▼
   Research Decision Planning Output
   Agent    Agent   Agent   Agent
              │
              ▼
       Infrastructure Layer
              │
       ┌──────┴──────┐
       │             │
   AI Gateway   Research Gateway
   Storage Gateway  Queue Gateway
```

### Six Layers

1. **Presentation** — UI, authentication, user interaction
2. **Application** — Workflow execution, request routing
3. **Agent** — Intelligent reasoning (Research, Decision, Planning, Output)
4. **Business** — Deterministic logic, calculations, state
5. **Infrastructure** — External system communication
6. **External** — OpenRouter, Gemini, GitHub, Search APIs, etc.

---

## 🚀 Core Features

| Feature | Description |
|---------|-------------|
| **Market Research** | Analyze market size, trends, opportunities |
| **Competitor Analysis** | Identify competitors and gaps |
| **Technology Validation** | Evaluate tech stacks with evidence |
| **Architecture Recommendations** | System design with trade-offs |
| **Implementation Planning** | Phased roadmap with effort estimates |
| **AI Execution Assets** | Prompts, rules, configs for AI tools |
| **Export Package** | Ready-to-use documentation bundle |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript (ES2022) |
| **Runtime** | Node.js 20+ |
| **Architecture** | Hexagonal (Ports & Adapters) |
| **AI Providers** | OpenRouter, Gemini (via adapters) |
| **Research** | Tavily, Exa (via adapters) |
| **Database** | PostgreSQL (via Supabase) |
| **Cache** | Redis |
| **Queue** | BullMQ |
| **Testing** | Jest + Supertest |
| **Deployment** | Docker + Kubernetes |

---

## 📋 Development Principles

### 1. Architecture-First
No code without architecture docs. No features without ADRs.

### 2. Evidence-Based
Every claim backed by research. Confidence scores quantify uncertainty.

### 3. Modular & Replaceable
Providers swappable without code changes. Clear contracts everywhere.

### 4. Observable
All operations logged. Metrics collected. Dashboards for health.

### 5. Secure by Default
No secrets in code. Input validation everywhere. Least privilege.

### 6. Cost-Aware
Every token counts. Caching strategy. Budget alerts.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- research.agent.test.ts

# Run e2e tests
npm run test:e2e
```

**Coverage Requirements:**
- Core Agents: >90%
- Gateways: >85%
- DTOs: 100%
- Utilities: >80%

---

## 🔐 Security

### Environment Variables Required

```bash
# AI Providers
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# Research Providers
TAVILY_API_KEY=
EXA_API_KEY=

# Database
DATABASE_URL=
REDIS_URL=

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=
```

**Never commit `.env` files.** Use `.env.example` as template.

---

## 🤝 Contributing

### For AI Assistants

1. Read `docs/00_foundation/ai_bootstrap_prompt.md` first
2. Identify the micro-task
3. Load only relevant context (TCS)
4. Follow coding standards strictly
5. Ask for clarification if unsure

### For Human Contributors

1. Fork the repository
2. Create feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes using conventional commits
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open Pull Request

**Commit Format:**
```
type(scope): subject

body (optional)

footer (optional)
```

Example:
```
feat(research-agent): implement caching for research results

Add in-memory caching with 5-minute TTL to reduce API calls.

Closes #42
```

---

## 📈 Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Architecture documentation
- [x] Coding standards
- [x] AI Bootstrap Constitution
- [ ] Core contracts & interfaces
- [ ] Gateway pattern implementation

### Phase 2: Core Engine
- [ ] Research Agent
- [ ] Decision Agent
- [ ] Planning Agent
- [ ] Output Agent
- [ ] Orchestrator

### Phase 3: Infrastructure
- [ ] AI Gateway adapters
- [ ] Research Gateway adapters
- [ ] Storage Gateway
- [ ] Queue system
- [ ] Observability stack

### Phase 4: API & Integration
- [ ] REST API
- [ ] CLI tool
- [ ] Webhook support
- [ ] Export integrations

### Phase 5: Frontend
- [ ] Web application
- [ ] Progress visualization
- [ ] Dashboard & analytics

### Phase 6: Launch
- [ ] Beta testing
- [ ] Public launch

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📞 Contact

- **Architecture Discussions:** GitHub Issues + ADRs
- **Feature Requests:** GitHub Issues
- **Bug Reports:** GitHub Issues
- **Security Vulnerabilities:** security@genesis.engine (private)

---

## 🙏 Acknowledgments

Built with ❤️ for non-technical founders who have brilliant ideas but need validation before investing in development.

**Vision:** Become the standard intelligence layer between idea and implementation.

---

*Last Updated: 2025-01-XX*  
*Version: 0.1.0 (Foundation Phase)*
