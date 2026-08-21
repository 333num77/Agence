import { IProject, ProjectIdVO, IResearchResult, IDecision, IPlan, Result } from '../core/domain';
/**
 * Repository Pattern - Data Access Abstraction
 */
export interface IRepository<T, TId> {
    findById(id: TId): Promise<Result<T, Error>>;
    findAll(): Promise<Result<T[], Error>>;
    save(entity: T): Promise<Result<T, Error>>;
    delete(id: TId): Promise<Result<void, Error>>;
    exists(id: TId): Promise<Result<boolean, Error>>;
}
/**
 * Project Repository Contract
 */
export interface IProjectRepository extends IRepository<IProject, ProjectIdVO> {
    findByUserId(userId: string): Promise<Result<IProject[], Error>>;
    findByStatus(status: string): Promise<Result<IProject[], Error>>;
    findActiveProjects(userId: string): Promise<Result<IProject[], Error>>;
}
/**
 * Research Result Repository Contract
 */
export interface IResearchResultRepository extends IRepository<IResearchResult, string> {
    findByProjectId(projectId: ProjectIdVO): Promise<Result<IResearchResult[], Error>>;
    findByCategory(projectId: ProjectIdVO, category: string): Promise<Result<IResearchResult[], Error>>;
    findLatestByProject(projectId: ProjectIdVO): Promise<Result<IResearchResult | null, Error>>;
}
/**
 * Decision Repository Contract
 */
export interface IDecisionRepository extends IRepository<IDecision, string> {
    findByProjectId(projectId: ProjectIdVO): Promise<Result<IDecision[], Error>>;
    findByType(projectId: ProjectIdVO, type: string): Promise<Result<IDecision[], Error>>;
    findHighConfidenceDecisions(projectId: ProjectIdVO): Promise<Result<IDecision[], Error>>;
    findLatestByProject(projectId: ProjectIdVO): Promise<Result<IDecision | null, Error>>;
}
/**
 * Plan Repository Contract
 */
export interface IPlanRepository extends IRepository<IPlan, string> {
    findByProjectId(projectId: ProjectIdVO): Promise<Result<IPlan[], Error>>;
    findLatestByProject(projectId: ProjectIdVO): Promise<Result<IPlan | null, Error>>;
}
/**
 * Unit of Work Pattern - Transaction Management
 */
export interface IUnitOfWork {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    dispose(): Promise<void>;
}
/**
 * Event Bus Contract - Domain Event Publishing
 */
export interface IEventBus {
    publish<T>(event: T): Promise<void>;
    subscribe<T>(eventType: string, handler: (event: T) => Promise<void>): void;
    unsubscribe(eventType: string): void;
}
/**
 * Logger Contract
 */
export interface ILogger {
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
    fatal(message: string, error?: Error, context?: Record<string, any>): void;
}
/**
 * Configuration Contract
 */
export interface IConfig {
    get<T>(key: string, defaultValue?: T): T;
    getRequired<T>(key: string): T;
    has(key: string): boolean;
}
/**
 * Metrics Contract - Observability
 */
export interface IMetrics {
    incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    recordGauge(name: string, value: number, labels?: Record<string, string>): void;
    startTimer(name: string, labels?: Record<string, string>): () => number;
}
//# sourceMappingURL=ports.d.ts.map