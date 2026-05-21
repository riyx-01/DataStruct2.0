import React from 'react';
import { motion } from 'framer-motion';
import { layoutTrie } from '../../utils/dataStructures';

const itemContainerStyle = {
  display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', padding: '40px'
};

const circleStyle = (c1, c2, isFound) => ({
  width: '70px', height: '70px', borderRadius: '50%',
  background: isFound ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${c1}, ${c2})`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '20px', fontWeight: '800', color: 'white',
  boxShadow: isFound ? '0 0 20px #10b981' : '0 4px 10px rgba(0,0,0,0.1)',
  border: isFound ? '3px solid #34d399' : 'none',
  position: 'relative'
});

export const DynamicArrayVisualizer = ({ data, searchIndex, isSearching, foundIndex }) => {
  const capacity = Math.max(8, Math.pow(2, Math.ceil(Math.log2(data.length || 1))));
  const blankSlots = Array.from({ length: capacity - data.length });
  
  return (
    <div style={itemContainerStyle}>
      {data.map((item, idx) => {
        const isFound = foundIndex !== null && (foundIndex === idx || foundIndex === item);
        const isChecking = isSearching && searchIndex === idx && foundIndex === null;
        return (
          <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
            width: '80px', height: '80px', 
            background: isFound 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : isChecking 
              ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '22px', fontWeight: 'bold',
            border: isFound ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isFound ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            {item}
            <span style={{ fontSize: '10px', opacity: 0.6 }}>[{idx}]</span>
          </motion.div>
        );
      })}
      {blankSlots.map((_, idx) => (
        <div key={`blank-${idx}`} style={{
          width: '80px', height: '80px', border: '2px dashed #4b5563', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '12px'
        }}>Empty</div>
      ))}
      <div style={{width: '100%', textAlign: 'center', color: '#9ca3af', fontWeight: '600', marginTop: '10px'}}>Capacity: {capacity} (Auto-Doubles)</div>
    </div>
  );
};

export const CircularQueueVisualizer = ({ data, foundIndex, front, rear }) => {
  const radius = 148;
  const total = 8;
  const size = 90;
  const center = 205;

  return (
    <div style={{ position: 'relative', width: '410px', height: '380px', margin: '10px auto' }}>
      <div style={{
        position: 'absolute',
        inset: '-20px',
        opacity: 0.35,
        backgroundImage: 'radial-gradient(circle, rgba(0, 153, 255, 0.5) 1.5px, transparent 1.5px)',
        backgroundSize: '12px 12px',
        maskImage: 'radial-gradient(circle at center, black 25%, transparent 82%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 25%, transparent 82%)',
      }} />
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - size / 2;
        const y = center - 15 + radius * Math.sin(angle) - size / 2;
        const val = data[i] !== undefined && data[i] !== null ? data[i] : null;
        const isFound = foundIndex !== null && (foundIndex === i || foundIndex === val);
        const isFront = front === i && val !== null;
        const isRear = rear === i && val !== null;
        const isActivePointer = isFront || isRear;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.05 }}
            style={{
              position: 'absolute', left: x, top: y,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : val !== null
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : 'linear-gradient(135deg, #e7edf6, #cfd8e5)',
              color: val !== null ? '#fff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '900',
              border: isFound
                ? '3px solid #34d399'
                : isActivePointer
                  ? '3px solid rgba(167, 139, 250, 0.65)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: val !== null
                ? '0 18px 34px rgba(17, 24, 39, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
                : '0 16px 30px rgba(17, 24, 39, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
              transition: 'border 0.3s ease, background 0.3s ease',
              zIndex: 1
            }}
          >
            {val !== null ? val : ''}
          </motion.div>
        );
      })}
      <div style={{ 
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8b5cf6',
        fontWeight: '900',
        fontSize: '22px',
        textAlign: 'center',
        zIndex: 0
      }}>
        Front/Rear
      </div>
    </div>
  );
};

export const DoublyLinkedListVisualizer = ({ data, foundIndex, circular }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', padding: '40px', maxWidth: '800px' }}>
      {data.map((item, idx) => {
        const isFound = foundIndex !== null && (foundIndex === idx || foundIndex === item);
        return (
          <React.Fragment key={idx}>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{
              width: '100px', height: '60px', 
              background: isFound 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #ec4899, #db2777)',
              borderRadius: '12px', display: 'flex', color: '#fff', 
              border: isFound ? '3px solid #34d399' : '2px solid rgba(255,255,255,0.1)', 
              boxShadow: isFound ? '0 0 15px rgba(16, 185, 129, 0.5)' : '0 4px 10px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              <div style={{flex: 1, borderRight: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.6)'}}>P</div>
              <div style={{flex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px'}}>
                {item}
                <span style={{ fontSize: '8px', opacity: 0.6 }}>[{idx}]</span>
              </div>
              <div style={{flex: 1, borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.6)'}}>N</div>
            </motion.div>
            {idx < data.length - 1 && <div style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '24px' }}>⇄</div>}
          </React.Fragment>
        );
      })}
      {circular && data.length > 0 && <div style={{width: '100%', height: '40px', borderBottom: '3px dashed #db2777', borderLeft: '3px dashed #db2777', borderRight: '3px dashed #db2777', marginTop: '10px', borderRadius: '0 0 10px 10px'}} />}
    </div>
  );
};

// Subtree heights and balance factor helpers for AVL nodes
const getSubtreeHeight = (arr, idx) => {
  if (idx >= arr.length || arr[idx] === null || arr[idx] === undefined) return 0;
  return 1 + Math.max(getSubtreeHeight(arr, 2 * idx + 1), getSubtreeHeight(arr, 2 * idx + 2));
};

const getBalanceFactor = (arr, idx) => {
  if (idx >= arr.length || arr[idx] === null || arr[idx] === undefined) return 0;
  return getSubtreeHeight(arr, 2 * idx + 1) - getSubtreeHeight(arr, 2 * idx + 2);
};

export const ExtendedTreeVisualizer = ({ data, foundIndex, type }) => {
  const levels = [];
  let index = 0, levelSize = 1;
  while (index < data.length) {
    const level = [];
    for (let i = 0; i < levelSize && index < data.length; i++) {
      level.push({ value: data[index], index });
      index++;
    }
    levels.push(level);
    levelSize *= 2;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', padding: '20px' }}>
      {levels.map((level, lIndex) => (
        <div key={lIndex} style={{ display: 'flex', gap: lIndex === 0 ? '0' : lIndex === 1 ? '100px' : '40px' }}>
          {level.map(item => {
            const isNull = item.value === null || item.value === undefined;
            const size = lIndex === 0 ? '80px' : lIndex === 1 ? '70px' : '60px';
            
            if (isNull) {
              return (
                <div key={`ext-null-${item.index}`} style={{ width: size, height: size, visibility: 'hidden' }} />
              );
            }

            const isFound = foundIndex !== null && (foundIndex === item.index || foundIndex === item.value);
            let c1 = '#3b82f6', c2 = '#2563eb';
            if (type === 'avl') { c1 = '#8b5cf6'; c2 = '#6d28d9'; }
            if (type === 'minheap') { c1 = '#14b8a6'; c2 = '#0d9488'; }
            
            const balFactor = type === 'avl' ? getBalanceFactor(data, item.index) : 0;
            
            return (
              <motion.div key={item.index} style={{position: 'relative'}}>
                 <div style={{
                   ...circleStyle(c1, c2, isFound),
                   width: size,
                   height: size,
                   border: isFound ? '3px solid #34d399' : '2px solid rgba(255,255,255,0.1)'
                 }}>{item.value}</div>
                 
                 {type === 'avl' && (
                   <div style={{
                     position: 'absolute', top: -6, right: -6, 
                     background: '#1f2937', color: Math.abs(balFactor) > 1 ? '#ef4444' : '#10b981', 
                     borderRadius: '50%', width:'20px', height:'20px', fontSize:'10px', 
                     display:'flex', alignItems:'center', justifyContent:'center', 
                     border: Math.abs(balFactor) > 1 ? '1px solid #ef4444' : '1px solid #10b981',
                     fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                   }}>
                     {balFactor}
                   </div>
                 )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const TrieVisualizer = ({ data, foundIndex }) => {
  const words = Array.isArray(data) ? data : [];
  const { nodes, edges } = layoutTrie(words);
  
  return (
    <div style={{ position: 'relative', width: '560px', height: '330px', overflow: 'auto', padding: '10px' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {edges.map((edge, idx) => (
          <motion.line
            key={`trie-edge-${idx}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="#f43f5e"
            strokeWidth="2.5"
          />
        ))}
      </svg>
      {nodes.map(node => {
        const isFound = foundIndex !== null && (
          foundIndex === node.label ||
          (typeof foundIndex === 'object' && foundIndex.id === node.id)
        );
        
        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: isFound ? 1.2 : 1 }}
            style={{
              position: 'absolute',
              left: node.x - 22,
              top: node.y - 22,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : node.isWordEnd
                ? 'linear-gradient(135deg, #f43f5e, #e11d48)' // Rose/Red for word ends
                : 'linear-gradient(135deg, #4b5563, #374151)', // Dark gray for branches
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isFound ? '0 0 15px rgba(16, 185, 129, 0.6)' : '0 4px 8px rgba(0,0,0,0.2)',
              border: node.isWordEnd ? '2px solid #fda4af' : '2px solid rgba(255,255,255,0.1)',
            }}
          >
            {node.label}
          </motion.div>
        );
      })}
    </div>
  );
};

