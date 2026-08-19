# Genesis Engine - Repository Structure

Version: 1.0  
Status: Active  
Priority: High  
Depends On:
- 00_project_rules.md
- 01_system_architecture.md

---

## Purpose

This document defines the complete repository structure for Genesis.

All files and folders MUST follow this structure unless an ADR approves changes.

---

## Root Structure

```
genesis/
├── docs/                     # All documentation
├── src/                      # Source code
├── tests/                    # Test suites
├── config/                   # Configuration files
├── scripts/                  # Automation scripts
├── .github/                  # GitHub workflows
├── .clinerules              # AI rules (critical)
├── README.md                # Project overview
├── package.json             # Dependencies (if Node.js)
└── requirements.txt         # Dependencies (if Python)
```

---

## Documentation Structure (`docs/`)

```
docs/
├── architecture/            # Core architecture documents
│   ├── 00_project_rules.md
│   ├── 00_ai_bootstrap_prompt.md
│   ├── 01_system_architecture.md
│   ├── 02_repository_structure.md
│   ├── 03_memory_architecture.md
│   ├── 04_execution_model.md
│   ├── 05_capability_architecture.md
│   ├── 06_gateway_architecture.md
│   ├── 07_registry_architecture.md
│   ├── 08_contract_definitions.md
│   ├── 09_prompt_architecture.md
│   ├── 10_artifact_pipeline.md
│   ├── 11_security_architecture.md
│   ├── 12_deployment_architecture.md
│   ├── 13_observability_architecture.md
│   ├── 14_workflow_architecture.md
│   ├── 15_api_architecture.md
│   ├── 16_frontend_architecture.md
│   └── 17_testing_architecture.md
│
├── contracts/               # Interface definitions
│   ├── agent_contracts.md
│   ├── gateway_contracts.md
│   ├── orchestrator_contracts.md
│   ├── dto_definitions.md
│   └── error_contracts.md
│
├── governance/              # Decision records & policies
│   ├── adr/                # Architectural Decision Records
│   │   ├── template.md
│   │   ├── adr-001.md
│   │   └── ...
│   ├── coding_standards.md
│   └── review_checklist.md
│
├── visualization/           # Mermaid diagrams
│   ├── architecture/
│   │   ├── system_overview.md
│   │   ├── full_genesis_map.md
│   │   └── architecture_dependencies.md
│   ├── execution/
│   │   ├── workflow.md
│   │   ├── retry_flow.md
│   │   ├── rollback_flow.md
│   │   ├── decision_flow.md
│   │   ├── memory_lifetime.md
│   │   └── implementation_roadmap.md
│   ├── infrastructure/
│   │   ├── deployment.md
│   │   ├── gateway_flow.md
│   │   └── incident_response.md
│   ├── developer/
│   │   ├── prompt_pipeline.md
│   │   ├── prompt_security.md
│   │   ├── testing_strategy.md
│   │   └── ci_cd_flow.md
│   └── ai_navigation/
│       ├── repository_tree.md
│       ├── implementation_graph.md
│       └── context_loading.md
│
└── runbooks/               # Operational procedures
    ├── recovery_procedures.md
    ├── rollback_procedure.md
    ├── provider_down_runbook.md
    ├── budget_drain_runbook.md
    ├── redis_failure_runbook.md
    ├── security_incident_runbook.md
    └── post_mortem_template.md
```

---

## Source Code Structure (`src/`)

