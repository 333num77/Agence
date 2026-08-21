/**
 * Output Agent Implementation
 * Responsibility: Convert structured plans into exportable assets
 * Follows hexagonal architecture - depends only on interfaces
 */

import { 
  IOutputAgent, 
  OutputQuery, 
  OutputResult, 
  OutputFile,
  OutputFormat
} from '../interfaces/agent.interfaces';
import { AsyncResult } from '../interfaces/core.interfaces';
import * as fs from 'fs';
import * as path from 'path';

export class OutputAgent implements IOutputAgent {
  
  async execute(query: OutputQuery): AsyncResult<OutputResult> {
    try {
      const startTime = Date.now();
      const outputs: OutputFile[] = [];
      
      // Determine export directory
      const exportDir = query.destination.path || `./exports/${query.projectId.value}`;
      
      // Create export directory if it doesn't exist
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Process each artifact from planning result
      for (const artifact of query.planningResult.artifacts) {
        const outputFile = await this.exportArtifact(
          artifact,
          exportDir,
          query.formats[0] || 'MARKDOWN'
        );
        outputs.push(outputFile);
      }

      // Export roadmap as separate file
      const roadmapFile = await this.exportRoadmap(
        query.planningResult.roadmap,
        exportDir
      );
      outputs.push(roadmapFile);

      // Create ZIP if requested
      let finalExportPath = exportDir;
      let finalFormat = query.formats[0] || 'MARKDOWN';

      if (query.formats.includes('ZIP')) {
        finalExportPath = await this.createZipPackage(outputs, exportDir);
        finalFormat = 'ZIP';
      }

      // Calculate checksum of all outputs
      const checksum = this.calculateChecksum(outputs);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          correlationId: query.correlationId,
          projectId: query.projectId,
          outputs,
          exportPath: finalExportPath,
          exportFormat: finalFormat,
          checksum
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error in Output Agent')
      };
    }
  }

  private async exportArtifact(
    artifact: any,
    exportDir: string,
    format: OutputFormat
  ): Promise<OutputFile> {
    const filename = this.generateFilename(artifact.type, artifact.format);
    const filePath = path.join(exportDir, filename);
    
    let content = artifact.content;
    
    // Add metadata header
    const header = this.generateHeader(artifact);
    content = header + '\n\n' + content;

    // Write file based on format
    fs.writeFileSync(filePath, content, 'utf-8');

    // Get file stats
    const stats = fs.statSync(filePath);

    return {
      filename,
      path: filePath,
      size: stats.size,
      contentType: this.getContentType(artifact.format),
      checksum: this.calculateFileChecksum(content)
    };
  }

  private async exportRoadmap(roadmap: any, exportDir: string): Promise<OutputFile> {
    const filename = 'roadmap.md';
    const filePath = path.join(exportDir, filename);
    
    let content = `# Project Roadmap\n\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;
    content += `## Overview\n\n`;
    content += `Total Phases: ${roadmap.phases.length}\n`;
    content += `Estimated Duration: ${roadmap.phases.reduce((sum: number, p: any) => sum + p.duration, 0)} days\n\n`;
    
    for (const phase of roadmap.phases) {
      content += `## Phase ${phase.number}: ${phase.name}\n\n`;
      content += `**Duration**: ${phase.duration} days\n\n`;
      content += `### Deliverables\n`;
      for (const deliverable of phase.deliverables) {
        content += `- ${deliverable}\n`;
      }
      content += `\n### Tasks\n`;
      for (const task of phase.tasks) {
        content += `- [ ] ${task.description} (${task.estimatedHours}h)\n`;
      }
      content += `\n`;
    }

    content += `## Dependencies\n\n`;
    for (const dep of roadmap.dependencies) {
      content += `- ${dep.from} → ${dep.to} (${dep.type})\n`;
    }

    content += `\n## Critical Path\n\n`;
    content += `${roadmap.criticalPath.join(' → ')}\n`;

    fs.writeFileSync(filePath, content, 'utf-8');
    const stats = fs.statSync(filePath);

    return {
      filename,
      path: filePath,
      size: stats.size,
      contentType: 'text/markdown',
      checksum: this.calculateFileChecksum(content)
    };
  }

  private generateFilename(type: string, format: string): string {
    const typeMap: Record<string, string> = {
      'PRD': 'product-requirements',
      'ARCHITECTURE': 'architecture-design',
      'DATABASE_SCHEMA': 'database-schema',
      'API_CONTRACTS': 'api-contracts',
      'ROADMAP': 'implementation-roadmap',
      'DEVELOPMENT_PHASES': 'development-phases',
      'AI_EXECUTION_PLAN': 'ai-execution-plan',
      'SECURITY_PLAN': 'security-plan',
      'TEST_STRATEGY': 'test-strategy'
    };

    const formatMap: Record<string, string> = {
      'MARKDOWN': 'md',
      'JSON': 'json',
      'YAML': 'yaml',
      'MERMAID': 'mmd'
    };

    const baseName = typeMap[type] || type.toLowerCase();
    const extension = formatMap[format] || 'md';

    return `${baseName}.${extension}`;
  }

  private generateHeader(artifact: any): string {
    return `---
artifact: ${artifact.type}
version: ${artifact.version}
format: ${artifact.format}
generated: ${new Date().toISOString()}
---`;
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      'MARKDOWN': 'text/markdown',
      'JSON': 'application/json',
      'YAML': 'application/x-yaml',
      'MERMAID': 'text/plain'
    };
    return contentTypes[format] || 'text/plain';
  }

  private calculateFileChecksum(content: string): string {
    // Simple hash for demo purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private calculateChecksum(outputs: OutputFile[]): string {
    const combined = outputs.map(o => o.checksum).join('');
    return this.calculateFileChecksum(combined);
  }

  private async createZipPackage(outputs: OutputFile[], exportDir: string): Promise<string> {
    const zipPath = path.join(exportDir, 'project-export.zip');
    
    // For now, we'll create a simple manifest since Node.js doesn't have built-in ZIP
    // In production, use a library like 'archiver' or 'jszip'
    const manifestPath = path.join(exportDir, 'MANIFEST.json');
    const manifest = {
      exportedAt: new Date().toISOString(),
      files: outputs.map(o => ({
        filename: o.filename,
        size: o.size,
        checksum: o.checksum
      })),
      totalFiles: outputs.length,
      totalSize: outputs.reduce((sum, o) => sum + o.size, 0)
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Return the directory path as the "package"
    // Real ZIP implementation would go here
    return exportDir;
  }
}
