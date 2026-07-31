# Genesis Engine — Coding Standards

> **Version:** 1.0.0  
> **Status:** Active  
> **Priority:** CRITICAL  
> **Applies To:** All source code in `/src`

---

## 🏗️ ARCHITECTURAL STYLE

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────┐
│           External World                │
│  (APIs, Databases, AI Providers, etc.)  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            Adapters Layer               │
│   (Implementations of Port Interfaces)  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            Ports Layer                  │
│      (Interfaces / Contracts)           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Domain Logic (Core)             │
│    (Business Rules, Agents, Workflows)  │
└─────────────────────────────────────────┘
```

**Rules:**
1. Core NEVER depends on adapters
2. Adapters depend on port interfaces
3. External dependencies injected via constructor
4. No direct imports from external libraries in core

---

## 📝 TYPESCRIPT STANDARDS

### 1. Strict Mode Enforcement

```json
// tsconfig.json (REQUIRED)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  }
}
```

### 2. Type Safety Rules

```typescript
// ✅ CORRECT - Explicit types
interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

function getUserById(id: string): Promise<User | null> {
  // Implementation
}

// ❌ WRONG - Implicit any
function getUserById(id) { // Missing type annotation
  return null; // Returns any instead of User | null
}
```

### 3. Immutability

```typescript
// ✅ CORRECT - Readonly properties
interface ResearchResult {
  readonly query: string;
  readonly findings: readonly string[];
  readonly confidence: number;
  readonly timestamp: Date;
}

// ✅ CORRECT - Readonly arrays
const findings: readonly string[] = ['result1', 'result2'];

// ❌ WRONG - Mutable data
interface ResearchResult {
  query: string; // Should be readonly
  findings: string[]; // Should be readonly
}
```

### 4. Enum Usage

```typescript
// ✅ CORRECT - Const enum for performance
export const enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// ✅ CORRECT - Union types for flexibility
export type WorkflowStage = 
  | 'idea'
  | 'research'
  | 'validation'
  | 'planning'
  | 'output';

// ❌ AVOID - Regular enums (runtime overhead)
export enum AgentStatus {
  IDLE,
  RUNNING,
  COMPLETED,
  FAILED
}
```

---

## 🔌 DEPENDENCY INJECTION

### Constructor Injection Pattern

```typescript
// ✅ CORRECT
import { IResearchGateway } from '../interfaces/research.gateway.interface';
import { ILogger } from '../interfaces/logger.interface';

export class ResearchAgent {
  constructor(
    private readonly researchGateway: IResearchGateway,
    private readonly logger: ILogger,
    private readonly config: ResearchAgentConfig
  ) {}

  async execute(query: string): Promise<ResearchResult> {
    this.logger.info('Starting research', { query });
    const results = await this.researchGateway.search(query);
    this.logger.info('Research completed', { resultCount: results.length });
    return results;
  }
}

// ❌ WRONG - Hardcoded dependencies
export class ResearchAgent {
  private gateway = new TavilyGateway(); // Direct instantiation
  private logger = new ConsoleLogger();

  async execute(query: string): Promise<ResearchResult> {
    // Implementation
  }
}
```

### Factory Pattern for Complex Dependencies

```typescript
// ✅ CORRECT - Factory for creating agents
export interface AgentFactory {
  createResearchAgent(): IResearchAgent;
  createDecisionAgent(): IDecisionAgent;
  createPlanningAgent(): IPlanningAgent;
  createOutputAgent(): IOutputAgent;
}

export class GenesisAgentFactory implements AgentFactory {
  constructor(
    private readonly container: DependencyContainer
  ) {}

  createResearchAgent(): IResearchAgent {
    const gateway = this.container.resolve<IResearchGateway>('IResearchGateway');
    const logger = this.container.resolve<ILogger>('ILogger');
    return new ResearchAgent(gateway, logger);
  }
}
```

---

## ⚡ ASYNC/ERROR HANDLING

### Result Pattern (No Raw Throws)

```typescript
// ✅ CORRECT - Result type
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export class ResearchAgent {
  async execute(query: string): Promise<Result<ResearchResult, ResearchError>> {
    try {
      const results = await this.researchGateway.search(query);
      
      if (results.length === 0) {
        return {
          success: false,
          error: new ResearchError('No results found', 'NO_RESULTS')
        };
      }

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ResearchError 
          ? error 
          : new ResearchError('Unknown error', 'UNKNOWN', error)
      };
    }
  }
}

