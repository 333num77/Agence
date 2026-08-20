/**
 * Gateway interfaces - Contracts for all external system communications
 * No agent communicates directly with external providers
 */
import { CorrelationId, Cost, AsyncResult } from './core.interfaces';
import { Evidence, ResearchType } from './agent.interfaces';
/**
 * AI Provider types
 */
export type AIProvider = 'OPENROUTER' | 'GEMINI' | 'ANTHROPIC' | 'OPENAI' | 'AZURE_OPENAI' | 'LOCAL_LLAMA';
/**
 * AI Model capabilities
 */
export interface ModelCapabilities {
    readonly contextWindow: number;
    readonly maxOutputTokens: number;
    readonly supportsVision: boolean;
    readonly supportsFunctionCalling: boolean;
    readonly supportsStreaming: boolean;
    readonly inputCostPer1k: number;
    readonly outputCostPer1k: number;
}
/**
 * AI Message structure
 */
export interface AIMessage {
    readonly role: 'SYSTEM' | 'USER' | 'ASSISTANT';
    readonly content: string;
    readonly metadata?: Record<string, unknown>;
}
/**
 * AI Request to provider
 */
export interface AIRequest {
    readonly correlationId: CorrelationId;
    readonly provider: AIProvider;
    readonly model: string;
    readonly messages: AIMessage[];
    readonly temperature?: number;
    readonly maxTokens?: number;
    readonly topP?: number;
    readonly frequencyPenalty?: number;
    readonly presencePenalty?: number;
    readonly stopSequences?: string[];
    readonly responseFormat?: 'TEXT' | 'JSON' | 'XML';
    readonly tools?: AITool[];
}
export interface AITool {
    readonly name: string;
    readonly description: string;
    readonly parameters: Record<string, unknown>;
}
/**
 * AI Response from provider
 */
export interface AIResponse {
    readonly correlationId: CorrelationId;
    readonly provider: AIProvider;
    readonly model: string;
    readonly content: string;
    readonly usage: TokenUsage;
    readonly latency: number;
    readonly finishReason: string;
    readonly toolCalls?: AIToolCall[];
}
export interface TokenUsage {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
    readonly cost: Cost;
}
export interface AIToolCall {
    readonly id: string;
    readonly name: string;
    readonly arguments: Record<string, unknown>;
}
/**
 * AI Gateway Interface
 * Responsibility: Abstract all AI provider communications
 */
export interface IAIGateway {
    getCapabilities(provider: AIProvider, model: string): Promise<ModelCapabilities>;
    generate(request: AIRequest): AsyncResult<AIResponse>;
    stream(request: AIRequest): AsyncResult<AsyncIterable<AIResponse>>;
    listModels(provider: AIProvider): AsyncResult<string[]>;
    estimateCost(provider: AIProvider, model: string, tokens: number): Cost;
}
/**
 * Search provider types
 */
export type SearchProvider = 'EXA' | 'TAVILY' | 'BRAVE' | 'GOOGLE_CUSTOM' | 'BING';
/**
 * Search query options
 */
export interface SearchQuery {
    readonly correlationId: CorrelationId;
    readonly provider: SearchProvider;
    readonly query: string;
    readonly numResults: number;
    readonly searchType: 'WEB' | 'NEWS' | 'ACADEMIC' | 'CODE';
    readonly dateRange?: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly domains?: string[];
    readonly excludeDomains?: string[];
    readonly language?: string;
    readonly country?: string;
}
/**
 * Search result item
 */
export interface SearchResult {
    readonly title: string;
    readonly url: string;
    readonly snippet: string;
    readonly content?: string;
    readonly publishedDate?: Date;
    readonly author?: string;
    readonly score: number;
}
/**
 * Search response
 */
export interface SearchResponse {
    readonly correlationId: CorrelationId;
    readonly provider: SearchProvider;
    readonly query: string;
    readonly results: SearchResult[];
    readonly totalResults: number;
    readonly executionTime: number;
    readonly cost: Cost;
}
/**
 * Research Gateway Interface
 * Responsibility: Abstract all research/search provider communications
 */
export interface IResearchGateway {
    search(query: SearchQuery): AsyncResult<SearchResponse>;
    extractContent(url: string, correlationId: CorrelationId): AsyncResult<string>;
    convertEvidence(evidence: Evidence[], researchType: ResearchType): AsyncResult<Evidence[]>;
}
/**
 * Storage provider types
 */
export type StorageProvider = 'POSTGRESQL' | 'SUPABASE' | 'MONGODB' | 'REDIS' | 'S3' | 'GCS' | 'LOCAL_FS';
/**
 * Storage operation types
 */
export type StorageOperation = 'READ' | 'WRITE' | 'DELETE' | 'LIST' | 'UPDATE';
/**
 * Storage query
 */
export interface StorageQuery<T = unknown> {
    readonly correlationId: CorrelationId;
    readonly provider: StorageProvider;
    readonly operation: StorageOperation;
    readonly collection: string;
    readonly key?: string;
    readonly data?: T;
    readonly filters?: Record<string, unknown>;
    readonly options?: StorageOptions;
}
export interface StorageOptions {
    readonly ttl?: number;
    readonly encryption?: boolean;
    readonly compression?: boolean;
    readonly consistency?: 'EVENTUAL' | 'STRONG';
}
/**
 * Storage response
 */
export interface StorageResponse<T = unknown> {
    readonly correlationId: CorrelationId;
    readonly provider: StorageProvider;
    readonly operation: StorageOperation;
    readonly data?: T;
    readonly affectedRows?: number;
    readonly executionTime: number;
    readonly cost: Cost;
}
/**
 * Storage Gateway Interface
 * Responsibility: Abstract all storage provider communications
 */
export interface IStorageGateway {
    execute<T>(query: StorageQuery<T>): AsyncResult<StorageResponse<T>>;
    connect(provider: StorageProvider): AsyncResult<void>;
    disconnect(provider: StorageProvider): AsyncResult<void>;
    healthCheck(provider: StorageProvider): AsyncResult<boolean>;
}
/**
 * Queue provider types
 */
export type QueueProvider = 'REDIS' | 'RABBITMQ' | 'SQS' | 'KAFKA' | 'LOCAL_MEMORY';
/**
 * Queue message
 */
export interface QueueMessage<T = unknown> {
    readonly id: string;
    readonly correlationId: CorrelationId;
    readonly type: string;
    readonly payload: T;
    readonly priority: number;
    readonly delay?: number;
    readonly maxRetries: number;
    readonly createdAt: Date;
}
/**
 * Queue operation types
 */
export type QueueOperation = 'ENQUEUE' | 'DEQUEUE' | 'PEEK' | 'ACKNOWLEDGE' | 'REJECT' | 'RETRY';
/**
 * Queue query
 */
export interface QueueQuery<T = unknown> {
    readonly correlationId: CorrelationId;
    readonly provider: QueueProvider;
    readonly operation: QueueOperation;
    readonly queueName: string;
    readonly message?: QueueMessage<T>;
    readonly visibilityTimeout?: number;
}
/**
 * Queue response
 */
export interface QueueResponse<T = unknown> {
    readonly correlationId: CorrelationId;
    readonly provider: QueueProvider;
    readonly operation: QueueOperation;
    readonly message?: QueueMessage<T>;
    readonly queueLength?: number;
    readonly executionTime: number;
}
/**
 * Queue Gateway Interface
 * Responsibility: Abstract all queue provider communications
 */
export interface IQueueGateway {
    execute<T>(query: QueueQuery<T>): AsyncResult<QueueResponse<T>>;
    subscribe<T>(queueName: string, handler: (message: QueueMessage<T>) => Promise<void>): AsyncResult<void>;
    unsubscribe(queueName: string): AsyncResult<void>;
    getQueueLength(queueName: string): AsyncResult<number>;
    purge(queueName: string): AsyncResult<void>;
}
/**
 * Export provider types
 */
export type ExportProvider = 'LOCAL_FS' | 'S3' | 'GITHUB' | 'GIST' | 'ZIP';
/**
 * Export file
 */
export interface ExportFile {
    readonly filename: string;
    readonly content: string | Buffer;
    readonly contentType: string;
    readonly encoding: 'UTF8' | 'BASE64' | 'BINARY';
}
/**
 * Export query
 */
export interface ExportQuery {
    readonly correlationId: CorrelationId;
    readonly provider: ExportProvider;
    readonly files: ExportFile[];
    readonly destination: string;
    readonly options?: ExportOptions;
}
export interface ExportOptions {
    readonly overwrite?: boolean;
    readonly createDirectory?: boolean;
    readonly compress?: boolean;
    readonly encryption?: boolean;
    readonly publicAccess?: boolean;
}
/**
 * Export response
 */
export interface ExportResponse {
    readonly correlationId: CorrelationId;
    readonly provider: ExportProvider;
    readonly success: boolean;
    readonly paths: string[];
    readonly size: number;
    readonly executionTime: number;
    readonly cost: Cost;
    readonly error?: string;
}
/**
 * Export Gateway Interface
 * Responsibility: Abstract all export provider communications
 */
export interface IExportGateway {
    export(query: ExportQuery): AsyncResult<ExportResponse>;
    download(source: string, correlationId: CorrelationId): AsyncResult<Buffer>;
    delete(path: string, correlationId: CorrelationId): AsyncResult<void>;
    list(directory: string): AsyncResult<string[]>;
}
/**
 * Gateway registry for dependency injection
 */
export interface IGatewayRegistry {
    getAIGateway(): IAIGateway;
    getResearchGateway(): IResearchGateway;
    getStorageGateway(): IStorageGateway;
    getQueueGateway(): IQueueGateway;
    getExportGateway(): IExportGateway;
}
/**
 * Gateway metrics for observability
 */
export interface GatewayMetrics {
    readonly gatewayType: string;
    readonly provider: string;
    readonly requestCount: number;
    readonly successCount: number;
    readonly failureCount: number;
    readonly avgLatency: number;
    readonly p95Latency: number;
    readonly p99Latency: number;
    readonly totalCost: number;
    readonly rateLimitHits: number;
    readonly circuitBreakerTrips: number;
}
/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    readonly failureThreshold: number;
    readonly successThreshold: number;
    readonly timeout: number;
    readonly monitoringPeriod: number;
}
//# sourceMappingURL=gateway.interfaces.d.ts.map