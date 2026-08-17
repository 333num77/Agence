# 10_coding_standards.md

Version: 1.0
Status: Approved
Priority: Critical
Depends On: 01_system_architecture.md, 08_contract_definitions.md

---

# Purpose

This document defines the **Coding Standards** for Genesis.

All code MUST follow these standards. No exceptions without an approved ADR.

Standards ensure:
- Consistency across the codebase.
- Maintainability by any team member.
- Predictability in behavior.
- Ease of automated testing.

---

# Tech Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Runtime** | Node.js | 20.x LTS |
| **Language** | TypeScript | 5.x (Strict Mode) |
| **Package Manager** | pnpm | 9.x |
| **Framework** | Fastify (API), Hono (Edge) | Latest |
| **Database ORM** | Kysely (Type-safe SQL) | Latest |
| **Queue** | BullMQ (Redis-based) | Latest |
| **Testing** | Vitest + Playwright | Latest |
| **Linting** | ESLint + Biome | Latest |
| **Formatting** | Prettier | Latest |

---

# Core Principles

## 1. Hexagonal Architecture (Ports & Adapters)

```
Domain Layer (Entities, VOs) ← Pure business logic
       ↑
Application Layer (Use Cases) ← Orchestrates domain
       ↑
   Interfaces (API, CLI) ← External entry points
       ↑
   Adapters (DB, HTTP, AI) ← Infrastructure details
```

**Rule:** Dependencies point inward. Outer layers depend on inner layers. Never vice versa.

---

## 2. Dependency Injection (DI)

All dependencies are injected via constructor. No static imports of concrete classes.

### ❌ BAD

```typescript
import { PostgresStorageGateway } from '../infrastructure/postgres';

class DecisionAgent {
  private storage = new PostgresStorageGateway(); // Hardcoded dependency
  
  async execute() {
    const data = await this.storage.query('...');
  }
}
```

### ✅ GOOD

```typescript
import { IStorageGateway } from '../contracts/storage-gateway';

class DecisionAgent {
  constructor(private storage: IStorageGateway) {} // Injected
  
  async execute() {
    const data = await this.storage.query('...');
  }
}
```

**Why?** Enables easy mocking for tests and swapping implementations.

---

## 3. Strict Typing

No `any` type allowed. Use `unknown` and narrow it.

### ❌ BAD

```typescript
function processData(data: any): Result {
  return data.value; // Unsafe
}
```

### ✅ GOOD

```typescript
interface DataInput {
  value: string;
}

function processData(data: unknown): Result {
  if (!isValidDataInput(data)) {
    throw new Error('Invalid input');
  }
  return data.value; // Type-safe
}

// Type guard
function isValidDataInput(data: unknown): data is DataInput {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as DataInput).value === 'string'
  );
}
```

---

## 4. Async/Await Only

No raw Promises or `.then()` chains.

### ❌ BAD

```typescript
getData().then(data => {
  return processData(data).then(result => {
    return saveResult(result);
  });
});
```

### ✅ GOOD

```typescript
async function workflow(): Promise<Result> {
  const data = await getData();
  const result = await processData(data);
  return await saveResult(result);
}
```

---

## 5. Error Handling

All errors are caught and transformed into `DomainError` objects.

```typescript
try {
  await gateway.callExternalService();
} catch (error) {
  if (isNetworkError(error)) {
    throw new DomainError(
      ErrorCode.SERVICE_UNAVAILABLE,
      'External service is down',
      { originalError: error }
    );
  }
  throw error; // Re-throw unknown errors
}
```

**Rules:**
- Never swallow errors silently.
- Always log with correlation ID.
- Never expose stack traces to API responses.

---

# File Structure

```
src/
├── core/                    # Domain Layer
│   ├── entities/            # Project, Idea, Decision
│   ├── value-objects/       # ProjectId, ConfidenceScore
│   ├── events/              # Domain Events
│   └── errors/              # Domain Errors
├── application/             # Application Layer
│   ├── services/            # ValidationService, PlanningService
│   ├── commands/            # CreateProjectCommand
│   ├── queries/             # GetProjectQuery
│   └── dto/                 # Request/Response DTOs
├── interfaces/              # Interface Adapters
│   ├── api/                 # REST Controllers, Middleware
│   ├── cli/                 # CLI Commands
│   └── webhooks/            # Webhook Handlers
├── infrastructure/          # Infrastructure Layer
│   ├── gateways/            # Gateway Implementations
│   │   ├── ai/              # OpenRouter, Gemini adapters
│   │   ├── storage/         # Postgres, Redis adapters
│   │   └── queue/           # BullMQ adapter
│   ├── repositories/        # Repository Implementations
│   └── config/              # Environment, DI Container
└── agents/                  # Agent Layer
    ├── research/            # Research Agent
    ├── decision/            # Decision Agent
    ├── planning/            # Planning Agent
    └── output/              # Output Agent
```

