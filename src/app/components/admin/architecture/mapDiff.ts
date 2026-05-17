export type ArchitectureMapLike = {
  generatedAt: string;
  clusters: Array<{ id: string; label: string; displayLabel?: string }>;
  nodes: Array<{ id: string; cluster: string; dead?: boolean }>;
  edges: Array<{ from: string; to: string; kind: string; label: string }>;
};

export type ClusterDiff = {
  id: string;
  label: string;
  before: number;
  after: number;
  delta: number;
};

export type ArchitectureMapDiff = {
  previousGeneratedAt: string;
  nextGeneratedAt: string;
  addedNodeIds: string[];
  removedNodeIds: string[];
  addedEdgeKeys: string[];
  removedEdgeKeys: string[];
  deadAddedIds: string[];
  deadRemovedIds: string[];
  clusterDiffs: ClusterDiff[];
};

const edgeKey = (edge: ArchitectureMapLike["edges"][number]) =>
  `${edge.from}->${edge.to}:${edge.kind}:${edge.label}`;

const getClusterLabel = (cluster: ArchitectureMapLike["clusters"][number] | undefined, clusterId: string) =>
  cluster?.displayLabel ?? cluster?.label ?? clusterId;

export function computeArchitectureMapDiff(
  previous: ArchitectureMapLike | null,
  next: ArchitectureMapLike,
): ArchitectureMapDiff | null {
  if (!previous) return null;

  const previousNodeIds = new Set(previous.nodes.map((node) => node.id));
  const nextNodeIds = new Set(next.nodes.map((node) => node.id));
  const previousEdgeKeys = new Set(previous.edges.map(edgeKey));
  const nextEdgeKeys = new Set(next.edges.map(edgeKey));
  const previousDeadIds = new Set(previous.nodes.filter((node) => node.dead).map((node) => node.id));
  const nextDeadIds = new Set(next.nodes.filter((node) => node.dead).map((node) => node.id));
  const previousClusters = new Map(previous.clusters.map((cluster) => [cluster.id, cluster]));
  const nextClusters = new Map(next.clusters.map((cluster) => [cluster.id, cluster]));
  const clusterIds = new Set([
    ...previous.nodes.map((node) => node.cluster),
    ...next.nodes.map((node) => node.cluster),
  ]);

  const countByCluster = (data: ArchitectureMapLike, clusterId: string) =>
    data.nodes.filter((node) => node.cluster === clusterId).length;

  return {
    previousGeneratedAt: previous.generatedAt,
    nextGeneratedAt: next.generatedAt,
    addedNodeIds: [...nextNodeIds].filter((id) => !previousNodeIds.has(id)).sort(),
    removedNodeIds: [...previousNodeIds].filter((id) => !nextNodeIds.has(id)).sort(),
    addedEdgeKeys: [...nextEdgeKeys].filter((key) => !previousEdgeKeys.has(key)).sort(),
    removedEdgeKeys: [...previousEdgeKeys].filter((key) => !nextEdgeKeys.has(key)).sort(),
    deadAddedIds: [...nextDeadIds].filter((id) => !previousDeadIds.has(id)).sort(),
    deadRemovedIds: [...previousDeadIds].filter((id) => !nextDeadIds.has(id)).sort(),
    clusterDiffs: [...clusterIds]
      .map((id) => {
        const before = countByCluster(previous, id);
        const after = countByCluster(next, id);
        return {
          id,
          label: getClusterLabel(nextClusters.get(id) ?? previousClusters.get(id), id),
          before,
          after,
          delta: after - before,
        };
      })
      .filter((cluster) => cluster.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  };
}
