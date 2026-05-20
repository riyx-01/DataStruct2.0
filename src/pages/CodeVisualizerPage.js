import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import Hyperspeed from '../components/ui/Hyperspeed';
import { 
  Play, Pause, RotateCcw, SkipForward, SkipBack, Terminal, 
  Database, ChevronRight, Activity, Box, AlertCircle, Code, Camera, RefreshCw, Layers, Eye, Ghost, Info
} from 'lucide-react';

import './CodeVisualizerPage.css';

// ==================== CODE TEMPLATES ====================
const CODE_TEMPLATES = {
  bst_insert: {
    name: "BST Insertion",
    language: "javascript",
    code: `class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

let root = new Node(10);
root.left = new Node(5);
root.right = new Node(15);
root.left.left = new Node(3);
root.left.right = new Node(7);

console.log("Binary Search Tree initialized!");`
  },
  linked_list_ops: {
    name: "Linked List Deletion",
    language: "javascript",
    code: `class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);

console.log("Deleting node 20...");
// Unlink node 20
head.next = head.next.next;
console.log("Node 20 deleted successfully.");`
  },
  array_ops: {
    name: "Stack / Array Operations",
    language: "javascript",
    code: `let stack = [10, 20, 30];
console.log("Stack initialized:", stack);

stack.push(40);
console.log("Pushed 40:", stack);

stack.pop();
console.log("Popped element.");`
  }
};

// ==================== EXECUTION ENGINE ====================

const __clone = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
};

const convertHashComments = (text) => {
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === "'" && !inDoubleQuote && !inBacktick) inSingleQuote = !inSingleQuote;
      else if (char === '"' && !inSingleQuote && !inBacktick) inDoubleQuote = !inDoubleQuote;
      else if (char === '`' && !inSingleQuote && !inDoubleQuote) inBacktick = !inBacktick;
      else if (char === '#' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
        return line.substring(0, i) + '//' + line.substring(i + 1);
      }
    }
    return line;
  });
  return processedLines.join('\n');
};

