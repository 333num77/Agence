# Genesis Engine - AI-Native Product Intelligence Platform

## 🎯 Vision

Genesis is **NOT** an AI coding assistant, PRD generator, or chatbot.

Genesis is an **intelligent engineering system** that transforms uncertain ideas into validated, production-ready execution blueprints.

Instead of asking "How do I build this?", Genesis first asks "**Should this even be built?**"

## 🚀 Core Principles

1. **Reason before generation** - No code without validation
2. **Evidence before reasoning** - Decisions backed by research
3. **One responsibility per component** - Clean architecture
4. **Replace providers, not architecture** - Future-proof design
5. **LLMs reason, software executes** - Clear separation
6. **Everything measurable** - Full observability

## 📁 Project Structure

```
genesis-engine/
├── src/
│   ├── core/           # Domain entities, value objects, events
│   ├── agents/         # Research, Decision, Planning, Output agents
│   ├── gateways/       # External system interfaces
│   ├── adapters/       # Provider implementations
│   ├── interfaces/     # TypeScript interfaces & contracts
│   ├── dto/            # Data Transfer Objects
│   ├── services/       # Application services
│   └── utils/          # Shared utilities
├── docs/
│   ├── 00_foundation/  # Constitution & rules
│   ├── 01_architecture/# System design documents
│   ├── 02_contracts/   # Interface definitions
│   ├── 03_agents/      # Agent specifications
│   ├── 04_infrastructure/# Gateway & deployment docs
│   ├── 05_visualization/# Mermaid diagrams
│   ├── 06_governance/  # ADRs & decision logs
│   └── 07_deployment/  # Runbooks & operations
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/             # Configuration files
└── scripts/            # Build & deployment scripts
```

## 🔒 Privacy & Security First

- **No data leakage**: All external calls go through gateways
- **Provider abstraction**: Easy to swap AI providers
- **Audit logging**: Every action tracked with correlation IDs
- **Data minimization**: Only collect what's necessary
- **Encryption at rest**: Sensitive data encrypted
- **GDPR compliant**: User data controls built-in

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x (strict mode)
- **Architecture**: Hexagonal (Ports & Adapters)
- **Pattern**: CQRS + Event-Driven
- **Testing**: Jest + Supertest
- **Deployment**: Docker + Kubernetes ready

## 📋 Implementation Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] TypeScript configuration
- [x] Directory structure
- [ ] Core interfaces
- [ ] Value objects

### Phase 2: Contracts
- [ ] Agent interfaces
- [ ] Gateway contracts
- [ ] DTO definitions

### Phase 3: Infrastructure
- [ ] AI Gateway
- [ ] Research Gateway
- [ ] Storage Gateway

### Phase 4: Agents
- [ ] Research Agent
- [ ] Decision Agent
- [ ] Planning Agent
- [ ] Output Agent

### Phase 5: Orchestrator
- [ ] Workflow engine
- [ ] Job tracking
- [ ] Retry logic

### Phase 6: API & UI
- [ ] REST API
- [ ] CLI interface
- [ ] Web dashboard

## 🚦 Getting Started

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

ISC

## 🤝 Contributing

1. Read `docs/00_foundation/` first
2. Follow ADR process for architecture changes
3. All code must have tests
4. Strict typing required

---

**Genesis Engine** - Reducing expensive engineering mistakes before they happen.
