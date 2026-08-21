import {
  Project,
  ProjectIdVO,
  ResearchResult,
  Decision,
  ConfidenceScoreVO,
  Plan,
  PlanPhase,
  CostVO,
  DomainEvent,
  ProjectEvents,
  Result,
} from '../../src/core/domain';

describe('Domain Entities', () => {
  describe('Project', () => {
    it('should create a valid project', () => {
      const project = Project.create(
        'Test Project',
        'A test project description',
        'user-123'
      );

      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project description');
      expect(project.status).toBe('idea');
      expect(project.userId).toBe('user-123');
      expect(project.id).toBeInstanceOf(ProjectIdVO);
    });

    it('should throw error for missing name', () => {
      expect(() => {
        Project.create('', 'Description', 'user-123');
      }).toThrow('Project name is required');
    });

    it('should throw error for missing description in idea stage', () => {
      expect(() => {
        // @ts-ignore - testing invalid state
        new Project(
          ProjectIdVO.create(),
          'Test',
          '',
          'idea',
          new Date(),
          new Date(),
          'user-123'
        );
      }).toThrow('Description required for idea-stage projects');
    });

    it('should transition through valid states', () => {
      const project = Project.create('Test', 'Description', 'user-123');
      
      expect(project.status).toBe('idea');
      
      project.startResearch();
      expect(project.status).toBe('researching');
      
      project.startValidation();
      expect(project.status).toBe('validating');
      
      project.startPlanning();
      expect(project.status).toBe('planning');
      
      project.markReadyForExport();
      expect(project.status).toBe('ready_for_export');
    });

    it('should throw error for invalid state transition', () => {
      const project = Project.create('Test', 'Description', 'user-123');
      
      expect(() => {
        project.startValidation(); // Can't validate without research
      }).toThrow('Can only start validation after research');
    });

    it('should archive project', () => {
      const project = Project.create('Test', 'Description', 'user-123');
      project.archive();
      expect(project.status).toBe('archived');
    });

    it('should cancel project', () => {
      const project = Project.create('Test', 'Description', 'user-123');
      project.cancel();
      expect(project.status).toBe('cancelled');
    });

    it('should update metadata', () => {
      const project = Project.create('Test', 'Description', 'user-123');
      project.updateMetadata('key1', 'value1');
      project.updateMetadata('key2', { nested: 'object' });
      
      expect(project.metadata.key1).toBe('value1');
      expect(project.metadata.key2).toEqual({ nested: 'object' });
    });
  });

  describe('ResearchResult', () => {
    it('should create valid research result', () => {
      const projectId = ProjectIdVO.create();
      const findings = [
        {
          title: 'Market Size',
          summary: 'Large market opportunity',
          evidence: 'Data shows growth',
          relevanceScore: 8,
          sourceUrl: 'https://example.com',
        },
      ];
      const sources = ['https://example.com'];

      const result = ResearchResult.create(
        projectId,
        'market',
        findings,
        sources
      );

      expect(result.category).toBe('market');
      expect(result.findings.length).toBe(1);
      expect(result.sources.length).toBe(1);
      expect(result.confidence.toNumber()).toBeGreaterThan(0);
    });

    it('should throw error for empty findings', () => {
      const projectId = ProjectIdVO.create();
      
      expect(() => {
        ResearchResult.create(projectId, 'market', [], ['source']);
      }).toThrow('ResearchResult must have at least one finding');
    });

    it('should throw error for empty sources', () => {
      const projectId = ProjectIdVO.create();
      const findings = [
        {
          title: 'Test',
          summary: 'Summary',
          evidence: 'Evidence',
          relevanceScore: 5,
        },
      ];
      
      expect(() => {
        ResearchResult.create(projectId, 'market', findings, []);
      }).toThrow('ResearchResult must have at least one source');
    });
  });

  describe('Decision', () => {
    it('should create valid decision', () => {
      const projectId = ProjectIdVO.create();
      
      const decision = Decision.create(
        projectId,
        'should_build',
        'Build the product',
        'Market research shows strong demand',
        ConfidenceScoreVO.high(),
        ['Pivot to different market', 'Wait for better timing'],
        ['First-mover advantage vs. market education']
      );

      expect(decision.decisionType).toBe('should_build');
      expect(decision.recommendation).toBe('Build the product');
      expect(decision.confidence.isHigh()).toBe(true);
      expect(decision.alternatives.length).toBe(2);
      expect(decision.tradeOffs.length).toBe(1);
    });

    it('should throw error for missing recommendation', () => {
      const projectId = ProjectIdVO.create();
      
      expect(() => {
        Decision.create(
          projectId,
          'should_build',
          '',
          'Reasoning',
          ConfidenceScoreVO.medium()
        );
      }).toThrow('Decision recommendation is required');
    });

    it('should throw error for missing reasoning', () => {
      const projectId = ProjectIdVO.create();
      
      expect(() => {
        Decision.create(
          projectId,
          'should_build',
          'Recommendation',
          '',
          ConfidenceScoreVO.medium()
        );
      }).toThrow('Decision reasoning is required');
    });

    it('should identify high confidence decisions', () => {
      const projectId = ProjectIdVO.create();
      const highConfDecision = Decision.create(
        projectId,
        'should_build',
        'Build',
        'Reasoning',
        ConfidenceScoreVO.high()
      );
      
      const lowConfDecision = Decision.create(
        projectId,
        'should_pivot',
        'Pivot',
        'Reasoning',
        ConfidenceScoreVO.low()
      );

      expect(highConfDecision.isHighConfidence()).toBe(true);
      expect(lowConfDecision.isHighConfidence()).toBe(false);
    });
  });

  describe('Plan', () => {
    it('should create valid implementation plan', () => {
      const projectId = ProjectIdVO.create();
      
      const phases: PlanPhase[] = [
        {
          name: 'MVP Development',
          description: 'Build core features',
          tasks: [
            {
              id: 'task-1',
              title: 'Setup database',
              description: 'Configure PostgreSQL',
              estimatedHours: 8,
              priority: 'critical',
            },
          ],
          estimatedWeeks: 4,
          estimatedCost: CostVO.create(5000),
          dependencies: [],
        },
      ];

      const plan = Plan.create(
        projectId,
        phases,
        ['PostgreSQL', 'Node.js', 'React'],
        ['Technical debt risk']
      );

      expect(plan.phases.length).toBe(1);
      expect(plan.totalEstimatedTime).toBe(4);
      expect(plan.totalEstimatedCost.amount).toBe(5000);
      expect(plan.technologies.length).toBe(3);
      expect(plan.risks.length).toBe(1);
    });

    it('should calculate total cost from phases', () => {
      const projectId = ProjectIdVO.create();
      
      const phases: PlanPhase[] = [
        {
          name: 'Phase 1',
          description: 'First phase',
          tasks: [],
          estimatedWeeks: 2,
          estimatedCost: CostVO.create(3000),
          dependencies: [],
        },
        {
          name: 'Phase 2',
          description: 'Second phase',
          tasks: [],
          estimatedWeeks: 3,
          estimatedCost: CostVO.create(5000),
          dependencies: ['Phase 1'],
        },
      ];

      const plan = Plan.create(projectId, phases, ['Tech']);

      expect(plan.totalEstimatedCost.amount).toBe(8000);
      expect(plan.totalEstimatedTime).toBe(5);
    });

    it('should get critical tasks', () => {
      const projectId = ProjectIdVO.create();
      
      const phases: PlanPhase[] = [
        {
          name: 'Phase 1',
          description: 'First phase',
          tasks: [
            {
              id: 'task-1',
              title: 'Critical task',
              description: 'Must do',
              estimatedHours: 10,
              priority: 'critical',
            },
            {
              id: 'task-2',
              title: 'Nice to have',
              description: 'Optional',
              estimatedHours: 5,
              priority: 'low',
            },
          ],
          estimatedWeeks: 2,
          estimatedCost: CostVO.zero(),
          dependencies: [],
        },
      ];

      const plan = Plan.create(projectId, phases, ['Tech']);
      const criticalTasks = plan.getCriticalTasks();

      expect(criticalTasks.length).toBe(1);
      expect(criticalTasks[0].priority).toBe('critical');
    });

    it('should throw error for empty phases', () => {
      const projectId = ProjectIdVO.create();
      
      expect(() => {
        Plan.create(projectId, [], []);
      }).toThrow('Plan must have at least one phase');
    });
  });

  describe('Domain Events', () => {
    it('should create domain event', () => {
      const event = DomainEvent.create(
        'project-123',
        ProjectEvents.PROJECT_CREATED,
        { projectId: 'project-123', userId: 'user-123' }
      );

      expect(event.aggregateId).toBe('project-123');
      expect(event.eventType).toBe(ProjectEvents.PROJECT_CREATED);
      expect(event.payload).toEqual({
        projectId: 'project-123',
        userId: 'user-123',
      });
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should generate unique event IDs', () => {
      const event1 = DomainEvent.create('agg-1', 'test.event', {});
      const event2 = DomainEvent.create('agg-1', 'test.event', {});

      expect(event1.eventId.toString()).not.toBe(event2.eventId.toString());
    });
  });

  describe('Result Type', () => {
    it('should create success result', () => {
      const result = Result.ok('success data');
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBe('success data');
    });

    it('should create error result', () => {
      const error = new Error('Something went wrong');
      const result = Result.err(error);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBe(error);
    });

    it('should map success result', () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);
      
      expect(mapped.success).toBe(true);
      expect((mapped as any).data).toBe(10);
    });

    it('should not map error result', () => {
      const result = Result.err(new Error('Error'));
      const mapped = Result.map(result, (x: number) => x * 2);
      
      expect(mapped.success).toBe(false);
    });

    it('should flatMap success result', () => {
      const result = Result.ok(5);
      const mapped = Result.flatMap(result, (x) => Result.ok(x * 3));
      
      expect(mapped.success).toBe(true);
      expect((mapped as any).data).toBe(15);
    });
  });
});