// Intelligent Virtual Simulator for Javascript / Python / C++ / Java
const simulateExecution = (rawCode, language) => {
  const uniformCode = convertHashComments(rawCode);
  const lines = uniformCode.split('\n');
  const history = [];
  
  const variables = {};
  const heap = {}; // id -> node structure
  let objectIdCounter = 1;
  let currentOutput = [];
  
  const createNode = (val) => {
    const id = `0x${objectIdCounter++}`;
    heap[id] = {
      id,
      val: isNaN(val) ? val : Number(val),
      left: null,
      right: null,
      next: null,
      prev: null
    };
    return id;
  };

  const captureState = (lineNum, codeLine, why) => {
    const variablesCopy = {};
    const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {} };
    const cloneMap = new Map();
    
    const cloneStructure = (id) => {
      if (!id || !heap[id]) return null;
      if (cloneMap.has(id)) {
        return { isReference: true, targetId: id };
      }
      const node = heap[id];
      const clone = {
        id: id,
        val: node.val,
        variables: []
      };
      cloneMap.set(id, clone);
      
      // Determine links based on existing fields
      if (node.left !== undefined) clone.left = cloneStructure(node.left);
      if (node.right !== undefined) clone.right = cloneStructure(node.right);
      if (node.next !== undefined) clone.next = cloneStructure(node.next);
      if (node.prev !== undefined) clone.prev = cloneStructure(node.prev);
      
      return clone;
    };
    
    // Process variables
    for (let key in variables) {
      const val = variables[key];
      if (val && typeof val === 'object' && val.type === 'ref') {
        const rootClone = cloneStructure(val.id);
        if (rootClone) {
          memoryStructures.trees[key] = rootClone;
        }
      } else if (Array.isArray(val)) {
        memoryStructures.arrays[key] = val.map(item => {
          if (item && typeof item === 'object' && item.type === 'ref') {
            return cloneStructure(item.id);
          }
          return item;
        });
      } else {
        variablesCopy[key] = val;
      }
    }
    
    // Label variables pointing to nodes
    for (let key in variables) {
      const val = variables[key];
      if (val && typeof val === 'object' && val.type === 'ref') {
        const clone = cloneMap.get(val.id);
        if (clone) {
          clone.variables.push(key);
        }
      }
    }
    
    return {
      line: lineNum,
      code: codeLine,
      variables: variablesCopy,
      memoryStructures,
      why,
      deletedElements: [],
      output: [...currentOutput]
    };
  };

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    let line = rawLine.trim();
    
    if (line.includes('//')) {
      line = line.split('//')[0].trim();
    }
    
    if (!line || line.startsWith('/*') || line.startsWith('*')) {
      return;
    }
    
    let why = "Executing logical instruction.";
    
    // 1. Console outputs
    if (line.includes('print(') || line.includes('console.log')) {
      why = "Standard Output: Broadcasting internal state to the virtual console.";
      const printMatch = line.match(/(?:print|console\.log)\(([^)]*)\)/);
      if (printMatch) {
        const argsStr = printMatch[1];
        const args = argsStr.split(',').map(a => a.trim());
        const resolvedArgs = args.map(arg => {
          if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg.slice(1, -1);
          }
          if (variables[arg] !== undefined) {
            const val = variables[arg];
            if (val && typeof val === 'object' && val.type === 'ref') {
              return `[Node ${val.id.substring(2)} (val=${heap[val.id]?.val})]`;
            }
            return String(val);
          }
          const propMatch = arg.match(/^(\w+)\.(\w+)$/);
          if (propMatch) {
            const varName = propMatch[1];
            const propName = propMatch[2];
            const ref = variables[varName];
            if (ref && ref.type === 'ref' && heap[ref.id]) {
              return String(heap[ref.id][propName]);
            }
          }
          return arg;
        });
        currentOutput.push(resolvedArgs.join(' '));
      }
    }
    // 2. Node allocations: let x = new Node(val)
    else if (line.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/)) {
      why = "Memory Allocation: Creating a new object in the heap. This allocates space for value and child pointers.";
      const match = line.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/);
      const name = match[1];
      const valStr = match[2].trim();
      const val = isNaN(valStr) ? valStr.replace(/['"]/g, '') : Number(valStr);
      const id = createNode(val);
      variables[name] = { type: 'ref', id };
    }
    // 3. Pointer linkages: root.left = new Node(val)
    else if (line.match(/(\w+)\.(left|right|next|prev)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/)) {
      why = "Memory Allocation & Link: Allocating a new Node and establishing a pointer reference.";
      const match = line.match(/(\w+)\.(left|right|next|prev)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/);
      const parentName = match[1];
      const pointerName = match[2];
      const valStr = match[3].trim();
      const val = isNaN(valStr) ? valStr.replace(/['"]/g, '') : Number(valStr);
      const parentRef = variables[parentName];
      if (parentRef && parentRef.type === 'ref' && heap[parentRef.id]) {
        const childId = createNode(val);
        heap[parentRef.id][pointerName] = childId;
      }
    }
    // 4. Pointer updates / Deletions: root.left = temp, root.left = null
    else if (line.match(/(\w+)\.(left|right|next|prev)\s*=\s*(.*)/)) {
      why = "Pointer Update: Modifying the link between nodes. This changes the structural topology.";
      const match = line.match(/(\w+)\.(left|right|next|prev)\s*=\s*(.*)/);
      const parentName = match[1];
      const pointerName = match[2];
      let targetName = match[3].trim();
      if (targetName.endsWith(';')) targetName = targetName.slice(0, -1).trim();
      
      const parentRef = variables[parentName];
      if (parentRef && parentRef.type === 'ref' && heap[parentRef.id]) {
        if (targetName === 'null' || targetName === 'None' || targetName === 'nullptr' || targetName === 'undefined') {
          heap[parentRef.id][pointerName] = null;
        } else {
          const targetRef = variables[targetName];
          if (targetRef && targetRef.type === 'ref') {
            heap[parentRef.id][pointerName] = targetRef.id;
          }
        }
      }
    }
    // 5. Array Push
    else if (line.includes('.push') || line.includes('.append')) {
      why = "Heap Push: Growing a dynamic array structure in memory.";
      const match = line.match(/(\w+)\.\s*(?:append|push)\(([^)]*)\)/);
      if (match) {
        const name = match[1];
        const valStr = match[2].trim();
        let val = isNaN(valStr) ? valStr.replace(/['"]/g, '') : Number(valStr);
        if (variables[valStr] !== undefined) {
          val = variables[valStr];
        }
        if (!variables[name]) variables[name] = [];
        variables[name].push(val);
      }
    }
    // 6. Array Pop
    else if (line.includes('.pop')) {
      why = "Heap Pop: Dequeuing or removing an element from the dynamic structure.";
      const match = line.match(/(\w+)\.\s*pop\(([^)]*)\)/);
      if (match) {
        const name = match[1];
        const arg = match[2].trim();
        if (Array.isArray(variables[name])) {
          if (arg === '0') {
            variables[name].shift();
          } else {
            variables[name].pop();
          }
        }
      }
    }
    // 7. General Assignment & Traversals
    else if (line.includes('=')) {
      why = "State Mutation: Binding a new value to a variable descriptor.";
      const match = line.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.*)/);
      if (match) {
        const name = match[1];
        let valStr = match[2].trim();
        if (valStr.endsWith(';')) valStr = valStr.slice(0, -1).trim();
        
        if (valStr === '[]') {
          variables[name] = [];
        } else if (valStr.startsWith('[') && valStr.endsWith(']')) {
          try {
            const validJsonStr = valStr.replace(/'/g, '"');
            variables[name] = JSON.parse(validJsonStr);
          } catch {
            variables[name] = [];
          }
        } 
        // Traversal: curr = curr.next
        else if (valStr.match(/^(\w+)\.(left|right|next|prev)$/)) {
          const travMatch = valStr.match(/^(\w+)\.(left|right|next|prev)$/);
          const parentName = travMatch[1];
          const pointerName = travMatch[2];
          const parentRef = variables[parentName];
          if (parentRef && parentRef.type === 'ref' && heap[parentRef.id]) {
            const targetId = heap[parentRef.id][pointerName];
            if (targetId) {
              variables[name] = { type: 'ref', id: targetId };
            } else {
              variables[name] = null;
            }
          } else {
            variables[name] = null;
          }
        }
        else if (variables[valStr] !== undefined) {
          variables[name] = variables[valStr];
        } else {
          const num = Number(valStr);
          variables[name] = isNaN(num) ? valStr.replace(/['"]/g, '') : num;
        }
      }
    }
    
    history.push(captureState(lineNum, rawLine.trim(), why));
  });
  
  return history;
};

// Compile and Trace JS natively using AST instrumentation
const compileAndRun = (rawCode, language) => {
  const history = [];
  const code = convertHashComments(rawCode);
  
  // Babel Standalone Plugin to statically capture local variable scope
  const instrumentPlugin = ({ types: t }) => {
    const varNames = new Set();
    return {
      visitor: {
        Program: {
          enter(path) {
            varNames.clear();
            path.traverse({
              VariableDeclarator(p) {
                if (p.node.id && p.node.id.name) {
                  varNames.add(p.node.id.name);
                }
              },
              AssignmentExpression(p) {
                if (p.node.left && p.node.left.type === 'Identifier') {
                  varNames.add(p.node.left.name);
                }
              },
              FunctionDeclaration(p) {
                if (p.node.id && p.node.id.name) {
                  varNames.add(p.node.id.name);
                }
                p.node.params.forEach(param => {
                  if (param.type === 'Identifier') {
                    varNames.add(param.name);
                  }
                });
              },
              ClassDeclaration(p) {
                if (p.node.id && p.node.id.name) {
                  varNames.add(p.node.id.name);
                }
              }
            });
          }
        },
        Statement(path) {
          if (!path.node.loc || path.node.__injected) return;
          if (!path.parentPath.isBlockStatement() && !path.parentPath.isProgram()) return;
          
          const line = path.node.loc.start.line;
          try {
            const properties = [];
            varNames.forEach(name => {
              properties.push(
                t.objectProperty(
                  t.identifier(name),
                  t.conditionalExpression(
                    t.binaryExpression(
                      '!==',
                      t.unaryExpression('typeof', t.identifier(name)),
                      t.stringLiteral('undefined')
                    ),
                    t.identifier(name),
                    t.identifier('undefined')
                  )
                )
              );
            });
            
            const scopeExpr = t.objectExpression(properties);
            const traceCall = t.callExpression(t.identifier('__trace'), [
              t.numericLiteral(line),
              scopeExpr
            ]);
            const traceStmt = t.expressionStatement(traceCall);
            traceStmt.__injected = true;
            
            if (path.isReturnStatement()) {
              path.insertBefore(traceStmt);
            } else {
              path.insertAfter(traceStmt);
            }
          } catch(e) { console.error(e); }
        }
      }
    };
  };

  let instrumentedCode = "";
  let success = false;
  
  if (language === 'javascript' && window.Babel) {
    try {
      // Compiles using 'env' preset to transpile modern classes & ES6 syntax safely
      instrumentedCode = window.Babel.transform(code, { 
        presets: ['env'],
        plugins: [instrumentPlugin], 
        filename: 'visualizer.js' 
      }).code;
      
      let currentOutput = [];
      let stepCount = 0;
      
      const __trace = (line, scope) => {
        if (stepCount++ > 3000) throw new Error("Infinite loop detected.");
        const variables = {};
        const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {} };

        const visited = new Map();
        let objectIdCounter = 1;
        const getObjectId = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (!visited.has(obj)) {
            visited.set(obj, `0x${objectIdCounter++}`);
          }
          return visited.get(obj);
        };

        const cloneMap = new Map();

        const cloneStructure = (node) => {
          if (!node || typeof node !== 'object') return node;
          if (Array.isArray(node)) {
            return node.map(item => cloneStructure(item));
          }
          
          const id = getObjectId(node);
          if (cloneMap.has(id)) {
            return { isReference: true, targetId: id };
          }

          const clone = {
            id: id,
            val: node.val !== undefined ? node.val : (node.value !== undefined ? node.value : node.data),
            variables: []
          };
          
          cloneMap.set(id, clone);

          if ('left' in node) clone.left = cloneStructure(node.left);
          if ('right' in node) clone.right = cloneStructure(node.right);
          if ('next' in node) clone.next = cloneStructure(node.next);
          if ('prev' in node) clone.prev = cloneStructure(node.prev);

          return clone;
        };

        // First pass: clone memory objects
        for (let key in scope) {
          const val = scope[key];
          if (val === undefined || typeof val === 'function') continue;
          
          if (Array.isArray(val)) {
            memoryStructures.arrays[key] = val.map(item => {
              if (item && typeof item === 'object') return cloneStructure(item);
              return item;
            });
          } else if (typeof val === 'object' && val !== null) {
             if ('left' in val || 'right' in val || 'next' in val || 'prev' in val || 'val' in val || 'value' in val) {
               memoryStructures.trees[key] = cloneStructure(val);
             } else {
               variables[key] = __clone(val);
             }
          } else {
            variables[key] = val;
          }
        }

        // Second pass: link tags
        for (let key in scope) {
          const val = scope[key];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const id = getObjectId(val);
            const clone = cloneMap.get(id);
            if (clone) {
              clone.variables.push(key);
            }
          }
        }

        const codeLine = rawCode.split('\n')[line - 1]?.trim() || '';
        let why = "Executing logical instruction.";
        
        if (codeLine.includes('root =') || codeLine.includes('Node(')) why = "Memory Allocation: Creating a new object in the heap. This allocates space for value and child pointers.";
        else if (codeLine.includes('return')) why = "Returning Control: Exiting current frame and passing value back to the caller.";
        else if (codeLine.includes('.left') || codeLine.includes('.right')) why = "Pointer Update: Modifying the link between nodes. This changes the structural topology of the tree.";
        else if (codeLine.includes('.next')) why = "Linked Connection: Updating the directional edge in the list structure.";
        else if (codeLine.includes('arr.push') || codeLine.includes('.push')) why = "Heap Push: Growing a dynamic array. This may trigger an O(N) resize if capacity is reached.";
        else if (codeLine.includes('for') || codeLine.includes('while')) why = "Iterative Branch: Evaluating the loop guard to decide if another iteration is required.";
        else if (codeLine.includes('if')) why = "Logical Fork: Evaluating a boolean predicate to fork execution path.";
        else if (codeLine.includes('=')) why = "State Mutation: Binding a new value to a variable descriptor in the current stack frame.";
        else if (codeLine.includes('console.log')) why = "Standard Output: Broadcasting internal state to the virtual console.";

        history.push({
          line,
          code: codeLine,
          variables,
          memoryStructures,
          why,
          deletedElements: [],
          output: [...currentOutput]
        });
      };

      const fakeConsole = { 
        log: (...args) => { 
          currentOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); 
        } 
      };
      
      const fn = new Function('__trace', '__clone', 'console', instrumentedCode);
      fn(__trace, __clone, fakeConsole);
      success = history.length > 0;
    } catch(e) { 
      console.warn("Babel execution failed, utilizing simulator instead:", e.message);
    }
  }

  if (success) {
    return history;
  }
  
  return simulateExecution(rawCode, language);
};

