import { ResearchResult, ProjectIdVO, Result } from '../core/domain';

/**
 * In-Memory Research Gateway (Development/Testing)
 * Production implementation would use Exa, Tavily, or Brave Search
 */
export class InMemoryResearchGateway {
  private cache: Map<string, ResearchResult[]> = new Map();

  async searchMarket(
    projectId: ProjectIdVO,
    query: string
  ): Promise<Result<ResearchResult, Error>> {
    try {
      // Simulated market research
      const finding = {
        title: `Market Analysis: ${query}`,
        summary: 'Simulated market data shows moderate opportunity',
        evidence: 'Based on industry reports and trend analysis',
        relevanceScore: 7.5,
        sourceUrl: 'https://example-market-report.com',
      };

      const result = ResearchResult.create(
        projectId,
        'market',
        [finding],
        [finding.sourceUrl]
      );

      this.saveToCache(projectId.toString(), result);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Market research failed'));
    }
  }

  async searchCompetitors(
    projectId: ProjectIdVO,
    _query: string
  ): Promise<Result<ResearchResult, Error>> {
    try {
      // Simulated competitor research
      const findings = [
        {
          title: 'Direct Competitor A',
          summary: 'Established player with 30% market share',
          evidence: 'Company website and public financials',
          relevanceScore: 8.0,
          sourceUrl: 'https://competitor-a.com',
        },
        {
          title: 'Emerging Competitor B',
          summary: 'Fast-growing startup with innovative features',
          evidence: 'Recent funding announcement',
          relevanceScore: 6.5,
          sourceUrl: 'https://competitor-b.com',
        },
      ];

      const result = ResearchResult.create(
        projectId,
        'competitor',
        findings,
        findings.map((f) => f.sourceUrl!)
      );

      this.saveToCache(projectId.toString(), result);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Competitor research failed'));
    }
  }

  async searchTechnology(
    projectId: ProjectIdVO,
    query: string
  ): Promise<Result<ResearchResult, Error>> {
    try {
      // Simulated technology research
      const findings = [
        {
          title: `Technology Stack: ${query}`,
          summary: 'Modern tech stack recommendations',
          evidence: 'Industry best practices and performance benchmarks',
          relevanceScore: 8.5,
          sourceUrl: 'https://tech-research.example.com',
        },
      ];

      const result = ResearchResult.create(
        projectId,
        'technology',
        findings,
        [findings[0].sourceUrl!]
      );

      this.saveToCache(projectId.toString(), result);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Technology research failed'));
    }
  }

  async searchDocumentation(
    projectId: ProjectIdVO,
    topic: string
  ): Promise<Result<ResearchResult, Error>> {
    try {
      const finding = {
        title: `Documentation: ${topic}`,
        summary: 'Official documentation and community resources',
        evidence: 'Verified documentation sources',
        relevanceScore: 9.0,
        sourceUrl: `https://docs.example.com/${topic}`,
      };

      const result = ResearchResult.create(
        projectId,
        'documentation',
        [finding],
        [finding.sourceUrl]
      );

      this.saveToCache(projectId.toString(), result);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Documentation research failed'));
    }
  }

  async searchPricing(
    projectId: ProjectIdVO,
    productCategory: string
  ): Promise<Result<ResearchResult, Error>> {
    try {
      const finding = {
        title: `Pricing Analysis: ${productCategory}`,
        summary: 'Competitive pricing landscape',
        evidence: 'Market pricing data from multiple sources',
        relevanceScore: 7.0,
        sourceUrl: `https://pricing-research.example.com/${productCategory}`,
      };

      const result = ResearchResult.create(
        projectId,
        'pricing',
        [finding],
        [finding.sourceUrl]
      );

      this.saveToCache(projectId.toString(), result);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error('Pricing research failed'));
    }
  }

  private saveToCache(key: string, result: ResearchResult): void {
    const existing = this.cache.get(key) || [];
    existing.push(result);
    this.cache.set(key, existing);
  }

  async getCachedResults(
    projectId: ProjectIdVO
  ): Promise<Result<ResearchResult[], Error>> {
    const results = this.cache.get(projectId.toString()) || [];
    return Result.ok(results);
  }

  async clearCache(projectId: ProjectIdVO): Promise<Result<void, Error>> {
    this.cache.delete(projectId.toString());
    return Result.ok(undefined);
  }
}