export const BloomFilterVisualizer = ({ data, searchIndex, isSearching }) => {
  const bits = Array(16).fill(0);
  data.forEach(val => {
     let v = parseInt(val) || 0;
     bits[(v * 3) % 16] = 1;
     bits[(v * 7) % 16] = 1;
     bits[(v * 11) % 16] = 1;
  });

  const searchBits = [];
  if (isSearching && searchIndex !== null) {
     const v = parseInt(searchIndex) || 0;
     searchBits.push((v * 3) % 16);
     searchBits.push((v * 7) % 16);
     searchBits.push((v * 11) % 16);
  }

  return (
    <div style={{padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'}}>
      <div style={{display:'flex', gap:'8px', flexWrap: 'wrap', justifyContent: 'center'}}>
         {bits.map((b, i) => {
            const isHashed = searchBits.includes(i);
            return (
              <motion.div key={i} style={{
                width: '36px', height: '48px', 
                background: isHashed
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : b 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #374151, #1f2937)', 
                color: 'white',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', 
                fontWeight: 'bold', borderRadius: '8px',
                border: isHashed ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isHashed ? '0 0 12px rgba(245,158,11,0.5)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>{b}</span>
                <span style={{ fontSize: '9px', opacity: 0.5 }}>{i}</span>
              </motion.div>
            );
         })}
      </div>
      {isSearching && searchIndex !== null && (
        <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '600', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px' }}>
          Hashed indices for <span style={{ color: '#fbbf24' }}>{searchIndex}</span>: {searchBits.join(', ')}
        </div>
      )}
    </div>
  );
};

export const DisjointSetVisualizer = ({ data, searchIndex }) => {
  const parents = Array.isArray(data) ? data : Array.from({ length: 8 }, (_, i) => i);
  
  const nodePositions = [
    { x: 60, y: 60 },
    { x: 180, y: 60 },
    { x: 300, y: 60 },
    { x: 420, y: 60 },
    { x: 60, y: 200 },
    { x: 180, y: 200 },
    { x: 300, y: 200 },
    { x: 420, y: 200 },
  ];
  
  return (
    <div style={{ position: 'relative', width: '480px', height: '260px' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {parents.map((parent, childIdx) => {
          if (parent === childIdx || childIdx >= nodePositions.length || parent >= nodePositions.length) return null;
          const childPos = nodePositions[childIdx];
          const parentPos = nodePositions[parent];
          
          return (
            <g key={`ds-edge-${childIdx}`}>
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1={childPos.x}
                y1={childPos.y}
                x2={parentPos.x}
                y2={parentPos.y}
                stroke="#f59e0b"
                strokeWidth="2.5"
                markerEnd="url(#arrow)"
              />
            </g>
          );
        })}
      </svg>
      
      {parents.map((parent, idx) => {
        if (idx >= nodePositions.length) return null;
        const pos = nodePositions[idx];
        const isChecking = searchIndex !== null && searchIndex === idx;
        
        return (
          <motion.div
            key={`ds-node-${idx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              left: pos.x - 22,
              top: pos.y - 22,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isChecking
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : parent === idx
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #4b5563, #374151)', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isChecking 
                ? '0 0 15px rgba(245,158,11,0.6)' 
                : '0 4px 8px rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }}
          >
            {idx}
          </motion.div>
        );
      })}
    </div>
  );
};
