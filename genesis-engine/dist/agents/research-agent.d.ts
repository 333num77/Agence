/**
 * Research Agent Implementation
 * Responsibility: Collect evidence from research gateways, NOT conclusions
 * Follows hexagonal architecture - depends only on interfaces
 */
import { IResearchAgent, ResearchQuery, ResearchResult } from '../interfaces/agent.interfaces';
import { IResearchGateway } from '../interfaces/gateway.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';
export declare class ResearchAgent implements IResearchAgent {
    private readonly researchGateway;
    constructor(researchGateway: IResearchGateway);
    execute(query: ResearchQuery): AsyncResult<ResearchResult>;
}
//# sourceMappingURL=research-agent.d.ts.map