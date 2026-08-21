"use strict";
/**
 * Decision Agent Implementation
 * Responsibility: Convert evidence into engineering decisions with confidence scores
 * Follows hexagonal architecture - depends only on interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionAgent = void 0;
const value_objects_1 = require("../core/value-objects");
class DecisionAgent {
    async execute(query) {
        try {
            const decisions = [];
            const blockedBy = [];
            const nextSteps = [];
            // Analyze evidence for the decision type
            const analysis = this.analyzeEvidence(query.evidence, query.decisionType, query.userConstraints);
            // Generate decision based on analysis
            const decision = this.createDecision(query.decisionType, analysis.confidence, analysis.rationale, analysis.tradeOffs, analysis.assumptions, analysis.risks, query.userConstraints);
            decisions.push(decision);
            // Determine recommendation and next steps
            if (decision.recommendation === 'ABANDON' || decision.recommendation === 'PIVOT') {
                blockedBy.push('Critical viability concerns identified');
                nextSteps.push('Reconsider product scope or target market');
                nextSteps.push('Conduct additional customer validation');
            }
            else if (decision.recommendation === 'PAUSE_FOR_VALIDATION') {
                blockedBy.push('Key assumptions require validation');
                nextSteps.push('Validate critical assumptions before proceeding');
                nextSteps.push('Gather more evidence on high-risk areas');
            }
            else {
                nextSteps.push('Proceed to planning phase');
                nextSteps.push('Define MVP scope based on decision rationale');
                if (decision.recommendation === 'PROCEED_WITH_CHANGES') {
                    nextSteps.push('Incorporate recommended changes into plan');
                }
            }
            return {
                success: true,
                data: {
                    correlationId: query.correlationId,
                    projectId: query.projectId,
                    decisions,
                    overallConfidence: {
                        value: decision.confidence.value,
                        factors: decision.confidence.factors || [],
                        uncertainty: this.calculateUncertainty(decision.risks)
                    },
                    nextSteps,
                    blockedBy
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Unknown error in Decision Agent')
            };
        }
    }
    analyzeEvidence(evidence, decisionType, constraints) {
        // Calculate confidence based on evidence quality and quantity
        const totalReliability = evidence.reduce((sum, e) => sum + e.reliability, 0);
        const avgReliability = evidence.length > 0 ? totalReliability / evidence.length : 0;
        // Adjust confidence based on evidence diversity
        const evidenceTypes = new Set(evidence.map((e) => e.type));
        const diversityBonus = Math.min(evidenceTypes.size * 0.1, 0.3);
        let confidenceValue = Math.min(avgReliability + diversityBonus, 1.0);
        // Penalize for insufficient evidence
        if (evidence.length < 3) {
            confidenceValue *= 0.7;
        }
        // Generate rationale based on decision type
        let rationale = '';
        const tradeOffs = [];
        const assumptions = [];
        const risks = [];
        switch (decisionType) {
            case 'PRODUCT_VIABILITY':
                rationale = this.generateViabilityRationale(evidence, confidenceValue);
                tradeOffs.push({
                    option: 'Build full product now',
                    pros: ['Faster time to market', 'Complete feature set'],
                    cons: ['Higher initial cost', 'Risk of building wrong features'],
                    impact: 'HIGH'
                });
                tradeOffs.push({
                    option: 'Start with MVP',
                    pros: ['Lower risk', 'Faster validation', 'Cost efficient'],
                    cons: ['May miss market window', 'Limited initial value'],
                    impact: 'MEDIUM'
                });
                assumptions.push({
                    statement: 'Target customers experience the problem described',
                    validationRequired: true,
                    impactIfWrong: 'CRITICAL'
                });
                risks.push({
                    description: 'Market may be smaller than estimated',
                    probability: 'MEDIUM',
                    impact: 'HIGH',
                    mitigation: 'Conduct primary market research with 50+ potential users'
                });
                break;
            case 'TECH_STACK':
                rationale = this.generateTechStackRationale(evidence, confidenceValue, constraints);
                tradeOffs.push({
                    option: 'Use established technologies',
                    pros: ['Better documentation', 'Larger talent pool', 'Proven stability'],
                    cons: ['May be less innovative', 'Potential licensing costs'],
                    impact: 'MEDIUM'
                });
                tradeOffs.push({
                    option: 'Adopt cutting-edge stack',
                    pros: ['Performance benefits', 'Developer excitement', 'Future-proofing'],
                    cons: ['Less mature ecosystem', 'Harder to hire', 'Integration risks'],
                    impact: 'HIGH'
                });
                assumptions.push({
                    statement: 'Team can ramp up on chosen technologies within timeline',
                    validationRequired: true,
                    impactIfWrong: 'HIGH'
                });
                risks.push({
                    description: 'Key technology may have undiscovered limitations',
                    probability: 'LOW',
                    impact: 'MEDIUM',
                    mitigation: 'Build proof-of-concept for critical components'
                });
                break;
            default:
                rationale = `Analysis based on ${evidence.length} evidence items with ${confidenceValue.toFixed(2)} confidence.`;
                assumptions.push({
                    statement: 'Provided evidence is accurate and relevant',
                    validationRequired: false,
                    impactIfWrong: 'MEDIUM'
                });
        }
        return {
            confidence: new value_objects_1.ConfidenceScoreVO(confidenceValue, [{
                    name: 'evidence_quality',
                    weight: 0.6,
                    evidence: ['market_data', 'competitor_analysis']
                }], 'MEDIUM'),
            rationale,
            tradeOffs,
            assumptions,
            risks
        };
    }
    generateViabilityRationale(evidence, confidence) {
        const positiveSignals = evidence.filter((e) => e.reliability > 0.7).length;
        const totalEvidence = evidence.length;
        if (confidence > 0.8) {
            return `Strong viability signals detected: ${positiveSignals}/${totalEvidence} high-reliability evidence items support product development. Market conditions appear favorable with manageable risks.`;
        }
        else if (confidence > 0.6) {
            return `Moderate viability indicated: ${positiveSignals}/${totalEvidence} evidence items are positive. Recommend proceeding with validation of key assumptions before full commitment.`;
        }
        else if (confidence > 0.4) {
            return `Weak viability signals: Only ${positiveSignals}/${totalEvidence} evidence items are strongly positive. Significant risks identified. Consider pivoting or additional validation.`;
        }
        else {
            return `Poor viability indicators: Insufficient positive evidence. High risk of failure. Recommend abandoning or complete pivot of concept.`;
        }
    }
    generateTechStackRationale(evidence, confidence, constraints) {
        const expertise = constraints?.technicalExpertise || 'MEDIUM';
        if (expertise === 'LOW') {
            return `Given low technical expertise, recommend established, well-documented technologies. Confidence: ${(confidence * 0.9).toFixed(2)}. Prioritize developer experience and community support over cutting-edge features.`;
        }
        else if (expertise === 'HIGH') {
            return `High technical expertise enables adoption of advanced technologies. Confidence: ${confidence.toFixed(2)}. Can evaluate and mitigate risks of newer tools effectively.`;
        }
        else {
            return `Balanced approach recommended for medium expertise level. Confidence: ${confidence.toFixed(2)}. Mix of proven and modern technologies with good documentation.`;
        }
    }
    createDecision(type, confidence, rationale, tradeOffs, assumptions, risks, constraints) {
        let recommendation;
        if (confidence.value >= 0.8) {
            recommendation = 'PROCEED';
        }
        else if (confidence.value >= 0.6) {
            recommendation = assumptions.some(a => a.validationRequired) ? 'PROCEED_WITH_CHANGES' : 'PROCEED';
        }
        else if (confidence.value >= 0.4) {
            recommendation = 'PAUSE_FOR_VALIDATION';
        }
        else if (confidence.value >= 0.2) {
            recommendation = 'PIVOT';
        }
        else {
            recommendation = 'ABANDON';
        }
        // Adjust for risk tolerance
        if (constraints.riskTolerance === 'LOW' && risks.some(r => r.impact === 'CRITICAL' || r.impact === 'HIGH')) {
            if (recommendation === 'PROCEED') {
                recommendation = 'PROCEED_WITH_CHANGES';
            }
        }
        return {
            id: crypto.randomUUID(),
            type,
            recommendation,
            confidence: {
                value: confidence.value,
                factors: confidence.factors,
                uncertainty: this.calculateUncertainty(risks)
            },
            rationale,
            tradeOffs,
            assumptions,
            risks
        };
    }
    calculateUncertainty(risks) {
        const criticalRisks = risks.filter(r => r.impact === 'CRITICAL').length;
        const highRisks = risks.filter(r => r.impact === 'HIGH' && r.probability === 'HIGH').length;
        if (criticalRisks > 0)
            return 'CRITICAL';
        if (highRisks > 1)
            return 'HIGH';
        if (highRisks > 0 || risks.filter(r => r.impact === 'MEDIUM').length > 2)
            return 'MEDIUM';
        return 'LOW';
    }
}
exports.DecisionAgent = DecisionAgent;
//# sourceMappingURL=decision-agent.js.map