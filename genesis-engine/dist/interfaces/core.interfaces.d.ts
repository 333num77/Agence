/**
 * Core domain interfaces - The heart of Genesis Engine
 * These interfaces define the contracts that all implementations must follow
 */
/**
 * Unique identifier for any entity in the system
 */
export interface EntityId {
    readonly value: string;
    readonly createdAt: Date;
}
/**
 * Correlation ID for tracking requests across the system
 */
export interface CorrelationId {
    readonly value: string;
    readonly traceId: string;
    readonly spanId: string;
}
/**
 * Confidence score for decisions (0.0 to 1.0)
 */
export interface ConfidenceScore {
    readonly value: number;
    readonly factors: ConfidenceFactor[];
    readonly uncertainty: UncertaintyLevel;
}
export type UncertaintyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ConfidenceFactor {
    readonly name: string;
    readonly weight: number;
    readonly evidence: string[];
}
/**
 * Monetary cost with currency
 */
export interface Cost {
    readonly amount: number;
    readonly currency: string;
    readonly breakdown: CostBreakdown[];
}
export interface CostBreakdown {
    readonly category: string;
    readonly amount: number;
    readonly description: string;
}
/**
 * Base interface for all domain entities
 */
export interface Entity<TId extends EntityId> {
    readonly id: TId;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly version: number;
}
/**
 * Base interface for all value objects
 */
export interface ValueObject<T> {
    equals(other: T): boolean;
    toString(): string;
}
/**
 * Domain event interface
 */
export interface DomainEvent {
    readonly eventId: string;
    readonly aggregateId: string;
    readonly occurredAt: Date;
    readonly correlationId: CorrelationId;
    readonly type: string;
    readonly payload: Record<string, unknown>;
}
/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
/**
 * Async operation result
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
/**
 * Repository interface for persistence
 */
export interface Repository<T extends Entity<EntityId>, TId extends EntityId> {
    findById(id: TId): AsyncResult<T>;
    findAll(): AsyncResult<T[]>;
    save(entity: T): AsyncResult<T>;
    delete(id: TId): AsyncResult<void>;
    exists(id: TId): AsyncResult<boolean>;
}
/**
 * Unit of Work pattern for transactions
 */
export interface UnitOfWork {
    begin(): AsyncResult<void>;
    commit(): AsyncResult<void>;
    rollback(): AsyncResult<void>;
    dispose(): void;
}
//# sourceMappingURL=core.interfaces.d.ts.map