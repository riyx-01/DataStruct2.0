import React from 'react';
import { motion } from 'framer-motion';

const QueueVisualizer = ({ data, searchIndex, isSearching, foundIndex }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '100%',
      padding: '24px',
      gap: '18px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        maxWidth: '620px',
        minWidth: 0,
        padding: '26px 14px',
        borderRadius: '18px',
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.18)',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {data.map((item, index) => {
          const isChecking = isSearching && searchIndex === index && foundIndex === null;
          const isFound = foundIndex === index;
          const wasChecked = isSearching && searchIndex !== null && index < searchIndex;
          const isFront = index === 0;
          const isRear = index === data.length - 1;
          
          return (
            <React.Fragment key={`queue-slot-${index}`}>
              <motion.div
                key={`queue-${index}`}
                initial={{ scale: 0, opacity: 0, y: 12 }}
                animate={{ 
                  scale: isFound ? 1.1 : isChecking ? 1.06 : 1, 
                  opacity: 1,
                  y: 0
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.08
                }}
                style={{
                  width: 'clamp(56px, 7vw, 78px)',
                  aspectRatio: '1 / 1',
                  flex: '0 1 78px',
                  minWidth: '48px',
                  borderRadius: '14px',
                  background: isFound
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isChecking
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : wasChecked
                    ? 'linear-gradient(135deg, #4b5563, #374151)'
                    : isRear
                    ? 'linear-gradient(135deg, #34d399, #059669)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  fontSize: 'clamp(20px, 2.4vw, 28px)',
                  fontWeight: '900',
                  color: 'white',
                  boxShadow: isFound
                    ? '0 0 28px rgba(16, 185, 129, 0.6)'
                    : isChecking
                    ? '0 0 24px rgba(245, 158, 11, 0.5)'
                    : isRear
                    ? '0 0 24px rgba(52, 211, 153, 0.38)'
                    : '0 10px 22px rgba(5, 150, 105, 0.28)',
                  border: isFound 
                    ? '3px solid #34d399'
                    : isChecking
                    ? '3px solid #fbbf24'
                    : '2px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {item}
                {(isFront || isRear) && (
                  <span style={{
                    position: 'absolute',
                    top: isFront ? '-22px' : 'auto',
                    bottom: isRear ? '-22px' : 'auto',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: isFront ? 'rgba(16, 185, 129, 0.95)' : 'rgba(52, 211, 153, 0.95)',
                    color: '#06281d',
                    fontSize: '11px',
                    fontWeight: '900',
                    letterSpacing: '0.7px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                    zIndex: 2
                  }}>
                    {isFront ? 'Front' : 'Rear'}
                  </span>
                )}
              </motion.div>
              {index < data.length - 1 && (
                <div style={{
                  flex: '0 0 18px',
                  color: '#6ee7b7',
                  fontSize: '22px',
                  fontWeight: '900',
                  lineHeight: 1,
                  textAlign: 'center',
                  textShadow: '0 0 12px rgba(16, 185, 129, 0.55)'
                }}>
                  {'>'}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#86efac'
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>Dequeue from Front</span>
        <div style={{ width: '44px', height: '2px', background: 'rgba(134, 239, 172, 0.75)' }} />
        <span style={{
          fontSize: '13px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>Enqueue at Rear</span>
      </div>
    </div>
  );
};

export default QueueVisualizer;
