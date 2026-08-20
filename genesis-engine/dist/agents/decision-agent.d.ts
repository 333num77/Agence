/**
 * Decision Agent Implementation
 * Responsibility: Convert evidence into engineering decisions with confidence scores
 * Follows hexagonal architecture - depends only on interfaces
 */
import { IDecisionAgent, DecisionQuery, DecisionResult } from '../interfaces/agent.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';
export declare class DecisionAgent implements IDecisionAgent {
    execute(query: DecisionQuery): AsyncResult<DecisionResult>;
    private analyzeEvidence;
    private generateViabilityRationale;
    private generateTechStackRationale;
    private createDecision;
    private calculateUncertainty;
}
//# sourceMappingURL=decision-agent.d.ts.map