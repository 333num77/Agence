// Jest Test Setup
// Global test configuration and utilities

import { jest } from '@jest/globals';

// Extend Jest timeout for AI operations
jest.setTimeout(30000);

// Mock console.error in tests to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
};

// Global test utilities
export const createMockCorrelationId = () => ({
  value: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  traceId: `trace-${Date.now()}`,
  spanId: `span-${Math.random().toString(36).substr(2, 9)}`,
});

export const createMockEntityId = (value?: string) => ({
  value: value || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  createdAt: new Date(),
});

export const createMockCost = (amount: number = 0) => ({
  amount,
  currency: 'USD',
  breakdown: [],
});

export const createMockConfidenceScore = (value: number = 0.5) => ({
  value,
  factors: [],
  uncertainty: 'MEDIUM' as const,
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
