/**
 * Orchestrator Types - Type definitions for workflow orchestration
 */

export type WorkflowState = 
  | 'IDLE'
  | 'RESEARCHING'
  | 'DECIDING'
  | 'PLANNING'
  | 'OUTPUT'
  | 'COMPLETED'
  | 'FAILED';

export interface WorkflowEvent {
  readonly eventType: string;
  readonly timestamp: Date;
  readonly payload: Record<string, unknown>;
}

export interface IOrchestrator {
  executeWorkflow(projectId: string): Promise<{ success: boolean; data?: void; error?: Error }>;
  getState(): WorkflowState;
  onEvent(eventType: string, handler: (event: WorkflowEvent) => void): void;
}

export interface WorkflowMetrics {
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly avgExecutionTime: number;
  readonly stateTransitions: Record<WorkflowState, number>;
}
