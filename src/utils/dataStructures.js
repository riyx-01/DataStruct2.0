// Data Structure Utility Functions for Visualizers

// --- BST (Binary Search Tree) ---
export const insertBST = (arr, val) => {
  const newArr = [...arr];
  if (newArr.length === 0 || newArr[0] === null || newArr[0] === undefined) {
    newArr[0] = val;
    return newArr;
  }
  let i = 0;
  while (true) {
    if (newArr[i] === null || newArr[i] === undefined) {
      newArr[i] = val;
      break;
    }
    if (val < newArr[i]) {
      i = 2 * i + 1;
    } else {
      i = 2 * i + 2;
    }
    if (i >= 127) {
      throw new Error("Tree depth too deep (max depth 6 reached). Try AVL Tree for self-balancing!");
    }
  }
  // Fill intermediate empty spots with null
  for (let j = 0; j < newArr.length; j++) {
    if (newArr[j] === undefined) newArr[j] = null;
  }
  return newArr;
};

export const deleteBST = (arr, val) => {
  const newArr = [...arr];
  const idx = newArr.indexOf(val);
  if (idx === -1) {
    throw new Error(`Value ${val} not found in Tree`);
  }

  const copySubtree = (src, dest, oldArr, targetArr) => {
    targetArr[dest] = oldArr[src];
    if (src * 2 + 1 < oldArr.length) {
      copySubtree(src * 2 + 1, dest * 2 + 1, oldArr, targetArr);
    } else {
      targetArr[dest * 2 + 1] = null;
    }
    if (src * 2 + 2 < oldArr.length) {
      copySubtree(src * 2 + 2, dest * 2 + 2, oldArr, targetArr);
    } else {
      targetArr[dest * 2 + 2] = null;
    }
  };

  const removeNodeAtIndex = (arrRef, i) => {
    const hasLeft = (i * 2 + 1 < arrRef.length) && (arrRef[i * 2 + 1] !== null && arrRef[i * 2 + 1] !== undefined);
    const hasRight = (i * 2 + 2 < arrRef.length) && (arrRef[i * 2 + 2] !== null && arrRef[i * 2 + 2] !== undefined);

    if (!hasLeft && !hasRight) {
      arrRef[i] = null;
    } else if (hasLeft && !hasRight) {
      const tempArr = [...arrRef];
      const clearSubtree = (curr) => {
        arrRef[curr] = null;
        if (curr * 2 + 1 < arrRef.length) clearSubtree(curr * 2 + 1);
        if (curr * 2 + 2 < arrRef.length) clearSubtree(curr * 2 + 2);
      };
      clearSubtree(i * 2 + 1);
      copySubtree(i * 2 + 1, i, tempArr, arrRef);
      arrRef[i * 2 + 1] = null;
    } else if (!hasLeft && hasRight) {
      const tempArr = [...arrRef];
      const clearSubtree = (curr) => {
        arrRef[curr] = null;
        if (curr * 2 + 1 < arrRef.length) clearSubtree(curr * 2 + 1);
        if (curr * 2 + 2 < arrRef.length) clearSubtree(curr * 2 + 2);
      };
      clearSubtree(i * 2 + 2);
      copySubtree(i * 2 + 2, i, tempArr, arrRef);
      arrRef[i * 2 + 2] = null;
    } else {
      // Find inorder successor
      let succ = i * 2 + 2;
      while (succ * 2 + 1 < arrRef.length && arrRef[succ * 2 + 1] !== null && arrRef[succ * 2 + 1] !== undefined) {
        succ = succ * 2 + 1;
      }
      const succVal = arrRef[succ];
      removeNodeAtIndex(arrRef, succ);
      arrRef[i] = succVal;
    }
  };

  removeNodeAtIndex(newArr, idx);
  // Clean trailing null values
  while (newArr.length > 0 && newArr[newArr.length - 1] === null) {
    newArr.pop();
  }
  return newArr;
};


// --- AVL Tree ---
class AVLNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

const getHeight = (node) => node ? node.height : 0;
const getBalance = (node) => node ? getHeight(node.left) - getHeight(node.right) : 0;

const rotateRight = (y) => {
  const x = y.left;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
  x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
  return x;
};

const rotateLeft = (x) => {
  const y = x.right;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
  y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
  return y;
};

