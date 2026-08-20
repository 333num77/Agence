"use strict";
/**
 * Output Agent Implementation
 * Responsibility: Convert structured plans into exportable assets
 * Follows hexagonal architecture - depends only on interfaces
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputAgent = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class OutputAgent {
    async execute(query) {
        try {
            const startTime = Date.now();
            const outputs = [];
            // Determine export directory
            const exportDir = query.destination.path || `./exports/${query.projectId.value}`;
            // Create export directory if it doesn't exist
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }
            // Process each artifact from planning result
            for (const artifact of query.planningResult.artifacts) {
                const outputFile = await this.exportArtifact(artifact, exportDir, query.formats[0] || 'MARKDOWN');
                outputs.push(outputFile);
            }
            // Export roadmap as separate file
            const roadmapFile = await this.exportRoadmap(query.planningResult.roadmap, exportDir);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Unknown error in Output Agent')
            };
        }
    }
    async exportArtifact(artifact, exportDir, format) {
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
    async exportRoadmap(roadmap, exportDir) {
        const filename = 'roadmap.md';
        const filePath = path.join(exportDir, filename);
        let content = `# Project Roadmap\n\n`;
        content += `Generated: ${new Date().toISOString()}\n\n`;
        content += `## Overview\n\n`;
        content += `Total Phases: ${roadmap.phases.length}\n`;
        content += `Estimated Duration: ${roadmap.phases.reduce((sum, p) => sum + p.duration, 0)} days\n\n`;
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
    generateFilename(type, format) {
        const typeMap = {
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
        const formatMap = {
            'MARKDOWN': 'md',
            'JSON': 'json',
            'YAML': 'yaml',
            'MERMAID': 'mmd'
        };
        const baseName = typeMap[type] || type.toLowerCase();
        const extension = formatMap[format] || 'md';
        return `${baseName}.${extension}`;
    }
    generateHeader(artifact) {
        return `---
artifact: ${artifact.type}
version: ${artifact.version}
format: ${artifact.format}
generated: ${new Date().toISOString()}
---`;
    }
    getContentType(format) {
        const contentTypes = {
            'MARKDOWN': 'text/markdown',
            'JSON': 'application/json',
            'YAML': 'application/x-yaml',
            'MERMAID': 'text/plain'
        };
        return contentTypes[format] || 'text/plain';
    }
    calculateFileChecksum(content) {
        // Simple hash for demo purposes
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
    calculateChecksum(outputs) {
        const combined = outputs.map(o => o.checksum).join('');
        return this.calculateFileChecksum(combined);
    }
    async createZipPackage(outputs, exportDir) {
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
exports.OutputAgent = OutputAgent;
//# sourceMappingURL=output-agent.js.map