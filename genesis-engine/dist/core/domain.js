"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanEvents = exports.DecisionEvents = exports.ResearchEvents = exports.ProjectEvents = exports.DomainEvent = exports.Result = exports.Plan = exports.Decision = exports.ResearchResult = exports.Project = exports.ProjectIdVO = exports.EntityIdVO = exports.CostVO = exports.ConfidenceScoreVO = exports.CorrelationIdVO = void 0;
const zod_1 = require("zod");
// ============================================================================
// VALUE OBJECTS (Immutable, validated domain primitives)
// ============================================================================
/**
 * Generate UUID v4 using native crypto
 */
function generateUUID() {
    const randomBytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
    }
    // Set version to 4
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    // Set variant to RFC 4122
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
    const hex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/**
 * Correlation ID for tracing requests across the system
 */
class CorrelationIdVO {
    value;
    constructor(value) {
        this.value = value;
        if (!value || value.length < 36) {
            throw new Error('CorrelationId must be a valid UUID');
        }
    }
    static create() {
        return new CorrelationIdVO(generateUUID());
    }
    static fromString(value) {
        return new CorrelationIdVO(value);
    }
    toString() {
        return this.value;
    }
}
exports.CorrelationIdVO = CorrelationIdVO;
/**
 * Confidence score for decisions (0.0 to 1.0)
 */
class ConfidenceScoreVO {
    value;
    constructor(value) {
        this.value = value;
        if (value < 0 || value > 1) {
            throw new Error('ConfidenceScore must be between 0 and 1');
        }
    }
    static create(score) {
        return new ConfidenceScoreVO(Math.round(score * 100) / 100);
    }
    static high() {
        return new ConfidenceScoreVO(0.8);
    }
    static medium() {
        return new ConfidenceScoreVO(0.5);
    }
    static low() {
        return new ConfidenceScoreVO(0.3);
    }
    toNumber() {
        return this.value;
    }
    isHigh() {
        return this.value >= 0.7;
    }
    isMedium() {
        return this.value >= 0.4 && this.value < 0.7;
    }
    isLow() {
        return this.value < 0.4;
    }
}
exports.ConfidenceScoreVO = ConfidenceScoreVO;
/**
 * Monetary value with currency
 */
class CostVO {
    amount;
    currency;
    static schema = zod_1.z.object({
        amount: zod_1.z.number().min(0),
        currency: zod_1.z.string().length(3).default('USD'),
    });
    constructor(amount, currency = 'USD') {
        this.amount = amount;
        this.currency = currency;
        CostVO.schema.parse({ amount, currency });
    }
    static create(amount, currency = 'USD') {
        return new CostVO(amount, currency);
    }
    static zero(currency = 'USD') {
        return new CostVO(0, currency);
    }
    add(other) {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add costs with different currencies');
        }
        return new CostVO(this.amount + other.amount, this.currency);
    }
    toObject() {
        return { amount: this.amount, currency: this.currency };
    }
    toString() {
        return `${this.currency} ${this.amount.toFixed(2)}`;
    }
}
exports.CostVO = CostVO;
/**
 * Base entity identifier
 */
class EntityIdVO {
    value;
    createdAt;
    constructor(value) {
        this.value = value;
        if (!value || value.trim().length === 0) {
            throw new Error('EntityId cannot be empty');
        }
        this.createdAt = new Date();
    }
    static create() {
        return new EntityIdVO(generateUUID());
    }
    static fromString(value) {
        return new EntityIdVO(value);
    }
    toString() {
        return this.value;
    }
}
exports.EntityIdVO = EntityIdVO;
/**
 * Project-specific ID with slug validation
 */
