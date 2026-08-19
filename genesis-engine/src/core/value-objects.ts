/**
 * Value Objects - Immutable domain primitives
 * These objects enforce business rules at the type level
 */

import { ValueObject } from '../interfaces/core.interfaces';

/**
 * Correlation ID Value Object
 * Tracks requests across the entire system
 */
export class CorrelationIdVO implements ValueObject<CorrelationIdVO> {
  constructor(
    public readonly value: string,
    public readonly traceId: string,
    public readonly spanId: string
  ) {
    this.validate();
  }

  private validate(): void {
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

  equals(other: CorrelationIdVO): boolean {
    return (
      this.value === other.value &&
      this.traceId === other.traceId &&
      this.spanId === other.spanId
    );
  }

  toString(): string {
    return `CorrelationId(${this.value}, ${this.traceId}, ${this.spanId})`;
  }

  static generate(): CorrelationIdVO {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    return new CorrelationIdVO(
      `corr-${timestamp}-${random}`,
      `trace-${timestamp}-${random.substring(0, 8)}`,
      `span-${random.substring(0, 8)}`
    );
  }
}

/**
 * Confidence Score Value Object
 * Represents decision confidence with factors
 */
export class ConfidenceScoreVO implements ValueObject<ConfidenceScoreVO> {
  constructor(
    public readonly value: number,
    public readonly factors: Array<{ name: string; weight: number; evidence: string[] }>,
    public readonly uncertainty: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 0 || this.value > 1) {
      throw new Error('Confidence value must be between 0 and 1');
    }
    
    const totalWeight = this.factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight > 1.001) { // Allow small floating point error
      throw new Error('Factor weights must sum to 1.0 or less');
    }
  }

  equals(other: ConfidenceScoreVO): boolean {
    return (
      this.value === other.value &&
      this.uncertainty === other.uncertainty &&
      this.factors.length === other.factors.length
    );
  }

  toString(): string {
    return `ConfidenceScore(value=${this.value.toFixed(2)}, uncertainty=${this.uncertainty})`;
  }

  static high(confidence: number = 0.9): ConfidenceScoreVO {
    return new ConfidenceScoreVO(confidence, [], 'LOW');
  }

  static medium(confidence: number = 0.6): ConfidenceScoreVO {
    return new ConfidenceScoreVO(confidence, [], 'MEDIUM');
  }

  static low(confidence: number = 0.3): ConfidenceScoreVO {
    return new ConfidenceScoreVO(confidence, [], 'HIGH');
  }

  static critical(confidence: number = 0.1): ConfidenceScoreVO {
    return new ConfidenceScoreVO(confidence, [], 'CRITICAL');
  }
}

/**
 * Cost Value Object
 * Represents monetary cost with breakdown
 */
export class CostVO implements ValueObject<CostVO> {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
    public readonly breakdown: Array<{ category: string; amount: number; description: string }> = []
  ) {
    this.validate();
  }

  private validate(): void {
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

  equals(other: CostVO): boolean {
    return (
      this.amount === other.amount &&
      this.currency === other.currency
    );
  }

  toString(): string {
    return `Cost(${this.amount.toFixed(2)} ${this.currency})`;
  }

  add(other: CostVO): CostVO {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add costs with different currencies');
    }
    
    return new CostVO(
      this.amount + other.amount,
      this.currency,
      [...this.breakdown, ...other.breakdown]
    );
  }

  static zero(currency: string = 'USD'): CostVO {
    return new CostVO(0, currency);
  }

  static usd(amount: number): CostVO {
    return new CostVO(amount, 'USD');
  }
}

/**
 * Entity ID Value Object
 * Base identifier for all entities
 */
export class EntityIdVO implements ValueObject<EntityIdVO> {
  constructor(
    public readonly value: string,
    public readonly createdAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('EntityId value cannot be empty');
    }
  }

  equals(other: EntityIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `EntityId(${this.value})`;
  }

  static generate(prefix: string = 'entity'): EntityIdVO {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    return new EntityIdVO(`${prefix}-${timestamp}-${random}`);
  }
}

/**
 * Project ID Value Object
 * Specialized Entity ID for projects
 */
export class ProjectIdVO extends EntityIdVO implements ValueObject<ProjectIdVO> {
  constructor(
    public readonly value: string,
    public readonly slug: string,
    public readonly createdAt: Date = new Date()
  ) {
    super(value, createdAt);
    this.validateSlug();
  }

  private validateSlug(): void {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(this.slug)) {
      throw new Error('Slug must be lowercase alphanumeric with hyphens');
    }
    if (this.slug.length < 3 || this.slug.length > 100) {
      throw new Error('Slug must be between 3 and 100 characters');
    }
  }

  equals(other: ProjectIdVO): boolean {
    return this.value === other.value && this.slug === other.slug;
  }

  toString(): string {
    return `ProjectId(${this.value}, slug=${this.slug})`;
  }

  static generate(name: string): ProjectIdVO {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const id = EntityIdVO.generate('proj');
    
    return new ProjectIdVO(id.value, slug);
  }
}
