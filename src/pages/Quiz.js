import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import './Quiz.css';

const QUIZ_BANK = [
  { topic: 'Arrays', question: 'In Python, what is the default time complexity to append an item to a list?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(1) amortized'], answer: 3, explanation: 'Appending to a list in Python is O(1) most of the time, but occasionally O(n) when resizing occurs, making it O(1) amortized.' },
  { topic: 'Arrays', question: 'What happens in Java when you access an array index out of bounds?', options: ['Returns undefined', 'Returns null', 'Throws ArrayIndexOutOfBoundsException', 'Memory corruption'], answer: 2, explanation: 'Java is a memory-safe language and will throw a runtime exception if you access an invalid index.' },
  { topic: 'Linked List', question: 'In a doubly linked list, how many pointers does each node have?', options: ['1', '2', '3', 'None'], answer: 1, explanation: 'Each node stores a "next" pointer and a "previous" pointer.' },
  { topic: 'Stack', question: 'Which operation is used to add an element to a Stack?', options: ['Enqueue', 'Push', 'Pop', 'Insert'], answer: 1, explanation: 'The "Push" operation adds an item to the top of the stack.' },
  { topic: 'JavaScript', question: 'What is the time complexity of Array.prototype.shift() in JavaScript?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], answer: 1, explanation: 'Shifting requires re-indexing all subsequent elements, making it O(n).' },
  { topic: 'Python', question: 'Which data structure is the Python "dict" based on?', options: ['Array', 'Linked List', 'Hash Table', 'Binary Tree'], answer: 2, explanation: 'Python dictionaries use hash tables for O(1) average lookup.' },
  { topic: 'Queue', question: 'A queue that allows insertion and deletion from both ends is called?', options: ['Priority Queue', 'Circular Queue', 'Deque', 'Stack'], answer: 2, explanation: 'A Deque (Double-Ended Queue) allows LIFO and FIFO behaviors.' },
  { topic: 'C++', question: 'What does std::vector::at(i) do that operator[] does not?', options: ['Nothing', 'Bounds checking', 'Faster access', 'Memory clearing'], answer: 1, explanation: '.at() performs bounds checking and throws an out_of_range exception if invalid.' },
  { topic: 'Trees', question: 'In a Binary Search Tree (BST), what is the relationship between a node and its left child?', options: ['Left child is larger', 'Left child is smaller', 'No relationship', 'Both are equal'], answer: 1, explanation: 'In a BST, all nodes in the left subtree are smaller than the parent node.' },
  { topic: 'Java', question: 'Which interface in Java provides the base for Stack and Queue behaviors?', options: ['List', 'Map', 'Collection', 'Set'], answer: 2, explanation: 'Both are part of the Java Collections Framework.' },
  { topic: 'Algorithms', question: 'Which sorting algorithm has a worst-case O(n^2)?', options: ['Quick Sort', 'Merge Sort', 'Heap Sort', 'Timsort'], answer: 0, explanation: 'Quick Sort is O(n^2) in the worst case (e.g., sorted array with poor pivot), though it is O(n log n) on average.' },
  { topic: 'Hash Table', question: 'What is a "collision" in a Hash Table?', options: ['Two identical keys', 'Two keys hashing to the same index', 'The table is full', 'A memory leak'], answer: 1, explanation: 'A collision occurs when the hash function generates the same index for different keys.' }
];

const Quiz = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Fetch 10 multiple choice questions from OpenTDB (Category 18: Computer Science)
      const res = await fetch('https://opentdb.com/api.php?amount=10&category=18&type=multiple');
      const data = await res.json();
      
      const formattedQuestions = data.results.map((q) => {
        // Decode HTML entities (OpenTDB returns html encoded text)
        const decodeHtml = (html) => {
          const txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
        };
        
        const decodedQuestion = decodeHtml(q.question);
        const correct = decodeHtml(q.correct_answer);
        const incorrect = q.incorrect_answers.map(decodeHtml);
        
        // Randomly insert the correct answer
        const options = [...incorrect];
        const answerIdx = Math.floor(Math.random() * 4);
        options.splice(answerIdx, 0, correct);
        
        return {
          topic: q.category || 'Computer Science',
          question: decodedQuestion,
          options: options,
          answer: answerIdx,
          explanation: `The correct answer is ${correct}.`
        };
      });
      
      if (formattedQuestions.length === 0) throw new Error("No questions fetched");
      setQuizQuestions(formattedQuestions);
    } catch (err) {
      console.error(err);
      // Fallback local bank if offline
      const shuffled = [...QUIZ_BANK].sort(() => 0.5 - Math.random());
      setQuizQuestions(shuffled.slice(0, 10));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const question = quizQuestions[currentIdx];

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === question.answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    // Save to localStorage
    const savedStats = JSON.parse(localStorage.getItem('userStats')) || { visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [] };
    
    const percentage = Math.round((score / quizQuestions.length) * 100);
    
    savedStats.quizzesTaken++;
    savedStats.avgScore = Math.round(((savedStats.avgScore * (savedStats.quizzesTaken - 1)) + percentage) / savedStats.quizzesTaken);
    
    savedStats.history.unshift({
      topic: 'Random Assessment',
      score: `${percentage}%`,
      date: new Date().toLocaleDateString()
    });
    
    if (savedStats.history.length > 5) savedStats.history.pop();
    localStorage.setItem('userStats', JSON.stringify(savedStats));
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    fetchQuestions(); // Grab new questions!
  };

  if (isLoading) {
    return (
      <div className="quiz-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <h2 style={{color: 'white'}}>Fetching fresh questions...</h2>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="quiz-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="quiz-card result-card"
        >
          <Trophy size={64} className="trophy-icon" />
          <h2>Quiz Completed!</h2>
          <div className="score-circle">
            <span className="score-text">{percentage}%</span>
          </div>
          <p>You scored {score} out of {quizQuestions.length}</p>
          <button onClick={restartQuiz} className="quiz-btn restart-btn">
            <RotateCcw size={18} /> Take Another Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>Knowledge Assessment</h1>
        <div className="quiz-progress">
          <div className="progress-text">
            <span>Question {currentIdx + 1} of {quizQuestions.length}</span>
            <span>Score: {score}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="quiz-card"
        >
          <div className="question-topic">{question.topic}</div>
          <h2 className="question-text">{question.question}</h2>

          <div className="options-grid">
            {question.options.map((opt, idx) => {
              let btnClass = 'option-btn';
              if (isAnswered) {
                if (idx === question.answer) btnClass += ' correct';
                else if (idx === selectedOption) btnClass += ' incorrect';
              } else if (idx === selectedOption) {
                btnClass += ' selected';
              }

              return (
                <button 
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                >
                  <span className="option-text">{opt}</span>
                  {isAnswered && idx === question.answer && <CheckCircle2 size={20} className="result-icon success" />}
                  {isAnswered && idx === selectedOption && idx !== question.answer && <XCircle size={20} className="result-icon error" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`explanation ${selectedOption === question.answer ? 'exp-correct' : 'exp-incorrect'}`}
            >
              <p><strong>{selectedOption === question.answer ? 'Correct!' : 'Incorrect.'}</strong> {question.explanation}</p>
            </motion.div>
          )}

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="quiz-footer"
            >
              <button className="quiz-btn next-btn" onClick={nextQuestion}>
                {currentIdx < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
