/**
 * Orchestrator Engine - The Brain of Genesis
 * Manages the complete lifecycle: Idea → Research → Decision → Planning → Output
 * Implements state machine, workflow orchestration, and error handling
 */

import { IOrchestrator, WorkflowState, WorkflowEvent } from './orchestrator.types';
import { IResearchAgent, IDecisionAgent, IPlanningAgent, IOutputAgent, ResearchQuery, DecisionQuery, PlanningQuery, OutputQuery, ProjectId } from '../interfaces/agent.interfaces';
import { Repository, EntityId, AsyncResult } from '../interfaces/core.interfaces';
import { Project } from '../core/domain';

export class Orchestrator implements IOrchestrator {
  private readonly researchAgent: IResearchAgent;
  private readonly decisionAgent: IDecisionAgent;
  private readonly planningAgent: IPlanningAgent;
  private readonly outputAgent: IOutputAgent;
  private readonly projectRepository: Repository<Project, EntityId>;
  
  private state: WorkflowState = 'IDLE';
  private currentProjectId: string | null = null;
  private correlationId: any = null;
  private eventListeners: Map<string, Set<(event: WorkflowEvent) => void>> = new Map();

  constructor(
    researchAgent: IResearchAgent,
    decisionAgent: IDecisionAgent,
    planningAgent: IPlanningAgent,
    outputAgent: IOutputAgent,
    projectRepository: Repository<Project, EntityId>
  ) {
    this.researchAgent = researchAgent;
    this.decisionAgent = decisionAgent;
    this.planningAgent = planningAgent;
    this.outputAgent = outputAgent;
    this.projectRepository = projectRepository;
  }

  async executeWorkflow(projectId: string): AsyncResult<void> {
    try {
      this.currentProjectId = projectId;
      this.correlationId = this.createCorrelationId();
      
      // Load project
      const projectResult = await this.projectRepository.findById({ value: projectId, createdAt: new Date() } as EntityId);
      if (!projectResult.success) {
        return { success: false, error: new Error('Project not found') };
      }
      
      const project = projectResult.data;

      // State Machine: IDEA → RESEARCHING → DECIDING → PLANNING → COMPLETED
      await this.transitionState('RESEARCHING');
      const researchResult = await this.executeResearch(project);
      if (!researchResult.success) {
        return { success: false, error: researchResult.error };
      }

      await this.transitionState('DECIDING');
      const decisionResult = await this.executeDecision(project, researchResult.data);
      if (!decisionResult.success) {
        return { success: false, error: decisionResult.error };
      }

      // Check if decision recommends proceeding
      const shouldProceed = decisionResult.data.decisions.some(d => 
        d.recommendation === 'PROCEED' || d.recommendation === 'PROCEED_WITH_CHANGES'
      );
      
      if (!shouldProceed) {
        await this.transitionState('COMPLETED');
        return { success: true, data: undefined };
      }

      await this.transitionState('PLANNING');
      const planningResult = await this.executePlanning(project, decisionResult.data);
      if (!planningResult.success) {
        return { success: false, error: planningResult.error };
      }

      await this.transitionState('OUTPUT');
      const outputResult = await this.executeOutput(project, planningResult.data);
      if (!outputResult.success) {
        return { success: false, error: outputResult.error };
      }

      await this.transitionState('COMPLETED');
      return { success: true, data: undefined };
    } catch (error) {
      await this.transitionState('FAILED');
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Workflow execution failed') 
      };
    }
  }

  private async executeResearch(project: Project) {
    const query: ResearchQuery = {
      correlationId: this.correlationId,
      projectId: { value: project.id.value, slug: (project.id as any).slug } as ProjectId,
      researchTypes: ['MARKET_ANALYSIS', 'COMPETITOR_ANALYSIS', 'TECHNOLOGY_RESEARCH'],
      questions: [`Validate idea: ${project.description}`],
      constraints: {
        maxSources: 10,
        minReliability: 0.6,
        timeBudget: 30000
      }
    };

    return await this.researchAgent.execute(query);
  }

  private async executeDecision(project: Project, researchResult: any) {
    const query: DecisionQuery = {
      correlationId: this.correlationId,
      projectId: { value: project.id.value, slug: (project.id as any).slug } as ProjectId,
      decisionType: 'PRODUCT_VIABILITY',
      evidence: researchResult.evidence,
      userConstraints: {
        technicalExpertise: 'MEDIUM',
        riskTolerance: 'MEDIUM'
      }
    };

    return await this.decisionAgent.execute(query);
  }

  private async executePlanning(project: Project, decisionResult: any) {
    const query: PlanningQuery = {
      correlationId: this.correlationId,
      projectId: { value: project.id.value, slug: (project.id as any).slug } as ProjectId,
      decisions: decisionResult.decisions,
      artifacts: ['PRD', 'ARCHITECTURE', 'ROADMAP'],
      constraints: {
        maxPhases: 3,
        phaseDuration: 14
      }
    };

    return await this.planningAgent.execute(query);
  }

  private async executeOutput(project: Project, planningResult: any) {
    const query: OutputQuery = {
      correlationId: this.correlationId,
      projectId: { value: project.id.value, slug: (project.id as any).slug } as ProjectId,
      planningResult: planningResult,
      formats: ['MARKDOWN', 'ZIP'],
      destination: {
        type: 'LOCAL',
        path: `/tmp/exports/${project.id.value}`
      }
    };

    return await this.outputAgent.execute(query);
  }

  private async transitionState(newState: WorkflowState): Promise<void> {
    const oldState = this.state;
    this.state = newState;
    
    const event: WorkflowEvent = {
      eventType: 'STATE_TRANSITION',
      timestamp: new Date(),
      payload: {
        from: oldState,
        to: newState,
        projectId: this.currentProjectId!
      }
    };

    await this.emitEvent(event);
  }

  private createCorrelationId(): any {
    const value = crypto.randomUUID();
    return {
      value,
      traceId: value,
      spanId: crypto.randomUUID().substring(0, 16)
    };
  }

  onEvent(eventType: string, handler: (event: WorkflowEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(handler);
  }

  private async emitEvent(event: WorkflowEvent): Promise<void> {
    const handlers = this.eventListeners.get(event.eventType) || new Set();
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  getState(): WorkflowState {
    return this.state;
  }
}
