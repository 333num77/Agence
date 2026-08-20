import { EntityId } from '../interfaces/core.interfaces';
/**
 * Correlation ID for tracing requests across the system
 */
export declare class CorrelationIdVO {
    readonly value: string;
    private constructor();
    static create(): CorrelationIdVO;
    static fromString(value: string): CorrelationIdVO;
    toString(): string;
}
/**
 * Confidence score for decisions (0.0 to 1.0)
 */
export declare class ConfidenceScoreVO {
    readonly value: number;
    private constructor();
    static create(score: number): ConfidenceScoreVO;
    static high(): ConfidenceScoreVO;
    static medium(): ConfidenceScoreVO;
    static low(): ConfidenceScoreVO;
    toNumber(): number;
    isHigh(): boolean;
    isMedium(): boolean;
    isLow(): boolean;
}
/**
 * Monetary value with currency
 */
export declare class CostVO {
    readonly amount: number;
    readonly currency: string;
    private static readonly schema;
    private constructor();
    static create(amount: number, currency?: string): CostVO;
    static zero(currency?: string): CostVO;
    add(other: CostVO): CostVO;
    toObject(): {
        amount: number;
        currency: string;
    };
    toString(): string;
}
/**
 * Base entity identifier
 */
export declare class EntityIdVO implements EntityId {
    readonly value: string;
    readonly createdAt: Date;
    protected constructor(value: string);
    static create(): EntityIdVO;
    static fromString(value: string): EntityIdVO;
    toString(): string;
}
/**
 * Project-specific ID with slug validation
 */
export declare class ProjectIdVO extends EntityIdVO {
    private static readonly slugRegex;
    private constructor();
    static create(): ProjectIdVO;
    static fromSlug(slug: string): ProjectIdVO;
    getSlug(): string;
}
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
export type ProjectStatus = 'idea' | 'researching' | 'validating' | 'planning' | 'ready_for_export' | 'archived' | 'cancelled';
export declare class Project implements IProject {
    readonly id: ProjectIdVO;
    name: string;
    description: string;
    status: ProjectStatus;
    readonly createdAt: Date;
    updatedAt: Date;
    readonly userId: string;
    metadata: Record<string, any>;
    readonly version: number;
    constructor(id: ProjectIdVO, name: string, description: string, status: ProjectStatus, createdAt: Date, updatedAt: Date, userId: string, metadata?: Record<string, any>, version?: number);
    private validate;
    startResearch(): void;
    startValidation(): void;
    startPlanning(): void;
    markReadyForExport(): void;
    archive(): void;
    cancel(): void;
    updateMetadata(key: string, value: any): void;
    toObject(): IProject;
    static create(name: string, description: string, userId: string): Project;
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
export type ResearchCategory = 'market' | 'competitor' | 'technology' | 'pricing' | 'documentation';
export interface ResearchFinding {
    title: string;
    summary: string;
    evidence: string;
    relevanceScore: number;
    sourceUrl?: string;
}
export declare class ResearchResult implements IResearchResult {
    readonly id: EntityIdVO;
    readonly projectId: ProjectIdVO;
    readonly category: ResearchCategory;
    readonly findings: ResearchFinding[];
    readonly confidence: ConfidenceScoreVO;
    readonly sources: string[];
    readonly createdAt: Date;
    constructor(id: EntityIdVO, projectId: ProjectIdVO, category: ResearchCategory, findings: ResearchFinding[], confidence: ConfidenceScoreVO, sources: string[], createdAt: Date);
    private validate;
    static create(projectId: ProjectIdVO, category: ResearchCategory, findings: ResearchFinding[], sources: string[]): ResearchResult;
    toObject(): IResearchResult;
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
export type DecisionType = 'should_build' | 'should_pivot' | 'should_cancel' | 'technology_choice' | 'feature_priority' | 'mvp_scope';
export declare class Decision implements IDecision {
    readonly id: EntityIdVO;
    readonly projectId: ProjectIdVO;
    readonly decisionType: DecisionType;
    readonly recommendation: string;
    readonly reasoning: string;
    readonly confidence: ConfidenceScoreVO;
    readonly alternatives: string[];
    readonly tradeOffs: string[];
    readonly createdAt: Date;
    constructor(id: EntityIdVO, projectId: ProjectIdVO, decisionType: DecisionType, recommendation: string, reasoning: string, confidence: ConfidenceScoreVO, alternatives: string[], tradeOffs: string[], createdAt: Date);
    private validate;
    static create(projectId: ProjectIdVO, decisionType: DecisionType, recommendation: string, reasoning: string, confidence: ConfidenceScoreVO, alternatives?: string[], tradeOffs?: string[]): Decision;
    isHighConfidence(): boolean;
    toObject(): IDecision;
}
/**
 * Implementation Plan Entity
 */
export interface IPlan {
    id: EntityIdVO;
    projectId: ProjectIdVO;
    phases: PlanPhase[];
    totalEstimatedCost: CostVO;
    totalEstimatedTime: number;
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
export declare class Plan implements IPlan {
    readonly id: EntityIdVO;
    readonly projectId: ProjectIdVO;
    readonly phases: PlanPhase[];
    readonly totalEstimatedCost: CostVO;
    readonly totalEstimatedTime: number;
    readonly technologies: string[];
    readonly risks: string[];
    readonly createdAt: Date;
    constructor(id: EntityIdVO, projectId: ProjectIdVO, phases: PlanPhase[], totalEstimatedCost: CostVO, totalEstimatedTime: number, technologies: string[], risks: string[], createdAt: Date);
    private validate;
    static create(projectId: ProjectIdVO, phases: PlanPhase[], technologies: string[], risks?: string[]): Plan;
    getCriticalTasks(): PlanTask[];
    toObject(): IPlan;
}
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export declare const Result: {
    ok<T>(data: T): Result<T, never>;
    err<E>(error: E): Result<never, E>;
    map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U>;
    flatMap<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U>;
};
export interface IDomainEvent {
    eventId: EntityIdVO;
    aggregateId: string;
    eventType: string;
    occurredAt: Date;
    payload: Record<string, any>;
}
export declare class DomainEvent implements IDomainEvent {
    readonly eventId: EntityIdVO;
    readonly aggregateId: string;
    readonly eventType: string;
    readonly payload: Record<string, any>;
    readonly occurredAt: Date;
    constructor(eventId: EntityIdVO, aggregateId: string, eventType: string, payload: Record<string, any>, occurredAt?: Date);
    static create<T extends Record<string, any>>(aggregateId: string, eventType: string, payload: T): DomainEvent;
}
export declare const ProjectEvents: {
    readonly PROJECT_CREATED: "project.created";
    readonly PROJECT_RESEARCH_STARTED: "project.research_started";
    readonly PROJECT_VALIDATION_STARTED: "project.validation_started";
    readonly PROJECT_PLANNING_STARTED: "project.planning_started";
    readonly PROJECT_READY_FOR_EXPORT: "project.ready_for_export";
    readonly PROJECT_ARCHIVED: "project.archived";
    readonly PROJECT_CANCELLED: "project.cancelled";
};
export declare const ResearchEvents: {
    readonly RESEARCH_COMPLETED: "research.completed";
    readonly RESEARCH_FAILED: "research.failed";
};
export declare const DecisionEvents: {
    readonly DECISION_MADE: "decision.made";
    readonly DECISION_LOW_CONFIDENCE: "decision.low_confidence";
};
export declare const PlanEvents: {
    readonly PLAN_GENERATED: "plan.generated";
    readonly PLAN_UPDATED: "plan.updated";
};
//# sourceMappingURL=domain.d.ts.map