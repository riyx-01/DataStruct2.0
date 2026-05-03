import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Shuffle, RotateCcw, Check, X, Book } from 'lucide-react';

// Import array of visualizers
import ArrayVisualizer from '../components/visualizers/ArrayVisualizer';
import StackVisualizer from '../components/visualizers/StackVisualizer';
import QueueVisualizer from '../components/visualizers/QueueVisualizer';
import LinkedListVisualizer from '../components/visualizers/LinkedListVisualizer';
import TreeVisualizer from '../components/visualizers/TreeVisualizer';
import GraphVisualizer from '../components/visualizers/GraphVisualizer';
import HashTableVisualizer from '../components/visualizers/HashTableVisualizer';
import HeapVisualizer from '../components/visualizers/HeapVisualizer';

import {
  DynamicArrayVisualizer, CircularQueueVisualizer,
  DoublyLinkedListVisualizer, ExtendedTreeVisualizer,
  TrieVisualizer, GraphMatrixVisualizer,
  BloomFilterVisualizer, DisjointSetVisualizer
} from '../components/visualizers/AdvancedVisualizers';

const structureInfo = {
  array: { title: 'Static Array', subtitle: 'Contiguous memory storage with O(1) access', maxSize: 10 },
  dynamic_array: { title: 'Dynamic Array', subtitle: 'Auto-resizing contiguous memory block', maxSize: 10 },
  stack: { title: 'Stack', subtitle: 'LIFO - Last In First Out principle', maxSize: 8 },
  queue: { title: 'Queue', subtitle: 'FIFO - First In First Out principle', maxSize: 8 },
  circular_queue: { title: 'Circular Queue', subtitle: 'Queue working as a circle', maxSize: 8 },
  linkedlist: { title: 'Singly Linked List', subtitle: 'Nodes connected by pointers', maxSize: 8 },
  doubly_linkedlist: { title: 'Doubly Linked List', subtitle: 'Nodes with next and prev pointers', maxSize: 8 },
  circular_linkedlist: { title: 'Circular Linked List', subtitle: 'Linked list connected back to root', maxSize: 8 },
  tree: { title: 'Binary Tree', subtitle: 'Hierarchical structure with parent-child relationships', maxSize: 7 },
  bst: { title: 'Binary Search Tree', subtitle: 'Left is smaller, right is larger', maxSize: 7 },
  avl: { title: 'AVL Tree', subtitle: 'Self balancing binary search tree', maxSize: 7 },
  redblack: { title: 'Red-Black Tree', subtitle: 'Self balancing via coloring rules', maxSize: 7 },
  trie: { title: 'Trie (Prefix Tree)', subtitle: 'Tree optimized for string search', maxSize: 7 },
  graph: { title: 'Graph (Adj List)', subtitle: 'Network of vertices connected by edges via lists', maxSize: 5 },
  graph_matrix: { title: 'Graph (Adj Matrix)', subtitle: 'Network of vertices connected by edges via matrices', maxSize: 4 },
  hashtable: { title: 'Hash Table', subtitle: 'Key-value pairs with O(1) average lookup', maxSize: 6 },
  bloom: { title: 'Bloom Filter', subtitle: 'Probabilistic set representation', maxSize: 8 },
  disjoint: { title: 'Disjoint Set (Union-Find)', subtitle: 'Tracks partitioned elements', maxSize: 8 },
  heap: { title: 'Max Heap', subtitle: 'Complete binary tree keeping max element at root', maxSize: 7 },
  minheap: { title: 'Min Heap', subtitle: 'Complete binary tree keeping min element at root', maxSize: 7 },
};

const VisualizerPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [searchIndex, setSearchIndex] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [foundIndex, setFoundIndex] = useState(null);
  
  const info = structureInfo[type] || { title: type, subtitle: '', maxSize: 10 };

  // Initialize data based on structure type
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('userStats')) || { visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [] };
    stats.visualizations += 1;
    localStorage.setItem('userStats', JSON.stringify(stats));

    switch(type) {
      case 'array':
        setData([10, 25, 15, 30, 45, 20]);
        break;
      case 'dynamic_array':
        setData([5, 10, 15]);
        break;
      case 'stack':
        setData([5, 10, 15, 20]);
        break;
      case 'queue':
      case 'circular_queue':
        setData([3, 6, 9, 12]);
        break;
      case 'linkedlist':
      case 'doubly_linkedlist':
      case 'circular_linkedlist':
        setData([7, 14, 21, 28]);
        break;
      case 'tree':
      case 'bst':
      case 'avl':
      case 'redblack':
        setData([50, 30, 70, 20, 40, 60, 80]);
        break;
      case 'minheap':
        setData([10, 20, 30, 40, 50, 60, 70]);
        break;
      case 'graph':
      case 'graph_matrix':
        setData([1, 2, 3, 4]);
        break;
      case 'hashtable':
        setData([{ key: 0, value: 10 }, { key: 3, value: 23 }, { key: 5, value: 45 }, { key: 7, value: 67 }]);
        break;
      case 'bloom':
      case 'disjoint':
      case 'trie':
      case 'heap':
        setData([90, 70, 80, 50, 60, 40, 30]);
        break;
      default:
        setData([10, 20, 30]);
    }
    // Reset search state when type changes
    setSearchIndex(null);
    setFoundIndex(null);
    setIsSearching(false);
  }, [type]);

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInsert = () => {
    if (!inputValue) {
      showNotification('Please enter a value', true);
      return;
    }
    
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      showNotification('Please enter a valid number', true);
      return;
    }
    
    if (data.length >= info.maxSize) {
      showNotification(`Maximum ${info.maxSize} elements allowed for ${type}`, true);
      return;
    }
    
    // Clear any previous search
    setSearchIndex(null);
    setFoundIndex(null);
    
    if (type === 'hashtable') {
      // Find next available key (0-9)
      const existingKeys = data.map(d => d.key);
      let newKey = 0;
      while (existingKeys.includes(newKey) && newKey < 10) newKey++;
      
      if (newKey >= 10) {
        showNotification('Hash table full', true);
        return;
      }
      
      setData(prev => [...prev, { key: newKey, value: val }]);
      showNotification(`Inserted ${val} at key ${newKey}`);
    } else {
      setData(prev => [...prev, val]);
      showNotification(`Inserted ${val}`);
    }
    setInputValue('');
  };

  const handleDelete = () => {
    if (data.length === 0) {
      showNotification('Nothing to delete', true);
      return;
    }
    
    setSearchIndex(null);
    setFoundIndex(null);
    
    setData(prev => {
      const newData = [...prev];
      const removed = newData.pop();
      const displayValue = typeof removed === 'object' ? removed.value : removed;
      showNotification(`Deleted ${displayValue}`);
      return newData;
    });
  };

  const handleSearch = async () => {
    if (!inputValue) {
      showNotification('Enter a value to search', true);
      return;
    }
    
    const searchVal = parseInt(inputValue);
    if (isNaN(searchVal)) {
      showNotification('Enter a valid number', true);
      return;
    }
    
    setIsSearching(true);
    setSearchIndex(null);
    setFoundIndex(null);
    
    // Linear search with animation for array, linkedlist, stack, queue
    if (['array', 'linkedlist', 'stack', 'queue'].includes(type)) {
      for (let i = 0; i < data.length; i++) {
        setSearchIndex(i);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const currentVal = typeof data[i] === 'object' ? data[i].value : data[i];
        if (currentVal === searchVal) {
          setFoundIndex(i);
          showNotification(`Found ${searchVal} at index ${i}`);
          setIsSearching(false);
          return;
        }
      }
      showNotification(`${searchVal} not found`, true);
      setSearchIndex(null);
    } 
    // Hash table search
    else if (type === 'hashtable') {
      for (let i = 0; i < data.length; i++) {
        setSearchIndex(i);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (data[i].value === searchVal) {
          setFoundIndex(i);
          showNotification(`Found ${searchVal} at key ${data[i].key}`);
          setIsSearching(false);
          return;
        }
      }
      showNotification(`${searchVal} not found`, true);
      setSearchIndex(null);
    }
    // Tree, Heap, Graph - instant check (no animation needed for these visualizations)
    else {
      const index = data.findIndex(item => {
        const val = typeof item === 'object' ? item.value : item;
        return val === searchVal;
      });
      
      if (index !== -1) {
        setFoundIndex(index);
        showNotification(`${searchVal} found in ${type}`);
      } else {
        showNotification(`${searchVal} not found in ${type}`, true);
      }
    }
    
    setIsSearching(false);
  };

  const handleShuffle = () => {
    if (['stack', 'queue', 'hashtable', 'tree', 'heap', 'graph'].includes(type)) {
      showNotification('Shuffle not available for this structure', true);
      return;
    }
    
    setSearchIndex(null);
    setFoundIndex(null);
    
    setData(prev => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5);
      showNotification('Array shuffled');
      return shuffled;
    });
  };

  const handleReset = () => {
    setInputValue('');
    setSearchIndex(null);
    setFoundIndex(null);
    setIsSearching(false);
    window.location.reload();
  };

  const renderVisualizer = () => {
    const commonProps = { 
      data, 
      searchIndex,
      isSearching,
      foundIndex
    };
    
    switch(type) {
      case 'array': return <ArrayVisualizer {...commonProps} />;
      case 'dynamic_array': return <DynamicArrayVisualizer {...commonProps} />;
      case 'stack': return <StackVisualizer {...commonProps} />;
      case 'queue': return <QueueVisualizer {...commonProps} />;
      case 'circular_queue': return <CircularQueueVisualizer {...commonProps} />;
      case 'linkedlist': return <LinkedListVisualizer {...commonProps} />;
      case 'doubly_linkedlist': return <DoublyLinkedListVisualizer {...commonProps} circular={false} />;
      case 'circular_linkedlist': return <DoublyLinkedListVisualizer {...commonProps} circular={true} />;
      case 'tree': return <TreeVisualizer {...commonProps} />;
      case 'bst': return <TreeVisualizer {...commonProps} />;
      case 'redblack': return <ExtendedTreeVisualizer {...commonProps} type="redblack" />;
      case 'graph': return <GraphVisualizer {...commonProps} />;
      case 'graph_matrix': return <GraphMatrixVisualizer {...commonProps} />;
      case 'hashtable': return <HashTableVisualizer {...commonProps} />;
      case 'heap': return <HeapVisualizer {...commonProps} />;
      case 'minheap': return <ExtendedTreeVisualizer {...commonProps} type="minheap" />;
      default: return (
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <Book size={48} style={{ marginBottom: '16px', opacity: 0.5, margin: '0 auto' }} />
          <h2>Visualization Coming Soon</h2>
          <p>We are actively building the interactive visualizer for {type}.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ 
      padding: '40px 24px',
      minHeight: '100vh',
      marginLeft: '260px',
      width: 'calc(100% - 260px)',
      boxSizing: 'border-box'
    }}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            style={{
              position: 'fixed',
              top: '100px',
              right: '24px',
              zIndex: 1000,
              padding: '16px 24px',
              borderRadius: '12px',
              background: notification.isError 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '600',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            {notification.isError ? <X size={20} /> : <Check size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}
      >
        <div>
          <h1 style={{
            fontSize: '56px',
            fontWeight: '900',
            marginBottom: '8px',
            color: '#f3f4f6',
            letterSpacing: '-1px',
          }}>
            {info.title}
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#9ca3af',
            fontWeight: '500',
          }}>
            {info.subtitle}
          </p>
        </div>

        <button 
          onClick={() => navigate(`/reader/${type}`)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderTop: '1px solid #34d399',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
          className="skeuo-theory-btn"
        >
          <Book size={20} />
          Study Theory (Interactive Book)
        </button>
      </motion.div>

      {/* Main Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '32px',
        height: 'calc(100vh - 280px)',
      }}>
        {/* Visualization Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'rgba(17, 24, 39, 0.7)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
          }} />
          {renderVisualizer()}
        </motion.div>

        {/* Controls Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(17, 24, 39, 0.7)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            marginBottom: '8px',
            color: '#f3f4f6'
          }}>
            Controls
          </h3>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Input Value
            </label>
            <input
              type="number"
              placeholder="Enter number..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleInsert()}
              disabled={isSearching}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#f3f4f6',
                fontSize: '16px',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleInsert}
              disabled={isSearching}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(90deg, #10b981, #39ff14)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: isSearching ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Plus size={24} /> Insert
            </button>
            
            <button 
              onClick={handleDelete}
              disabled={isSearching}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: isSearching ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Trash2 size={20} /> Delete
            </button>
            
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: isSearching 
                  ? 'rgba(245, 158, 11, 0.3)' 
                  : 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
              }}
            >
              <Search size={20} /> 
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div style={{ 
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <button 
              onClick={handleShuffle}
              disabled={isSearching}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSearching ? 0.6 : 1,
              }}
            >
              <Shuffle size={18} /> Shuffle
            </button>
            
            <button 
              onClick={handleReset}
              disabled={isSearching}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSearching ? 0.6 : 1,
              }}
            >
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisualizerPage;