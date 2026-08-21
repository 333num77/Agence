import { z } from 'zod';
import { EntityId } from '../interfaces/core.interfaces';

// ============================================================================
// VALUE OBJECTS (Immutable, validated domain primitives)
// ============================================================================

/**
 * Generate UUID v4 using native crypto
 */
function generateUUID(): string {
  const randomBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  
  // Set version to 4
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  // Set variant to RFC 4122
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
  
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Correlation ID for tracing requests across the system
 */
export class CorrelationIdVO {
  private constructor(public readonly value: string) {
    if (!value || value.length < 36) {
      throw new Error('CorrelationId must be a valid UUID');
    }
  }

  static create(): CorrelationIdVO {
    return new CorrelationIdVO(generateUUID());
  }

  static fromString(value: string): CorrelationIdVO {
    return new CorrelationIdVO(value);
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Confidence score for decisions (0.0 to 1.0)
 */
export class ConfidenceScoreVO {
  private constructor(public readonly value: number) {
    if (value < 0 || value > 1) {
      throw new Error('ConfidenceScore must be between 0 and 1');
    }
  }

  static create(score: number): ConfidenceScoreVO {
    return new ConfidenceScoreVO(Math.round(score * 100) / 100);
  }

  static high(): ConfidenceScoreVO {
    return new ConfidenceScoreVO(0.8);
  }

  static medium(): ConfidenceScoreVO {
    return new ConfidenceScoreVO(0.5);
  }

  static low(): ConfidenceScoreVO {
    return new ConfidenceScoreVO(0.3);
  }

  toNumber(): number {
    return this.value;
  }

  isHigh(): boolean {
    return this.value >= 0.7;
  }

  isMedium(): boolean {
    return this.value >= 0.4 && this.value < 0.7;
  }

  isLow(): boolean {
    return this.value < 0.4;
  }
}

/**
 * Monetary value with currency
 */
export class CostVO {
  private static readonly schema = z.object({
    amount: z.number().min(0),
    currency: z.string().length(3).default('USD'),
  });

  private constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD'
  ) {
    CostVO.schema.parse({ amount, currency });
  }

  static create(amount: number, currency: string = 'USD'): CostVO {
    return new CostVO(amount, currency);
  }

  static zero(currency: string = 'USD'): CostVO {
    return new CostVO(0, currency);
  }

  add(other: CostVO): CostVO {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add costs with different currencies');
    }
    return new CostVO(this.amount + other.amount, this.currency);
  }

  toObject(): { amount: number; currency: string } {
    return { amount: this.amount, currency: this.currency };
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

/**
 * Base entity identifier
 */
export class EntityIdVO implements EntityId {
  public readonly createdAt: Date;
  
  protected constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EntityId cannot be empty');
    }
    this.createdAt = new Date();
  }

  static create(): EntityIdVO {
    return new EntityIdVO(generateUUID());
  }

  static fromString(value: string): EntityIdVO {
    return new EntityIdVO(value);
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Project-specific ID with slug validation
 */
export class ProjectIdVO extends EntityIdVO {
  private static readonly slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  private constructor(value: string) {
    super(value);
    if (!ProjectIdVO.slugRegex.test(value)) {
      throw new Error(
        'ProjectId must be lowercase alphanumeric with hyphens (e.g., my-project-123)'
      );
    }
  }

  static create(): ProjectIdVO {
    const id = generateUUID().replace(/-/g, '').substring(0, 12);
    return new ProjectIdVO(`project-${id}`);
  }

  static fromSlug(slug: string): ProjectIdVO {
    return new ProjectIdVO(slug);
  }

  getSlug(): string {
    return this.value;
  }
}

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

/**
 * Project Entity - Aggregate Root
 */
export interface IProject {
  id: ProjectIdVO;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  metadata: Record<string, any>;
}

export type ProjectStatus = 
  | 'idea'
  | 'researching'
  | 'validating'
  | 'planning'
  | 'ready_for_export'
  | 'archived'
  | 'cancelled';

export class Project implements IProject {
  public readonly version: number;
  
  constructor(
    public readonly id: ProjectIdVO,
    public name: string,
    public description: string,
    public status: ProjectStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly userId: string,
    public metadata: Record<string, any> = {},
    version: number = 1
  ) {
    this.version = version;
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    if (this.status === 'idea' && !this.description) {
      throw new Error('Description required for idea-stage projects');
    }
  }

  startResearch(): void {
    if (this.status !== 'idea') {
      throw new Error('Can only start research from idea status');
    }
    this.status = 'researching';
    this.updatedAt = new Date();
  }

  startValidation(): void {
    if (this.status !== 'researching') {
      throw new Error('Can only start validation after research');
    }
    this.status = 'validating';
    this.updatedAt = new Date();
  }

  startPlanning(): void {
    if (this.status !== 'validating') {
      throw new Error('Can only start planning after validation');
    }
    this.status = 'planning';
    this.updatedAt = new Date();
  }

  markReadyForExport(): void {
    if (this.status !== 'planning') {
      throw new Error('Can only export after planning');
    }
    this.status = 'ready_for_export';
    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = 'archived';
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  updateMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  toObject(): IProject {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      userId: this.userId,
      metadata: this.metadata,
    };
  }

  static create(
    name: string,
    description: string,
    userId: string
  ): Project {
    return new Project(
      ProjectIdVO.create(),
      name,
      description,
      'idea',
      new Date(),
      new Date(),
      userId
    );
  }
}

/**
 * Research Result Entity
 */
export interface IResearchResult {
  id: EntityIdVO;
  projectId: ProjectIdVO;
  category: ResearchCategory;
  findings: ResearchFinding[];
  confidence: ConfidenceScoreVO;
  sources: string[];
  createdAt: Date;
}

export type ResearchCategory = 
  | 'market'
  | 'competitor'
  | 'technology'
  | 'pricing'
  | 'documentation';

export interface ResearchFinding {
  title: string;
  summary: string;
  evidence: string;
  relevanceScore: number;
  sourceUrl?: string;
}

export class ResearchResult implements IResearchResult {
  constructor(
    public readonly id: EntityIdVO,
    public readonly projectId: ProjectIdVO,
    public readonly category: ResearchCategory,
    public readonly findings: ResearchFinding[],
    public readonly confidence: ConfidenceScoreVO,
    public readonly sources: string[],
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.findings.length === 0) {
      throw new Error('ResearchResult must have at least one finding');
    }
    if (this.sources.length === 0) {
      throw new Error('ResearchResult must have at least one source');
    }
  }

  static create(
    projectId: ProjectIdVO,
    category: ResearchCategory,
    findings: ResearchFinding[],
    sources: string[]
  ): ResearchResult {
    const avgRelevance = findings.reduce((sum, f) => sum + f.relevanceScore, 0) / findings.length;
    return new ResearchResult(
      EntityIdVO.create(),
      projectId,
      category,
      findings,
      ConfidenceScoreVO.create(avgRelevance / 10),
      sources,
      new Date()
    );
  }

  toObject(): IResearchResult {
    return {
      id: this.id,
      projectId: this.projectId,
      category: this.category,
      findings: this.findings,
      confidence: this.confidence,
      sources: this.sources,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Decision Entity
 */
export interface IDecision {
  id: EntityIdVO;
  projectId: ProjectIdVO;
  decisionType: DecisionType;
  recommendation: string;
  reasoning: string;
  confidence: ConfidenceScoreVO;
  alternatives: string[];
  tradeOffs: string[];
  createdAt: Date;
}

export type DecisionType = 
  | 'should_build'
  | 'should_pivot'
  | 'should_cancel'
  | 'technology_choice'
  | 'feature_priority'
  | 'mvp_scope';

export class Decision implements IDecision {
  constructor(
    public readonly id: EntityIdVO,
    public readonly projectId: ProjectIdVO,
    public readonly decisionType: DecisionType,
    public readonly recommendation: string,
    public readonly reasoning: string,
    public readonly confidence: ConfidenceScoreVO,
    public readonly alternatives: string[],
    public readonly tradeOffs: string[],
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.recommendation || this.recommendation.trim().length === 0) {
      throw new Error('Decision recommendation is required');
    }
    if (!this.reasoning || this.reasoning.trim().length === 0) {
      throw new Error('Decision reasoning is required');
    }
  }

  static create(
    projectId: ProjectIdVO,
    decisionType: DecisionType,
    recommendation: string,
    reasoning: string,
    confidence: ConfidenceScoreVO,
    alternatives: string[] = [],
    tradeOffs: string[] = []
  ): Decision {
    return new Decision(
      EntityIdVO.create(),
      projectId,
      decisionType,
      recommendation,
      reasoning,
      confidence,
      alternatives,
      tradeOffs,
      new Date()
    );
  }

  isHighConfidence(): boolean {
    return this.confidence.isHigh();
  }

  toObject(): IDecision {
    return {
      id: this.id,
      projectId: this.projectId,
      decisionType: this.decisionType,
      recommendation: this.recommendation,
      reasoning: this.reasoning,
      confidence: this.confidence,
      alternatives: this.alternatives,
      tradeOffs: this.tradeOffs,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Implementation Plan Entity
 */
export interface IPlan {
  id: EntityIdVO;
  projectId: ProjectIdVO;
  phases: PlanPhase[];
  totalEstimatedCost: CostVO;
  totalEstimatedTime: number; // in weeks
  technologies: string[];
  risks: string[];
  createdAt: Date;
}

export interface PlanPhase {
  name: string;
  description: string;
  tasks: PlanTask[];
  estimatedWeeks: number;
  estimatedCost: CostVO;
  dependencies: string[];
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiPrompt?: string;
}

export class Plan implements IPlan {
  constructor(
    public readonly id: EntityIdVO,
    public readonly projectId: ProjectIdVO,
    public readonly phases: PlanPhase[],
    public readonly totalEstimatedCost: CostVO,
    public readonly totalEstimatedTime: number,
    public readonly technologies: string[],
    public readonly risks: string[],
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.phases.length === 0) {
      throw new Error('Plan must have at least one phase');
    }
    if (this.totalEstimatedTime <= 0) {
      throw new Error('Plan estimated time must be positive');
    }
  }

  static create(
    projectId: ProjectIdVO,
    phases: PlanPhase[],
    technologies: string[],
    risks: string[] = []
  ): Plan {
    const totalCost = phases.reduce(
      (sum, phase) => sum.add(phase.estimatedCost),
      CostVO.zero()
    );
    const totalTime = phases.reduce((sum, phase) => sum + phase.estimatedWeeks, 0);

    return new Plan(
      EntityIdVO.create(),
      projectId,
      phases,
      totalCost,
      totalTime,
      technologies,
      risks,
      new Date()
    );
  }

  getCriticalTasks(): PlanTask[] {
    return this.phases
      .flatMap((phase) => phase.tasks)
      .filter((task) => task.priority === 'critical');
  }

  toObject(): IPlan {
    return {
      id: this.id,
      projectId: this.projectId,
      phases: this.phases,
      totalEstimatedCost: this.totalEstimatedCost,
      totalEstimatedTime: this.totalEstimatedTime,
      technologies: this.technologies,
      risks: this.risks,
      createdAt: this.createdAt,
    };
  }
}

// ============================================================================
// RESULT TYPES (Functional Error Handling)
// ============================================================================

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  err<E>(error: E): Result<never, E> {
    return { success: false, error };
  },

  map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result as Result<U>;
  },

  flatMap<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> {
    if (result.success) {
      return fn(result.data);
    }
    return result as Result<U>;
  },
};

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

export interface IDomainEvent {
  eventId: EntityIdVO;
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
  payload: Record<string, any>;
}

export class DomainEvent implements IDomainEvent {
  constructor(
    public readonly eventId: EntityIdVO,
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: Record<string, any>,
    public readonly occurredAt: Date = new Date()
  ) {}

  static create<T extends Record<string, any>>(
    aggregateId: string,
    eventType: string,
    payload: T
  ): DomainEvent {
    return new DomainEvent(
      EntityIdVO.create(),
      aggregateId,
      eventType,
      payload,
      new Date()
    );
  }
}

// Event Types
export const ProjectEvents = {
  PROJECT_CREATED: 'project.created',
  PROJECT_RESEARCH_STARTED: 'project.research_started',
  PROJECT_VALIDATION_STARTED: 'project.validation_started',
  PROJECT_PLANNING_STARTED: 'project.planning_started',
  PROJECT_READY_FOR_EXPORT: 'project.ready_for_export',
  PROJECT_ARCHIVED: 'project.archived',
  PROJECT_CANCELLED: 'project.cancelled',
} as const;

export const ResearchEvents = {
  RESEARCH_COMPLETED: 'research.completed',
  RESEARCH_FAILED: 'research.failed',
} as const;

export const DecisionEvents = {
  DECISION_MADE: 'decision.made',
  DECISION_LOW_CONFIDENCE: 'decision.low_confidence',
} as const;

export const PlanEvents = {
  PLAN_GENERATED: 'plan.generated',
  PLAN_UPDATED: 'plan.updated',
} as const;
