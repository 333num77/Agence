import { ResearchResult, ProjectIdVO, Result } from '../core/domain';
/**
 * In-Memory Research Gateway (Development/Testing)
 * Production implementation would use Exa, Tavily, or Brave Search
 */
export declare class InMemoryResearchGateway {
    private cache;
    searchMarket(projectId: ProjectIdVO, query: string): Promise<Result<ResearchResult, Error>>;
    searchCompetitors(projectId: ProjectIdVO, _query: string): Promise<Result<ResearchResult, Error>>;
    searchTechnology(projectId: ProjectIdVO, query: string): Promise<Result<ResearchResult, Error>>;
    searchDocumentation(projectId: ProjectIdVO, topic: string): Promise<Result<ResearchResult, Error>>;
    searchPricing(projectId: ProjectIdVO, productCategory: string): Promise<Result<ResearchResult, Error>>;
    private saveToCache;
    getCachedResults(projectId: ProjectIdVO): Promise<Result<ResearchResult[], Error>>;
    clearCache(projectId: ProjectIdVO): Promise<Result<void, Error>>;
}
//# sourceMappingURL=research-gateway.memory.d.ts.map