const insertAVLHelper = (node, val) => {
  if (!node) return new AVLNode(val);
  if (val < node.val) {
    node.left = insertAVLHelper(node.left, val);
  } else if (val > node.val) {
    node.right = insertAVLHelper(node.right, val);
  } else {
    return node;
  }

  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  const balance = getBalance(node);

  if (balance > 1 && val < node.left.val) return rotateRight(node);
  if (balance < -1 && val > node.right.val) return rotateLeft(node);
  if (balance > 1 && val > node.left.val) {
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (balance < -1 && val < node.right.val) {
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }

  return node;
};

const minValueNode = (node) => {
  let curr = node;
  while (curr.left) curr = curr.left;
  return curr;
};

const deleteAVLHelper = (node, val) => {
  if (!node) return null;
  if (val < node.val) {
    node.left = deleteAVLHelper(node.left, val);
  } else if (val > node.val) {
    node.right = deleteAVLHelper(node.right, val);
  } else {
    if (!node.left || !node.right) {
      const temp = node.left ? node.left : node.right;
      if (!temp) {
        node = null;
      } else {
        node = temp;
      }
    } else {
      const temp = minValueNode(node.right);
      node.val = temp.val;
      node.right = deleteAVLHelper(node.right, temp.val);
    }
  }

  if (!node) return null;

  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
  const balance = getBalance(node);

  if (balance > 1 && getBalance(node.left) >= 0) return rotateRight(node);
  if (balance > 1 && getBalance(node.left) < 0) {
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (balance < -1 && getBalance(node.right) <= 0) return rotateLeft(node);
  if (balance < -1 && getBalance(node.right) > 0) {
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }

  return node;
};

const treeToArray = (root) => {
  if (!root) return [];
  const arr = [];
  const queue = [{ node: root, index: 0 }];
  let maxIdx = 0;
  while (queue.length > 0) {
    const { node, index } = queue.shift();
    if (index >= 127) continue;
    arr[index] = node.val;
    if (index > maxIdx) maxIdx = index;
    if (node.left) queue.push({ node: node.left, index: 2 * index + 1 });
    if (node.right) queue.push({ node: node.right, index: 2 * index + 2 });
  }
  for (let i = 0; i <= maxIdx; i++) {
    if (arr[i] === undefined) arr[i] = null;
  }
  return arr;
};

export const insertAVL = (arr, val) => {
  let root = null;
  for (let item of arr) {
    if (item !== null && item !== undefined) {
      root = insertAVLHelper(root, item);
    }
  }
  root = insertAVLHelper(root, val);
  return treeToArray(root);
};

export const deleteAVL = (arr, val) => {
  let root = null;
  for (let item of arr) {
    if (item !== null && item !== undefined) {
      root = insertAVLHelper(root, item);
    }
  }
  const idx = arr.indexOf(val);
  if (idx === -1) {
    throw new Error(`Value ${val} not found in Tree`);
  }
  root = deleteAVLHelper(root, val);
  return treeToArray(root);
};


// --- Heaps ---
export const insertHeap = (arr, val, isMinHeap = false) => {
  const newArr = [...arr];
  newArr.push(val);
  let i = newArr.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    const shouldSwap = isMinHeap 
      ? newArr[i] < newArr[parent] 
      : newArr[i] > newArr[parent];
    if (shouldSwap) {
      const temp = newArr[i];
      newArr[i] = newArr[parent];
      newArr[parent] = temp;
      i = parent;
    } else {
      break;
    }
  }
  return newArr;
};

export const extractHeapRoot = (arr, isMinHeap = false) => {
  if (arr.length === 0) return { newArr: [], extracted: null };
  const newArr = [...arr];
  const extracted = newArr[0];
  if (newArr.length === 1) {
    return { newArr: [], extracted };
  }
  newArr[0] = newArr.pop();
  let i = 0;
  while (true) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    let extreme = i;
    
    if (isMinHeap) {
      if (left < newArr.length && newArr[left] < newArr[extreme]) extreme = left;
      if (right < newArr.length && newArr[right] < newArr[extreme]) extreme = right;
    } else {
      if (left < newArr.length && newArr[left] > newArr[extreme]) extreme = left;
      if (right < newArr.length && newArr[right] > newArr[extreme]) extreme = right;
    }
    
    if (extreme !== i) {
      const temp = newArr[i];
      newArr[i] = newArr[extreme];
      newArr[extreme] = temp;
      i = extreme;
    } else {
      break;
    }
  }
  return { newArr, extracted };
};


// --- Trie ---
export const buildTrie = (words) => {
  const root = { id: 'root', label: 'ROOT', children: {} };
  let idCounter = 1;
  for (const word of words) {
    let curr = root;
    for (const char of word) {
      if (!curr.children[char]) {
        curr.children[char] = { id: `node-${idCounter++}`, label: char, children: {}, isWordEnd: false };
      }
      curr = curr.children[char];
    }
    curr.isWordEnd = true;
  }
  return root;
};

