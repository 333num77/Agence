/**
 * Planning Agent Implementation
 * Responsibility: Convert decisions into implementation plans with phased roadmaps
 * Follows hexagonal architecture - depends only on interfaces
 */
import { IPlanningAgent, PlanningQuery, PlanningResult } from '../interfaces/agent.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';
export declare class PlanningAgent implements IPlanningAgent {
    execute(query: PlanningQuery): AsyncResult<PlanningResult>;
    private generateArtifact;
    private generatePRD;
    private generateArchitecture;
    private generateDatabaseSchema;
    private generateAPIContracts;
    private generateRoadmapDoc;
    private generateDevelopmentPhases;
    private generateAIExecutionPlan;
    private generateSecurityPlan;
    private generateTestStrategy;
    private createRoadmap;
    private calculateCost;
}
//# sourceMappingURL=planning-agent.d.ts.map