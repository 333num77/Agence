"use strict";
/**
 * Value Objects - Immutable domain primitives
 * These objects enforce business rules at the type level
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectIdVO = exports.EntityIdVO = exports.CostVO = exports.ConfidenceScoreVO = exports.CorrelationIdVO = void 0;
/**
 * Correlation ID Value Object
 * Tracks requests across the entire system
 */
class CorrelationIdVO {
    value;
    traceId;
    spanId;
    constructor(value, traceId, spanId) {
        this.value = value;
        this.traceId = traceId;
        this.spanId = spanId;
        this.validate();
    }
    validate() {
        if (!this.value || this.value.length < 10) {
            throw new Error('CorrelationId value must be at least 10 characters');
        }
        if (!this.traceId || this.traceId.length < 5) {
            throw new Error('TraceId must be at least 5 characters');
        }
        if (!this.spanId || this.spanId.length < 5) {
            throw new Error('SpanId must be at least 5 characters');
        }
    }
    equals(other) {
        return (this.value === other.value &&
            this.traceId === other.traceId &&
            this.spanId === other.spanId);
    }
    toString() {
        return `CorrelationId(${this.value}, ${this.traceId}, ${this.spanId})`;
    }
    static generate() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return new CorrelationIdVO(`corr-${timestamp}-${random}`, `trace-${timestamp}-${random.substring(0, 8)}`, `span-${random.substring(0, 8)}`);
    }
}
exports.CorrelationIdVO = CorrelationIdVO;
/**
 * Confidence Score Value Object
 * Represents decision confidence with factors
 */
class ConfidenceScoreVO {
    value;
    factors;
    uncertainty;
    constructor(value, factors, uncertainty) {
        this.value = value;
        this.factors = factors;
        this.uncertainty = uncertainty;
        this.validate();
    }
    validate() {
        if (this.value < 0 || this.value > 1) {
            throw new Error('Confidence value must be between 0 and 1');
        }
        const totalWeight = this.factors.reduce((sum, f) => sum + f.weight, 0);
        if (totalWeight > 1.001) { // Allow small floating point error
            throw new Error('Factor weights must sum to 1.0 or less');
        }
    }
    equals(other) {
        return (this.value === other.value &&
            this.uncertainty === other.uncertainty &&
            this.factors.length === other.factors.length);
    }
    toString() {
        return `ConfidenceScore(value=${this.value.toFixed(2)}, uncertainty=${this.uncertainty})`;
    }
    static high(confidence = 0.9) {
        return new ConfidenceScoreVO(confidence, [], 'LOW');
    }
    static medium(confidence = 0.6) {
        return new ConfidenceScoreVO(confidence, [], 'MEDIUM');
    }
    static low(confidence = 0.3) {
        return new ConfidenceScoreVO(confidence, [], 'HIGH');
    }
    static critical(confidence = 0.1) {
        return new ConfidenceScoreVO(confidence, [], 'CRITICAL');
    }
}
exports.ConfidenceScoreVO = ConfidenceScoreVO;
/**
 * Cost Value Object
 * Represents monetary cost with breakdown
 */
class CostVO {
    amount;
    currency;
    breakdown;
    constructor(amount, currency, breakdown = []) {
        this.amount = amount;
        this.currency = currency;
        this.breakdown = breakdown;
        this.validate();
    }
    validate() {
        if (this.amount < 0) {
            throw new Error('Cost amount cannot be negative');
        }
        // Only validate breakdown if it exists and has items
        if (this.breakdown && this.breakdown.length > 0) {
            const totalBreakdown = this.breakdown.reduce((sum, b) => sum + b.amount, 0);
            if (Math.abs(totalBreakdown - this.amount) > 0.01) {
                throw new Error('Breakdown amounts must sum to total amount');
            }
        }
    }
    equals(other) {
        return (this.amount === other.amount &&
            this.currency === other.currency);
    }
    toString() {
        return `Cost(${this.amount.toFixed(2)} ${this.currency})`;
    }
    add(other) {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add costs with different currencies');
        }
        return new CostVO(this.amount + other.amount, this.currency, [...this.breakdown, ...other.breakdown]);
    }
    static zero(currency = 'USD') {
        return new CostVO(0, currency);
    }
    static usd(amount) {
        return new CostVO(amount, 'USD');
    }
}
exports.CostVO = CostVO;
/**
 * Entity ID Value Object
 * Base identifier for all entities
 */
class EntityIdVO {
    value;
    createdAt;
    constructor(value, createdAt = new Date()) {
        this.value = value;
        this.createdAt = createdAt;
        this.validate();
    }
    validate() {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('EntityId value cannot be empty');
        }
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return `EntityId(${this.value})`;
    }
    static generate(prefix = 'entity') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return new EntityIdVO(`${prefix}-${timestamp}-${random}`);
    }
}
exports.EntityIdVO = EntityIdVO;
/**
 * Project ID Value Object
 * Specialized Entity ID for projects
 */
class ProjectIdVO extends EntityIdVO {
    value;
    slug;
    createdAt;
    constructor(value, slug, createdAt = new Date()) {
        super(value, createdAt);
        this.value = value;
        this.slug = slug;
        this.createdAt = createdAt;
        this.validateSlug();
    }
    validateSlug() {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(this.slug)) {
            throw new Error('Slug must be lowercase alphanumeric with hyphens');
        }
        if (this.slug.length < 3 || this.slug.length > 100) {
            throw new Error('Slug must be between 3 and 100 characters');
        }
    }
    equals(other) {
        return this.value === other.value && this.slug === other.slug;
    }
    toString() {
        return `ProjectId(${this.value}, slug=${this.slug})`;
    }
    static generate(name) {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const id = EntityIdVO.generate('proj');
        return new ProjectIdVO(id.value, slug);
    }
}
exports.ProjectIdVO = ProjectIdVO;
//# sourceMappingURL=value-objects.js.map