const preprocessImage = (imageFile) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        const v = gray < 120 ? 0 : 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas); // Resolve with Canvas directly for speed and memory efficiency
    };
  });
};

const detectLanguage = (text) => {
  const normalized = text.toLowerCase();
  if (normalized.includes('#include') || normalized.includes('std::') || normalized.includes('cout <<') || normalized.includes('using namespace std')) {
    return 'cpp';
  }
  if (normalized.includes('public class ') || normalized.includes('system.out.print') || normalized.includes('public static void main')) {
    return 'java';
  }
  if (normalized.includes('def ') || normalized.includes('import ') && normalized.includes(':') || normalized.includes('print ') && !normalized.includes(';')) {
    return 'python';
  }
  if (normalized.includes('let ') || normalized.includes('const ') || normalized.includes('console.log') || normalized.includes('document.get') || normalized.includes('function ')) {
    return 'javascript';
  }
  return 'javascript';
};

// ==================== LIQUID GLASS RENDERERS ====================

const GlassArray = ({ name, arr }) => (
  <div className="iso-glass-container">
    <div className="iso-title">Array / Stack : <span>{name}</span></div>
    <div className="iso-array">
      {arr.map((val, idx) => (
        <div key={idx} className="iso-array-cell">
           <div className="iso-cell-value">{typeof val === 'object' ? '{...}' : String(val)}</div>
           <div className="iso-cell-index">{idx}</div>
        </div>
      ))}
    </div>
  </div>
);

