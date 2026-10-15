import { UserKnowledgeGraph, GraphVersion } from './types';

// Simple mock checksum for demonstration
function generateChecksum(graph: any): string {
  return `sha256_${Math.random().toString(36).substring(2, 15)}`;
}

export interface KnowledgeGraphRepository {
  getGraph(userId: string): Promise<UserKnowledgeGraph | null>;
  saveGraph(graph: UserKnowledgeGraph): Promise<void>;
  rollback(userId: string, targetVersionId: string): Promise<UserKnowledgeGraph>;
}

/**
 * Creates a new version of the knowledge graph.
 * Ensures that every mutation is traceable, checksummed, and timestamped.
 */
export function createGraphVersion(
  currentGraph: UserKnowledgeGraph,
  reason: string,
  triggerEvent: string,
  modelsUsed: string[],
  affectedModules: string[],
  diffSummary: string
): UserKnowledgeGraph {
  const timestamp = new Date().toISOString();
  const previousVersionId = currentGraph.currentVersion?.versionId || 'v_init';
  
  // Clone to avoid in-place mutation
  const updatedGraph = JSON.parse(JSON.stringify(currentGraph));
  
  const newVersion: GraphVersion = {
    versionId: `v_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    timestamp,
    reason,
    triggerEvent,
    modelVersion: 'cartsync-intelligence-v3.0',
    graphChecksum: generateChecksum(updatedGraph),
    affectedModules,
    rollbackPointer: previousVersionId,
    diffSummary
  };

  updatedGraph.versionHistory = [newVersion, ...(updatedGraph.versionHistory || [])].slice(0, 100);
  updatedGraph.currentVersion = newVersion;

  return updatedGraph;
}