// ❌ WRONG - Throwing raw errors
export class ResearchAgent {
  async execute(query: string): Promise<ResearchResult> {
    const results = await this.researchGateway.search(query);
    
    if (results.length === 0) {
      throw new Error('No results found'); // Raw error
    }
    
    return results;
  }
}
```

### Custom Error Classes

```typescript
// ✅ CORRECT - Structured errors
export class GenesisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GenesisError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GatewayError extends GenesisError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: Error
  ) {
    super(message, 'GATEWAY_ERROR', cause, { provider });
    this.name = 'GatewayError';
  }
}

export class ValidationError extends GenesisError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR', undefined, { field });
    this.name = 'ValidationError';
  }
}
```

### Async Best Practices

```typescript
// ✅ CORRECT - Proper async handling
export class ResearchAgent {
  async executeMultiple(queries: string[]): Promise<Result<ResearchResult[], AggregateError>> {
    const results = await Promise.allSettled(
      queries.map(query => this.execute(query))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<Result<any, any>> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(r => r.success);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    if (failed.length > 0) {
      return {
        success: false,
        error: new AggregateError(failed.map(r => r.reason), 'Some queries failed')
      };
    }

    return {
      success: true,
      data: successful.map(r => r.data)
    };
  }
}

// ❌ WRONG - Fire and forget
export class ResearchAgent {
  executeMultiple(queries: string[]): void {
    queries.forEach(query => {
      this.execute(query); // No error handling, no awaiting
    });
  }
}
```

---

## 📊 LOGGING STANDARDS

### Structured Logging

```typescript
// ✅ CORRECT - Structured logs with levels
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
}

export interface LogContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly component: string;
  readonly action: string;
  readonly duration?: number;
  readonly [key: string]: unknown;
}

// Usage example
export class ResearchAgent {
  async execute(query: string): Promise<Result<ResearchResult, ResearchError>> {
    const startTime = Date.now();
    
    this.logger.info('Research started', {
      component: 'ResearchAgent',
      action: 'execute',
      query,
      sessionId: this.sessionId
    });

    try {
      const results = await this.researchGateway.search(query);
      const duration = Date.now() - startTime;

      this.logger.info('Research completed', {
        component: 'ResearchAgent',
        action: 'execute',
        query,
        resultCount: results.length,
        duration
      });

      return { success: true, data: results };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Research failed', error as Error, {
        component: 'ResearchAgent',
        action: 'execute',
        query,
        duration
      });

      return {
        success: false,
        error: error instanceof ResearchError 
          ? error 
          : new ResearchError('Research failed', 'RESEARCH_FAILED', error as Error)
      };
    }
  }
}
```

### Log Sanitization

```typescript
// ✅ CORRECT - Never log sensitive data
export function sanitizeLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'authorization'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ❌ WRONG - Logging sensitive data
this.logger.info('API call', {
  apiKey: process.env.OPENROUTER_KEY, // SECURITY VIOLATION
  url: 'https://api.openrouter.ai/v1/chat/completions'
});
```

---

## 🧪 TESTING STANDARDS

### Unit Test Structure

```typescript
// ✅ CORRECT - AAA pattern (Arrange, Act, Assert)
import { ResearchAgent } from './research.agent';
import { MockResearchGateway } from '../__mocks__/research.gateway.mock';
import { MockLogger } from '../__mocks__/logger.mock';

describe('ResearchAgent', () => {
  let agent: ResearchAgent;
  let mockGateway: MockResearchGateway;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockGateway = new MockResearchGateway();
    mockLogger = new MockLogger();
    agent = new ResearchAgent(mockGateway, mockLogger);
  });

  describe('execute', () => {
    it('should return successful result when gateway returns data', async () => {
      // Arrange
      const query = 'test query';
      const expectedResults = [{ title: 'Result 1', content: 'Content 1' }];
      mockGateway.setMockResults(expectedResults);

      // Act
      const result = await agent.execute(query);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedResults);
      expect(mockGateway.search).toHaveBeenCalledWith(query);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should return error result when gateway returns empty array', async () => {
      // Arrange
      const query = 'empty query';
      mockGateway.setMockResults([]);

      // Act
      const result = await agent.execute(query);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_RESULTS');
    });
  });
});
```

### Test Coverage Requirements

```
Minimum Coverage:
- Core Agents: 90%
- Gateways: 85%
- DTOs: 100%
- Interfaces: N/A (no implementation)
- Utilities: 80%