const GlassList = ({ name, head }) => {
  const nodes = [];
  let curr = head;
  const visited = new Set();

  while (curr) {
    if (curr.isReference) {
      nodes.push({ isRef: true, targetId: curr.targetId });
      break;
    }
    const id = curr.id;
    if (visited.has(id)) {
      nodes.push({ isCycle: true, targetId: id });
      break;
    }
    visited.add(id);
    nodes.push(curr);
    curr = curr.next;
  }

  return (
    <div className="iso-glass-container">
      <div className="iso-title">Linked List : <span>{name}</span></div>
      <div className="iso-list-nodes">
        {nodes.map((node, idx) => {
          if (node.isRef || node.isCycle) {
            return (
              <div key={idx} className="iso-list-node-ref">
                <ChevronRight className="iso-list-arrow" />
                <div className="iso-list-ref-bubble">
                  Cycle to {node.targetId.substring(2)}
                </div>
              </div>
            );
          }
          return (
            <React.Fragment key={node.id}>
              {idx > 0 && <ChevronRight className="iso-list-arrow" />}
              <div className="iso-list-node-wrapper">
                {node.variables && node.variables.length > 0 && (
                  <div className="iso-node-vars">
                    {node.variables.map(v => (
                      <span key={v} className="iso-node-var-tag">{v}</span>
                    ))}
                  </div>
                )}
                <div className="iso-list-node">
                  <div className="iso-list-node-val">{node.val}</div>
                  <div className="iso-list-node-id">{node.id.substring(2)}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {nodes.length > 0 && !nodes[nodes.length - 1].isRef && !nodes[nodes.length - 1].isCycle && (
          <React.Fragment key="null-node">
            <ChevronRight className="iso-list-arrow" />
            <div className="iso-list-node null-node">
              <span>NULL</span>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

const GlassTree = ({ name, node }) => {
  const renderNode = (n) => {
    if (!n) return null;
    if (n.isReference) {
      return (
        <div className="iso-tree-node-ref-bubble" style={{
          background: 'rgba(251, 191, 36, 0.15)',
          border: '1px solid rgba(251, 191, 36, 0.5)',
          color: '#FBBF24',
          padding: '4px 8px',
          fontSize: '11px',
          borderRadius: '8px',
          fontWeight: 'bold',
          marginTop: '5px'
        }}>
          Ref to {n.targetId.substring(2)}
        </div>
      );
    }
    return (
      <div className="iso-tree-node-wrapper">
        {n.variables && n.variables.length > 0 && (
          <div className="iso-node-vars" style={{ marginBottom: '6px' }}>
            {n.variables.map(v => (
              <span key={v} className="iso-node-var-tag" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.6)' }}>{v}</span>
            ))}
          </div>
        )}
        <div className="iso-tree-node">
          {n.val !== undefined ? n.val : n.value}
        </div>
        <div className="iso-tree-children">
          {(n.left || n.right) && (
            <>
              <div className="iso-tree-child left">{renderNode(n.left)}</div>
              <div className="iso-tree-child right">{renderNode(n.right)}</div>
            </>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="iso-glass-container">
      <div className="iso-title">
        Binary Tree : <span>{name}</span>
      </div>
      <div className="iso-tree-root">{renderNode(node)}</div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CodeVisualizer = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.bst_insert.code);

  const [tokens, setTokens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  
  const [deletedVault, setDeletedVault] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    const handleResize = () => {
       if (editorRef.current) { editorRef.current.layout(); }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(() => editor.layout(), 100);
  };

  const currentState = tokens[currentStep];

  // Deallocation Tracker based on unique internal node IDs
  useEffect(() => {
    if (currentStep > 0 && tokens[currentStep-1] && tokens[currentStep]) {
      const collectNodes = (node, acc = {}) => {
        if (!node || typeof node !== 'object') return acc;
        if (node.id) acc[node.id] = node;
        if (node.left) collectNodes(node.left, acc);
        if (node.right) collectNodes(node.right, acc);
        if (node.next) collectNodes(node.next, acc);
        return acc;
      };

      const prevNodes = {};
      const currNodes = {};

      Object.values(tokens[currentStep-1].memoryStructures.trees).forEach(n => collectNodes(n, prevNodes));
      Object.values(tokens[currentStep].memoryStructures.trees).forEach(n => collectNodes(n, currNodes));

      const newlyDeleted = [];
      Object.keys(prevNodes).forEach(id => {
        if (!currNodes[id]) {
          newlyDeleted.push({
            name: `Node ${id.substring(2)}`,
            type: prevNodes[id].hasOwnProperty('next') ? 'List Node' : 'Tree Node',
            data: prevNodes[id],
            step: currentStep
          });
        }
      });

      if (newlyDeleted.length > 0) {
        setDeletedVault(prev => {
          const filtered = prev.filter(p => p.step !== currentStep);
          return [...filtered, ...newlyDeleted];
        });
      }
    }
    if (currentStep === 0) setDeletedVault([]);
  }, [currentStep, tokens]);

  // Monaco Line Highlighting
  useEffect(() => {
    if (editorRef.current && monacoRef.current && currentState?.line) {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(currentState.line, 1, currentState.line, 1),
          options: {
            isWholeLine: true,
            className: 'active-line-monaco',
            glyphMarginClassName: 'active-line-glyph-monaco'
          }
        }
      ]);
      editor.revealLineInCenter(currentState.line);
    } else if (editorRef.current && !currentState) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentState]);

  const performCompilation = useCallback(() => {
    try {
      const steps = compileAndRun(code, language);
      setTokens(steps);
      setError(null);
      return steps;
    } catch(e) { setError(e.message); setTokens([]); return []; }
  }, [code, language]);

  const reset = useCallback(() => { 
    setCurrentStep(0); 
    setIsPlaying(false); 
    if (timerRef.current) clearInterval(timerRef.current); 
    setDeletedVault([]); 
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => { performCompilation(); reset(); }, 800);
    return () => clearTimeout(timeout);
  }, [code, language, performCompilation, reset]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= tokens.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying, speed, tokens.length]);

  const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    setError(null);
    try {
      const processedCanvas = await preprocessImage(file);
      const worker = window.Tesseract;
      if (!worker) {
        throw new Error("Tesseract engine failed to load. Please check your internet connection.");
      }
      const { data } = await worker.recognize(processedCanvas, 'eng');
      const scannedText = data.text.replace(/‘|’|`|´/g, "'").replace(/“|”/g, '"');
      
      setCode(scannedText);
      const detectedLang = detectLanguage(scannedText);
      setLanguage(detectedLang);
    } catch (err) { 
      setError('OCR Scanner Failed: ' + err.message); 
    } finally { 
      setIsScanning(false); 
    }
  };

  const loadTemplate = (templateKey) => {
    const template = CODE_TEMPLATES[templateKey];
    if (template) {
      setCode(template.code);
      setLanguage(template.language);
      reset();
    }
  };

  return (
    <div className="cv-container">
      <Hyperspeed />
      <div className="cv-inner">
        <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="cv-header">
          <Terminal className="cv-icon-terminal" size={32} />
          <div>
            <h1>Mandate: Optical Execution Engine</h1>
            <p>ISO-26 Flawless AST Trace Mapping Visualization</p>
          </div>
        </motion.div>

        <div className="cv-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="cv-panel">
               <div className="cv-panel-header">
                  <div className="cv-panel-title"><Code size={16} /> Source Code</div>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <input type="file" ref={fileInputRef} onChange={handleScanImage} accept="image/*" style={{display:'none'}} />
                    <button onClick={() => fileInputRef.current?.click()} className="cv-btn-icon highlight-camera" disabled={isScanning}>
                      {isScanning ? <RefreshCw className="spin" size={16} /> : <Camera size={16} />} <span style={{marginLeft:'5px'}}>Scan</span>
                    </button>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="cv-language-select">
                      <option value="javascript">JS</option>
                      <option value="python">Py</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
               </div>
               <div className="monaco-editor-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,153,255,0.3)', boxShadow: 'var(--clay-sm)' }}>
                 <Editor
                   height="360px"
                   language={language === 'cpp' ? 'cpp' : language}
                   theme="vs-dark"
                   value={code}
                   onMount={handleEditorDidMount}
                   onChange={(val) => setCode(val || '')}
                   options={{ 
                     minimap: { enabled: false }, 
                     fontSize: 14, 
                     scrollBeyondLastLine: false, 
                     lineNumbers: 'on', 
                     roundedSelection: true, 
                     fontFamily: "'Share Tech Mono', monospace", 
                     padding: { top: 10, bottom: 10 }, 
                     automaticLayout: true, 
                     backgroundColor: '#0d0b14' 
                   }}
                 />
              </div>
              
              {/* Presets and Quick Templates Panel */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '5px' }}>Presets:</span>
                {Object.entries(CODE_TEMPLATES).map(([key, t]) => (
                  <button key={key} onClick={() => loadTemplate(key)} className="cv-btn-icon" style={{ padding: '6px 12px', textTransform: 'none' }}>
                    {t.name}
                  </button>
                ))}
              </div>

               {error && <div className="cv-error" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><AlertCircle size={16}/> {error}</div>}
            </div>

            <div className="cv-panel">
               <div className="cv-controls">
                  <button className="cv-btn cv-btn-secondary" onClick={reset}><RotateCcw size={16}/> Reset</button>
                  <button className="cv-btn cv-btn-warning" onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)) }} disabled={currentStep === 0}><SkipBack size={16}/> Undo</button>
                  {isPlaying ? (
                    <button className="cv-btn cv-btn-warning" onClick={() => setIsPlaying(false)}><Pause size={16}/> Pause</button>
                  ) : (
                    <button className="cv-btn cv-btn-primary" onClick={() => setIsPlaying(true)} disabled={currentStep >= tokens.length - 1}><Play size={16}/> Play</button>
                  )}
                  <button className="cv-btn cv-btn-secondary" onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(tokens.length - 1, currentStep + 1)) }} disabled={currentStep >= tokens.length - 1}><SkipForward size={16}/> Step</button>
               </div>
               <div className="cv-progress-container">
                  <div className="cv-progress-text">
                     <span>Trace Step {currentStep + 1} / {tokens.length || 1}</span>
                     <span>{tokens.length ? Math.round(((currentStep+1)/tokens.length)*100) : 0}%</span>
                  </div>
                  <div className="cv-progress-bar"><div className="cv-progress-fill" style={{width: `${tokens.length ? ((currentStep+1)/tokens.length)*100 : 0}%`}}></div></div>
               </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="cv-panel execution-tracker">
                <div className="cv-panel-title" style={{justifyContent: 'space-between'}}>
                   <div style={{display:'flex', alignItems:'center', gap: '8px'}}><Activity size={16}/> Execution Trace</div>
                   <div className="why-indicator" onMouseEnter={() => setShowExplanation(true)} onMouseLeave={() => setShowExplanation(false)}>
                      <Info size={18} color="#FCEE09" style={{cursor:'help'}}/>
                      <AnimatePresence>
                        {showExplanation && (
                          <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="why-popup">
                            <div className="why-title">ALGORITHMIC JUSTIFICATION</div>
                            <div className="why-text">{currentState?.why || "Processing logical compute."}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
                 <div className="cv-code-block" style={{marginTop:'10px', fontSize:'14px', position: 'relative'}}>
                    {currentState ? `[L${currentState.line}] :: ${currentState.code}` : "AWAITING COMPILATION..."}
                 </div>
              </div>

              <div className="cv-panel explainable-ai-panel">
                <div className="cv-panel-title"><Info size={16}/> Explainable AI</div>
                <div className="cv-code-block" style={{marginTop:'10px', fontSize:'14px', position: 'relative', borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)'}}>
                  {currentState?.why || "Awaiting execution..."}
                </div>
              </div>

              <div className="cv-panel memory-mapper" style={{position:'relative'}}>
                 <div className="cv-panel-title"><Layers size={16}/> Memory Heap Topology</div>
                 <div className="render-canvas">
                     <div className="visual-layers-stack">
                        <div className="layer current-layer">
                           {currentState && (
                             <>
                               {Object.entries(currentState.memoryStructures.arrays).map(([name, arr]) => (
                                 <GlassArray key={name} name={name} arr={arr} />
                               ))}
                               {Object.entries(currentState.memoryStructures.trees)
                                 .filter(([name, node]) => node && !node.isReference)
                                 .map(([name, node]) => {
                                    if (node.hasOwnProperty('next')) {
                                      return <GlassList key={name} name={name} head={node} />;
                                    } else {
                                      return <GlassTree key={name} name={name} node={node} />;
                                    }
                                 })}
                             </>
                           )}
                           {(!currentState || 
                             (Object.keys(currentState.memoryStructures.arrays).length === 0 && 
                              Object.keys(currentState.memoryStructures.trees).length === 0)) && (
                             <div className="heap-placeholder" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px', fontStyle: 'italic', fontSize: '14px' }}>
                               Heap is currently empty. Allocate nodes (e.g. root = new Node(10)) or arrays to visualize the topology.
                             </div>
                           )}
                        </div>
                     </div>
                 </div>
              </div>

              {currentState && deletedVault.length > 0 && (
                 <div className="cv-panel vault-panel">
                    <div className="cv-panel-title"><Database size={16}/> DEALLOCATION VAULT (Deleted Nodes)</div>
                    <div className="vault-grid">
                       {deletedVault.map((item, i) => (
                         <div key={i} className="vault-item">
                            <div className="vault-item-header">
                               <span>{item.name} ({item.type})</span>
                               <span className="vault-step">Step {item.step}</span>
                            </div>
                            <div className="vault-preview">
                               {item.type === 'Array' ? (
                                 <GlassArray name={item.name} arr={item.data} />
                               ) : item.data.hasOwnProperty('next') ? (
                                 <GlassList name={item.name} head={item.data} />
                               ) : (
                                 <GlassTree name={item.name} node={item.data} />
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              )}

              <div className="cv-panel">
                <div className="cv-panel-title"><Terminal size={16}/> Console Log</div>
                <div className="cv-console" style={{ minHeight: '120px' }}>
                  {currentState && currentState.output && currentState.output.length > 0 ? (
                    currentState.output.map((out, j) => (
                      <div key={j} className="cv-console-line">
                        <span className="cv-console-prompt">$</span> 
                        <span className="cv-console-text">{out}</span>
                      </div>
                    ))
                  ) : (
                    <div className="cv-console-placeholder" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
                      Console is empty. Run or step through code to see outputs.
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeVisualizer;