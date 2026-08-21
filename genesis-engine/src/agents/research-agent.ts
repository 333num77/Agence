/**
 * Research Agent Implementation
 * Responsibility: Collect evidence from research gateways, NOT conclusions
 * Follows hexagonal architecture - depends only on interfaces
 */

import { IResearchAgent, ResearchQuery, ResearchResult, Evidence } from '../interfaces/agent.interfaces';
import { IResearchGateway, SearchQuery } from '../interfaces/gateway.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';

export class ResearchAgent implements IResearchAgent {
  private readonly researchGateway: IResearchGateway;
  
  constructor(researchGateway: IResearchGateway) {
    this.researchGateway = researchGateway;
  }

  async execute(query: ResearchQuery): AsyncResult<ResearchResult> {
    try {
      const startTime = Date.now();
      const evidence: Evidence[] = [];
      const gaps: string[] = [];
      let totalCostAmount = 0;

      // Execute research for each type requested
      for (const researchType of query.researchTypes) {
        const searchQuery: SearchQuery = {
          correlationId: query.correlationId,
          provider: 'EXA',
          query: query.questions.join(' '),
          numResults: query.constraints.maxSources,
          searchType: 'WEB'
        };

        const researchResult = await this.researchGateway.search(searchQuery);

        if (!researchResult.success) {
          gaps.push(`Failed to research: ${researchType}`);
          continue;
        }

        // Convert search results to evidence
        const searchResults = researchResult.data.results || [];
        for (const result of searchResults) {
          evidence.push({
            id: crypto.randomUUID(),
            type: researchType,
            source: result.url || 'Unknown',
            content: result.snippet || result.title,
            reliability: 0.7,
            timestamp: new Date(),
            metadata: {}
          });
        }
        
        // Accumulate costs
        if (searchResults.length > 0) {
          totalCostAmount += 0.05;
        }
      }

      // Validate we have sufficient evidence
      if (evidence.length === 0) {
        return {
          success: false,
          error: new Error('No evidence could be collected')
        };
      }

      // Filter by minimum reliability
      const filteredEvidence = evidence.filter(
        e => e.reliability >= query.constraints.minReliability
      );

      if (filteredEvidence.length === 0) {
        return {
          success: false,
          error: new Error('No evidence meets minimum reliability threshold')
        };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          correlationId: query.correlationId,
          projectId: query.projectId,
          evidence: filteredEvidence,
          totalCost: {
            amount: totalCostAmount,
            currency: 'USD',
            breakdown: [{
              category: 'RESEARCH_OPERATIONS',
              amount: totalCostAmount,
              description: `Collected ${filteredEvidence.length} evidence items`
            }]
          },
          executionTime,
          gaps
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error in Research Agent')
      };
    }
  }
}
