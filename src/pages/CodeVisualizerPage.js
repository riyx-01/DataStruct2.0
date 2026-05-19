import React, { useState, useEffect, useRef, useCallback } from 'react';
// Force reload for UI updates
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import Hyperspeed from '../components/ui/Hyperspeed';
import { 
  Play, Pause, RotateCcw, SkipForward, SkipBack, Terminal, 
  Database, ChevronRight, Activity, Box, AlertCircle, Code, Camera, RefreshCw, Layers, Eye, Ghost, Info
} from 'lucide-react';

import './CodeVisualizerPage.css';

// ==================== EXECUTION ENGINE ====================

const __clone = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
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

const simulateExecution = (rawCode, language) => {
  const uniformCode = convertHashComments(rawCode);
  const lines = uniformCode.split('\n');
  const history = [];
  const variables = {};
  const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {} };
  let currentOutput = [];
  
  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    let line = rawLine.trim();
    
    // Strip trailing or line comments
    if (line.includes('//')) {
      line = line.split('//')[0].trim();
    }
    
    if (!line || line.startsWith('/*') || line.startsWith('*')) {
      return;
    }
    
    let why = "Executing logical instruction.";
    
    // Check if line is a print statement
    if (line.includes('print(') || line.includes('console.log')) {
      why = "Standard Output: Broadcasting internal state to the virtual console.";
      
      const printMatch = line.match(/(?:print|console\.log)\(([^)]*)\)/);
      if (printMatch) {
        const argsStr = printMatch[1];
        
        // Simple comma splitter that avoids splitting inside strings
        const args = [];
        let currentArg = "";
        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let i = 0; i < argsStr.length; i++) {
          const char = argsStr[i];
          if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
          else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
          
          if (char === ',' && !inSingleQuote && !inDoubleQuote) {
            args.push(currentArg.trim());
            currentArg = "";
          } else {
            currentArg += char;
          }
        }
        if (currentArg.trim()) {
          args.push(currentArg.trim());
        }
        
        const resolvedArgs = args.map(arg => {
          if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg.slice(1, -1);
          }
          if (variables[arg] !== undefined) return String(variables[arg]);
          if (memoryStructures.arrays[arg] !== undefined) return JSON.stringify(memoryStructures.arrays[arg]);
          if (memoryStructures.trees[arg] !== undefined) return '[Binary Tree]';
          return arg;
        });
        currentOutput.push(resolvedArgs.join(' '));
      }
    }
    // Check for push or append (support spaces, e.g. queue. append)
    else if (line.includes('arr.push') || line.includes('.push') || line.includes('.append')) {
      why = "Heap Push: Growing a dynamic structure dynamically in memory.";
      const appendMatch = line.match(/(\w+)\.\s*(?:append|push)\(([^)]*)\)/);
      if (appendMatch) {
        const name = appendMatch[1];
        const valStr = appendMatch[2].trim();
        const val = isNaN(valStr) ? (valStr.replace(/['"]/g, '') || '') : Number(valStr);
        if (!memoryStructures.arrays[name]) {
          memoryStructures.arrays[name] = [];
        }
        memoryStructures.arrays[name] = [...memoryStructures.arrays[name], val];
      }
    }
    // Check for pop (support spaces, e.g. queue. pop)
    else if (line.includes('.pop(') || line.includes('.pop0') || line.includes('.pop(0)')) {
      why = "Heap Pop: Dequeuing or removing an element from the dynamic structure.";
      const popMatch = line.match(/(\w+)\.\s*pop\(([^)]*)\)/);
      if (popMatch) {
        const name = popMatch[1];
        const arg = popMatch[2].trim();
        if (memoryStructures.arrays[name]) {
          const arrCopy = [...memoryStructures.arrays[name]];
          if (arg === '0') {
            arrCopy.shift();
          } else {
            arrCopy.pop();
          }
          memoryStructures.arrays[name] = arrCopy;
        }
      }
    }
    // Check tree node allocation
    else if (line.includes('root =') || line.includes('Node(') || line.includes('new Node')) {
      why = "Memory Allocation: Creating a new object in the heap. This allocates space for value and child pointers.";
      
      const treeMatch = line.match(/(\w+)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/);
      if (treeMatch) {
        const name = treeMatch[1];
        const valStr = treeMatch[2].trim();
        const val = isNaN(valStr) ? (valStr.replace(/['"]/g, '') || 10) : Number(valStr);
        memoryStructures.trees[name] = { val: val, left: null, right: null };
      }
      
      const treeLeftRightMatch = line.match(/(\w+)\.(left|right)\s*=\s*(?:new\s+)?Node\(([^)]*)\)/);
      if (treeLeftRightMatch) {
        const parentName = treeLeftRightMatch[1];
        const childSide = treeLeftRightMatch[2];
        const valStr = treeLeftRightMatch[3].trim();
        const val = isNaN(valStr) ? (valStr.replace(/['"]/g, '') || 5) : Number(valStr);
        if (memoryStructures.trees[parentName]) {
          const parentCopy = __clone(memoryStructures.trees[parentName]);
          parentCopy[childSide] = { val: val, left: null, right: null };
          memoryStructures.trees[parentName] = parentCopy;
        }
      }
    }
    else if (line.includes('return')) {
      why = "Returning Control: Exiting current frame and passing value back to the caller.";
    }
    else if (line.includes('.left') || line.includes('.right')) {
      why = "Pointer Update: Modifying the link between nodes. This changes the structural topology of the tree.";
    }
    else if (line.includes('.next')) {
      why = "Linked Connection: Updating the directional edge in the list structure.";
    }
    else if (line.includes('for ') || line.includes('while ')) {
      why = "Iterative Branch: Evaluating the loop guard to decide if another iteration is required.";
    }
    else if (line.includes('if ')) {
      why = "Logical Fork: Evaluating a boolean predicate to fork execution path.";
    }
    else if (line.includes('=')) {
      why = "State Mutation: Binding a new value to a variable descriptor in the current stack frame.";
      
      const assignMatch = line.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.*)/);
      if (assignMatch) {
        const name = assignMatch[1];
        let valStr = assignMatch[2].trim();
        if (valStr.endsWith(';')) valStr = valStr.slice(0, -1);
        if (valStr === '[]') {
          memoryStructures.arrays[name] = [];
        } else if (valStr.startsWith('[') && valStr.endsWith(']')) {
          try {
            const validJsonStr = valStr.replace(/'/g, '"');
            memoryStructures.arrays[name] = JSON.parse(validJsonStr);
          } catch {
            memoryStructures.arrays[name] = [];
          }
        } else {
          const num = Number(valStr);
          variables[name] = isNaN(num) ? valStr.replace(/['"]/g, '') : num;
        }
      }
    }
    
    history.push({
      line: lineNum,
      code: rawLine.trim(), // Keep raw line text for visual match
      variables: __clone(variables),
      memoryStructures: __clone(memoryStructures),
      why: why,
      deletedElements: [],
      output: [...currentOutput]
    });
  });
  
  return history;
};

const compileAndRun = (rawCode, language) => {
  const history = [];
  const code = convertHashComments(rawCode);
  
  const instrumentPlugin = ({ types: t }) => {
    return {
      visitor: {
        Statement(path) {
          if (!path.node.loc || path.node.__injected) return;
          if (!path.parentPath.isBlockStatement() && !path.parentPath.isProgram()) return;
          const line = path.node.loc.start.line;
          try {
            const traceStmt = t.expressionStatement(t.callExpression(t.identifier('__trace'), [t.numericLiteral(line), t.callExpression(t.identifier('eval'), [t.stringLiteral('({ ...typeof this !== "undefined" ? this : {}, ...typeof arguments !== "undefined" ? arguments : {}, ...((() => { try { return Object.fromEntries(Object.entries(eval("this") || {})); } catch { return {}; } })()) })') ] )]));
            traceStmt.__injected = true;
            path.insertAfter(traceStmt);
          } catch(e) { console.error(e); }
        }
      }
    };
  };

  let instrumentedCode = "";
  let success = false;
  
  if (language === 'javascript') {
    try {
      instrumentedCode = window.Babel.transform(code, { plugins: [instrumentPlugin], filename: 'visualizer.js' }).code;
      
      let currentOutput = [];
      let stepCount = 0;
      
      const __trace = (line, scope) => {
        if (stepCount++ > 3000) throw new Error("Infinite loop detected.");
        const variables = {};
        const memoryStructures = { arrays: {}, trees: {}, graphs: {}, stacks: {} };

        for (let key in scope) {
          const val = scope[key];
          if (val === undefined || typeof val === 'function') continue;
          if (Array.isArray(val)) { memoryStructures.arrays[key] = __clone(val); }
          else if (typeof val === 'object' && val !== null) {
             if ('left' in val || 'right' in val || 'value' in val || 'val' in val) memoryStructures.trees[key] = __clone(val);
             else if ('next' in val) memoryStructures.graphs[key] = __clone(val);
             else variables[key] = val;
          } else variables[key] = val;
        }

        const codeLine = rawCode.split('\n')[line - 1]?.trim() || '';
        let why = "Executing logical instruction.";
        
        // Semantic Heuristics for X-Ray
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

      const fakeConsole = { log: (...args) => { currentOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); } };
      
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
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Apply grayscaling and thresholding (contrast boost)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Binarization (threshold = 120)
        const v = gray < 120 ? 0 : 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
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

const GlassTree = ({ name, node }) => {
  const renderNode = (n) => {
    if (!n) return null;
    return (
      <div className="iso-tree-node-wrapper">
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
  const [code, setCode] = useState(`class Node {\n  constructor(val) {\n    this.val = val;\n    this.left = null;\n    this.right = null;\n  }\n}\nlet root = new Node(10);\nroot.left = new Node(5);\nroot.right = new Node(15);\nconsole.log(root);`);

  const [tokens, setTokens] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  
  // Feature States
  const [deletedVault, setDeletedVault] = useState([]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [ocrWarning, setOcrWarning] = useState(null);
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
    // Trigger initial layout
    setTimeout(() => editor.layout(), 100);
  };

  const currentState = tokens[currentStep];

  // Deallocation Tracker
  useEffect(() => {
    if (currentStep > 0 && tokens[currentStep-1] && tokens[currentStep]) {
      const prevArrayKeys = Object.keys(tokens[currentStep-1].memoryStructures.arrays);
      const currArrayKeys = Object.keys(tokens[currentStep].memoryStructures.arrays);
      const prevTreeKeys = Object.keys(tokens[currentStep-1].memoryStructures.trees);
      const currTreeKeys = Object.keys(tokens[currentStep].memoryStructures.trees);

      const newlyDeleted = [];
      prevArrayKeys.forEach(k => { if (!currArrayKeys.includes(k)) newlyDeleted.push({ name: k, type: 'Array', data: tokens[currentStep-1].memoryStructures.arrays[k], step: currentStep }); });
      prevTreeKeys.forEach(k => { if (!currTreeKeys.includes(k)) newlyDeleted.push({ name: k, type: 'Tree', data: tokens[currentStep-1].memoryStructures.trees[k], step: currentStep }); });

      if (newlyDeleted.length > 0) {
        setDeletedVault(prev => {
          const filtered = prev.filter(p => p.step !== currentStep);
          return [...filtered, ...newlyDeleted];
        });
      }
    }
    if (currentStep === 0) setDeletedVault([]);
  }, [currentStep, tokens]);

  // Monaco Decorations
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

  const reset = useCallback(() => { setCurrentStep(0); setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); setDeletedVault([]); }, []);

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
      // 1. Process image for ultra-high contrast (grayscale + binarize)
      const processedImageUrl = await preprocessImage(file);
      
      // 2. Perform fast OCR recognition on the preprocessed image
      const worker = window.Tesseract;
      const { data } = await worker.recognize(processedImageUrl, 'eng');
      const scannedText = data.text.replace(/‘|’|`|´/g, "'").replace(/“|”/g, '"');
      
      // 3. Update code and automatically detect programming language
      setCode(scannedText);
      const detectedLang = detectLanguage(scannedText);
      setLanguage(detectedLang);
    } catch (err) { 
      setError('OCR Failed: ' + err.message); 
    } finally { 
      setIsScanning(false); 
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
                  <div style={{display:'flex', gap:'10px'}}>
                    <input type="file" ref={fileInputRef} onChange={handleScanImage} accept="image/*" style={{display:'none'}} />
                    <button onClick={() => fileInputRef.current?.click()} className="cv-btn-icon highlight-camera" disabled={isScanning}>
                      {isScanning ? <RefreshCw className="spin" size={16} /> : <Camera size={16} />} <span style={{marginLeft:'5px'}}>Scan</span>
                    </button>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="cv-language-select">
                      <option value="javascript">JS</option><option value="python">Py</option><option value="java">Java</option><option value="cpp">C++</option>
                    </select>
                  </div>
               </div>
               <div className="monaco-editor-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.3)', boxShadow: 'var(--clay-sm)' }}>
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
                    automaticLayout: false, 
                    backgroundColor: '#0d0b14' 
                  }}
                />
              </div>
               {error && <div className="cv-error"><AlertCircle size={16}/> {error}</div>}
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

             {currentState && (
               <>
                 <div className="cv-panel memory-mapper" style={{position:'relative'}}>
                    <div className="cv-panel-title"><Layers size={16}/> Memory Heap Topology</div>
                    <div className="render-canvas">
                        <div className="visual-layers-stack">
                           <div className="layer current-layer">
                              {Object.entries(currentState.memoryStructures.arrays).map(([name, arr]) => <GlassArray key={name} name={name} arr={arr} />)}
                              {Object.entries(currentState.memoryStructures.trees).map(([name, node]) => <GlassTree key={name} name={name} node={node} />)}
                           </div>
                        </div>
                    </div>
                 </div>

                 {deletedVault.length > 0 && (
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
                                  {item.type === 'Array' ? <GlassArray name={item.name} arr={item.data} /> : <GlassTree name={item.name} node={item.data} />}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {currentState.output.length > 0 && (
                    <div className="cv-panel">
                      <div className="cv-panel-title"><Terminal size={16}/> Console Log</div>
                      <div className="cv-console">
                        {currentState.output.map((out, j) => (<div key={j} className="cv-console-line"><span className="cv-console-prompt">$</span> <span className="cv-console-text">{out}</span></div>))}
                      </div>
                    </div>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeVisualizer;