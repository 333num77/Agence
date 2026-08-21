/**
 * Output Agent Implementation
 * Responsibility: Convert structured plans into exportable assets
 * Follows hexagonal architecture - depends only on interfaces
 */
import { IOutputAgent, OutputQuery, OutputResult } from '../interfaces/agent.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';
export declare class OutputAgent implements IOutputAgent {
    execute(query: OutputQuery): AsyncResult<OutputResult>;
    private exportArtifact;
    private exportRoadmap;
    private generateFilename;
    private generateHeader;
    private getContentType;
    private calculateFileChecksum;
    private calculateChecksum;
    private createZipPackage;
}
//# sourceMappingURL=output-agent.d.ts.map