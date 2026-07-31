# Genesis Engine - Project Rules

Version: 1.0  
Status: Active  
Priority: Critical  

---

## Purpose

This document defines the non-negotiable rules for the Genesis project.

All contributors (human and AI) MUST follow these rules.

---

## Rule 1: Architecture Authority

Architecture documents have higher authority than implementation code.

If code conflicts with architecture:
- Code MUST be changed
- Architecture changes require ADR process

---

## Rule 2: No Assumptions Without Evidence

AI MUST NOT assume:
- User requirements are complete
- Technology choices are optimal
- Market conditions are static
- Competitor landscape is known

AI MUST ask clarifying questions when:
- Requirements are ambiguous
- Evidence is insufficient
- Trade-offs need human judgment
- Confidence score < 80%

---

## Rule 3: Targeted Context Strategy (TCS)

AI MUST load context in this order:

1. Global Rules (this file)
2. Target Architecture Document
3. Relevant Contracts (via Dependency Resolver)

AI MUST NOT:
- Load entire repository
- Read unrelated documentation
- Assume context without verification

---

## Rule 4: Dependency Resolution

Before implementing any feature, AI MUST identify dependencies:

```
Feature → Required Contracts → Required Interfaces → Required DTOs
```

AI MUST request only those specific sections.

---

## Rule 5: Micro-Task Execution

AI MUST work in micro-tasks:

✅ DO: Implement one interface at a time  
✅ DO: Create one adapter per task  
✅ DO: Test one capability before moving on  

❌ DON'T: Build entire modules in one response  
❌ DON'T: Skip testing for "speed"  
❌ DON'T: Combine unrelated changes  

---

## Rule 6: Coding Standards

All code MUST follow:

- Hexagonal Architecture pattern
- Dependency Injection for all external dependencies
- Strict typing (no `any` in TypeScript, no `Any` in Python)
- Async-first design for I/O operations
- Structured logging with correlation IDs
- Error contracts (never throw raw exceptions)
- Unit tests for all business logic
- Integration tests for all gateways

---

## Rule 7: Documentation Separation

- **Architecture Docs**: Timeless, versioned, ADR-governed
- **Implementation Prompts**: Temporary, task-specific
- **Runbooks**: Operational procedures
- **Contracts**: Interface definitions

NEVER mix these categories.

---

## Rule 8: Provider Abstraction

All external services MUST go through Gateways:

- LLM providers → AI Gateway
- Search APIs → Research Gateway
- Databases → Storage Gateway
- Queues → Queue Gateway
- File exports → Export Gateway

Agents MUST NOT call external services directly.

---

## Rule 9: Observability

Every expensive operation MUST be measurable:

- Latency
- Cost
- Token usage
- Cache hit rate
- Failure rate
- Retry count

No silent failures allowed.

---

## Rule 10: Security First

- Never log sensitive data
- Validate all inputs at boundaries
- Use principle of least privilege
- Encrypt data at rest and in transit
- Audit trail for all state changes

---

## Rule 11: ADR Workflow

Architecture changes require:

1. Create ADR document
2. Document alternatives considered
3. Document decision rationale
4. Get approval (human or automated)
5. Update affected docs
6. Then implement

NO direct architecture changes in code.

---

## Rule 12: AI Behavior Contract

When acting as Genesis developer, AI MUST:

1. Read this file first
2. Confirm understanding of task scope
3. Identify required context documents
4. Ask clarifying questions if confidence < 80%
5. Propose implementation plan (micro-task breakdown)
6. Implement one micro-task
7. Provide test strategy
8. Wait for review before next task

AI is an **Architecture Guardian**, not just a code generator.

---

## Enforcement

Violations of these rules MUST be caught in:
- Code review
- Automated linting
- Integration tests
- Architecture compliance checks

Repeated violations trigger ADR for process improvement.

---

## End of Document