export const layoutTrie = (words) => {
  const root = buildTrie(words);
  const nodes = [];
  const edges = [];
  
  const traverse = (curr, currX, currY, currWidth) => {
    nodes.push({ id: curr.id, label: curr.label, x: currX, y: currY, isWordEnd: curr.isWordEnd });
    const keys = Object.keys(curr.children);
    if (keys.length === 0) return;
    
    const step = currWidth / keys.length;
    const startX = currX - currWidth / 2 + step / 2;
    
    keys.forEach((char, idx) => {
      const childX = startX + idx * step;
      const childY = currY + 80;
      const child = curr.children[char];
      edges.push({ 
        from: { x: currX, y: currY }, 
        to: { x: childX, y: childY } 
      });
      traverse(child, childX, childY, currWidth / (keys.length || 1));
    });
  };
  
  traverse(root, 300, 45, 520);
  return { nodes, edges };
};


// --- Graph ---
export const addGraphNode = (graph, label) => {
  if (!label) return graph;
  const normalizedLabel = label.toString().toUpperCase().trim();
  if (graph.nodes.some(n => n.label === normalizedLabel)) {
    throw new Error(`Node ${normalizedLabel} already exists`);
  }
  if (graph.nodes.length >= 8) {
    throw new Error("Maximum 8 nodes allowed for Graph visualization");
  }
  const nextId = graph.nodes.length > 0 ? Math.max(...graph.nodes.map(n => n.id)) + 1 : 0;
  return {
    nodes: [...graph.nodes, { id: nextId, label: normalizedLabel }],
    edges: [...graph.edges]
  };
};

export const deleteGraphNode = (graph, label) => {
  const normalizedLabel = label.toString().toUpperCase().trim();
  const targetNode = graph.nodes.find(n => n.label === normalizedLabel);
  if (!targetNode) {
    throw new Error(`Node ${normalizedLabel} not found`);
  }
  const targetId = targetNode.id;
  return {
    nodes: graph.nodes.filter(n => n.id !== targetId),
    edges: graph.edges.filter(e => e.from !== targetId && e.to !== targetId)
  };
};

export const addGraphEdge = (graph, fromLabel, toLabel) => {
  const fl = fromLabel.toString().toUpperCase().trim();
  const tl = toLabel.toString().toUpperCase().trim();
  const fromNode = graph.nodes.find(n => n.label === fl);
  const toNode = graph.nodes.find(n => n.label === tl);
  if (!fromNode || !toNode) {
    throw new Error(`Nodes ${fl} or ${tl} do not exist`);
  }
  if (fromNode.id === toNode.id) {
    throw new Error("Self-loops are not allowed");
  }
  const edgeExists = graph.edges.some(e => 
    (e.from === fromNode.id && e.to === toNode.id) ||
    (e.from === toNode.id && e.to === fromNode.id)
  );
  if (edgeExists) {
    throw new Error(`Edge between ${fl} and ${tl} already exists`);
  }
  return {
    nodes: [...graph.nodes],
    edges: [...graph.edges, { from: fromNode.id, to: toNode.id }]
  };
};

export const deleteGraphEdge = (graph, fromLabel, toLabel) => {
  const fl = fromLabel.toString().toUpperCase().trim();
  const tl = toLabel.toString().toUpperCase().trim();
  const fromNode = graph.nodes.find(n => n.label === fl);
  const toNode = graph.nodes.find(n => n.label === tl);
  if (!fromNode || !toNode) {
    throw new Error(`Nodes ${fl} or ${tl} do not exist`);
  }
  return {
    nodes: [...graph.nodes],
    edges: graph.edges.filter(e => 
      !( (e.from === fromNode.id && e.to === toNode.id) || (e.from === toNode.id && e.to === fromNode.id) )
    )
  };
};


// --- Disjoint Set ---
export const unionDisjointSet = (parents, x, y) => {
  const newParents = [...parents];
  const find = (i) => {
    let root = i;
    while (newParents[root] !== root) {
      root = newParents[root];
    }
    return root;
  };
  
  const rootX = find(x);
  const rootY = find(y);
  if (rootX !== rootY) {
    newParents[rootX] = rootY;
  }
  return newParents;
};

export const findDisjointSet = (parents, x) => {
  let path = [];
  let root = x;
  while (parents[root] !== root) {
    path.push(root);
    root = parents[root];
  }
  path.push(root);
  return { root, path };
};
