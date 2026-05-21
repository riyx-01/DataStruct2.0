import React from 'react';
import { motion } from 'framer-motion';

const HashTableVisualizer = ({ data, searchIndex, isSearching, foundIndex }) => {
  // data is a flat array of 10 slots, each null or a number
  const slots = Array.isArray(data) && data.length === 10
    ? data
    : Array.from({ length: 10 }, () => null);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '24px',
      width: '100%',
      maxHeight: '440px',
      overflowY: 'auto',
    }}>
      {slots.map((val, idx) => {
        const isBucketChecking = isSearching && searchIndex === idx;
        const isFound = foundIndex !== null && foundIndex === idx;

        return (
          <div key={`slot-${idx}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minHeight: '48px',
          }}>
            {/* Slot Index Label */}
            <div style={{
              width: '45px',
              height: '42px',
              borderRadius: '8px',
              background: isBucketChecking
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #1f2937, #111827)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '800',
              color: isBucketChecking ? 'white' : '#9ca3af',
              border: isBucketChecking ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isBucketChecking ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>
              {idx}
            </div>

            {/* Hash function hint */}
            <span style={{
              fontSize: '16px',
              color: '#4b5563',
              fontWeight: 'bold',
              flexShrink: 0,
            }}>→</span>

            {/* Slot Value */}
            {val !== null && val !== undefined ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isFound ? 1.1 : 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  padding: '6px 18px',
                  minWidth: '70px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isFound
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isBucketChecking
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: isFound
                    ? '0 0 15px rgba(16, 185, 129, 0.4)'
                    : '0 2px 5px rgba(0,0,0,0.2)',
                  border: isFound ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                }}
              >
                {val}
              </motion.div>
            ) : (
              <span style={{
                fontSize: '13px',
                color: '#4b5563',
                fontStyle: 'italic',
                marginLeft: '4px',
              }}>empty</span>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div style={{
        marginTop: '12px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.6',
      }}>
        <strong style={{ color: '#9ca3af' }}>Linear Probing:</strong>{' '}
        hash(key) = key % 10. On collision, probe (hash + 1) % 10, (hash + 2) % 10, …
      </div>
    </div>
  );
};

export default HashTableVisualizer;