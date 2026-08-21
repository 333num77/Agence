/**
 * Planning Agent Implementation
 * Responsibility: Convert decisions into implementation plans with phased roadmaps
 * Follows hexagonal architecture - depends only on interfaces
 */

import { 
  IPlanningAgent, 
  PlanningQuery, 
  PlanningResult, 
  GeneratedArtifact,
  Roadmap,
  Phase,
  Task,
  PlanningArtifact,
  Dependency
} from '../interfaces/agent.interfaces';
import { EngineeringDecision } from '../interfaces/agent.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';

export class PlanningAgent implements IPlanningAgent {
  
  async execute(query: PlanningQuery): AsyncResult<PlanningResult> {
    try {
      const startTime = Date.now();
      const artifacts: GeneratedArtifact[] = [];
      
      // Generate requested artifacts
      for (const artifactType of query.artifacts) {
        const artifact = await this.generateArtifact(
          artifactType,
          query.decisions,
          query.constraints
        );
        artifacts.push(artifact);
      }

      // Create roadmap based on decisions and constraints
      const roadmap = this.createRoadmap(query.decisions, query.constraints);
      
      // Calculate estimates
      const estimatedTime = roadmap.phases.reduce((sum, phase) => sum + phase.duration, 0);
      const estimatedCost = this.calculateCost(roadmap, query.constraints);

      return {
        success: true,
        data: {
          correlationId: query.correlationId,
          projectId: query.projectId,
          artifacts,
          roadmap,
          estimatedCost,
          estimatedTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error in Planning Agent')
      };
    }
  }

  private async generateArtifact(
    type: PlanningArtifact,
    decisions: EngineeringDecision[],
    constraints: any
  ): Promise<GeneratedArtifact> {
    let content = '';
    let format: 'MARKDOWN' | 'JSON' | 'YAML' | 'MERMAID' = 'MARKDOWN';

    switch (type) {
      case 'PRD':
        content = this.generatePRD(decisions);
        break;
      case 'ARCHITECTURE':
        content = this.generateArchitecture(decisions, constraints);
        format = 'MERMAID';
        break;
      case 'DATABASE_SCHEMA':
        content = this.generateDatabaseSchema(decisions);
        format = 'MERMAID';
        break;
      case 'API_CONTRACTS':
        content = this.generateAPIContracts(decisions);
        format = 'JSON';
        break;
      case 'ROADMAP':
        content = this.generateRoadmapDoc(decisions, constraints);
        format = 'MARKDOWN';
        break;
      case 'DEVELOPMENT_PHASES':
        content = this.generateDevelopmentPhases(decisions, constraints);
        format = 'MARKDOWN';
        break;
      case 'AI_EXECUTION_PLAN':
        content = this.generateAIExecutionPlan(decisions);
        format = 'MARKDOWN';
        break;
      case 'SECURITY_PLAN':
        content = this.generateSecurityPlan(decisions);
        format = 'MARKDOWN';
        break;
      case 'TEST_STRATEGY':
        content = this.generateTestStrategy(decisions);
        format = 'MARKDOWN';
        break;
    }

    return {
      type,
      content,
      format,
      version: '1.0.0'
    };
  }

  private generatePRD(decisions: EngineeringDecision[]): string {
    const viabilityDecision = decisions.find(d => d.type === 'PRODUCT_VIABILITY');
    
    return `# Product Requirements Document

## Executive Summary
${viabilityDecision?.rationale || 'Product viability analysis pending.'}

## Problem Statement
Based on research evidence, the target market experiences significant challenges that this product aims to solve.

## Target Users
- Primary: Early adopters seeking validated solutions
- Secondary: Mainstream market following validation

## Core Features (MVP)
1. **Feature 1**: Minimum viable implementation
2. **Feature 2**: Essential functionality only
3. **Feature 3**: Critical user journey support

## Success Metrics
- User adoption rate > 20% in first month
- Retention rate > 60% after week 1
- NPS score > 30

## Technical Constraints
${decisions.map(d => `- ${d.type}: ${d.recommendation}`).join('\n')}

## Risks & Mitigations
${viabilityDecision?.risks.map(r => `- ${r.description}: ${r.mitigation}`).join('\n') || 'No critical risks identified'}
`;
  }

  private generateArchitecture(decisions: EngineeringDecision[], constraints: any): string {
    const techDecision = decisions.find(d => d.type === 'TECH_STACK');
    const stack = techDecision?.rationale.includes('established') ? 'proven' : 'modern';
    
    return `graph TD
    A[Client Layer] --> B[API Gateway]
    B --> C[Application Services]
    C --> D[Domain Layer]
    D --> E[Infrastructure Adapters]
    E --> F[(Database)]
    E --> G[External APIs]
    
    subgraph "Hexagonal Architecture"
    C
    D
    E
    end
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#ffebee
    style F fill:#fafafa
    style G fill:#fafafa
`;
  }

  private generateDatabaseSchema(decisions: EngineeringDecision[]): string {
    return `erDiagram
    PROJECT ||--o{ IDEA : contains
    PROJECT ||--o{ RESEARCH_RESULT : has
    PROJECT ||--o{ DECISION : generates
    PROJECT ||--o{ PLAN : produces
    
    IDEA {
        string id
        string description
        string status
        datetime createdAt
    }
    
    RESEARCH_RESULT {
        string id
        string type
        text findings
        float confidence
    }
    
    DECISION {
        string id
        string type
        string recommendation
        float confidenceScore
    }
    
    PLAN {
        string id
        int totalDuration
        decimal totalCost
        string status
    }
`;
  }

  private generateAPIContracts(decisions: EngineeringDecision[]): string {
    return `{
  "openapi": "3.0.0",
  "info": {
    "title": "Genesis Engine API",
    "version": "1.0.0",
    "description": "Product Intelligence Platform API"
  },
  "paths": {
    "/projects": {
      "post": {
        "summary": "Create new project",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "description": {"type": "string"},
                  "idea": {"type": "object"}
                }
              }
            }
          }
        }
      }
    },
    "/projects/{id}/research": {
      "post": {
        "summary": "Initiate research workflow"
      }
    },
    "/projects/{id}/decide": {
      "post": {
        "summary": "Generate engineering decisions"
      }
    },
    "/projects/{id}/plan": {
      "post": {
        "summary": "Create implementation plan"
      }
    }
  }
}`;
  }

  private generateRoadmapDoc(decisions: EngineeringDecision[], constraints: any): string {
    const maxPhases = constraints.maxPhases || 3;
    
    return `# Implementation Roadmap

## Phase Overview
Total Phases: ${maxPhases}

### Phase 1: Foundation (Weeks 1-4)
- Setup development environment
- Implement core domain layer
- Create interface contracts
- Build initial test suite

### Phase 2: Infrastructure (Weeks 5-8)
- Implement gateway adapters
- Setup database connections
- Configure AI providers
- Build orchestration engine

### Phase 3: Agents (Weeks 9-12)
- Deploy Research Agent
- Deploy Decision Agent
- Deploy Planning Agent
- Deploy Output Agent

### Phase 4: Integration (Weeks 13-16)
- API layer implementation
- Frontend development
- End-to-end testing
- Performance optimization
`;
  }

  private generateDevelopmentPhases(decisions: EngineeringDecision[], constraints: any): string {
    const duration = constraints.phaseDuration || 14;
    
    return `# Development Phases

## Sprint Structure
- Sprint Duration: ${duration} days
- Team Size: ${constraints.teamSize || 3} developers
- Technical Expertise: ${constraints.technicalExpertise || 'MEDIUM'}

## Phase Breakdown

### MVP Phase
Focus: Core validation workflow
Deliverables:
- Idea ingestion
- Basic research simulation
- Simple decision engine
- Markdown export

### V1 Phase
Focus: Production readiness
Deliverables:
- Real AI integration
- Database persistence
- API endpoints
- Web interface

### V2 Phase
Focus: Scale and automation
Deliverables:
- Advanced workflows
- Multi-agent collaboration
- Export integrations
- Analytics dashboard
`;
  }

  private generateAIExecutionPlan(decisions: EngineeringDecision[]): string {
    return `# AI Execution Plan

## AI Assist Levels by Task

### HIGH Automation (AI Generates 80%+)
- Unit test generation
- Documentation drafting
- Code refactoring suggestions
- Test data creation

### MEDIUM Automation (AI Generates 50-80%)
- API endpoint implementation
- Database schema design
- Component scaffolding
- Configuration files

### LOW Automation (AI Generates <50%)
- Business logic implementation
- Security-critical code
- Performance optimizations
- Integration logic

## Recommended AI Tools
- Code Generation: Cursor/Cline
- Research: Exa/Tavily APIs
- Documentation: LLM-based generators
- Testing: AI-assisted test writers

## Human Review Requirements
All AI-generated code must undergo:
1. Security review
2. Business logic validation
3. Performance assessment
4. Integration testing
`;
  }

  private generateSecurityPlan(decisions: EngineeringDecision[]): string {
    return `# Security Plan

## Threat Model
- Data isolation by ProjectId
- Input validation via Value Objects
- No external data leaks in memory mode
- Correlation ID tracking for audit trails

## Security Controls
1. **Authentication**: JWT-based with refresh tokens
2. **Authorization**: Role-based access control
3. **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
4. **Audit Logging**: All state changes tracked

## Compliance Considerations
- GDPR: Data minimization, right to deletion
- SOC2: Access controls, monitoring
- OWASP Top 10: Regular security scanning

## Incident Response
- Automated anomaly detection
- Rollback procedures documented
- Post-mortem process defined
`;
  }

  private generateTestStrategy(decisions: EngineeringDecision[]): string {
    return `# Test Strategy

## Testing Pyramid

### Unit Tests (70%)
- Domain entity validation
- Value object constraints
- Agent business logic
- Service calculations

### Integration Tests (20%)
- Gateway adapter connections
- Repository operations
- Workflow orchestration
- API endpoint chains

### E2E Tests (10%)
- Complete idea-to-plan workflow
- Multi-agent collaboration
- Export functionality
- Error recovery scenarios

## Coverage Requirements
- Lines: >80%
- Branches: >75%
- Functions: >85%
- Statements: >80%

## Quality Gates
- All tests must pass before merge
- No decrease in overall coverage
- Critical paths require 100% coverage
- Performance benchmarks maintained
`;
  }

  private createRoadmap(decisions: EngineeringDecision[], constraints: any): Roadmap {
    const maxPhases = constraints.maxPhases || 4;
    const phases: Phase[] = [];
    const dependencies: Dependency[] = [];
    const tasks: Task[] = [];

    // Phase 1: Foundation
    phases.push({
      number: 1,
      name: 'Foundation & Core',
      duration: 30,
      deliverables: [
        'Domain model complete',
        'Interface contracts defined',
        'Test infrastructure setup',
        'Basic value objects'
      ],
      tasks: [
        {
          id: 'P1T1',
          description: 'Implement domain entities',
          estimatedHours: 16,
          dependencies: [],
          aiAssistLevel: 'GENERATE'
        },
        {
          id: 'P1T2',
          description: 'Create interface contracts',
          estimatedHours: 12,
          dependencies: ['P1T1'],
          aiAssistLevel: 'SUGGEST'
        },
        {
          id: 'P1T3',
          description: 'Setup test framework',
          estimatedHours: 8,
          dependencies: [],
          aiAssistLevel: 'AUTOMATE'
        }
      ]
    });

    // Phase 2: Infrastructure
    phases.push({
      number: 2,
      name: 'Infrastructure Layer',
      duration: 35,
      deliverables: [
        'Gateway adapters implemented',
        'Database connections working',
        'AI provider integration',
        'Error handling complete'
      ],
      tasks: [
        {
          id: 'P2T1',
          description: 'Build research gateway',
          estimatedHours: 20,
          dependencies: ['P1T2'],
          aiAssistLevel: 'GENERATE'
        },
        {
          id: 'P2T2',
          description: 'Implement AI gateway',
          estimatedHours: 24,
          dependencies: ['P1T2'],
          aiAssistLevel: 'GENERATE'
        },
        {
          id: 'P2T3',
          description: 'Create storage adapters',
          estimatedHours: 16,
          dependencies: ['P2T1'],
          aiAssistLevel: 'SUGGEST'
        }
      ]
    });

    // Phase 3: Agents
    phases.push({
      number: 3,
      name: 'Agent Implementation',
      duration: 40,
      deliverables: [
        'Research Agent operational',
        'Decision Agent reasoning',
        'Planning Agent generating',
        'Output Agent exporting'
      ],
      tasks: [
        {
          id: 'P3T1',
          description: 'Implement Research Agent',
          estimatedHours: 24,
          dependencies: ['P2T1'],
          aiAssistLevel: 'GENERATE'
        },
        {
          id: 'P3T2',
          description: 'Implement Decision Agent',
          estimatedHours: 28,
          dependencies: ['P2T1', 'P2T2'],
          aiAssistLevel: 'SUGGEST'
        },
        {
          id: 'P3T3',
          description: 'Implement Planning Agent',
          estimatedHours: 32,
          dependencies: ['P3T2'],
          aiAssistLevel: 'SUGGEST'
        },
        {
          id: 'P3T4',
          description: 'Implement Output Agent',
          estimatedHours: 20,
          dependencies: ['P3T3'],
          aiAssistLevel: 'GENERATE'
        }
      ]
    });

    // Phase 4: Orchestration
    phases.push({
      number: 4,
      name: 'Orchestration & API',
      duration: 30,
      deliverables: [
        'Workflow engine running',
        'API endpoints live',
        'Frontend interface ready',
        'Documentation complete'
      ],
      tasks: [
        {
          id: 'P4T1',
          description: 'Build orchestrator engine',
          estimatedHours: 32,
          dependencies: ['P3T1', 'P3T2', 'P3T3', 'P3T4'],
          aiAssistLevel: 'SUGGEST'
        },
        {
          id: 'P4T2',
          description: 'Create REST API',
          estimatedHours: 24,
          dependencies: ['P4T1'],
          aiAssistLevel: 'GENERATE'
        },
        {
          id: 'P4T3',
          description: 'Build web interface',
          estimatedHours: 40,
          dependencies: ['P4T2'],
          aiAssistLevel: 'GENERATE'
        }
      ]
    });

    // Create dependencies between phases
    for (let i = 1; i < phases.length; i++) {
      const prevPhaseLastTask = phases[i - 1].tasks[phases[i - 1].tasks.length - 1].id;
      const currentPhaseFirstTask = phases[i].tasks[0].id;
      dependencies.push({
        from: prevPhaseLastTask,
        to: currentPhaseFirstTask,
        type: 'HARD'
      });
    }

    // Calculate critical path
    const criticalPath = phases.flatMap(p => p.tasks.map(t => t.id));

    return {
      phases: phases.slice(0, maxPhases),
      dependencies,
      criticalPath
    };
  }

  private calculateCost(roadmap: Roadmap, constraints: any): any {
    const totalHours = roadmap.phases.reduce((sum, phase) => {
      return sum + phase.tasks.reduce((taskSum, task) => taskSum + task.estimatedHours, 0);
    }, 0);

    const hourlyRate = 75; // Average developer rate
    const infrastructureCost = 500; // Monthly cloud costs
    const aiCosts = totalHours * 0.5; // Estimated AI token costs

    const totalAmount = (totalHours * hourlyRate) + infrastructureCost + aiCosts;

    return {
      amount: totalAmount,
      currency: 'USD',
      breakdown: [
        {
          category: 'DEVELOPMENT',
          amount: totalHours * hourlyRate,
          description: `${totalHours} hours at $${hourlyRate}/hour`
        },
        {
          category: 'INFRASTRUCTURE',
          amount: infrastructureCost,
          description: 'Cloud hosting, databases, monitoring'
        },
        {
          category: 'AI_SERVICES',
          amount: aiCosts,
          description: 'LLM API calls, embeddings, research'
        }
      ]
    };
  }
}
