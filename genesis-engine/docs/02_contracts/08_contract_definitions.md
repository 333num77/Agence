# 08_contract_definitions.md

Version: 1.0
Status: Approved
Priority: Critical
Depends On: 01_system_architecture.md, 07_gateway_architecture.md

---

# Purpose

This document defines the **Contracts** (Interfaces, DTOs, Value Objects) that form the backbone of Genesis.

Contracts ensure loose coupling between layers.

No layer depends on concrete implementations. All dependencies are abstractions.

---

# Contract Categories

## 1. Domain Entities (Core Business Objects)
Immutable objects representing core business concepts.

## 2. Value Objects (VOs)
Immutable objects defined by their attributes, not ID.

## 3. Data Transfer Objects (DTOs)
Objects for transferring data across boundaries (API, Gateway).

## 4. Repository Interfaces
Abstractions for data persistence.

## 5. Service Interfaces
Abstractions for business logic.

---

# 1. Domain Entities

## Project Entity

```typescript
type ProjectStatus = 'DRAFT' | 'RESEARCHING' | 'VALIDATING' | 'PLANNING' | 'READY' | 'ARCHIVED';

interface Project {
  readonly id: ProjectId;
  readonly userId: UserId;
  readonly name: string;
  readonly description: string;
  readonly status: ProjectStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly version: number; // For optimistic locking
}
```

## Idea Entity

```typescript
interface Idea {
  readonly id: IdeaId;
  readonly projectId: ProjectId;
  readonly problemStatement: string;
  readonly proposedSolution: string;
  readonly targetAudience: string;
  readonly constraints: Constraint[];
  readonly validationStatus: 'PENDING' | 'VALIDATED' | 'INVALIDATED';
  readonly confidenceScore?: ConfidenceScore;
}
```

## ResearchReport Entity

```typescript
interface ResearchReport {
  readonly id: ReportId;
  readonly projectId: ProjectId;
  readonly type: 'MARKET' | 'COMPETITOR' | 'TECHNOLOGY';
  readonly evidence: EvidenceItem[];
  readonly summary: string;
  readonly sources: Source[];
  readonly generatedAt: Timestamp;
}

interface EvidenceItem {
  readonly content: string;
  readonly relevanceScore: number;
  readonly sourceUrl: string;
}
```

## Decision Entity

```typescript
interface Decision {
  readonly id: DecisionId;
  readonly projectId: ProjectId;
  readonly type: 'BUILD_NOBUILD' | 'STACK_SELECTION' | 'FEATURE_PRIORITY';
  readonly recommendation: string;
  readonly reasoning: string;
  readonly confidenceScore: ConfidenceScore;
  readonly alternatives: Alternative[];
  readonly decidedAt: Timestamp;
}

interface Alternative {
  readonly option: string;
  readonly pros: string[];
  readonly cons: string[];
  readonly estimatedCost?: Cost;
}
```

## Plan Entity

```typescript
interface Plan {
  readonly id: PlanId;
  readonly projectId: ProjectId;
  readonly version: string;
  readonly phases: ImplementationPhase[];
  readonly architecture: ArchitectureSpec;
  readonly estimatedCost: Cost;
  readonly estimatedTimeline: Timeline;
  readonly risks: Risk[];
}

interface ImplementationPhase {
  readonly phaseNumber: number;
  readonly name: string;
  readonly objectives: string[];
  readonly deliverables: string[];
  readonly estimatedDays: number;
}
```

---

# 2. Value Objects (VOs)

Value objects have no identity. They are compared by value.

## ProjectId

```typescript
class ProjectId {
  constructor(private readonly value: string) {
    if (!isValidUuid(value)) {
      throw new Error('Invalid ProjectId');
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }
}
```

## ConfidenceScore

```typescript
class ConfidenceScore {
  constructor(private readonly value: number) {
    if (value < 0 || value > 100) {
      throw new Error('ConfidenceScore must be between 0 and 100');
    }
  }
  
  toNumber(): number {
    return this.value;
  }
  
  isHigh(): boolean {
    return this.value >= 80;
  }
  
  isMedium(): boolean {
    return this.value >= 50 && this.value < 80;
  }
  
  isLow(): boolean {
    return this.value < 50;
  }
}
```

## Cost

```typescript
class Cost {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new Error('Cost cannot be negative');
    }
  }
  
  add(other: Cost): Cost {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Cost(this.amount + other.amount, this.currency);
  }
  
  toUsd(): number {
    // Apply conversion rate logic here
    return this.amount;
  }
}
```