```
src/
├── core/                    # Core business logic
│   ├── orchestrator/       # Workflow orchestration
│   │   ├── orchestrator.ts
│   │   ├── workflow_engine.ts
│   │   ├── retry_manager.ts
│   │   └── job_tracker.ts
│   │
│   └── agents/             # AI agents
│       ├── research/
│       │   ├── research_agent.ts
│       │   ├── market_researcher.ts
│       │   ├── competitor_researcher.ts
│       │   └── technology_researcher.ts
│       ├── decision/
│       │   ├── decision_agent.ts
│       │   ├── validation_engine.ts
│       │   └── confidence_calculator.ts
│       ├── planning/
│       │   ├── planning_agent.ts
│       │   ├── prd_generator.ts
│       │   ├── architecture_planner.ts
│       │   └── roadmap_generator.ts
│       └── output/
│           ├── output_agent.ts
│           ├── markdown_generator.ts
│           ├── diagram_generator.ts
│           └── export_packager.ts
│
├── infrastructure/          # External integrations
│   ├── gateways/           # Gateway implementations
│   │   ├── research/
│   │   │   ├── research_gateway.ts
│   │   │   ├── exa_adapter.ts
│   │   │   ├── tavily_adapter.ts
│   │   │   └── brave_adapter.ts
│   │   ├── ai/
│   │   │   ├── ai_gateway.ts
│   │   │   ├── openrouter_adapter.ts
│   │   │   ├── gemini_adapter.ts
│   │   │   └── anthropic_adapter.ts
│   │   ├── storage/
│   │   │   ├── storage_gateway.ts
│   │   │   ├── postgres_adapter.ts
│   │   │   ├── redis_adapter.ts
│   │   │   └── supabase_adapter.ts
│   │   ├── queue/
│   │   │   ├── queue_gateway.ts
│   │   │   └── redis_queue_adapter.ts
│   │   └── export/
│   │       ├── export_gateway.ts
│   │       └── zip_exporter.ts
│   │
│   └── adapters/           # Additional adapters
│       ├── llm/
│       ├── search/
│       ├── database/
│       ├── storage/
│       └── payment/
│
├── domain/                  # Business domain
│   ├── entities/           # Core entities
│   │   ├── project.ts
│   │   ├── idea.ts
│   │   ├── research_result.ts
│   │   ├── decision.ts
│   │   └── plan.ts
│   │
│   ├── value_objects/      # Immutable values
│   │   ├── confidence_score.ts
│   │   ├── cost.ts
│   │   ├── timestamp.ts
│   │   └── correlation_id.ts
│   │
│   ├── interfaces/         # Domain interfaces
│   │   ├── agent_interface.ts
│   │   ├── gateway_interface.ts
│   │   └── repository_interface.ts
│   │
│   └── services/           # Domain services
│       ├── validation_service.ts
│       ├── pricing_service.ts
│       └── scoring_service.ts
│
├── application/             # Application layer
│   ├── services/           # Application services
│   │   ├── project_service.ts
│   │   ├── workflow_service.ts
│   │   └── export_service.ts
│   │
│   ├── dtos/               # Data transfer objects
│   │   ├── research_request.ts
│   │   ├── research_result.ts
│   │   ├── decision_dto.ts
│   │   └── plan_dto.ts
│   │
│   └── validators/         # Input validators
│       ├── request_validator.ts
│       └── schema_validator.ts
│
└── presentation/            # Presentation layer
    ├── api/                # REST/GraphQL API
    │   ├── routes/
    │   ├── controllers/
    │   ├── middleware/
    │   └── api_docs.ts
    │
    ├── cli/                # Command-line interface
    │   ├── commands/
    │   └── cli.ts
    │
    └── ui/                 # Web/Desktop UI (if applicable)
        ├── components/
        ├── pages/
        └── styles/
```

---

## Test Structure (`tests/`)

```
tests/
├── unit/                   # Unit tests
│   ├── core/
│   │   ├── orchestrator.test.ts
│   │   └── agents/
│   ├── infrastructure/
│   │   └── gateways/
│   ├── domain/
│   └── application/
│
├── integration/            # Integration tests
│   ├── gateway_integration.test.ts
│   ├── agent_integration.test.ts
│   └── workflow_integration.test.ts
│
└── e2e/                    # End-to-end tests
    ├── full_workflow.test.ts
    └── api_e2e.test.ts
```

---

## Configuration Structure (`config/`)

```
config/
├── default.json            # Default configuration
├── development.json        # Dev environment
├── production.json         # Production environment
├── test.json               # Test environment
└── secrets.example.json    # Secrets template (no real secrets)
```

---

## Scripts Structure (`scripts/`)

```
scripts/
├── setup.sh                # Initial setup
├── migrate.sh              # Database migrations
├── seed.sh                 # Seed data
├── backup.sh               # Backup procedures
├── deploy.sh               # Deployment scripts
└── cleanup.sh              # Cleanup tasks
```

---

## GitHub Workflows (`.github/workflows/`)

```
.github/workflows/
├── ci.yml                  # Continuous integration
├── cd.yml                  # Continuous deployment
├── test.yml                # Test runner
├── lint.yml                # Linting
├── security_scan.yml       # Security scanning
└── docs_deploy.yml         # Documentation deployment
```

---

## File Naming Conventions

### TypeScript/JavaScript
- Classes: `PascalCase.ts` (e.g., `ResearchAgent.ts`)
- Interfaces: `PascalCase.ts` (e.g., `IGateway.ts`)
- DTOs: `PascalCase.dto.ts` (e.g., `ResearchRequest.dto.ts`)
- Tests: `filename.test.ts`
- Utils: `kebab-case.util.ts`

### Markdown
- Architecture docs: `NN_document_name.md`
- Contracts: `component_contracts.md`
- ADRs: `adr-NNN.md`
- Diagrams: `diagram_name.md`

### Configuration
- Environment configs: `environment.json`
- Secrets templates: `secrets.example.json`

---

## Import Rules

### Layer Dependencies
```
Presentation → Application → Domain ← Infrastructure
```

**NEVER:**
- Domain imports Presentation
- Application imports Infrastructure directly
- Circular dependencies between any layers

### Gateway Pattern
```typescript
// ✅ Correct
import { IResearchGateway } from '../infrastructure/gateways/research';

// ❌ Wrong
import { ExaAdapter } from '../infrastructure/adapters/exa';
```

---

## End of Document
