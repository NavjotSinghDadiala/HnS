import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/apiInstance';

const NODE_COLORS = {
  property: '#2563eb',
  builder: '#16a34a',
  location: '#f59e0b',
  amenity: '#7c3aed',
  project: '#6b7280',
};

const HIGH_SCORE_THRESHOLD = 0.7;

const AdminGraph = () => {
  const graphRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedBuilder, setSelectedBuilder] = useState('all');
  const [highScoreOnly, setHighScoreOnly] = useState(false);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/admin/graph');
        const payload = response.data || {};
        const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
        const links = Array.isArray(payload.edges)
          ? payload.edges.map((edge) => ({
              source: edge.source,
              target: edge.target,
              type: edge.type,
            }))
          : [];
        setGraphData({ nodes, edges: links });
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load graph data.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);

  const cities = useMemo(() => {
    const set = new Set();
    graphData.nodes.forEach((node) => {
      if (node.type === 'property' && node.city) {
        set.add(node.city);
      }
    });
    return ['all', ...Array.from(set).sort()];
  }, [graphData.nodes]);

  const builders = useMemo(() => {
    const set = new Set();
    graphData.nodes.forEach((node) => {
      if (node.type === 'property' && node.builder_label) {
        set.add(node.builder_label);
      }
    });
    return ['all', ...Array.from(set).sort()];
  }, [graphData.nodes]);

  const filteredGraph = useMemo(() => {
    const propertyNodes = graphData.nodes.filter((node) => node.type === 'property');
    const allowedProperties = new Set(
      propertyNodes
        .filter((node) => {
          const cityOk = selectedCity === 'all' || node.city === selectedCity;
          const builderOk = selectedBuilder === 'all' || node.builder_label === selectedBuilder;
          const scoreOk = !highScoreOnly || Number(node.score || 0) >= HIGH_SCORE_THRESHOLD;
          return cityOk && builderOk && scoreOk;
        })
        .map((node) => node.id)
    );

    const keptLinks = graphData.edges.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return allowedProperties.has(sourceId) || allowedProperties.has(targetId);
    });

    const keepNodeIds = new Set(Array.from(allowedProperties));
    keptLinks.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      keepNodeIds.add(sourceId);
      keepNodeIds.add(targetId);
    });

    return {
      nodes: graphData.nodes.filter((node) => keepNodeIds.has(node.id)),
      links: keptLinks,
    };
  }, [graphData, highScoreOnly, selectedBuilder, selectedCity]);

  const neighborMap = useMemo(() => {
    const map = new Map();
    filteredGraph.nodes.forEach((node) => map.set(node.id, new Set()));
    filteredGraph.links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());
      map.get(sourceId).add(targetId);
      map.get(targetId).add(sourceId);
    });
    return map;
  }, [filteredGraph]);

  const highlightedNodes = useMemo(() => {
    if (!hoverNodeId) return new Set();
    const set = new Set([hoverNodeId]);
    const neighbors = neighborMap.get(hoverNodeId);
    if (neighbors) {
      neighbors.forEach((id) => set.add(id));
    }
    return set;
  }, [hoverNodeId, neighborMap]);

  const highlightedLinks = useMemo(() => {
    if (!hoverNodeId) return new Set();
    const set = new Set();
    filteredGraph.links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === hoverNodeId || targetId === hoverNodeId) {
        set.add(link);
      }
    });
    return set;
  }, [filteredGraph.links, hoverNodeId]);

  const topFive = useMemo(() => {
    return graphData.nodes
      .filter((node) => node.type === 'property')
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 5);
  }, [graphData.nodes]);

  const nodeLabel = (node) => {
    const scorePart = node.type === 'property' ? `<br/>Score: ${Number(node.score || 0).toFixed(2)}` : '';
    return `${node.label}<br/>Type: ${node.type}${scorePart}`;
  };

  const edgeLabel = (type) => {
    if (type === 'built_by') return 'built by';
    if (type === 'located_in') return 'located in';
    if (type === 'has_amenity') return 'has amenity';
    if (type === 'has_project') return 'has project';
    return type || '';
  };

  const getNodeRadius = (node) => {
    if (node.type === 'property') {
      const score = Number(node.score || 0);
      return 6 + score * 14 + (node.is_top ? 3 : 0);
    }
    return 5;
  };

  const drawNode = (node, ctx, globalScale) => {
    const radius = getNodeRadius(node);
    const color = NODE_COLORS[node.type] || '#64748b';

    const isDimmed = hoverNodeId && !highlightedNodes.has(node.id);
    ctx.globalAlpha = isDimmed ? 0.2 : 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = node.type === 'property' ? 1.5 : 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    if (node.is_top) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();
    }

    const shouldShowLabel = showNodeLabels && (
      hoverNodeId === node.id ||
      selectedNode?.id === node.id ||
      node.is_top ||
      globalScale >= 1.5 ||
      node.type === 'property'
    );

    if (shouldShowLabel) {
      const fontSize = 12 / globalScale;
      ctx.font = `600 ${fontSize}px Sans-Serif`;
      const text = node.type === 'property'
        ? `${node.label} (${Number(node.score || 0).toFixed(2)})`
        : node.label;
      const textWidth = ctx.measureText(text).width;
      const labelX = node.x + radius + 4;
      const labelY = node.y + 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(labelX - 3, labelY - fontSize, textWidth + 6, fontSize + 6);
      ctx.fillStyle = '#111827';
      ctx.fillText(text, labelX, labelY + 1);
    }

    ctx.globalAlpha = 1;
  };

  const drawLink = (link, ctx, globalScale) => {
    const isHighlighted = highlightedLinks.has(link);
    if (!showEdgeLabels && !isHighlighted) return;

    const source = link.source;
    const target = link.target;
    if (!source || !target || typeof source !== 'object' || typeof target !== 'object') return;
    if (typeof source.x !== 'number' || typeof source.y !== 'number' || typeof target.x !== 'number' || typeof target.y !== 'number') return;

    const label = edgeLabel(link.type);
    if (!label) return;

    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const fontSize = 10 / globalScale;
    ctx.font = `500 ${fontSize}px Sans-Serif`;
    const width = ctx.measureText(label).width;
    ctx.fillStyle = isHighlighted ? 'rgba(17, 24, 39, 0.9)' : 'rgba(75, 85, 99, 0.75)';
    ctx.fillRect(midX - width / 2 - 2, midY - fontSize + 1, width + 4, fontSize + 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, midX - width / 2, midY + 1);
  };

  if (loading) {
    return <div style={{ padding: 24, fontWeight: 600 }}>Loading knowledge graph...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: '#b91c1c', fontWeight: 600 }}>{error}</div>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: 16,
      minHeight: '86vh',
      background: 'radial-gradient(circle at 20% 0%, #eef6ff 0%, #f8fafc 45%, #ffffff 100%)',
      padding: 12,
      borderRadius: 14,
    }}>
      <aside style={{ background: '#ffffff', border: '1px solid #dbe3ee', borderRadius: 12, padding: 16, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
        <h2 style={{ fontSize: 21, margin: '0 0 2px 0', color: '#0f172a' }}>Knowledge Graph Explorer</h2>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: 12 }}>Relationships across properties, builders, locations, amenities, and projects.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
            Nodes: {filteredGraph.nodes.length}
          </div>
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
            Edges: {filteredGraph.links.length}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Filter by city</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            {cities.map((city) => (
              <option key={city} value={city}>{city === 'all' ? 'All cities' : city}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Filter by builder</label>
          <select
            value={selectedBuilder}
            onChange={(e) => setSelectedBuilder(e.target.value)}
            style={{ width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            {builders.map((builder) => (
              <option key={builder} value={builder}>{builder === 'all' ? 'All builders' : builder}</option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={highScoreOnly}
            onChange={(e) => setHighScoreOnly(e.target.checked)}
          />
          Show only high-score properties
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={showNodeLabels}
            onChange={(e) => setShowNodeLabels(e.target.checked)}
          />
          Show node labels
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={showEdgeLabels}
            onChange={(e) => setShowEdgeLabels(e.target.checked)}
          />
          Show relation labels
        </label>

        <button
          type="button"
          onClick={() => graphRef.current?.zoomToFit(400)}
          style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
        >
          Reset and Fit View
        </button>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 14, margin: '0 0 8px 0' }}>Legend</h3>
          {[
            ['property', 'Property'],
            ['builder', 'Builder'],
            ['location', 'Location'],
            ['amenity', 'Amenity'],
            ['project', 'Project'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: NODE_COLORS[key] || '#64748b' }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 14, margin: '0 0 8px 0' }}>Top 5 Properties</h3>
          {topFive.map((node, idx) => (
            <div key={node.id} style={{ fontSize: 12, marginBottom: 6, color: '#1f2937' }}>
              {idx + 1}. {node.label} ({Number(node.score || 0).toFixed(2)})
            </div>
          ))}
          {topFive.length === 0 && <div style={{ fontSize: 12, color: '#6b7280' }}>No property scores available.</div>}
        </div>
      </aside>

      <section style={{ background: '#ffffff', border: '1px solid #dbe3ee', borderRadius: 12, position: 'relative', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: 'linear-gradient(90deg, #f8fafc 0%, #eef2ff 100%)' }}>
          Drag nodes to explore relationships. Scroll to zoom.
        </div>

        <div style={{ height: '74vh' }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraph}
            nodeLabel={nodeLabel}
            nodeCanvasObject={drawNode}
            linkCanvasObject={drawLink}
            linkCanvasObjectMode={() => 'after'}
            linkWidth={(link) => (highlightedLinks.has(link) ? 2 : 1)}
            linkColor={(link) => (highlightedLinks.has(link) ? '#111827' : '#9ca3af')}
            linkDirectionalParticles={(link) => (highlightedLinks.has(link) ? 3 : 0)}
            linkDirectionalParticleWidth={2}
            onNodeHover={(node) => setHoverNodeId(node ? node.id : null)}
            onNodeClick={(node) => setSelectedNode(node)}
          />
        </div>
      </section>
    </div>
  );
};

export default AdminGraph;
