"use strict";
/**
 * Orchestrator Engine - The Brain of Genesis
 * Manages the complete lifecycle: Idea → Research → Decision → Planning → Output
 * Implements state machine, workflow orchestration, and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
class Orchestrator {
    researchAgent;
    decisionAgent;
    planningAgent;
    outputAgent;
    projectRepository;
    state = 'IDLE';
    currentProjectId = null;
    correlationId = null;
    eventListeners = new Map();
    constructor(researchAgent, decisionAgent, planningAgent, outputAgent, projectRepository) {
        this.researchAgent = researchAgent;
        this.decisionAgent = decisionAgent;
        this.planningAgent = planningAgent;
        this.outputAgent = outputAgent;
        this.projectRepository = projectRepository;
    }
    async executeWorkflow(projectId) {
        try {
            this.currentProjectId = projectId;
            this.correlationId = this.createCorrelationId();
            // Load project
            const projectResult = await this.projectRepository.findById({ value: projectId, createdAt: new Date() });
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
            const shouldProceed = decisionResult.data.decisions.some(d => d.recommendation === 'PROCEED' || d.recommendation === 'PROCEED_WITH_CHANGES');
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
        }
        catch (error) {
            await this.transitionState('FAILED');
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Workflow execution failed')
            };
        }
    }
    async executeResearch(project) {
        const query = {
            correlationId: this.correlationId,
            projectId: { value: project.id.value, slug: project.id.slug },
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
    async executeDecision(project, researchResult) {
        const query = {
            correlationId: this.correlationId,
            projectId: { value: project.id.value, slug: project.id.slug },
            decisionType: 'PRODUCT_VIABILITY',
            evidence: researchResult.evidence,
            userConstraints: {
                technicalExpertise: 'MEDIUM',
                riskTolerance: 'MEDIUM'
            }
        };
        return await this.decisionAgent.execute(query);
    }
    async executePlanning(project, decisionResult) {
        const query = {
            correlationId: this.correlationId,
            projectId: { value: project.id.value, slug: project.id.slug },
            decisions: decisionResult.decisions,
            artifacts: ['PRD', 'ARCHITECTURE', 'ROADMAP'],
            constraints: {
                maxPhases: 3,
                phaseDuration: 14
            }
        };
        return await this.planningAgent.execute(query);
    }
    async executeOutput(project, planningResult) {
        const query = {
            correlationId: this.correlationId,
            projectId: { value: project.id.value, slug: project.id.slug },
            planningResult: planningResult,
            formats: ['MARKDOWN', 'ZIP'],
            destination: {
                type: 'LOCAL',
                path: `/tmp/exports/${project.id.value}`
            }
        };
        return await this.outputAgent.execute(query);
    }
    async transitionState(newState) {
        const oldState = this.state;
        this.state = newState;
        const event = {
            eventType: 'STATE_TRANSITION',
            timestamp: new Date(),
            payload: {
                from: oldState,
                to: newState,
                projectId: this.currentProjectId
            }
        };
        await this.emitEvent(event);
    }
    createCorrelationId() {
        const value = crypto.randomUUID();
        return {
            value,
            traceId: value,
            spanId: crypto.randomUUID().substring(0, 16)
        };
    }
    onEvent(eventType, handler) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType).add(handler);
    }
    async emitEvent(event) {
        const handlers = this.eventListeners.get(event.eventType) || new Set();
        for (const handler of handlers) {
            try {
                handler(event);
            }
            catch (error) {
                console.error('Event handler error:', error);
            }
        }
    }
    getState() {
        return this.state;
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=engine.js.map