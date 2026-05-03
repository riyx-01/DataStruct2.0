import React from 'react';
import { motion } from 'framer-motion';

const itemContainerStyle = {
  display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', padding: '40px'
};

const circleStyle = (c1, c2, isFound) => ({
  width: '70px', height: '70px', borderRadius: '50%',
  background: isFound ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${c1}, ${c2})`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '20px', fontWeight: '800', color: 'white',
  boxShadow: isFound ? '0 0 20px #10b981' : '0 4px 10px rgba(0,0,0,0.1)',
  border: isFound ? '3px solid #34d399' : 'none'
});

export const DynamicArrayVisualizer = ({ data, searchIndex, isSearching, foundIndex }) => {
  const capacity = Math.max(8, Math.pow(2, Math.ceil(Math.log2(data.length || 1))));
  const blankSlots = Array.from({ length: capacity - data.length });
  
  return (
    <div style={itemContainerStyle}>
      {data.map((item, idx) => {
        const isFound = foundIndex === idx;
        const isChecking = isSearching && searchIndex === idx && foundIndex === null;
        return (
          <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
            width: '80px', height: '80px', background: isFound ? '#10b981' : isChecking ? '#f59e0b' : '#3b82f6',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '24px', fontWeight: 'bold'
          }}>{item}</motion.div>
        );
      })}
      {blankSlots.map((_, idx) => (
        <div key={`blank-${idx}`} style={{
          width: '80px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px'
        }}>Empty</div>
      ))}
      <div style={{width: '100%', textAlign: 'center', color: '#64748b'}}>Capacity: {capacity} (Auto-Doubles)</div>
    </div>
  );
};

export const CircularQueueVisualizer = ({ data, foundIndex }) => {
  const radius = 120;
  const total = Math.max(8, data.length);
  return (
    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '40px auto' }}>
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        const x = 150 + radius * Math.cos(angle) - 35;
        const y = 150 + radius * Math.sin(angle) - 35;
        const val = data[i] !== undefined ? data[i] : null;
        const isFound = foundIndex === i;
        return (
          <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} style={{
            position: 'absolute', left: x, top: y, ...circleStyle(val ? '#8b5cf6' : '#e2e8f0', val ? '#7c3aed' : '#cbd5e1', isFound),
            color: val ? '#fff' : 'transparent'
          }}>
            {val || '-'}
          </motion.div>
        );
      })}
      <div style={{ position: 'absolute', top: '130px', left: '110px', color: '#8b5cf6', fontWeight: 'bold' }}>Front/Rear</div>
    </div>
  );
};

export const DoublyLinkedListVisualizer = ({ data, foundIndex, circular }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px', padding: '40px' }}>
      {data.map((item, idx) => (
        <React.Fragment key={idx}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{
            width: '100px', height: '60px', background: foundIndex === idx ? '#10b981' : '#ec4899',
            borderRadius: '8px', display: 'flex', color: '#fff', border: '2px solid #db2777', overflow: 'hidden'
          }}>
            <div style={{flex: 1, borderRight: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}>P</div>
            <div style={{flex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{item}</div>
            <div style={{flex: 1, borderLeft: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}>N</div>
          </motion.div>
          {idx < data.length - 1 && <div style={{ color: '#db2777', fontWeight: 'bold', fontSize: '24px' }}>⇄</div>}
        </React.Fragment>
      ))}
      {circular && data.length > 0 && <div style={{width: '100%', height: '40px', borderBottom: '3px dashed #db2777', borderLeft: '3px dashed #db2777', borderRight: '3px dashed #db2777', marginTop: '10px', borderRadius: '0 0 10px 10px'}} />}
    </div>
  );
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
        <div key={lIndex} style={{ display: 'flex', gap: lIndex === 0 ? '0' : lIndex === 1 ? '60px' : '30px' }}>
          {level.map(item => {
            const isRed = type === 'redblack' ? (Math.random() > 0.5) : false;
            let c1 = '#3b82f6', c2 = '#2563eb';
            if (type === 'redblack') { c1 = isRed ? '#ef4444' : '#1e293b'; c2 = isRed ? '#dc2626' : '#0f172a'; }
            if (type === 'avl') { c1 = '#8b5cf6'; c2 = '#7c3aed'; }
            if (type === 'minheap') { c1 = '#14b8a6'; c2 = '#0d9488'; }
            return (
              <motion.div key={item.index} style={{position: 'relative'}}>
                 <div style={circleStyle(c1, c2, foundIndex === item.index)}>{item.value}</div>
                 {type === 'avl' && <div style={{position: 'absolute', top: -10, right: -10, background: '#fff', color: '#8b5cf6', borderRadius: '50%', width:'20px', height:'20px', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #8b5cf6'}}>0</div>}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const TrieVisualizer = ({ data, foundIndex }) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap:'20px', padding: '40px'}}>
       <div style={circleStyle('#94a3b8', '#64748b', false)}>ROOT</div>
       <div style={{borderLeft: '2px solid #ccc', height: '20px'}}></div>
       <div style={{display: 'flex', gap: '20px'}}>
         {data.map((item, idx) => (
            <motion.div key={idx} initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} style={circleStyle('#f43f5e', '#e11d48', foundIndex === idx)}>'{item.toString()[0] || 'x'}'</motion.div>
         ))}
       </div>
    </div>
  );
};

export const GraphMatrixVisualizer = ({ data }) => {
  const N = Math.min(6, Math.max(3, data.length));
  return (
    <div style={{padding: '40px'}}>
      <table style={{ borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <tbody>
          <tr><td style={{padding:'15px', background:'#f8fafc', fontWeight:'bold'}}>V</td>{Array.from({length:N}).map((_,i) => <td key={i} style={{padding:'15px', background:'#f8fafc', fontWeight:'bold'}}>{i}</td>)}</tr>
          {Array.from({length:N}).map((_,row) => (
             <tr key={row}>
                <td style={{padding:'15px', background:'#f8fafc', borderTop: '1px solid #e2e8f0', fontWeight:'bold'}}>{row}</td>
                {Array.from({length:N}).map((_,col) => {
                  const edge = row !== col && Math.random() > 0.6 ? 1 : 0;
                  return <td key={col} style={{padding:'15px', border: '1px solid #e2e8f0', textAlign: 'center', color: edge? '#10b981' : '#cbd5e1', fontWeight: edge? 'bold' : 'normal'}}>{edge}</td>
                })}
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const BloomFilterVisualizer = ({ data }) => {
  // Hash map deterministic bits
  const bits = Array(16).fill(0);
  data.forEach(val => {
     let v = parseInt(val) || 0;
     bits[(v * 3) % 16] = 1;
     bits[(v * 7) % 16] = 1;
     bits[(v * 11) % 16] = 1;
  });
  return (
    <div style={{padding: '40px'}}>
      <div style={{display:'flex', gap:'4px'}}>
         {bits.map((b, i) => (
            <motion.div key={i} style={{
              width: '30px', height: '40px', background: b ? '#10b981' : '#e2e8f0', color: b ? '#fff' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '4px'
            }}>{b}</motion.div>
         ))}
      </div>
    </div>
  );
};

export const DisjointSetVisualizer = ({ data }) => {
  const half = Math.floor(data.length / 2);
  const set1 = data.slice(0, half);
  const set2 = data.slice(half);
  return (
    <div style={{display: 'flex', gap: '60px', padding: '40px'}}>
      {[set1, set2].map((set, sid) => (
         <div key={sid} style={{background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center'}}>
           <div style={{fontWeight: 'bold', color: '#64748b', marginBottom: '15px'}}>Set {sid + 1} (Rep: {set[0]||'None'})</div>
           <div style={{display: 'flex', gap: '10px'}}>
             {set.map((val, i) => <div key={i} style={circleStyle('#f59e0b', '#d97706', false)}>{val}</div>)}
           </div>
         </div>
      ))}
    </div>
  );
};
