/**
 * Orchestrator Engine - The Brain of Genesis
 * Manages the complete lifecycle: Idea → Research → Decision → Planning → Output
 * Implements state machine, workflow orchestration, and error handling
 */
import { IOrchestrator, WorkflowState, WorkflowEvent } from './orchestrator.types';
import { IResearchAgent, IDecisionAgent, IPlanningAgent, IOutputAgent } from '../interfaces/agent.interfaces';
import { Repository, EntityId, AsyncResult } from '../interfaces/core.interfaces';
import { Project } from '../core/domain';
export declare class Orchestrator implements IOrchestrator {
    private readonly researchAgent;
    private readonly decisionAgent;
    private readonly planningAgent;
    private readonly outputAgent;
    private readonly projectRepository;
    private state;
    private currentProjectId;
    private correlationId;
    private eventListeners;
    constructor(researchAgent: IResearchAgent, decisionAgent: IDecisionAgent, planningAgent: IPlanningAgent, outputAgent: IOutputAgent, projectRepository: Repository<Project, EntityId>);
    executeWorkflow(projectId: string): AsyncResult<void>;
    private executeResearch;
    private executeDecision;
    private executePlanning;
    private executeOutput;
    private transitionState;
    private createCorrelationId;
    onEvent(eventType: string, handler: (event: WorkflowEvent) => void): void;
    private emitEvent;
    getState(): WorkflowState;
}
//# sourceMappingURL=engine.d.ts.map