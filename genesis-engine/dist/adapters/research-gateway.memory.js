"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryResearchGateway = void 0;
const domain_1 = require("../core/domain");
/**
 * In-Memory Research Gateway (Development/Testing)
 * Production implementation would use Exa, Tavily, or Brave Search
 */
class InMemoryResearchGateway {
    cache = new Map();
    async searchMarket(projectId, query) {
        try {
            // Simulated market research
            const finding = {
                title: `Market Analysis: ${query}`,
                summary: 'Simulated market data shows moderate opportunity',
                evidence: 'Based on industry reports and trend analysis',
                relevanceScore: 7.5,
                sourceUrl: 'https://example-market-report.com',
            };
            const result = domain_1.ResearchResult.create(projectId, 'market', [finding], [finding.sourceUrl]);
            this.saveToCache(projectId.toString(), result);
            return domain_1.Result.ok(result);
        }
        catch (error) {
            return domain_1.Result.err(error instanceof Error ? error : new Error('Market research failed'));
        }
    }
    async searchCompetitors(projectId, _query) {
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
            const result = domain_1.ResearchResult.create(projectId, 'competitor', findings, findings.map((f) => f.sourceUrl));
            this.saveToCache(projectId.toString(), result);
            return domain_1.Result.ok(result);
        }
        catch (error) {
            return domain_1.Result.err(error instanceof Error ? error : new Error('Competitor research failed'));
        }
    }
    async searchTechnology(projectId, query) {
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
            const result = domain_1.ResearchResult.create(projectId, 'technology', findings, [findings[0].sourceUrl]);
            this.saveToCache(projectId.toString(), result);
            return domain_1.Result.ok(result);
        }
        catch (error) {
            return domain_1.Result.err(error instanceof Error ? error : new Error('Technology research failed'));
        }
    }
    async searchDocumentation(projectId, topic) {
        try {
            const finding = {
                title: `Documentation: ${topic}`,
                summary: 'Official documentation and community resources',
                evidence: 'Verified documentation sources',
                relevanceScore: 9.0,
                sourceUrl: `https://docs.example.com/${topic}`,
            };
            const result = domain_1.ResearchResult.create(projectId, 'documentation', [finding], [finding.sourceUrl]);
            this.saveToCache(projectId.toString(), result);
            return domain_1.Result.ok(result);
        }
        catch (error) {
            return domain_1.Result.err(error instanceof Error ? error : new Error('Documentation research failed'));
        }
    }
    async searchPricing(projectId, productCategory) {
        try {
            const finding = {
                title: `Pricing Analysis: ${productCategory}`,
                summary: 'Competitive pricing landscape',
                evidence: 'Market pricing data from multiple sources',
                relevanceScore: 7.0,
                sourceUrl: `https://pricing-research.example.com/${productCategory}`,
            };
            const result = domain_1.ResearchResult.create(projectId, 'pricing', [finding], [finding.sourceUrl]);
            this.saveToCache(projectId.toString(), result);
            return domain_1.Result.ok(result);
        }
        catch (error) {
            return domain_1.Result.err(error instanceof Error ? error : new Error('Pricing research failed'));
        }
    }
    saveToCache(key, result) {
        const existing = this.cache.get(key) || [];
        existing.push(result);
        this.cache.set(key, existing);
    }
    async getCachedResults(projectId) {
        const results = this.cache.get(projectId.toString()) || [];
        return domain_1.Result.ok(results);
    }
    async clearCache(projectId) {
        this.cache.delete(projectId.toString());
        return domain_1.Result.ok(undefined);
    }
}
exports.InMemoryResearchGateway = InMemoryResearchGateway;
//# sourceMappingURL=research-gateway.memory.js.map