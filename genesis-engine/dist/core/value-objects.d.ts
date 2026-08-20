/**
 * Value Objects - Immutable domain primitives
 * These objects enforce business rules at the type level
 */
import { ValueObject } from '../interfaces/core.interfaces';
/**
 * Correlation ID Value Object
 * Tracks requests across the entire system
 */
export declare class CorrelationIdVO implements ValueObject<CorrelationIdVO> {
    readonly value: string;
    readonly traceId: string;
    readonly spanId: string;
    constructor(value: string, traceId: string, spanId: string);
    private validate;
    equals(other: CorrelationIdVO): boolean;
    toString(): string;
    static generate(): CorrelationIdVO;
}
/**
 * Confidence Score Value Object
 * Represents decision confidence with factors
 */
export declare class ConfidenceScoreVO implements ValueObject<ConfidenceScoreVO> {
    readonly value: number;
    readonly factors: Array<{
        name: string;
        weight: number;
        evidence: string[];
    }>;
    readonly uncertainty: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    constructor(value: number, factors: Array<{
        name: string;
        weight: number;
        evidence: string[];
    }>, uncertainty: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL');
    private validate;
    equals(other: ConfidenceScoreVO): boolean;
    toString(): string;
    static high(confidence?: number): ConfidenceScoreVO;
    static medium(confidence?: number): ConfidenceScoreVO;
    static low(confidence?: number): ConfidenceScoreVO;
    static critical(confidence?: number): ConfidenceScoreVO;
}
/**
 * Cost Value Object
 * Represents monetary cost with breakdown
 */
export declare class CostVO implements ValueObject<CostVO> {
    readonly amount: number;
    readonly currency: string;
    readonly breakdown: Array<{
        category: string;
        amount: number;
        description: string;
    }>;
    constructor(amount: number, currency: string, breakdown?: Array<{
        category: string;
        amount: number;
        description: string;
    }>);
    private validate;
    equals(other: CostVO): boolean;
    toString(): string;
    add(other: CostVO): CostVO;
    static zero(currency?: string): CostVO;
    static usd(amount: number): CostVO;
}
/**
 * Entity ID Value Object
 * Base identifier for all entities
 */
export declare class EntityIdVO implements ValueObject<EntityIdVO> {
    readonly value: string;
    readonly createdAt: Date;
    constructor(value: string, createdAt?: Date);
    private validate;
    equals(other: EntityIdVO): boolean;
    toString(): string;
    static generate(prefix?: string): EntityIdVO;
}
/**
 * Project ID Value Object
 * Specialized Entity ID for projects
 */
export declare class ProjectIdVO extends EntityIdVO implements ValueObject<ProjectIdVO> {
    readonly value: string;
    readonly slug: string;
    readonly createdAt: Date;
    constructor(value: string, slug: string, createdAt?: Date);
    private validateSlug;
    equals(other: ProjectIdVO): boolean;
    toString(): string;
    static generate(name: string): ProjectIdVO;
}
//# sourceMappingURL=value-objects.d.ts.map