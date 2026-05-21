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
  TrieVisualizer,
  BloomFilterVisualizer, DisjointSetVisualizer
} from '../components/visualizers/AdvancedVisualizers';

// Import correct algorithms
import {
  insertBST, deleteBST,
  insertAVL, deleteAVL,
  insertHeap, extractHeapRoot,
  addGraphNode, deleteGraphNode, addGraphEdge, deleteGraphEdge,
  unionDisjointSet, findDisjointSet
} from '../utils/dataStructures';

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
  trie: { title: 'Trie (Prefix Tree)', subtitle: 'Tree optimized for string search', maxSize: 7 },
  graph: { title: 'Graph (Adj List)', subtitle: 'Network of vertices connected by edges via lists', maxSize: 5 },
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
  const [secondaryInputValue, setSecondaryInputValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [searchIndex, setSearchIndex] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [foundIndex, setFoundIndex] = useState(null);
  
  const [queueFront, setQueueFront] = useState(0);
  const [queueRear, setQueueRear] = useState(3);
  
  const info = structureInfo[type] || { title: type, subtitle: '', maxSize: 10 };

  // Initialize data based on structure type
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('userStats')) || { visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [] };
    const visited = stats.visualizersVisited || {};
    const currentVisit = visited[type] || { count: 0 };

    stats.visualizations = (Number(stats.visualizations) || 0) + 1;
    stats.visualizersVisited = {
      ...visited,
      [type]: {
        count: (Number(currentVisit.count) || 0) + 1,
        lastVisited: new Date().toISOString()
      }
    };
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
        setData([3, 6, 9, 12]);
        break;
      case 'circular_queue':
        setData([3, 6, 9, 12, null, null, null, null]);
        setQueueFront(0);
        setQueueRear(3);
        break;
      case 'linkedlist':
      case 'doubly_linkedlist':
      case 'circular_linkedlist':
        setData([7, 14, 21, 28]);
        break;
      case 'tree':
      case 'bst':
      case 'avl':
        setData([50, 30, 70, 20, 40, 60, 80]);
        break;
      case 'minheap':
        setData([10, 20, 30, 40, 50, 60, 70]);
        break;
      case 'graph':
        setData({
          nodes: [
            { id: 0, label: 'A' },
            { id: 1, label: 'B' },
            { id: 2, label: 'C' },
            { id: 3, label: 'D' }
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 0 },
            { from: 0, to: 2 }
          ]
        });
        break;
      case 'hashtable':
        setData([10, null, null, 23, null, 45, null, 67, null, null]);
        break;
      case 'bloom':
        setData([10, 20, 30]);
        break;
      case 'disjoint':
        setData([0, 1, 2, 3, 4, 5, 6, 7]);
        break;
      case 'trie':
        setData(['CAT', 'CAR', 'DOG']);
        break;
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
    setInputValue('');
    setSecondaryInputValue('');
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
    
    // Clear any previous search
    setSearchIndex(null);
    setFoundIndex(null);
    
    try {
      const val = parseInt(inputValue);
      
      if (type === 'array' || type === 'dynamic_array') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        
        let targetIndex = secondaryInputValue ? parseInt(secondaryInputValue) : -1;
        if (secondaryInputValue && isNaN(targetIndex)) {
          showNotification('Please enter a valid index', true);
          return;
        }
        
        setData(prev => {
          const newData = [...prev];
          if (targetIndex >= 0) {
            if (targetIndex > newData.length) {
              throw new Error(`Index out of bounds. Max index allowed is ${newData.length}`);
            }
            newData.splice(targetIndex, 0, val);
          } else {
            newData.push(val);
          }
          if (type === 'array' && newData.length > info.maxSize) {
            throw new Error(`Static array exceeded max size of ${info.maxSize}`);
          }
          showNotification(targetIndex >= 0 ? `Inserted ${val} at index ${targetIndex}` : `Inserted ${val}`);
          return newData;
        });
      }
      
      else if (type === 'stack') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        if (data.length >= info.maxSize) {
          showNotification('Stack overflow! Maximum size reached', true);
          return;
        }
        setData(prev => [...prev, val]);
        showNotification(`Pushed ${val} onto Stack`);
      }
      
      else if (type === 'queue') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        if (data.length >= info.maxSize) {
          showNotification('Queue overflow! Maximum size reached', true);
          return;
        }
        setData(prev => [...prev, val]);
        showNotification(`Enqueued ${val} into Queue`);
      }
      
      else if (type === 'circular_queue') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        
        const nextRear = (queueRear + 1) % 8;
        if (nextRear === queueFront && data[nextRear] !== null) {
          showNotification('Circular Queue Full!', true);
          return;
        }
        
        setData(prev => {
          const newData = [...prev];
          let newFront = queueFront === -1 ? 0 : queueFront;
          newData[nextRear] = val;
          setQueueFront(newFront);
          setQueueRear(nextRear);
          showNotification(`Enqueued ${val} at index ${nextRear}`);
          return newData;
        });
      }
      
      else if (['linkedlist', 'doubly_linkedlist', 'circular_linkedlist'].includes(type)) {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        let targetIndex = secondaryInputValue ? parseInt(secondaryInputValue) : -1;
        if (secondaryInputValue && isNaN(targetIndex)) {
          showNotification('Please enter a valid index', true);
          return;
        }
        
        setData(prev => {
          const newData = [...prev];
          if (targetIndex >= 0) {
            if (targetIndex > newData.length) {
              throw new Error(`Index out of bounds. Max index allowed is ${newData.length}`);
            }
            newData.splice(targetIndex, 0, val);
          } else {
            newData.push(val);
          }
          showNotification(targetIndex >= 0 ? `Inserted node ${val} at position ${targetIndex}` : `Appended node ${val}`);
          return newData;
        });
      }
      
      else if (type === 'bst') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        setData(prev => {
          const nextData = insertBST(prev, val);
          showNotification(`Inserted ${val} into BST`);
          return nextData;
        });
      }
      
      else if (type === 'avl') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        setData(prev => {
          const nextData = insertAVL(prev, val);
          showNotification(`Inserted ${val} and balanced AVL tree`);
          return nextData;
        });
      }
      
      else if (type === 'heap') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        setData(prev => {
          const nextData = insertHeap(prev, val, false);
          showNotification(`Inserted ${val} and heapified up (Max Heap)`);
          return nextData;
        });
      }
      
      else if (type === 'minheap') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        setData(prev => {
          const nextData = insertHeap(prev, val, true);
          showNotification(`Inserted ${val} and heapified up (Min Heap)`);
          return nextData;
        });
      }
      
      else if (type === 'hashtable') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        // Linear probing insertion
        const baseSlot = val % 10;
        setData(prev => {
          const nextData = [...prev];
          let placed = false;
          for (let i = 0; i < 10; i++) {
            const probeIdx = (baseSlot + i) % 10;
            if (nextData[probeIdx] === null || nextData[probeIdx] === undefined) {
              nextData[probeIdx] = val;
              placed = true;
              if (i === 0) {
                showNotification(`Hashed ${val} → slot ${probeIdx} (${val} % 10 = ${baseSlot})`);
              } else {
                showNotification(`Collision at ${baseSlot}! Linear probe → slot ${probeIdx}`);
              }
              break;
            }
          }
          if (!placed) {
            showNotification('Hash Table is full!', true);
            return prev;
          }
          return nextData;
        });
      }
      
      else if (type === 'trie') {
        const word = inputValue.toString().toUpperCase().trim();
        if (!/^[A-Z]+$/.test(word)) {
          showNotification('Please enter letters only for Trie', true);
          return;
        }
        setData(prev => {
          if (prev.includes(word)) {
            showNotification(`Word "${word}" already in Trie`, true);
            return prev;
          }
          showNotification(`Inserted "${word}" into Trie`);
          return [...prev, word];
        });
      }
      
      else if (type === 'graph') {
        const primary = inputValue.toString().toUpperCase().trim();
        if (secondaryInputValue && secondaryInputValue.toString().trim() !== '') {
          const secondary = secondaryInputValue.toString().toUpperCase().trim();
          // Compute outside setData so errors are caught by try/catch
          const nextData = addGraphEdge(data, primary, secondary);
          setData(nextData);
          showNotification(`Added edge between ${primary} and ${secondary}`);
        } else {
          // Compute outside setData so errors are caught by try/catch
          const nextData = addGraphNode(data, primary);
          setData(nextData);
          showNotification(`Added vertex ${primary}`);
        }
      }
      
      else if (type === 'disjoint') {
        const x = parseInt(inputValue);
        const y = secondaryInputValue ? parseInt(secondaryInputValue) : -1;
        if (isNaN(x) || isNaN(y) || x < 0 || x >= 8 || y < 0 || y >= 8) {
          showNotification('Enter valid node indices (0 to 7)', true);
          return;
        }
        setData(prev => {
          const nextData = unionDisjointSet(prev, x, y);
          showNotification(`Performed Union(${x}, ${y})`);
          return nextData;
        });
      }
      
      else if (type === 'bloom') {
        if (isNaN(val)) {
          showNotification('Please enter a valid number', true);
          return;
        }
        setData(prev => {
          if (prev.includes(val)) return prev;
          showNotification(`Added ${val} to Bloom Filter (hashed to 3 bits)`);
          return [...prev, val];
        });
      }
      
      setInputValue('');
      setSecondaryInputValue('');
    } catch (e) {
      showNotification(e.message, true);
    }
  };

  const handleDelete = () => {
    setSearchIndex(null);
    setFoundIndex(null);
    
    try {
      if (type === 'circular_queue') {
        if (queueFront === -1 || data[queueFront] === null) {
          showNotification('Circular Queue Empty!', true);
          return;
        }
        
        setData(prev => {
          const newData = [...prev];
          const removed = newData[queueFront];
          newData[queueFront] = null;
          
          if (queueFront === queueRear) {
            setQueueFront(-1);
            setQueueRear(-1);
          } else {
            setQueueFront((queueFront + 1) % 8);
          }
          
          showNotification(`Dequeued ${removed} from front`);
          return newData;
        });
        return;
      }
      
      if (type === 'stack') {
        if (data.length === 0) {
          showNotification('Stack Underflow! Empty Stack', true);
          return;
        }
        setData(prev => {
          const newData = [...prev];
          const removed = newData.pop();
          showNotification(`Popped ${removed} from Top of Stack`);
          return newData;
        });
        return;
      }
      
      if (type === 'queue') {
        if (data.length === 0) {
          showNotification('Queue Empty!', true);
          return;
        }
        setData(prev => {
          const newData = [...prev];
          const removed = newData.shift();
          showNotification(`Dequeued ${removed} from Front of Queue`);
          return newData;
        });
        return;
      }
      
      if (type === 'heap' || type === 'minheap') {
        if (data.length === 0) {
          showNotification('Heap is empty!', true);
          return;
        }
        const isMin = type === 'minheap';
        setData(prev => {
          const { newArr, extracted } = extractHeapRoot(prev, isMin);
          showNotification(`Extracted Root element: ${extracted}`);
          return newArr;
        });
        return;
      }
      
      if (!inputValue) {
        if (data.length === 0) {
          showNotification('Nothing to delete', true);
          return;
        }
        
        if (type === 'hashtable') {
          showNotification('Enter a value to delete', true);
          return;
        }
        if (type === 'graph') {
          showNotification('Enter a vertex label to delete', true);
          return;
        }
        
        setData(prev => {
          const newData = [...prev];
          const removed = newData.pop();
          const displayValue = typeof removed === 'object' ? removed.value : removed;
          showNotification(`Deleted ${displayValue}`);
          return newData;
        });
        return;
      }
      
      const val = parseInt(inputValue);
      
      if (type === 'array' || type === 'dynamic_array' || ['linkedlist', 'doubly_linkedlist', 'circular_linkedlist'].includes(type)) {
        let deleteIdx = secondaryInputValue ? parseInt(secondaryInputValue) : -1;
        
        setData(prev => {
          const newData = [...prev];
          if (deleteIdx >= 0) {
            if (deleteIdx >= newData.length) {
              throw new Error(`Index out of bounds`);
            }
            const removed = newData.splice(deleteIdx, 1)[0];
            showNotification(`Deleted ${removed} at index ${deleteIdx}`);
          } else {
            if (isNaN(val)) {
              throw new Error("Enter index or a valid value to delete");
            }
            const searchIdx = newData.indexOf(val);
            if (searchIdx === -1) {
              throw new Error(`Value ${val} not found`);
            }
            newData.splice(searchIdx, 1);
            showNotification(`Deleted value ${val}`);
          }
          return newData;
        });
      }
      
      else if (type === 'bst') {
        if (isNaN(val)) {
          showNotification('Enter a value to delete from BST', true);
          return;
        }
        setData(prev => {
          const nextData = deleteBST(prev, val);
          showNotification(`Deleted ${val} from BST`);
          return nextData;
        });
      }
      
      else if (type === 'avl') {
        if (isNaN(val)) {
          showNotification('Enter a value to delete from AVL', true);
          return;
        }
        setData(prev => {
          const nextData = deleteAVL(prev, val);
          showNotification(`Deleted ${val} from AVL tree`);
          return nextData;
        });
      }
      
      else if (type === 'hashtable') {
        if (isNaN(val)) {
          showNotification('Enter a value to delete from HashTable', true);
          return;
        }
        setData(prev => {
          const nextData = [...prev];
          const slotIdx = nextData.indexOf(val);
          if (slotIdx === -1) {
            showNotification(`Value ${val} not found in Hash Table`, true);
            return prev;
          }
          nextData[slotIdx] = null;
          showNotification(`Removed ${val} from slot ${slotIdx}`);
          return nextData;
        });
      }
      
      else if (type === 'trie') {
        const word = inputValue.toString().toUpperCase().trim();
        setData(prev => {
          if (!prev.includes(word)) {
            showNotification(`Word "${word}" not found in Trie`, true);
            return prev;
          }
          showNotification(`Deleted "${word}" from Trie`);
          return prev.filter(w => w !== word);
        });
      }
      
      else if (type === 'graph') {
        const primary = inputValue.toString().toUpperCase().trim();
        if (secondaryInputValue && secondaryInputValue.toString().trim() !== '') {
          const secondary = secondaryInputValue.toString().toUpperCase().trim();
          const nextData = deleteGraphEdge(data, primary, secondary);
          setData(nextData);
          showNotification(`Deleted edge between ${primary} and ${secondary}`);
        } else {
          const nextData = deleteGraphNode(data, primary);
          setData(nextData);
          showNotification(`Deleted vertex ${primary}`);
        }
      }
      
      setInputValue('');
      setSecondaryInputValue('');
    } catch (e) {
      showNotification(e.message, true);
    }
  };

  const handleUpdate = () => {
    if (!inputValue) {
      showNotification('Enter a value to update', true);
      return;
    }
    
    setSearchIndex(null);
    setFoundIndex(null);
    
    try {
      const val = parseInt(inputValue);
      
      if (type === 'array' || type === 'dynamic_array' || ['linkedlist', 'doubly_linkedlist', 'circular_linkedlist'].includes(type)) {
        if (!secondaryInputValue) {
          showNotification('Enter target position/index to update', true);
          return;
        }
        const index = parseInt(secondaryInputValue);
        if (isNaN(index)) {
          showNotification('Enter a valid position index', true);
          return;
        }
        if (isNaN(val)) {
          showNotification('Enter a valid new value', true);
          return;
        }
        
        setData(prev => {
          if (index < 0 || index >= prev.length) {
            throw new Error('Index out of bounds');
          }
          const newData = [...prev];
          newData[index] = val;
          showNotification(`Updated index ${index} to ${val}`);
          return newData;
        });
      }
      
      else if (type === 'stack') {
        if (isNaN(val)) {
          showNotification('Enter a valid number', true);
          return;
        }
        setData(prev => {
          if (prev.length === 0) throw new Error('Stack is empty');
          const newData = [...prev];
          newData[newData.length - 1] = val;
          showNotification(`Updated Top of Stack to ${val}`);
          return newData;
        });
      }
      
      else if (type === 'queue') {
        if (isNaN(val)) {
          showNotification('Enter a valid number', true);
          return;
        }
        setData(prev => {
          if (prev.length === 0) throw new Error('Queue is empty');
          const newData = [...prev];
          newData[0] = val;
          showNotification(`Updated Front of Queue to ${val}`);
          return newData;
        });
      }
      
      else if (type === 'circular_queue') {
        if (isNaN(val)) {
          showNotification('Enter a valid number', true);
          return;
        }
        setData(prev => {
          if (queueFront === -1 || prev[queueFront] === null) throw new Error('Queue is empty');
          const newData = [...prev];
          newData[queueFront] = val;
          showNotification(`Updated Front element to ${val}`);
          return newData;
        });
      }
      
      else if (type === 'bst') {
        if (!secondaryInputValue) {
          showNotification('Enter new value in secondary input', true);
          return;
        }
        const oldVal = val;
        const newVal = parseInt(secondaryInputValue);
        if (isNaN(oldVal) || isNaN(newVal)) {
          showNotification('Enter valid old and new numbers', true);
          return;
        }
        
        setData(prev => {
          let nextData = deleteBST(prev, oldVal);
          nextData = insertBST(nextData, newVal);
          showNotification(`Updated BST: Replaced ${oldVal} with ${newVal}`);
          return nextData;
        });
      }
      
      else if (type === 'avl') {
        if (!secondaryInputValue) {
          showNotification('Enter new value in secondary input', true);
          return;
        }
        const oldVal = val;
        const newVal = parseInt(secondaryInputValue);
        if (isNaN(oldVal) || isNaN(newVal)) {
          showNotification('Enter valid old and new numbers', true);
          return;
        }
        
        setData(prev => {
          let nextData = deleteAVL(prev, oldVal);
          nextData = insertAVL(nextData, newVal);
          showNotification(`Updated AVL: Replaced ${oldVal} with ${newVal} and re-balanced`);
          return nextData;
        });
      }
      
      else if (type === 'hashtable') {
        if (!secondaryInputValue) {
          showNotification('Enter new value in secondary input', true);
          return;
        }
        const oldVal = val;
        const newVal = parseInt(secondaryInputValue);
        if (isNaN(oldVal) || isNaN(newVal)) {
          showNotification('Enter valid numbers', true);
          return;
        }
        
        setData(prev => {
          const nextData = [...prev];
          // Remove old value
          const oldIdx = nextData.indexOf(oldVal);
          if (oldIdx === -1) {
            showNotification(`Value ${oldVal} not found`, true);
            return prev;
          }
          nextData[oldIdx] = null;
          // Insert new value using linear probing
          const baseSlot = newVal % 10;
          for (let i = 0; i < 10; i++) {
            const probeIdx = (baseSlot + i) % 10;
            if (nextData[probeIdx] === null || nextData[probeIdx] === undefined) {
              nextData[probeIdx] = newVal;
              showNotification(`HashTable: Updated ${oldVal} → ${newVal} at slot ${probeIdx}`);
              return nextData;
            }
          }
          showNotification('Hash Table is full, cannot insert new value', true);
          return prev;
        });
      }
      
      else if (type === 'trie') {
        if (!secondaryInputValue) {
          showNotification('Enter new word in secondary input', true);
          return;
        }
        const oldWord = inputValue.toString().toUpperCase().trim();
        const newWord = secondaryInputValue.toString().toUpperCase().trim();
        if (!/^[A-Z]+$/.test(newWord)) {
          showNotification('Letters only for Trie words', true);
          return;
        }
        setData(prev => {
          if (!prev.includes(oldWord)) throw new Error(`Word "${oldWord}" not found`);
          const filtered = prev.filter(w => w !== oldWord);
          if (filtered.includes(newWord)) return filtered;
          showNotification(`Updated "${oldWord}" to "${newWord}"`);
          return [...filtered, newWord];
        });
      }
      
      else if (type === 'graph') {
        const oldLabel = inputValue.toString().toUpperCase().trim();
        const newLabel = secondaryInputValue.toString().toUpperCase().trim();
        if (!newLabel) {
          showNotification('Enter new label in secondary input', true);
          return;
        }
        const exists = data.nodes.some(n => n.label === newLabel);
        if (exists) throw new Error(`Node ${newLabel} already exists`);
        const nextNodes = data.nodes.map(n => 
          n.label === oldLabel ? { ...n, label: newLabel } : n
        );
        setData({ nodes: nextNodes, edges: data.edges });
        showNotification(`Updated vertex ${oldLabel} to ${newLabel}`);
      }
      
      setInputValue('');
      setSecondaryInputValue('');
    } catch (e) {
      showNotification(e.message, true);
    }
  };

  const handleSearch = async () => {
    if (!inputValue) {
      showNotification('Enter a value to search', true);
      return;
    }
    
    setIsSearching(true);
    setSearchIndex(null);
    setFoundIndex(null);
    
    try {
      const searchVal = parseInt(inputValue);
      
      if (['array', 'dynamic_array', 'linkedlist', 'doubly_linkedlist', 'circular_linkedlist', 'stack', 'queue'].includes(type)) {
        if (isNaN(searchVal)) {
          showNotification('Enter a valid number to search', true);
          return;
        }
        
        for (let i = 0; i < data.length; i++) {
          setSearchIndex(i);
          await new Promise(resolve => setTimeout(resolve, 400));
          
          if (data[i] === searchVal) {
            setFoundIndex(i);
            showNotification(`Found ${searchVal} at index ${i}`);
            setIsSearching(false);
            return;
          }
        }
        showNotification(`${searchVal} not found`, true);
      }
      
      else if (type === 'circular_queue') {
        if (isNaN(searchVal)) {
          showNotification('Enter a valid number to search', true);
          return;
        }
        for (let i = 0; i < 8; i++) {
          setSearchIndex(i);
          await new Promise(resolve => setTimeout(resolve, 400));
          if (data[i] === searchVal) {
            setFoundIndex(i);
            showNotification(`Found ${searchVal} at slot index ${i}`);
            setIsSearching(false);
            return;
          }
        }
        showNotification(`${searchVal} not found`, true);
      }
      
      else if (type === 'hashtable') {
        if (isNaN(searchVal)) {
          showNotification('Enter a valid number to search', true);
          return;
        }
        // Linear probing search
        const baseSlot = searchVal % 10;
        let found = false;
        for (let i = 0; i < 10; i++) {
          const probeIdx = (baseSlot + i) % 10;
          setSearchIndex(probeIdx);
          await new Promise(resolve => setTimeout(resolve, 400));
          
          if (data[probeIdx] === searchVal) {
            setFoundIndex(probeIdx);
            showNotification(`Found ${searchVal} at slot ${probeIdx}!`);
            found = true;
            break;
          }
          if (data[probeIdx] === null || data[probeIdx] === undefined) {
            // Empty slot means value is definitely not in table
            break;
          }
        }
        if (!found) {
          showNotification(`${searchVal} not found in Hash Table`, true);
        }
      }
      
      else if (type === 'bst' || type === 'avl' || type === 'heap' || type === 'minheap') {
        if (isNaN(searchVal)) {
          showNotification('Enter a valid number to search', true);
          return;
        }
        const index = data.findIndex(item => item === searchVal);
        if (index !== -1) {
          setFoundIndex(index);
          showNotification(`Found ${searchVal} at tree index ${index}`);
        } else {
          showNotification(`${searchVal} not found in Tree`, true);
        }
      }
      
      else if (type === 'trie') {
        const word = inputValue.toString().toUpperCase().trim();
        if (data.includes(word)) {
          setFoundIndex(word);
          showNotification(`Found "${word}" in Trie!`);
        } else {
          showNotification(`"${word}" not found in Trie`, true);
        }
      }
      
      else if (type === 'graph') {
        const label = inputValue.toString().toUpperCase().trim();
        const node = data.nodes.find(n => n.label === label);
        if (node) {
          setFoundIndex(node.label);
          showNotification(`Vertex ${label} is present in Graph`);
        } else {
          showNotification(`Vertex ${label} not found`, true);
        }
      }
      
      else if (type === 'disjoint') {
        const x = parseInt(inputValue);
        if (isNaN(x) || x < 0 || x >= 8) {
          showNotification('Enter a node index (0 to 7)', true);
          return;
        }
        const { root, path } = findDisjointSet(data, x);
        for (let node of path) {
          setSearchIndex(node);
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        setFoundIndex(root);
        showNotification(`Representative root of ${x} is ${root}`);
      }
      
      else if (type === 'bloom') {
        if (isNaN(searchVal)) {
          showNotification('Enter a valid number', true);
          return;
        }
        setSearchIndex(searchVal);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const i1 = (searchVal * 3) % 16;
        const i2 = (searchVal * 7) % 16;
        const i3 = (searchVal * 11) % 16;
        
        const bits = Array(16).fill(0);
        data.forEach(val => {
           let v = parseInt(val) || 0;
           bits[(v * 3) % 16] = 1;
           bits[(v * 7) % 16] = 1;
           bits[(v * 11) % 16] = 1;
        });
        
        if (bits[i1] && bits[i2] && bits[i3]) {
          showNotification(`All bits are 1! ${searchVal} is PROBABLY in set.`);
        } else {
          showNotification(`Bit ${!bits[i1] ? i1 : !bits[i2] ? i2 : i3} is 0. ${searchVal} is DEFINITELY NOT in set.`, true);
        }
      }
      
    } catch (e) {
      showNotification(e.message, true);
    }
    
    setIsSearching(false);
  };

  const handleShuffle = () => {
    if (['stack', 'queue', 'hashtable', 'tree', 'bst', 'avl', 'heap', 'minheap', 'graph', 'bloom', 'disjoint', 'trie'].includes(type)) {
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
    setSecondaryInputValue('');
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
      case 'circular_queue': return <CircularQueueVisualizer {...commonProps} front={queueFront} rear={queueRear} />;
      case 'linkedlist': return <LinkedListVisualizer {...commonProps} />;
      case 'doubly_linkedlist': return <DoublyLinkedListVisualizer {...commonProps} circular={false} />;
      case 'circular_linkedlist': return <DoublyLinkedListVisualizer {...commonProps} circular={true} />;
      case 'tree': return <TreeVisualizer {...commonProps} />;
      case 'bst': return <TreeVisualizer {...commonProps} />;
      case 'avl': return <ExtendedTreeVisualizer {...commonProps} type="avl" />;
      case 'graph': return <GraphVisualizer {...commonProps} />;
      case 'hashtable': return <HashTableVisualizer {...commonProps} />;
      case 'heap': return <HeapVisualizer {...commonProps} />;
      case 'minheap': return <ExtendedTreeVisualizer {...commonProps} type="minheap" />;
      case 'trie': return <TrieVisualizer {...commonProps} />;
      case 'bloom': return <BloomFilterVisualizer {...commonProps} />;
      case 'disjoint': return <DisjointSetVisualizer {...commonProps} />;
      default: return (
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <Book size={48} style={{ marginBottom: '16px', opacity: 0.5, margin: '0 auto' }} />
          <h2>Visualization Coming Soon</h2>
          <p>We are actively building the interactive visualizer for {type}.</p>
        </div>
      );
    }
  };

  const getLabels = () => {
    switch(type) {
      case 'graph':
        return {
          primary: 'Node Label',
          secondary: 'Target Node Label (for Edge)'
        };
      case 'disjoint':
        return {
          primary: 'Element X (0-7)',
          secondary: 'Element Y (Union / optional)'
        };
      case 'hashtable':
        return {
          primary: 'Value',
          secondary: 'New Value (Update)'
        };
      case 'trie':
        return {
          primary: 'Word',
          secondary: 'New Word (Update)'
        };
      case 'bst':
      case 'avl':
        return {
          primary: 'Value',
          secondary: 'New Value (Update)'
        };
      case 'array':
      case 'dynamic_array':
      case 'linkedlist':
      case 'doubly_linkedlist':
      case 'circular_linkedlist':
        return {
          primary: 'Value',
          secondary: 'Position / Index'
        };
      default:
        return {
          primary: 'Value',
          secondary: ''
        };
    }
  };

  const labels = getLabels();

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
              {labels.primary}
            </label>
            <input
              type={['trie', 'graph'].includes(type) ? 'text' : 'number'}
              placeholder={`Enter ${labels.primary.toLowerCase()}...`}
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

          {labels.secondary && (
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
                {labels.secondary}
              </label>
              <input
                type={['trie', 'graph'].includes(type) ? 'text' : 'number'}
                placeholder={`Enter ${labels.secondary.toLowerCase()}...`}
                value={secondaryInputValue}
                onChange={(e) => setSecondaryInputValue(e.target.value)}
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
          )}

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
              <Plus size={24} /> {type === 'disjoint' ? 'Union' : type === 'graph' && secondaryInputValue && secondaryInputValue.toString().trim() !== '' ? 'Add Edge' : type === 'graph' ? 'Add Node' : 'Insert'}
            </button>

            <button 
              onClick={handleUpdate}
              disabled={isSearching}
              style={{
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
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
              <RotateCcw size={20} style={{ transform: 'rotate(180deg)' }} /> Update
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
              <Trash2 size={20} /> {type === 'graph' && secondaryInputValue && secondaryInputValue.toString().trim() !== '' ? 'Delete Edge' : type === 'graph' ? 'Delete Node' : type === 'heap' || type === 'minheap' ? 'Extract Root' : 'Delete'}
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
              {isSearching ? 'Searching...' : type === 'disjoint' ? 'Find' : 'Search'}
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
