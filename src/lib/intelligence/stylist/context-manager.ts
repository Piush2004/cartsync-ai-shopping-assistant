import { UserKnowledgeGraph } from '../learning/types';

export interface ContextPruningOptions {
  maxTimelineEvents?: number;
  maxMemoryNodes?: number;
  prioritizeRecency?: boolean;
}

/**
 * Ranks relevant graph nodes, summarizes long histories, manages token budgets, 
 * and prioritizes recent evidence before handing the graph to the context-builder.
 */
export function manageContext(
  graph: UserKnowledgeGraph,
  options: ContextPruningOptions = {}
): UserKnowledgeGraph {
  const maxEvents = options.maxTimelineEvents || 10;
  const maxMemory = options.maxMemoryNodes || 5;

  // Deep clone to prevent mutating the original active graph in memory
  const prunedGraph: UserKnowledgeGraph = JSON.parse(JSON.stringify(graph));

  // 1. Prune Timeline (Keep most recent)
  if (prunedGraph.timeline && prunedGraph.timeline.length > maxEvents) {
    prunedGraph.timeline = prunedGraph.timeline.slice(0, maxEvents);
  }

  // 2. Prune Memories (Prioritize recency and importance)
  const pruneMemoryArray = (memories: any[]) => {
    if (!memories) return [];
    return memories
      .sort((a, b) => b.importance - a.importance || new Date(b.recency).getTime() - new Date(a.recency).getTime())
      .slice(0, maxMemory);
  };

  if (prunedGraph.memory) {
    prunedGraph.memory.episodic = pruneMemoryArray(prunedGraph.memory.episodic);
    prunedGraph.memory.semantic = pruneMemoryArray(prunedGraph.memory.semantic);
    prunedGraph.memory.procedural = pruneMemoryArray(prunedGraph.memory.procedural);
    prunedGraph.memory.preference = pruneMemoryArray(prunedGraph.memory.preference);
    prunedGraph.memory.brand = pruneMemoryArray(prunedGraph.memory.brand);
    prunedGraph.memory.conversation = pruneMemoryArray(prunedGraph.memory.conversation);
  }

  // 3. (Future) Cache summaries of pruned data to maintain context without token bloat

  return prunedGraph;
}
