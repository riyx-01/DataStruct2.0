import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import Hyperspeed from '../components/ui/Hyperspeed';
import { 
  Play, Pause, RotateCcw, SkipForward, SkipBack, Terminal, 
  Database, ChevronRight, Activity, Box, AlertCircle, Code, Camera, RefreshCw, Layers, Eye, Ghost, Info
} from 'lucide-react';

import './CodeVisualizerPage.css';

// ==================== PYTHON TRACE SCRIPT ====================
const PYTHON_TRACE_SCRIPT = `
import sys

class TraceState:
    def __init__(self):
        self.history = []
        self.console_output = []
        self.step_count = 0
        self.max_steps = 1000

trace_state = TraceState()

class ConsoleMock:
    def write(self, text):
        if text:
            if not trace_state.console_output:
                trace_state.console_output.append("")
            if text == '\\n':
                trace_state.console_output.append("")
            else:
                trace_state.console_output[-1] += text
    def flush(self):
        pass

sys.stdout = ConsoleMock()

def serialize_val(val, visited=None):
    if visited is None:
        visited = set()
    if val is None:
        return None
    if isinstance(val, (int, float, str, bool)):
        return val
    
    val_id = id(val)
    if val_id in visited:
        return {"isReference": True, "targetId": hex(val_id)}
    
    visited.add(val_id)
    
    if isinstance(val, list):
        return [serialize_val(item, visited) for item in val]
    if isinstance(val, dict):
        return {str(k): serialize_val(v, visited) for k, v in val.items()}
        
    if hasattr(val, '__dict__'):
        fields = {}
        for k, v in val.__dict__.items():
            if not k.startswith('_'):
                fields[k] = serialize_val(v, visited)
        
        res = {
            "id": hex(val_id),
            "type": "ref",
            "class": val.__class__.__name__,
            "val": getattr(val, 'val', getattr(val, 'value', getattr(val, 'data', None)))
        }
        for link in ['left', 'right', 'next', 'prev']:
            if hasattr(val, link):
                res[link] = serialize_val(getattr(val, link), visited)
        
        for k, v in fields.items():
            if k not in ['left', 'right', 'next', 'prev', 'val', 'value', 'data']:
                res[k] = v
        return res
        
    return str(val)

def trace_calls(frame, event, arg):
    if event != 'call':
        return
    return trace_lines

def trace_lines(frame, event, arg):
    if event == 'line':
        if trace_state.step_count > trace_state.max_steps:
            raise Exception("Infinite loop protection triggered.")
        
        line_no = frame.f_lineno
        variables = {}
        memory_structures = {"arrays": {}, "trees": {}, "graphs": {}, "stacks": {}, "objects": {}}
        
        local_vars = {
            k: v for k, v in frame.f_locals.items() 
            if not k.startswith('__') and k not in ['sys', 'trace_state', 'ConsoleMock', 'serialize_val', 'trace_calls', 'trace_lines', 'user_code', 'namespace']
        }
        
        for k, v in local_vars.items():
            if hasattr(v, '__call__') or isinstance(v, type):
                continue
            
            serialized = serialize_val(v)
            if isinstance(serialized, list):
                memory_structures["arrays"][k] = serialized
            elif isinstance(serialized, dict) and serialized.get("type") == "ref":
                if any(x in serialized for x in ['left', 'right', 'next', 'prev']):
                    memory_structures["trees"][k] = serialized
                else:
                    memory_structures["objects"][k] = serialized
            else:
                variables[k] = serialized
                
        code_lines = user_code.split('\\n')
        code_line = code_lines[line_no - 1].strip() if 0 < line_no <= len(code_lines) else ""
        
        why = "Executing instruction."
        if "push" in code_line or "append" in code_line:
            why = "Stack / List Push: Appending element to internal collection."
        elif "pop" in code_line:
            why = "Stack / List Pop: Removing and returning elements."
        elif "peek" in code_line or "[-1]" in code_line:
            why = "Stack Peek: Accessing top of stack."
            
        trace_state.history.append({
            "line": line_no,
            "code": code_line,
            "variables": variables,
            "memoryStructures": memory_structures,
            "why": why,
            "deletedElements": [],
            "output": [line for line in trace_state.console_output if line.strip()]
        })
        trace_state.step_count += 1
    return trace_lines

namespace = {}
try:
    sys.settrace(trace_calls)
    exec(user_code, namespace)
except Exception as e:
    err_msg = f"Traceback Error: {str(e)}"
    trace_state.console_output.append(err_msg)
    
    last_state = trace_state.history[-1] if trace_state.history else None
    line_no = 1
    tb = sys.exc_info()[2]
    while tb and tb.tb_next:
        tb = tb.tb_next
    if tb:
        line_no = tb.tb_lineno
        
    code_lines = user_code.split('\\n')
    code_line = code_lines[line_no - 1].strip() if 0 < line_no <= len(code_lines) else "Error line"
    
    trace_state.history.append({
        "line": line_no,
        "code": code_line,
        "variables": last_state["variables"] if last_state else {},
        "memoryStructures": last_state["memoryStructures"] if last_state else {"arrays": {}, "trees": {}, "graphs": {}, "stacks": {}, "objects": {}},
        "why": f"Runtime Exception: {err_msg}",
        "deletedElements": [],
        "output": [line for line in trace_state.console_output if line.strip()]
    })
finally:
    sys.settrace(None)
    sys.stdout = sys.__stdout__
    
    # Capture absolute final state mutations
    final_vars = {}
    final_memory = {"arrays": {}, "trees": {}, "graphs": {}, "stacks": {}, "objects": {}}
    for k, v in namespace.items():
        if k.startswith('__') or k in ['sys', 'trace_state', 'ConsoleMock', 'serialize_val', 'trace_calls', 'trace_lines', 'user_code', 'namespace'] or hasattr(v, '__call__') or isinstance(v, type):
            continue
        serialized = serialize_val(v)
        if isinstance(serialized, list):
            final_memory["arrays"][k] = serialized
        elif isinstance(serialized, dict) and serialized.get("type") == "ref":
            if any(x in serialized for x in ['left', 'right', 'next', 'prev']):
                final_memory["trees"][k] = serialized
            else:
                final_memory["objects"][k] = serialized
        else:
            final_vars[k] = serialized
            
    code_lines = user_code.split('\\n')
    trace_state.history.append({
        "line": len(code_lines),
        "code": "Execution completed",
        "variables": final_vars,
        "memoryStructures": final_memory,
        "why": "Execution completed. Visualizing final program state.",
        "deletedElements": [],
        "output": [line for line in trace_state.console_output if line.strip()]
    })
    
    import json
    trace_history_json = json.dumps(trace_state.history)
`;

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
  python_queue: {
    name: "Python List Queue",
    language: "python",
    code: `queue = [] 
queue.append(10) 
queue.append(20)
queue.append(30)

print("Queue:", queue)

# Dequeue the first element
queue.pop(0) 
print("After dequeue:", queue)`
  },
  python_stack: {
    name: "Python Stack Class",
    language: "python",
    code: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if self.items:
            return self.items.pop()
        return None

    def peek(self):
        if self.items:
            return self.items[-1]
        return None

s = Stack()
s.push(10)
s.push(20)

print(s.pop())
print(s.peek())`
  },
  cpp_stack: {
    name: "C++ Stack Push/Pop",
    language: "cpp",
    code: `#include <iostream>
using namespace std;

int main() {
    int stack[5];
    int top = -1;

    stack[++top] = 18;
    stack[++top] = 28;
    stack[++top] = 38;

    cout << "Stack elements: ";

    for(int i = 0; i <= top; i++)
        cout << stack[i] << " ";

    top--;

    cout << "\\nAfter pop: ";

    for(int i = 0; i <= top; i++)
        cout << stack[i] << " ";
}`
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

// Intelligent Virtual Instruction Interpreter for JS / Python / Java / C++
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
    const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {}, objects: {} };
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

  // Expression Resolver with side-effects (prefix/postfix increments, index lookups, method calls)
  const resolveExpression = (expr) => {
    const clean = expr.trim();
    if (clean === 'null' || clean === 'None' || clean === 'nullptr' || clean === 'undefined') {
      return null;
    }
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      return clean.slice(1, -1);
    }
    if (!isNaN(clean) && clean !== '') {
      return Number(clean);
    }
    
    // Array/List mutation method calls with return values: stack.pop(), queue.pop(0), stack.peek()
    const methodCallMatch = clean.match(/^([\w*&]+)\.(pop|shift|peek)\s*\(([^)]*)\)$/);
    if (methodCallMatch) {
      const arrayName = methodCallMatch[1].replace(/^[*&]+/, '');
      const method = methodCallMatch[2];
      const argsStr = methodCallMatch[3].trim();
      
      if (Array.isArray(variables[arrayName])) {
        const arr = variables[arrayName];
        if (method === 'pop') {
          if (argsStr !== '') {
            const idx = resolveExpression(argsStr);
            if (idx >= 0 && idx < arr.length) {
              return arr.splice(idx, 1)[0];
            }
            return undefined;
          } else {
            return arr.pop();
          }
        } else if (method === 'shift') {
          return arr.shift();
        } else if (method === 'peek') {
          return arr.length > 0 ? arr[arr.length - 1] : undefined;
        }
      }
    }
    
    // Prefix / Postfix increments
    if (clean.startsWith('++')) {
      const varName = clean.substring(2).trim();
      if (variables[varName] !== undefined) {
        variables[varName] = Number(variables[varName]) + 1;
        return variables[varName];
      }
    }
    if (clean.startsWith('--')) {
      const varName = clean.substring(2).trim();
      if (variables[varName] !== undefined) {
        variables[varName] = Number(variables[varName]) - 1;
        return variables[varName];
      }
    }
    if (clean.endsWith('++')) {
      const varName = clean.substring(0, clean.length - 2).trim();
      if (variables[varName] !== undefined) {
        const oldVal = variables[varName];
        variables[varName] = Number(variables[varName]) + 1;
        return oldVal;
      }
    }
    if (clean.endsWith('--')) {
      const varName = clean.substring(0, clean.length - 2).trim();
      if (variables[varName] !== undefined) {
        const oldVal = variables[varName];
        variables[varName] = Number(variables[varName]) - 1;
        return oldVal;
      }
    }
    
    // Array index lookup: stack[top], stack[++top]
    const arrayIndexMatch = clean.match(/^(\w+)\s*\[([^\]]*)\]$/);
    if (arrayIndexMatch) {
      const arrayName = arrayIndexMatch[1];
      const indexExpr = arrayIndexMatch[2].trim();
      const resolvedIndex = resolveExpression(indexExpr);
      if (Array.isArray(variables[arrayName])) {
        return variables[arrayName][resolvedIndex];
      }
    }
    
    // Node property lookup: node.val
    const fieldMatch = clean.match(/^(\w+)\.(\w+)$/);
    if (fieldMatch) {
      const varName = fieldMatch[1];
      const fieldName = fieldMatch[2];
      const ref = variables[varName];
      if (ref && ref.type === 'ref' && heap[ref.id]) {
        return heap[ref.id][fieldName];
      }
    }
    
    if (variables[clean] !== undefined) {
      return variables[clean];
    }
    
    return undefined;
  };

  const executeSingleLine = (rawLine, lineNum) => {
    let line = rawLine.trim();
    if (line.includes('//')) {
      line = line.split('//')[0].trim();
    }
    if (!line || line.startsWith('/*') || line.startsWith('*')) {
      return;
    }
    
    let why = "Executing logical instruction.";
    
    // 1. C++ style cout (cout << ...)
    if (line.includes('cout') && line.includes('<<')) {
      why = "Standard Output: Broadcasting internal state to the virtual C++ console.";
      const parts = line.split('<<').slice(1).map(p => p.trim());
      let lineOutput = "";
      
      parts.forEach(part => {
        let cleanPart = part;
        if (cleanPart.endsWith(';')) cleanPart = cleanPart.slice(0, -1).trim();
        
        if ((cleanPart.startsWith('"') && cleanPart.endsWith('"')) || (cleanPart.startsWith("'") && cleanPart.endsWith("'"))) {
          lineOutput += cleanPart.slice(1, -1);
        } else if (cleanPart === 'endl' || cleanPart === '"\\n"') {
          currentOutput.push(lineOutput);
          lineOutput = "";
        } else {
          const val = resolveExpression(cleanPart);
          lineOutput += val !== undefined ? String(val) : cleanPart;
        }
      });
      
      if (lineOutput) {
        if (lineOutput.includes('\\n')) {
          const subparts = lineOutput.split('\\n');
          subparts.forEach((sp, sidx) => {
            if (sidx === 0) {
              if (currentOutput.length === 0) currentOutput.push(sp);
              else currentOutput[currentOutput.length - 1] += sp;
            } else {
              currentOutput.push(sp);
            }
          });
        } else {
          if (currentOutput.length === 0) {
            currentOutput.push(lineOutput);
          } else {
            currentOutput[currentOutput.length - 1] += lineOutput;
          }
        }
      }
    }
    // 2. JS console.log or Python print
    else if (line.includes('print(') || line.includes('console.log')) {
      why = "Standard Output: Broadcasting internal state to the virtual console.";
      const printMatch = line.match(/(?:print|console\.log)\(([^)]*)\)/);
      if (printMatch) {
        const argsStr = printMatch[1];
        const args = argsStr.split(',').map(a => a.trim());
        const resolvedArgs = args.map(arg => {
          const val = resolveExpression(arg);
          if (Array.isArray(val)) {
             return "[" + val.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(', ') + "]";
          }
          return val !== undefined ? String(val) : arg;
        });
        currentOutput.push(resolvedArgs.join(' '));
      }
    }
    // 3. Array Instantiation: int stack[5]; or queue = []
    else if (line.match(/^(\w+)\s+(\w+)\s*\[\s*\d*\s*\]\s*;?$/)) {
      why = "Memory Allocation: Initializing array structure in stack/heap.";
      const match = line.match(/^(\w+)\s+(\w+)\s*\[\s*\d*\s*\]\s*;?$/);
      const name = match[2];
      variables[name] = [];
    }
    // 4. Array mutations: queue.append(10), stack.push(20), stack.pop()
    else if (line.match(/^([\w*&]+)\.(append|push|push_back|pop|shift|unshift|insert)\s*\(([^)]*)\);?$/)) {
      const arrayIndexMatch = line.match(/^([\w*&]+)\.(append|push|push_back|pop|shift|unshift|insert)\s*\(([^)]*)\);?$/);
      const arrayName = arrayIndexMatch[1].replace(/^[*&]+/, '');
      const method = arrayIndexMatch[2];
      const argsStr = arrayIndexMatch[3].trim();
      
      why = `Heap Mutation: Executing list operation .${method}() on ${arrayName}.`;
      
      if (!variables[arrayName]) {
        variables[arrayName] = [];
      }
      
      if (Array.isArray(variables[arrayName])) {
        const arr = variables[arrayName];
        if (method === 'append' || method === 'push' || method === 'push_back') {
          const val = resolveExpression(argsStr);
          arr.push(val);
        } else if (method === 'pop') {
          if (argsStr !== '') {
            const idx = resolveExpression(argsStr);
            if (idx >= 0 && idx < arr.length) {
              arr.splice(idx, 1);
            } else {
              currentOutput.push(`Traceback Error: pop index out of range`);
            }
          } else {
            arr.pop();
          }
        } else if (method === 'shift') {
          arr.shift();
        } else if (method === 'unshift') {
          const val = resolveExpression(argsStr);
          arr.unshift(val);
        } else if (method === 'insert') {
          const parts = argsStr.split(',').map(p => p.trim());
          if (parts.length === 2) {
            const idx = resolveExpression(parts[0]);
            const val = resolveExpression(parts[1]);
            arr.splice(idx, 0, val);
          }
        }
      }
    }
    // 5. Standalone increment / decrement statement: top--; or ++top;
    else if (line.match(/^(\+\+|--)?\s*(\w+)\s*(\+\+|--)?\s*;?$/)) {
      why = "State Mutation: Modifying variable value.";
      resolveExpression(line);
    }
    // 6. Variable Assignments with =
    else if (line.includes('=')) {
      const eqIdx = line.indexOf('=');
      const lhs = line.substring(0, eqIdx).trim();
      let rhs = line.substring(eqIdx + 1).trim();
      if (rhs.endsWith(';')) rhs = rhs.slice(0, -1).trim();
      
      // Pointer update: parent.left = target
      const fieldMatch = lhs.match(/^([\w*&]+)\.(\w+)$/);
      if (fieldMatch) {
        why = "Pointer Update: Modifying the link between nodes. This changes the structural topology of the tree.";
        let parentName = fieldMatch[1].replace(/^[*&]+/, '');
        const pointerName = fieldMatch[2];
        const parentRef = variables[parentName];
        
        if (parentRef && parentRef.type === 'ref' && heap[parentRef.id]) {
          const nodeAllocMatch = rhs.match(/^(?:new\s+)?Node\(([^)]*)\)$/);
          if (nodeAllocMatch) {
            const valStr = nodeAllocMatch[1].trim();
            const val = isNaN(valStr) ? valStr.replace(/['"]/g, '') : Number(valStr);
            const childId = createNode(val);
            heap[parentRef.id][pointerName] = childId;
          } else {
            const resolvedRhs = resolveExpression(rhs);
            if (resolvedRhs && typeof resolvedRhs === 'object' && resolvedRhs.type === 'ref') {
              heap[parentRef.id][pointerName] = resolvedRhs.id;
            } else {
              heap[parentRef.id][pointerName] = null;
            }
          }
        }
      }
      // Array index assignment: stack[++top] = 18
      else {
        const arrayIndexMatch = lhs.match(/^([\w*&]+)\s*\[([^\]]*)\]$/);
        if (arrayIndexMatch) {
          why = "Heap Write: Updating value at specific index in dynamic array.";
          const arrayName = arrayIndexMatch[1].replace(/^[*&]+/, '');
          const indexExpr = arrayIndexMatch[2].trim();
          const resolvedIndex = resolveExpression(indexExpr);
          const resolvedVal = resolveExpression(rhs);
          
          if (!variables[arrayName]) {
            variables[arrayName] = [];
          }
          variables[arrayName][resolvedIndex] = resolvedVal;
        }
        // General assignment (e.g. int top = -1, queue = [])
        else {
          why = "State Mutation: Binding a new value to a variable descriptor.";
          const varMatch = lhs.match(/([\w*&]+)$/);
          if (varMatch) {
            const varName = varMatch[1].replace(/^[*&]+/, '');
            
            const nodeAllocMatch = rhs.match(/^(?:new\s+)?Node\(([^)]*)\)$/);
            if (nodeAllocMatch) {
              const valStr = nodeAllocMatch[1].trim();
              const val = isNaN(valStr) ? valStr.replace(/['"]/g, '') : Number(valStr);
              const id = createNode(val);
              variables[varName] = { type: 'ref', id };
            } else {
              variables[varName] = resolveExpression(rhs);
            }
          }
        }
      }
    }
    
    history.push(captureState(lineNum, rawLine.trim(), why));
  };

  // Run the loop interpreter
  let lineIdx = 0;
  while (lineIdx < lines.length) {
    const rawLine = lines[lineIdx];
    let line = rawLine.trim();
    
    if (line.includes('//')) {
      line = line.split('//')[0].trim();
    }
    
    if (!line || line.startsWith('/*') || line.startsWith('*')) {
      lineIdx++;
      continue;
    }
    
    // Check if it's a simple for loop: for(int i = 0; i <= top; i++)
    const forLoopMatch = line.match(/for\s*\(\s*(?:int|let|var)?\s*(\w+)\s*=\s*([^;]+)\s*;\s*\1\s*(<=|<)\s*([^;]+)\s*;\s*\1\s*(?:\+\+|--)\s*\)/);
    if (forLoopMatch) {
      const varName = forLoopMatch[1];
      const startExpr = forLoopMatch[2];
      const op = forLoopMatch[3];
      const endExpr = forLoopMatch[4];
      
      const startVal = Number(resolveExpression(startExpr));
      
      let bodyLines = [];
      let nextIdx = lineIdx + 1;
      if (lines[nextIdx] && lines[nextIdx].trim() === '{') {
        nextIdx++;
        while (nextIdx < lines.length && lines[nextIdx].trim() !== '}') {
          bodyLines.push(lines[nextIdx]);
          nextIdx++;
        }
        lineIdx = nextIdx + 1;
      } else {
        if (lines[nextIdx]) {
          bodyLines.push(lines[nextIdx]);
        }
        lineIdx = nextIdx + 1;
      }
      
      variables[varName] = startVal;
      let limitVal = Number(resolveExpression(endExpr));
      const isWithinLimit = op === '<=' ? (v => v <= limitVal) : (v => v < limitVal);
      
      while (isWithinLimit(variables[varName])) {
        bodyLines.forEach(bodyLine => {
          executeSingleLine(bodyLine, lineIdx);
        });
        variables[varName] = variables[varName] + 1;
        limitVal = Number(resolveExpression(endExpr));
      }
      continue;
    }
    
    executeSingleLine(rawLine, lineIdx + 1);
    lineIdx++;
  }
  
  return history;
};

// Compile and Trace JS natively using AST instrumentation
const compileAndRun = (rawCode, language) => {
  const history = [];
  const code = convertHashComments(rawCode);
  
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
        const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {}, objects: {} };

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
               memoryStructures.objects[key] = cloneStructure(val) || __clone(val);
             }
          } else {
            variables[key] = val;
          }
        }

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
        
        if (codeLine.includes('root =') || codeLine.includes('Node(')) why = "Memory Allocation: Creating a new object in the heap.";
        else if (codeLine.includes('return')) why = "Returning Control: Exiting current frame.";
        else if (codeLine.includes('.left') || codeLine.includes('.right')) why = "Pointer Update: Modifying the link between nodes.";
        else if (codeLine.includes('.next')) why = "Linked Connection: Updating the directional edge.";
        else if (codeLine.includes('arr.push') || codeLine.includes('.push')) why = "Heap Push: Growing a dynamic array.";
        else if (codeLine.includes('for') || codeLine.includes('while')) why = "Iterative Branch: Evaluating loop condition.";
        else if (codeLine.includes('if')) why = "Logical Fork: Evaluating boolean predicate.";
        else if (codeLine.includes('=')) why = "State Mutation: Binding a new value to a variable descriptor.";
        else if (codeLine.includes('console.log')) why = "Standard Output: Broadcasting internal state to the console.";

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
      const contrastFactor = (259 * (140 + 255)) / (255 * (259 - 140));
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        const enhanced = contrastFactor * (gray - 128) + 128;
        const clamped = Math.max(0, Math.min(255, enhanced));
        
        data[i] = clamped;
        data[i + 1] = clamped;
        data[i + 2] = clamped;
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas);
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
  if (normalized.includes('def ') || (normalized.includes('import ') && normalized.includes(':')) || (normalized.includes('print ') && !normalized.includes(';'))) {
    return 'python';
  }
  if (normalized.includes('let ') || normalized.includes('const ') || normalized.includes('console.log') || normalized.includes('document.get') || normalized.includes('function ')) {
    return 'javascript';
  }
  return 'javascript';
};

// ==================== LIQUID GLASS RENDERERS ====================

const GlassArray = ({ name, arr, variables }) => {
  const topVar = variables && (variables.top !== undefined ? Number(variables.top) : (variables.topIndex !== undefined ? Number(variables.topIndex) : null));
  const isStack = name.toLowerCase().includes('stack') || topVar !== null;

  return (
    <div className="iso-glass-container">
      <div className="iso-title">Array / Stack : <span>{name}</span></div>
      <div className="iso-array">
        {arr.map((val, idx) => {
          const isInactive = isStack && topVar !== null && idx > topVar;
          return (
            <div key={idx} className={`iso-array-cell ${isInactive ? 'inactive-stack-cell' : ''}`}>
               <div className="iso-cell-value">{typeof val === 'object' ? '{...}' : String(val)}</div>
               <div className="iso-cell-index">{idx}</div>
               {topVar === idx && <div className="stack-top-pointer">top</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

const GlassObject = ({ name, obj }) => (
  <div className="iso-glass-container">
    <div className="iso-title">Object / Instance : <span>{name} ({obj.class || 'Object'})</span></div>
    <div className="iso-object-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
      {Object.entries(obj).map(([key, val]) => {
        if (['id', 'type', 'class', 'val', 'variables'].includes(key)) return null;
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--primary-light)', fontWeight: 'bold', fontSize: '12px' }}>{key}</span>
            <span style={{ color: 'var(--text-main)', fontSize: '13px', fontFamily: 'monospace' }}>
              {Array.isArray(val) ? `[ ${val.join(', ')} ]` : typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

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
  
  const [pyodide, setPyodide] = useState(null);

  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // Initialize Pyodide on Mount
  useEffect(() => {
    const initPyodide = async () => {
      if (window.loadPyodide) {
        try {
          const py = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
          });
          setPyodide(py);
        } catch(e) {
          console.error("Pyodide failed to load:", e);
        }
      }
    };
    initPyodide();
  }, []);

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

  const performCompilation = useCallback(async () => {
    try {
      let steps = [];
      if (language === 'python') {
        if (!pyodide) {
          setError("Python environment initializing. Please wait...");
          return [];
        }
        setError(null);
        pyodide.globals.set('user_code', code);
        await pyodide.runPythonAsync(PYTHON_TRACE_SCRIPT);
        const jsonStr = pyodide.globals.get('trace_history_json');
        steps = JSON.parse(jsonStr);
      } else {
        steps = compileAndRun(code, language);
      }
      setTokens(steps);
      setError(null);
      return steps;
    } catch(e) { 
      setError(e.message); 
      setTokens([]); 
      return []; 
    }
  }, [code, language, pyodide]);

  const reset = useCallback(() => { 
    setCurrentStep(0); 
    setIsPlaying(false); 
    if (timerRef.current) clearInterval(timerRef.current); 
    setDeletedVault([]); 
  }, []);

  useEffect(() => {
    const run = async () => {
      await performCompilation();
      reset();
    };
    const timeout = setTimeout(run, 800);
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

  const updateCodeAndEditor = (newCode, lang) => {
    setCode(newCode);
    if (lang) setLanguage(lang);
    if (editorRef.current) {
      editorRef.current.setValue(newCode);
    }
  };

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
      
      const scannedText = data.text
        .replace(/[\u2018\u2019\u201A\u201B\u00B4\u02CB`]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/\u00A0/g, ' ')
        .replace(/\r\n/g, '\n');
      
      const detectedLang = detectLanguage(scannedText);
      updateCodeAndEditor(scannedText, detectedLang);
    } catch (err) { 
      setError('OCR Scanner Failed: ' + err.message); 
    } finally { 
      setIsScanning(false); 
    }
  };

  const loadTemplate = (templateKey) => {
    const template = CODE_TEMPLATES[templateKey];
    if (template) {
      updateCodeAndEditor(template.code, template.language);
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
                                 <GlassArray key={name} name={name} arr={arr} variables={currentState.variables} />
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
                               {Object.entries(currentState.memoryStructures.objects || {}).map(([name, obj]) => (
                                 <GlassObject key={name} name={name} obj={obj} />
                               ))}
                             </>
                           )}
                           {(!currentState || 
                             (Object.keys(currentState.memoryStructures.arrays).length === 0 && 
                              Object.keys(currentState.memoryStructures.trees).length === 0 &&
                              Object.keys(currentState.memoryStructures.objects || {}).length === 0)) && (
                             <div className="heap-placeholder" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px', fontStyle: 'italic', fontSize: '14px' }}>
                               Heap is currently empty. Allocate nodes or objects to visualize.
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
                                 <GlassArray name={item.name} arr={item.data} variables={currentState.variables} />
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