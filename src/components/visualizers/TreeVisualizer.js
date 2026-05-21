import React from 'react';
import { motion } from 'framer-motion';

const TreeVisualizer = ({ data, foundIndex }) => {
  // Build tree levels (assuming complete binary tree)
  const levels = [];
  let index = 0;
  let levelSize = 1;
  
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px',
      padding: '40px',
    }}>
      {levels.map((level, levelIndex) => (
        <div
          key={levelIndex}
          style={{
            display: 'flex',
            gap: levelIndex === 0 ? '0' : levelIndex === 1 ? '80px' : '40px',
            justifyContent: 'center',
          }}
        >
          {level.map((item, idx) => {
            const isFound = foundIndex === item.index;
            const isNull = item.value === null || item.value === undefined;
            const width = levelIndex === 0 ? '90px' : levelIndex === 1 ? '80px' : '70px';
            const height = levelIndex === 0 ? '90px' : levelIndex === 1 ? '80px' : '70px';

            if (isNull) {
              return (
                <div
                  key={`tree-null-${item.index}`}
                  style={{
                    width,
                    height,
                    visibility: 'hidden',
                  }}
                />
              );
            }
            
            return (
              <motion.div
                key={`tree-${item.index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isFound ? 1.2 : 1, 
                  opacity: 1 
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: item.index * 0.1
                }}
                style={{
                  width,
                  height,
                  borderRadius: '50%',
                  background: isFound
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : levelIndex === 0
                    ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                    : 'linear-gradient(135deg, #b45309, #92400e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: levelIndex === 0 ? '28px' : levelIndex === 1 ? '24px' : '20px',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: isFound
                    ? '0 0 30px rgba(16, 185, 129, 0.6)'
                    : levelIndex === 0
                    ? '0 0 30px rgba(251, 191, 36, 0.4)'
                    : '0 4px 15px rgba(180, 83, 9, 0.3)',
                  border: isFound 
                    ? '3px solid #34d399'
                    : '3px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                }}
              >
                {item.value}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TreeVisualizer;