---

# Naming Conventions

| Type | Convention | Example |
| :--- | :--- | :--- |
| **Files** | kebab-case | `project-repository.ts` |
| **Classes** | PascalCase | `ProjectRepository` |
| **Interfaces** | PascalCase with `I` prefix | `IProjectRepository` |
| **Variables** | camelCase | `projectId` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| **Enums** | PascalCase | `ErrorCode` |
| **Types** | PascalCase | `ProjectStatus` |
| **Functions** | camelCase (verb-first) | `getProjectById` |
| **Test Files** | `*.test.ts` | `project.test.ts` |

---

# Code Style Rules

## 1. Functions

- Max 20 lines per function.
- Max 3 parameters (use object if more).
- Single responsibility.

### ❌ BAD

```typescript
async function process(id: string, user: User, config: Config, db: DB, logger: Logger, cache: Cache) {
  // 50 lines of mixed logic
}
```

### ✅ GOOD

```typescript
async function processProject(params: ProcessParams): Promise<Result> {
  validateInput(params);
  const data = await fetchData(params.id);
  const result = await transform(data, params.config);
  await persist(result, params.db);
  return result;
}

interface ProcessParams {
  id: string;
  user: User;
  config: Config;
  db: DB;
  logger: Logger;
  cache: Cache;
}
```

---

## 2. Classes

- Max 200 lines per class.
- Max 10 public methods.
- Constructor only assigns dependencies.

---

## 3. Comments

- **WHY**, not WHAT (code shows what).
- JSDoc for public APIs.
- Inline comments for complex logic.

```typescript
/**
 * Calculates confidence score based on evidence quality.
 * 
 * Algorithm: Weighted average of relevance scores,
 * penalized by age of evidence.
 * 
 * @param evidence - Array of evidence items
 * @returns Confidence score (0-100)
 */
function calculateConfidence(evidence: EvidenceItem[]): ConfidenceScore {
  // Apply decay factor for evidence older than 30 days
  const decayFactor = 0.9;
  // ... rest of logic
}
```

---

# Testing Standards

## 1. Unit Tests

- Test one behavior per test.
- Mock all external dependencies.
- Arrange-Act-Assert pattern.

```typescript
describe('DecisionAgent', () => {
  it('should return low confidence when evidence is insufficient', async () => {
    // Arrange
    const mockRepo = new MockResearchRepository();
    mockRepo.findEvidence.mockResolvedValue([]);
    const agent = new DecisionAgent(mockRepo);

    // Act
    const result = await agent.makeDecision(projectId);

    // Assert
    expect(result.confidence.isLow()).toBe(true);
  });
});
```

## 2. Integration Tests

- Use real database (Docker container).
- Test full workflows.
- Clean up after each test.

## 3. E2E Tests

- Simulate real user flows.
- Run against staging environment.

---

# Security Standards

1. **Input Validation:** Validate ALL inputs at API boundary.
2. **SQL Injection:** Use parameterized queries only (Kysely handles this).
3. **Secrets:** Never commit secrets. Use environment variables.
4. **Logging:** Sanitize logs (no tokens, passwords, PII).
5. **Rate Limiting:** Enforce per-user limits.

---

# Performance Standards

1. **Database:** Index all foreign keys and query filters.
2. **Caching:** Cache expensive LLM calls.
3. **Pagination:** Paginate all list endpoints.
4. **Streaming:** Stream large responses.
5. **Timeouts:** Set timeouts on all external calls.

---

# CI/CD Requirements

Before merging:

- [ ] All tests pass (unit, integration, e2e).
- [ ] Code coverage > 80%.
- [ ] No ESLint errors.
- [ ] TypeScript compiles without errors.
- [ ] ADR referenced (if architectural change).
- [ ] Documentation updated.

---

# End of Document