class ProjectIdVO extends EntityIdVO {
    static slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    constructor(value) {
        super(value);
        if (!ProjectIdVO.slugRegex.test(value)) {
            throw new Error('ProjectId must be lowercase alphanumeric with hyphens (e.g., my-project-123)');
        }
    }
    static create() {
        const id = generateUUID().replace(/-/g, '').substring(0, 12);
        return new ProjectIdVO(`project-${id}`);
    }
    static fromSlug(slug) {
        return new ProjectIdVO(slug);
    }
    getSlug() {
        return this.value;
    }
}
exports.ProjectIdVO = ProjectIdVO;
class Project {
    id;
    name;
    description;
    status;
    createdAt;
    updatedAt;
    userId;
    metadata;
    version;
    constructor(id, name, description, status, createdAt, updatedAt, userId, metadata = {}, version = 1) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.userId = userId;
        this.metadata = metadata;
        this.version = version;
        this.validate();
    }
    validate() {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Project name is required');
        }
        if (this.status === 'idea' && !this.description) {
            throw new Error('Description required for idea-stage projects');
        }
    }
    startResearch() {
        if (this.status !== 'idea') {
            throw new Error('Can only start research from idea status');
        }
        this.status = 'researching';
        this.updatedAt = new Date();
    }
    startValidation() {
        if (this.status !== 'researching') {
            throw new Error('Can only start validation after research');
        }
        this.status = 'validating';
        this.updatedAt = new Date();
    }
    startPlanning() {
        if (this.status !== 'validating') {
            throw new Error('Can only start planning after validation');
        }
        this.status = 'planning';
        this.updatedAt = new Date();
    }
    markReadyForExport() {
        if (this.status !== 'planning') {
            throw new Error('Can only export after planning');
        }
        this.status = 'ready_for_export';
        this.updatedAt = new Date();
    }
    archive() {
        this.status = 'archived';
        this.updatedAt = new Date();
    }
    cancel() {
        this.status = 'cancelled';
        this.updatedAt = new Date();
    }
    updateMetadata(key, value) {
        this.metadata[key] = value;
        this.updatedAt = new Date();
    }
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            userId: this.userId,
            metadata: this.metadata,
        };
    }
    static create(name, description, userId) {
        return new Project(ProjectIdVO.create(), name, description, 'idea', new Date(), new Date(), userId);
    }
}
exports.Project = Project;
class ResearchResult {
    id;
    projectId;
    category;
    findings;
    confidence;
    sources;
    createdAt;
    constructor(id, projectId, category, findings, confidence, sources, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.category = category;
        this.findings = findings;
        this.confidence = confidence;
        this.sources = sources;
        this.createdAt = createdAt;
        this.validate();
    }
    validate() {
        if (this.findings.length === 0) {
            throw new Error('ResearchResult must have at least one finding');
        }
        if (this.sources.length === 0) {
            throw new Error('ResearchResult must have at least one source');
        }
    }
    static create(projectId, category, findings, sources) {
        const avgRelevance = findings.reduce((sum, f) => sum + f.relevanceScore, 0) / findings.length;
        return new ResearchResult(EntityIdVO.create(), projectId, category, findings, ConfidenceScoreVO.create(avgRelevance / 10), sources, new Date());
    }
    toObject() {
        return {
            id: this.id,
            projectId: this.projectId,
            category: this.category,
            findings: this.findings,
            confidence: this.confidence,
            sources: this.sources,
            createdAt: this.createdAt,
        };
    }
}
exports.ResearchResult = ResearchResult;
class Decision {
    id;
    projectId;
    decisionType;
    recommendation;
    reasoning;
    confidence;
    alternatives;
    tradeOffs;
    createdAt;
    constructor(id, projectId, decisionType, recommendation, reasoning, confidence, alternatives, tradeOffs, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.decisionType = decisionType;
        this.recommendation = recommendation;
        this.reasoning = reasoning;
        this.confidence = confidence;
        this.alternatives = alternatives;
        this.tradeOffs = tradeOffs;
        this.createdAt = createdAt;
        this.validate();
    }
    validate() {
        if (!this.recommendation || this.recommendation.trim().length === 0) {
            throw new Error('Decision recommendation is required');
        }
        if (!this.reasoning || this.reasoning.trim().length === 0) {
            throw new Error('Decision reasoning is required');
        }
    }
    static create(projectId, decisionType, recommendation, reasoning, confidence, alternatives = [], tradeOffs = []) {
        return new Decision(EntityIdVO.create(), projectId, decisionType, recommendation, reasoning, confidence, alternatives, tradeOffs, new Date());
    }
    isHighConfidence() {
        return this.confidence.isHigh();
    }
    toObject() {
        return {
            id: this.id,
            projectId: this.projectId,
            decisionType: this.decisionType,
            recommendation: this.recommendation,
            reasoning: this.reasoning,
            confidence: this.confidence,
            alternatives: this.alternatives,
            tradeOffs: this.tradeOffs,
            createdAt: this.createdAt,
        };
    }
}
exports.Decision = Decision;
class Plan {
    id;
    projectId;
    phases;
    totalEstimatedCost;
    totalEstimatedTime;
    technologies;
    risks;
    createdAt;
    constructor(id, projectId, phases, totalEstimatedCost, totalEstimatedTime, technologies, risks, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.phases = phases;
        this.totalEstimatedCost = totalEstimatedCost;
        this.totalEstimatedTime = totalEstimatedTime;
        this.technologies = technologies;
        this.risks = risks;
        this.createdAt = createdAt;
        this.validate();
    }
    validate() {
        if (this.phases.length === 0) {
            throw new Error('Plan must have at least one phase');
        }
        if (this.totalEstimatedTime <= 0) {
            throw new Error('Plan estimated time must be positive');
        }
    }
    static create(projectId, phases, technologies, risks = []) {
        const totalCost = phases.reduce((sum, phase) => sum.add(phase.estimatedCost), CostVO.zero());
        const totalTime = phases.reduce((sum, phase) => sum + phase.estimatedWeeks, 0);
        return new Plan(EntityIdVO.create(), projectId, phases, totalCost, totalTime, technologies, risks, new Date());
    }
    getCriticalTasks() {
        return this.phases
            .flatMap((phase) => phase.tasks)
            .filter((task) => task.priority === 'critical');
    }
    toObject() {
        return {
            id: this.id,
            projectId: this.projectId,
            phases: this.phases,
            totalEstimatedCost: this.totalEstimatedCost,
            totalEstimatedTime: this.totalEstimatedTime,
            technologies: this.technologies,
            risks: this.risks,
            createdAt: this.createdAt,
        };
    }
}
exports.Plan = Plan;
exports.Result = {
    ok(data) {
        return { success: true, data };
    },
    err(error) {
        return { success: false, error };
    },
    map(result, fn) {
        if (result.success) {
            return exports.Result.ok(fn(result.data));
        }
        return result;
    },
    flatMap(result, fn) {
        if (result.success) {
            return fn(result.data);
        }
        return result;
    },
};
class DomainEvent {
    eventId;
    aggregateId;
    eventType;
    payload;
    occurredAt;
    constructor(eventId, aggregateId, eventType, payload, occurredAt = new Date()) {
        this.eventId = eventId;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = payload;
        this.occurredAt = occurredAt;
    }
    static create(aggregateId, eventType, payload) {
        return new DomainEvent(EntityIdVO.create(), aggregateId, eventType, payload, new Date());
    }
}
exports.DomainEvent = DomainEvent;
// Event Types
exports.ProjectEvents = {
    PROJECT_CREATED: 'project.created',
    PROJECT_RESEARCH_STARTED: 'project.research_started',
    PROJECT_VALIDATION_STARTED: 'project.validation_started',
    PROJECT_PLANNING_STARTED: 'project.planning_started',
    PROJECT_READY_FOR_EXPORT: 'project.ready_for_export',
    PROJECT_ARCHIVED: 'project.archived',
    PROJECT_CANCELLED: 'project.cancelled',
};
exports.ResearchEvents = {
    RESEARCH_COMPLETED: 'research.completed',
    RESEARCH_FAILED: 'research.failed',
};
exports.DecisionEvents = {
    DECISION_MADE: 'decision.made',
    DECISION_LOW_CONFIDENCE: 'decision.low_confidence',
};
exports.PlanEvents = {
    PLAN_GENERATED: 'plan.generated',
    PLAN_UPDATED: 'plan.updated',
};
//# sourceMappingURL=domain.js.map