Required Test Types:
1. Unit tests for all business logic
2. Integration tests for all gateways
3. Contract tests for all interfaces
4. End-to-end tests for critical workflows
```

---

## 📁 FILE ORGANIZATION

### Naming Conventions

```
/src
  /core
    ├── orchestrator.ts
    ├── workflow.engine.ts
    └── dependency.container.ts

  /agents
    ├── research.agent.ts
    ├── decision.agent.ts
    ├── planning.agent.ts
    └── output.agent.ts

  /gateways
    ├── research.gateway.interface.ts
    ├── ai.gateway.interface.ts
    ├── storage.gateway.interface.ts
    ├── tavily.gateway.adapter.ts
    └── openrouter.gateway.adapter.ts

  /dto
    ├── research.request.dto.ts
    ├── research.response.dto.ts
    ├── decision.dto.ts
    └── workflow.dto.ts

  /interfaces
    ├── agent.interface.ts
    ├── gateway.interface.ts
    ├── logger.interface.ts
    └── error.contract.ts

  /utils
    ├── logger.ts
    ├── result.ts
    └── validators.ts

  /errors
    ├── genesis.error.ts
    ├── gateway.error.ts
    └── validation.error.ts
```

### File Header Template

```typescript
/**
 * [Component Name]
 * 
 * @purpose [One sentence description]
 * @dependencies [List of injected dependencies]
 * @relatedDocs [Links to architecture docs]
 * @version 1.0.0
 * @since 2025-01-XX
 */
```

---

## 🔒 SECURITY STANDARDS

### Input Validation

```typescript
// ✅ CORRECT - Validate all inputs
import { z } from 'zod';

export const ResearchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  sources: z.array(z.enum(['web', 'academic', 'github'])).optional(),
  maxResults: z.number().int().positive().max(50).optional(),
  timeout: z.number().int().positive().max(30000).optional()
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export class ResearchAgent {
  async execute(request: ResearchRequest): Promise<Result<ResearchResult, ValidationError>> {
    const validationResult = ResearchRequestSchema.safeParse(request);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: new ValidationError('Invalid request', validationResult.error.errors[0].path.join('.'))
      };
    }

    // Proceed with validated data
  }
}
```

### API Key Management

```typescript
// ✅ CORRECT - Environment variables only
export class OpenRouterAdapter {
  constructor(
    @Inject('CONFIG') private readonly config: ConfigService
  ) {}

  private getApiKey(): string {
    const key = this.config.get('OPENROUTER_API_KEY');
    
    if (!key || key.length < 10) {
      throw new ConfigurationError('OPENROUTER_API_KEY not configured');
    }

    return key;
  }
}

// ❌ WRONG - Hardcoded keys
export class OpenRouterAdapter {
  private apiKey = 'sk-or-v1-xxxxx'; // NEVER DO THIS
}
```

---

## 📈 PERFORMANCE GUIDELINES

### Caching Strategy

```typescript
// ✅ CORRECT - Cache expensive operations
export class ResearchAgent {
  private readonly cache = new Map<string, ResearchResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async execute(query: string): Promise<Result<ResearchResult, ResearchError>> {
    const cached = this.cache.get(query);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug('Cache hit', { query });
      return { success: true, data: cached };
    }

    const result = await this.researchGateway.search(query);
    
    if (result.success) {
      this.cache.set(query, { ...result.data, timestamp: Date.now() });
    }

    return result;
  }
}
```

### Rate Limiting

```typescript
// ✅ CORRECT - Implement rate limiting
import Bottleneck from 'bottleneck';

export class OpenRouterAdapter {
  private readonly limiter = new Bottleneck({
    minTime: 100, // Minimum 100ms between requests
    maxConcurrent: 5 // Maximum 5 concurrent requests
  });

  async chat(messages: Message[]): Promise<Result<ChatResponse, GatewayError>> {
    return this.limiter.schedule(() => this.executeChat(messages));
  }
}
```

---

## 🔄 VERSION CONTROL

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(research-agent): implement caching for research results

Add in-memory caching with 5-minute TTL to reduce API calls
and improve response times for repeated queries.

Closes #42
```

---

## ✅ CODE REVIEW CHECKLIST

Before submitting any code:

- [ ] Follows hexagonal architecture
- [ ] All types are explicit (no `any`)
- [ ] Dependencies are injected
- [ ] Errors use Result pattern
- [ ] Logging is structured and sanitized
- [ ] Tests cover happy path + edge cases
- [ ] Input validation implemented
- [ ] No hardcoded values or secrets
- [ ] Performance considerations addressed
- [ ] Documentation updated if needed

---

**End of Coding Standards**

*Last Updated: 2025-01-XX*  
*Next Review: After first sprint completion*
