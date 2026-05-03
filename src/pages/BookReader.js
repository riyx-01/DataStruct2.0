import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Volume2, Highlighter, 
  Book as BookIcon, MousePointer2, List, X
} from 'lucide-react';
import './BookReader.css';

const BookReader = () => {
  const { type = 'array' } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0); 
  const [isOpened, setIsOpened] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [activeTool, setActiveTool] = useState('pointer');
  const [showToc, setShowToc] = useState(false);
  
  const [book, setBook] = useState({
    title: "LOADING ARCHIVE...",
    author: "Universal Knowledge Bot",
    pages: []
  });

  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const scrapeInDepth = async () => {
      try {
        const topics = {
          array: ["Array_data_structure", "Dynamic_array", "Array_slice"],
          stack: ["Stack_(abstract_data_type)", "Call_stack", "Reverse_Polish_notation"],
          queue: ["Queue_(abstract_data_type)", "Circular_buffer", "Priority_queue"],
          linkedlist: ["Linked_list", "Doubly_linked_list", "Skip_list"],
          tree: ["Tree_(data_structure)", "Binary_search_tree", "Self-balancing_binary_search_tree"],
          graph: ["Graph_(abstract_data_type)", "Adjacency_list", "Depth-first_search"],
          hashtable: ["Hash_table", "Hash_function", "Hash_collision"],
          heap: ["Heap_(data_structure)", "Binary_heap", "Heapsort"]
        };
        
        const coreTopics = topics[type] || topics.array;
        let cumulativeText = "";

        for (const t of coreTopics) {
          const res = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts&explaintext=1&titles=${t}&format=json`);
          const data = await res.json();
          const pages = data.query.pages;
          cumulativeText += (pages[Object.keys(pages)[0]]?.extract || "") + "\n\n";
        }

        const paragraphs = cumulativeText.split(/\n\s*\n/).filter(p => p.trim().length > 60).map(p => p.trim().replace(/==+/g, ''));
        const generatedPages = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
          generatedPages.push({
            id: i,
            title: `Chapter ${Math.floor(i/10) + 1} :: Section ${i+1}`,
            content: paragraphs[i],
            note: `CIT_REF_WIKIPEDIA`
          });
        }
        
        if (generatedPages.length % 2 !== 0) {
          generatedPages.push({ id: generatedPages.length, title: "Finis", content: "The material concludes here.", note: "" });
        }

        if (mounted) {
          setBook({
            title: `${type.charAt(0).toUpperCase() + type.slice(1)}: Mastery Volume`,
            author: "Computer Science Society",
            pages: generatedPages
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    scrapeInDepth();
    setIsOpened(false);
    return () => { mounted = false; if (utteranceRef.current) window.speechSynthesis.cancel(); };
  }, [type]);

  const speak = (text) => {
    if (synth.speaking) { synth.cancel(); setIsReading(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsReading(false);
    utteranceRef.current = utterance;
    setIsReading(true);
    synth.speak(utterance);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentPage < book.pages.length - 2) setCurrentPage(p => p + 2);
  };
  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentPage > 0) setCurrentPage(p => p - 2);
  };

  const leftPage = book.pages[currentPage];
  const rightPage = book.pages[currentPage + 1];

  return (
    <div className="book-viewer-root">
      <nav className="book-navbar">
        <div className="navbar-content-guard">
          <button onClick={() => navigate(-1)} className="back-btn-skeuo"><ArrowLeft size={18}/> EXIT</button>
          <div className="book-metadata-header">ACADEMIC // {type.toUpperCase()}</div>
          <div className="book-tools">
            <button className={`tool-btn`} onClick={() => speak(leftPage?.content + " " + (rightPage?.content || ""))}><Volume2 size={18} /></button>
            <button className="tool-btn" onClick={() => setShowToc(true)}><List size={18} /></button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showToc && (
          <div className="toc-backdrop-overlay">
             <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="toc-card">
                <div className="toc-card-header">
                   <h3>VOLUME INDEX</h3>
                   <button onClick={() => setShowToc(false)}><X /></button>
                </div>
                <div className="toc-scroll">
                  {book.pages.filter((_, i) => i % 10 === 0).map((p, i) => (
                    <div key={i} className="toc-entry" onClick={() => { setCurrentPage(i * 10); setShowToc(false); setIsOpened(true); }}>
                      <span>SECTION {i+1}</span>
                      <div className="toc-dot-line"></div>
                      <span>P{i * 10 + 1}</span>
                    </div>
                  ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="book-centering-container">
        <div className={`uv-book ${isOpened ? 'uv-is-open' : ''}`}>
          
          <div className="uv-pages">
            {/* LEFT PAGE */}
            <div className="uv-page uv-page-left">
              <div className="page-paper-surface">
                {leftPage && (
                  <>
                    <div className="p-header">{leftPage.title}</div>
                    <div className="p-content">{leftPage.content}</div>
                    <div className="p-footer">Page {currentPage + 1}</div>
                  </>
                )}
                <button 
                  disabled={currentPage === 0} 
                  onClick={handlePrev} 
                  className="page-nav-btn prev-page-btn"
                >
                  <ChevronLeft />
                </button>
              </div>
            </div>

            <div className="uv-spine"></div>

            {/* RIGHT PAGE */}
            <div className="uv-page uv-page-right">
              <div className="page-paper-surface">
                {rightPage && (
                  <>
                    <div className="p-header">{rightPage.title}</div>
                    <div className="p-content">{rightPage.content}</div>
                    <div className="p-footer">Page {currentPage + 2}</div>
                  </>
                )}
                <button 
                  disabled={currentPage >= book.pages.length - 2} 
                  onClick={handleNext} 
                  className="page-nav-btn next-page-btn"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* FRONT COVER */}
          <div className="uv-cover" onClick={() => setIsOpened(!isOpened)}>
            <div className="uv-cover-inner">
               <BookIcon size={64} />
               <h1 className="uv-cover-title">{book.title}</h1>
               <div className="uv-cover-accent"></div>
               <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{book.author}</p>
               <div style={{ marginTop: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px' }}>CLICK TO OPEN</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