## CorrelationId

```typescript
class CorrelationId {
  private readonly value: string;
  
  static generate(): CorrelationId {
    return new CorrelationId(crypto.randomUUID());
  }
  
  constructor(value: string) {
    this.value = value;
  }
  
  toString(): string {
    return this.value;
  }
}
```

---

# 3. Data Transfer Objects (DTOs)

DTOs are used for API requests/responses and inter-service communication.

## CreateProjectRequest (API Input)

```typescript
interface CreateProjectRequest {
  name: string;
  description: string;
  idea: {
    problemStatement: string;
    proposedSolution: string;
    targetAudience: string;
  };
  constraints?: {
    budget?: number;
    timeline?: string;
    techPreferences?: string[];
  };
}
```

## ProjectResponse (API Output)

```typescript
interface ProjectResponse {
  id: string;
  name: string;
  status: string;
  createdAt: string; // ISO 8601
  idea: {
    problemStatement: string;
    proposedSolution: string;
  };
  latestDecision?: {
    recommendation: string;
    confidence: number;
  };
}
```

## AgentJobMessage (Queue Payload)

```typescript
interface AgentJobMessage {
  jobId: string;
  correlationId: string;
  type: 'RESEARCH' | 'DECISION' | 'PLANNING' | 'OUTPUT';
  payload: {
    projectId: string;
    parameters: Record<string, any>;
  };
  priority: number;
  maxRetries: number;
  createdAt: number; // Unix timestamp
}
```

---

# 4. Repository Interfaces

Repositories abstract database operations.

```typescript
interface IProjectRepository {
  findById(id: ProjectId): Promise<Project | null>;
  findByUserId(userId: UserId): Promise<Project[]>;
  save(project: Project): Promise<void>;
  updateStatus(id: ProjectId, status: ProjectStatus): Promise<void>;
  delete(id: ProjectId): Promise<void>; // Soft delete
}

interface IDecisionRepository {
  findById(id: DecisionId): Promise<Decision | null>;
  findByProjectId(projectId: ProjectId): Promise<Decision[]>;
  save(decision: Decision): Promise<void>;
  getLatestByProject(projectId: ProjectId): Promise<Decision | null>;
}

interface IResearchRepository {
  save(report: ResearchReport): Promise<void>;
  findByProjectId(projectId: ProjectId): Promise<ResearchReport[]>;
  findEvidenceByType(projectId: ProjectId, type: string): Promise<EvidenceItem[]>;
}
```

---

# 5. Service Interfaces

Services encapsulate business logic.

```typescript
interface IValidationService {
  validateIdea(idea: Idea, research: ResearchReport[]): Promise<Decision>;
  calculateConfidence(evidence: EvidenceItem[]): ConfidenceScore;
}

interface IPlanningService {
  generatePlan(decision: Decision, project: Project): Promise<Plan>;
  estimateCost(phases: ImplementationPhase[]): Cost;
  identifyRisks(plan: Plan): Risk[];
}

interface IExportService {
  generateMarkdownBundle(plan: Plan): Promise<FileEntry[]>;
  createZipArchive(files: FileEntry[]): Promise<Buffer>;
  exportToGit(files: FileEntry[], repoConfig: RepoConfig): Promise<string>;
}
```

---

# Error Contracts

Standardized error types for consistent handling.

```typescript
enum ErrorCode {
  // Client Errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // Domain Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
  CANNOT_MAKE_DECISION = 'CANNOT_MAKE_DECISION'
}

interface ErrorResponse {
  errorCode: ErrorCode;
  message: string;
  details?: Record<string, any>;
  correlationId: string;
  timestamp: string;
}

class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

---

# Type Safety Rules

1. **No `any` type:** Use `unknown` if type is truly dynamic, then narrow it.
2. **Strict Null Checks:** All optional fields must be explicitly marked `?`.
3. **Readonly by Default:** Entities and VOs are immutable unless explicitly mutable.
4. **Brand Primitives:** Use branded types for IDs to prevent mixing (e.g., `ProjectId` vs `UserId`).

---

# Validation Rules

All DTOs must be validated before use.

```typescript
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  idea: z.object({
    problemStatement: z.string().min(20),
    proposedSolution: z.string().min(20),
    targetAudience: z.string().min(5)
  }),
  constraints: z.object({
    budget: z.number().positive().optional(),
    timeline: z.string().optional(),
    techPreferences: z.array(z.string()).optional()
  }).optional()
});

type CreateProjectDTO = z.infer<typeof CreateProjectSchema>;
```

---

# End of Document
