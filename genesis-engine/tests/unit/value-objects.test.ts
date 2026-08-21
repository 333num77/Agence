/**
 * Unit Tests for Value Objects
 * Ensuring immutability and business rule enforcement
 */

import { describe, it, expect } from '@jest/globals';
import { CorrelationIdVO, ConfidenceScoreVO, CostVO, EntityIdVO, ProjectIdVO } from '../../src/core/value-objects';

describe('CorrelationIdVO', () => {
  it('should create valid correlation ID', () => {
    const corrId = new CorrelationIdVO('test-corr-123', 'trace-abc', 'span-xyz');
    
    expect(corrId.value).toBe('test-corr-123');
    expect(corrId.traceId).toBe('trace-abc');
    expect(corrId.spanId).toBe('span-xyz');
  });

  it('should throw error for short value', () => {
    expect(() => new CorrelationIdVO('short', 'trace-abc', 'span-xyz')).toThrow();
  });

  it('should generate valid correlation ID', () => {
    const corrId = CorrelationIdVO.generate();
    
    expect(corrId.value).toMatch(/^corr-\d+-[a-z0-9]+$/);
    expect(corrId.traceId).toMatch(/^trace-\d+-[a-z0-9]+$/);
    expect(corrId.spanId).toMatch(/^span-[a-z0-9]+$/);
  });

  it('should be equal when values match', () => {
    const corrId1 = new CorrelationIdVO('same-id-123', 'same-trace', 'same-span');
    const corrId2 = new CorrelationIdVO('same-id-123', 'same-trace', 'same-span');
    
    expect(corrId1.equals(corrId2)).toBe(true);
  });

  it('should not be equal when values differ', () => {
    const corrId1 = new CorrelationIdVO('id1-long-enough', 'trace1', 'span1');
    const corrId2 = new CorrelationIdVO('id2-long-enough', 'trace1', 'span1');
    
    expect(corrId1.equals(corrId2)).toBe(false);
  });
});

describe('ConfidenceScoreVO', () => {
  it('should create valid confidence score', () => {
    const score = new ConfidenceScoreVO(0.85, [], 'LOW');
    
    expect(score.value).toBe(0.85);
    expect(score.uncertainty).toBe('LOW');
  });

  it('should throw error for value > 1', () => {
    expect(() => new ConfidenceScoreVO(1.5, [], 'LOW')).toThrow();
  });

  it('should throw error for value < 0', () => {
    expect(() => new ConfidenceScoreVO(-0.1, [], 'LOW')).toThrow();
  });

  it('should create high confidence', () => {
    const score = ConfidenceScoreVO.high(0.95);
    
    expect(score.value).toBe(0.95);
    expect(score.uncertainty).toBe('LOW');
  });

  it('should create critical confidence', () => {
    const score = ConfidenceScoreVO.critical(0.05);
    
    expect(score.value).toBe(0.05);
    expect(score.uncertainty).toBe('CRITICAL');
  });
});

describe('CostVO', () => {
  it('should create valid cost', () => {
    const cost = new CostVO(100.50, 'USD', []);
    
    expect(cost.amount).toBe(100.50);
    expect(cost.currency).toBe('USD');
  });

  it('should throw error for negative amount', () => {
    expect(() => new CostVO(-50, 'USD')).toThrow();
  });

  it('should add costs with same currency', () => {
    const cost1 = CostVO.usd(50);
    const cost2 = CostVO.usd(75);
    const total = cost1.add(cost2);
    
    expect(total.amount).toBe(125);
    expect(total.currency).toBe('USD');
  });

  it('should throw error when adding different currencies', () => {
    const cost1 = CostVO.usd(50);
    const cost2 = new CostVO(75, 'EUR', []);
    
    expect(() => cost1.add(cost2)).toThrow();
  });

  it('should create zero cost', () => {
    const cost = CostVO.zero('USD');
    
    expect(cost.amount).toBe(0);
    expect(cost.currency).toBe('USD');
  });
});

describe('EntityIdVO', () => {
  it('should create valid entity ID', () => {
    const id = new EntityIdVO('entity-123');
    
    expect(id.value).toBe('entity-123');
  });

  it('should throw error for empty value', () => {
    expect(() => new EntityIdVO('')).toThrow();
  });

  it('should generate valid entity ID', () => {
    const id = EntityIdVO.generate('test');
    
    expect(id.value).toMatch(/^test-\d+-[a-z0-9]+$/);
  });

  it('should be equal when values match', () => {
    const id1 = new EntityIdVO('same-id');
    const id2 = new EntityIdVO('same-id');
    
    expect(id1.equals(id2)).toBe(true);
  });
});

describe('ProjectIdVO', () => {
  it('should create valid project ID', () => {
    const projectId = new ProjectIdVO('proj-123', 'my-project');
    
    expect(projectId.value).toBe('proj-123');
    expect(projectId.slug).toBe('my-project');
  });

  it('should throw error for invalid slug', () => {
    expect(() => new ProjectIdVO('proj-123', 'Invalid Slug!')).toThrow();
  });

  it('should throw error for short slug', () => {
    expect(() => new ProjectIdVO('proj-123', 'ab')).toThrow();
  });

  it('should generate valid project ID from name', () => {
    const projectId = ProjectIdVO.generate('My Awesome Project');
    
    expect(projectId.slug).toBe('my-awesome-project');
    expect(projectId.value).toMatch(/^proj-\d+-[a-z0-9]+$/);
  });

  it('should be equal when both value and slug match', () => {
    const proj1 = new ProjectIdVO('same-id', 'same-slug');
    const proj2 = new ProjectIdVO('same-id', 'same-slug');
    
    expect(proj1.equals(proj2)).toBe(true);
  });

  it('should not be equal when slug differs', () => {
    const proj1 = new ProjectIdVO('same-id', 'slug-1');
    const proj2 = new ProjectIdVO('same-id', 'slug-2');
    
    expect(proj1.equals(proj2)).toBe(false);
  });
});
