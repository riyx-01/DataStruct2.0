import React from 'react';
import { motion } from 'framer-motion';

const GraphVisualizer = ({ data, foundIndex }) => {
  // Map data to a graph structure { nodes, edges }
  let graph = { nodes: [], edges: [] };
  if (data && typeof data === 'object' && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
    graph = data;
  } else if (Array.isArray(data)) {
    // Backwards compatibility with mock data array
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    graph.nodes = data.map((val, idx) => ({ id: idx, label: labels[idx] || `V${idx}` }));
    if (graph.nodes.length === 4) {
      graph.edges = [
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 0 },
        { from: 0, to: 2 }
      ];
    } else {
      for (let i = 0; i < graph.nodes.length; i++) {
        if (graph.nodes.length > 1) {
          graph.edges.push({ from: graph.nodes[i].id, to: graph.nodes[(i + 1) % graph.nodes.length].id });
        }
      }
    }
  }

  // Calculate dynamic circular positions
  const radius = 110;
  const centerX = 200;
  const centerY = 175;
  const total = graph.nodes.length;
  
  const positions = graph.nodes.map((node, index) => {
    const angle = (index / (total || 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      id: node.id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const getPositionById = (id) => {
    const pos = positions.find(p => p.id === id);
    return pos ? pos : { x: centerX, y: centerY };
  };

  return (
    <div style={{
      position: 'relative',
      width: '400px',
      height: '350px',
    }}>
      {/* Edges */}
      <svg style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}>
        {graph.edges.map((edge, idx) => {
          const fromPos = getPositionById(edge.from);
          const toPos = getPositionById(edge.to);
          
          return (
            <motion.line
              key={`edge-${idx}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              x1={fromPos.x} 
              y1={fromPos.y} 
              x2={toPos.x} 
              y2={toPos.y}
              stroke="#10b981"
              strokeWidth="3"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {graph.nodes.map((node, index) => {
        const pos = getPositionById(node.id);
        const isFound = foundIndex !== null && (
          foundIndex === index || 
          foundIndex === node.label ||
          (typeof foundIndex === 'object' && foundIndex.label === node.label)
        );
        
        return (
          <motion.div
            key={`node-${node.id}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isFound ? 1.25 : 1, 
              opacity: 1 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            style={{
              position: 'absolute',
              left: pos.x - 30,
              top: pos.y - 30,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', // Changed to purple for node representation
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isFound
                ? '0 0 30px rgba(16, 185, 129, 0.7)'
                : '0 4px 10px rgba(139, 92, 246, 0.3)',
              border: isFound 
                ? '3px solid #34d399'
                : '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              zIndex: 10,
              cursor: 'default',
            }}
          >
            {node.label}
          </motion.div>
        );
      })}
    </div>
  );
};

export default GraphVisualizer;