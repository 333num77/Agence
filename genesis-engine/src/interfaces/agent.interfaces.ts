/**
 * Agent interfaces - Contracts for all AI agents in Genesis
 * Each agent has exactly one responsibility
 */

import { EntityId, CorrelationId, ConfidenceScore, Cost, AsyncResult } from './core.interfaces';

/**
 * Research request types
 */
export type ResearchType = 
  | 'MARKET_ANALYSIS'
  | 'COMPETITOR_ANALYSIS'
  | 'TECHNOLOGY_RESEARCH'
  | 'PRICING_RESEARCH'
  | 'DOCUMENTATION_RESEARCH'
  | 'OPEN_SOURCE_RESEARCH';

/**
 * Evidence collected by Research Agent
 */
export interface Evidence {
  readonly id: string;
  readonly type: ResearchType;
  readonly source: string;
  readonly content: string;
  readonly reliability: number; // 0.0 to 1.0
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Research query from orchestrator
 */
export interface ResearchQuery {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly researchTypes: ResearchType[];
  readonly questions: string[];
  readonly constraints: ResearchConstraints;
}

export interface ResearchConstraints {
  readonly maxSources: number;
  readonly minReliability: number;
  readonly timeBudget?: number; // milliseconds
  readonly costBudget?: number;
  readonly excludedSources?: string[];
}

/**
 * Research Agent Interface
 * Responsibility: Collect evidence, NOT conclusions
 */
export interface IResearchAgent {
  execute(query: ResearchQuery): AsyncResult<ResearchResult>;
}

export interface ResearchResult {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly evidence: Evidence[];
  readonly totalCost: Cost;
  readonly executionTime: number;
  readonly gaps: string[]; // What couldn't be researched
}

/**
 * Decision types
 */
export type DecisionType =
  | 'PRODUCT_VIABILITY'
  | 'FEATURE_PRIORITY'
  | 'TECH_STACK'
  | 'MVP_SCOPE'
  | 'GO_TO_MARKET'
  | 'SECURITY_RISK'
  | 'COMPLIANCE_RISK';

export type RecommendationAction = 
  | 'PROCEED'
  | 'PROCEED_WITH_CHANGES'
  | 'PAUSE_FOR_VALIDATION'
  | 'PIVOT'
  | 'ABANDON';

/**
 * Engineering decision with confidence
 */
export interface EngineeringDecision {
  readonly id: string;
  readonly type: DecisionType;
  readonly recommendation: RecommendationAction;
  readonly confidence: ConfidenceScore;
  readonly rationale: string;
  readonly tradeOffs: TradeOff[];
  readonly assumptions: Assumption[];
  readonly risks: Risk[];
}

export interface TradeOff {
  readonly option: string;
  readonly pros: string[];
  readonly cons: string[];
  readonly impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Assumption {
  readonly statement: string;
  readonly validationRequired: boolean;
  readonly impactIfWrong: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Risk {
  readonly description: string;
  readonly probability: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly mitigation: string;
}

/**
 * Decision query from orchestrator
 */
export interface DecisionQuery {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly decisionType: DecisionType;
  readonly evidence: Evidence[];
  readonly userConstraints: UserConstraints;
}

export interface UserConstraints {
  readonly budget?: number;
  readonly timeline?: number; // days
  readonly teamSize?: number;
  readonly technicalExpertise: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Decision Agent Interface
 * Responsibility: Convert evidence into engineering decisions
 */
export interface IDecisionAgent {
  execute(query: DecisionQuery): AsyncResult<DecisionResult>;
}

export interface DecisionResult {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly decisions: EngineeringDecision[];
  readonly overallConfidence: ConfidenceScore;
  readonly nextSteps: string[];
  readonly blockedBy: string[]; // What's blocking progress
}

/**
 * Planning artifacts to generate
 */
export type PlanningArtifact =
  | 'PRD'
  | 'ARCHITECTURE'
  | 'DATABASE_SCHEMA'
  | 'API_CONTRACTS'
  | 'ROADMAP'
  | 'DEVELOPMENT_PHASES'
  | 'AI_EXECUTION_PLAN'
  | 'SECURITY_PLAN'
  | 'TEST_STRATEGY';

/**
 * Planning query from orchestrator
 */
export interface PlanningQuery {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly decisions: EngineeringDecision[];
  readonly artifacts: PlanningArtifact[];
  readonly constraints: PlanningConstraints;
}

export interface PlanningConstraints {
  readonly maxPhases: number;
  readonly phaseDuration?: number; // days
  readonly preferredTechnologies?: string[];
  readonly excludedTechnologies?: string[];
}

/**
 * Planning Agent Interface
 * Responsibility: Convert decisions into implementation plans
 */
export interface IPlanningAgent {
  execute(query: PlanningQuery): AsyncResult<PlanningResult>;
}

export interface PlanningResult {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly artifacts: GeneratedArtifact[];
  readonly roadmap: Roadmap;
  readonly estimatedCost: Cost;
  readonly estimatedTime: number; // days
}

export interface GeneratedArtifact {
  readonly type: PlanningArtifact;
  readonly content: string;
  readonly format: 'MARKDOWN' | 'JSON' | 'YAML' | 'MERMAID';
  readonly version: string;
}

export interface Roadmap {
  readonly phases: Phase[];
  readonly dependencies: Dependency[];
  readonly criticalPath: string[];
}

export interface Phase {
  readonly number: number;
  readonly name: string;
  readonly duration: number; // days
  readonly deliverables: string[];
  readonly tasks: Task[];
}

export interface Task {
  readonly id: string;
  readonly description: string;
  readonly estimatedHours: number;
  readonly dependencies: string[]; // task IDs
  readonly aiAssistLevel: 'NONE' | 'SUGGEST' | 'GENERATE' | 'AUTOMATE';
}

export interface Dependency {
  readonly from: string;
  readonly to: string;
  readonly type: 'HARD' | 'SOFT';
}

/**
 * Output formats
 */
export type OutputFormat =
  | 'MARKDOWN'
  | 'PDF'
  | 'ZIP'
  | 'CURSOR_PROJECT'
  | 'GITHUB_REPO'
  | 'FIGMA_SPEC'
  | 'JIRA_BOARD';

/**
 * Output query from orchestrator
 */
export interface OutputQuery {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly planningResult: PlanningResult;
  readonly formats: OutputFormat[];
  readonly destination: OutputDestination;
}

export interface OutputDestination {
  readonly type: 'LOCAL' | 'S3' | 'GITHUB' | 'GIST';
  readonly path?: string;
  readonly credentials?: Record<string, string>;
}

/**
 * Output Agent Interface
 * Responsibility: Convert structured plans into exportable assets
 */
export interface IOutputAgent {
  execute(query: OutputQuery): AsyncResult<OutputResult>;
}

export interface OutputResult {
  readonly correlationId: CorrelationId;
  readonly projectId: ProjectId;
  readonly outputs: OutputFile[];
  readonly exportPath: string;
  readonly exportFormat: OutputFormat;
  readonly checksum: string;
}

export interface OutputFile {
  readonly filename: string;
  readonly path: string;
  readonly size: number; // bytes
  readonly contentType: string;
  readonly checksum: string;
}

/**
 * Project ID value object
 */
export interface ProjectId extends EntityId {
  readonly slug: string;
}

/**
 * Agent registry for dependency injection
 */
export interface IAgentRegistry {
  getResearchAgent(): IResearchAgent;
  getDecisionAgent(): IDecisionAgent;
  getPlanningAgent(): IPlanningAgent;
  getOutputAgent(): IOutputAgent;
}

/**
 * Agent metrics for observability
 */
export interface AgentMetrics {
  readonly agentType: string;
  readonly executionCount: number;
  readonly avgExecutionTime: number;
  readonly avgCost: number;
  readonly successRate: number;
  readonly errorRate: number;
  readonly p95Latency: number;
  readonly p99Latency: number;
}
