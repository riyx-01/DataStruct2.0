import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, Terminal, Code2 } from 'lucide-react';
import { ExtendedTreeVisualizer } from '../components/visualizers/AdvancedVisualizers';
import './SandboxChallenges.css';

const CHALLENGES = [
  {
    id: 1,
    title: "Fix the BST Insertion Logic",
    description: "The recursive logic for inserting a node in a binary search tree is broken. The right child is never properly updated. Fix the logic so the tree structure properly accepts values greater than the root.",
    initialCode: `import json\n\ndef insert(root, val):\n    if root is None:\n        return {'val': val, 'left': None, 'right': None}\n    if val < root['val']:\n        root['left'] = insert(root['left'], val)\n    else:\n        # FIX ME: The logic below is broken\n        pass\n    return root\n\nroot = None\nfor v in [50, 30, 70, 20, 40, 60, 80]:\n    root = insert(root, v)\n\n# Output the final tree state to the visualizer\njson.dumps(root)`,
    targetJSON: `{"val": 50, "left": {"val": 30, "left": {"val": 20, "left": null, "right": null}, "right": {"val": 40, "left": null, "right": null}}, "right": {"val": 70, "left": {"val": 60, "left": null, "right": null}, "right": {"val": 80, "left": null, "right": null}}}`
  }
];

const SandboxChallenges = () => {
  const [pyodide, setPyodide] = useState(null);
  const [code, setCode] = useState(CHALLENGES[0].initialCode);
  const [treeData, setTreeData] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMSG, setErrorMSG] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize Pyodide Native Execution
  useEffect(() => {
    let script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
    script.onload = async () => {
      const p = await window.loadPyodide();
      setPyodide(p);
    };
    document.body.appendChild(script);
    
    return () => { document.body.removeChild(script); };
  }, []);

  const runCode = async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setErrorMSG(null);
    try {
      // Execute the native Python code using WebAssembly!
      let res = await pyodide.runPythonAsync(code);
      let parsedTree = JSON.parse(res);
      
      // Flatten tree dict into array for our Visualizer sequentially
      const flattened = [];
      const traverse = (node) => {
        if (!node) return;
        flattened.push(node.val);
        traverse(node.left);
        traverse(node.right);
      };
      traverse(parsedTree);
      setTreeData(flattened);
      
      // Check success heuristic
      if (res.replace(/\s+/g, '') === CHALLENGES[0].targetJSON.replace(/\s+/g, '')) {
         setIsSuccess(true);
      } else {
         setIsSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMSG(err.toString());
      setTreeData([]);
      setIsSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  if (!pyodide) {
    return <div className="sb-loading">Initializing Native WebAssembly Python Runtime (Pyodide)...</div>;
  }

  return (
    <div className="sandbox-container">
      <div className="sandbox-header">
        <h1>Sandbox Challenges (Native WASM Execution)</h1>
        <p style={{color: 'var(--text-muted)'}}>Write infinitely complex Python directly in the browser.</p>
      </div>

      <div className="sandbox-grid">
        <div className="sb-panel">
          <div className="sb-panel-header">
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}><Code2 size={18}/> Code Editor</div>
            {isSuccess && <span style={{color:'#10b981', display:'flex', gap:'4px', alignItems:'center'}}><CheckCircle2 size={16}/> Passed!</span>}
          </div>
          <div className="sb-challenge-desc">
            <strong>Challenge:</strong> {CHALLENGES[0].description}
          </div>
          <textarea 
            className="sb-editor" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            spellCheck="false"
          />
          <div className="sb-controls">
            <button className={`sb-btn ${isSuccess ? 'success' : ''}`} onClick={runCode} disabled={isRunning}>
              <Play size={18} /> {isRunning ? "Executing via WASM..." : "Run Native Code"}
            </button>
          </div>
          {errorMSG && <div style={{padding:'10px', background:'#fef2f2', color:'#ef4444', fontSize:'12px', borderTop:'1px solid #fca5a5', fontFamily:'monospace', overflowY:'auto', maxHeight:'80px'}}>{errorMSG}</div>}
        </div>

        <div className="sb-panel">
          <div className="sb-panel-header">
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}><Terminal size={18}/> Output Visualization</div>
            <div className="sb-target">Goal: Build Full Tree</div>
          </div>
          <div className="sb-visualizer">
            {treeData.length > 0 ? (
              <ExtendedTreeVisualizer data={treeData} type="tree" foundIndex={null} />
            ) : (
              <div style={{color: '#94a3b8', fontStyle: 'italic'}}>Awaiting successful compilation...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxChallenges;
