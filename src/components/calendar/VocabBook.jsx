import { useState, useEffect, useRef } from 'react';
import { VOCAB_DATA } from '../../data/vocabData';
import './VocabBook.css';

const SOURCE_COLORS = {
  '多益800+': 'coral',
  'TOEIC 700': 'blue',
  'TOEIC 900': 'purple',
  'TOEIC 800': 'mint',
  'TOEIC 750': 'yellow',
  'TOEIC 850': 'orange',
};

const SOURCES = ['全部', ...Object.keys(SOURCE_COLORS)];

export default function VocabBook() {
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [flipped, setFlipped] = useState({});
  const [mode, setMode] = useState('browse'); // 'browse' | 'quiz'
  const [quiz, setQuiz] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const fileRef = useRef();

  const filtered = VOCAB_DATA.filter(w => {
    const matchSrc = filter === '全部' || w.source === filter;
    const matchSearch = !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.meaning.includes(search);
    return matchSrc && matchSearch;
  });

  const startQuiz = () => {
    const pool = filter === '全部' ? VOCAB_DATA : VOCAB_DATA.filter(w => w.source === filter);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuiz({ words: shuffled, index: 0 });
    setQuizAnswered(false);
    setQuizScore({ correct: 0, total: 0 });
    setMode('quiz');
  };

  const nextQuiz = (correct) => {
    const newScore = { correct: quizScore.correct + (correct ? 1 : 0), total: quizScore.total + 1 };
    setQuizScore(newScore);
    if (quiz.index + 1 >= quiz.words.length) {
      setQuiz(prev => ({ ...prev, done: true, score: newScore }));
    } else {
      setQuiz(prev => ({ ...prev, index: prev.index + 1 }));
      setQuizAnswered(false);
    }
  };

  const toggleFlip = (id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (mode === 'quiz' && quiz) {
    if (quiz.done) {
      return (
        <div className="vocab-quiz-done card animate-fadeInUp">
          <div className="animate-dolphin" style={{ fontSize: 64 }}>🐬</div>
          <h2 style={{ fontSize: 26, marginTop: 12 }}>測驗完成！</h2>
          <p style={{ fontSize: 22, marginTop: 8 }}>
            得分：{quiz.score.correct} / {quiz.score.total} 🌟
          </p>
          <p style={{ fontSize: 18, color: 'var(--ocean-dark)', marginTop: 6 }}>
            {quiz.score.correct >= 8 ? '超棒！你是海洋之星 ⭐' :
             quiz.score.correct >= 5 ? '不錯！繼續努力 🐠' : '再練習一下，加油！🐢'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={startQuiz}>再來一次</button>
            <button className="btn btn-ghost" onClick={() => setMode('browse')}>回單字本</button>
          </div>
        </div>
      );
    }

    const current = quiz.words[quiz.index];
    return (
      <div className="vocab-quiz card animate-fadeInUp">
        <div className="quiz-progress">
          <span style={{ fontSize: 16, color: 'var(--ocean-dark)' }}>第 {quiz.index + 1} / {quiz.words.length} 題</span>
          <div className="quiz-bar">
            <div className="quiz-bar-fill" style={{ width: `${((quiz.index) / quiz.words.length) * 100}%` }} />
          </div>
        </div>
        <div className="quiz-word">{current.word}</div>
        {!quizAnswered ? (
          <button className="btn btn-primary" style={{ marginTop: 24, fontSize: 18 }} onClick={() => setQuizAnswered(true)}>
            顯示答案
          </button>
        ) : (
          <div className="animate-fadeInUp" style={{ marginTop: 20, textAlign: 'center' }}>
            <div className="quiz-answer">{current.meaning}</div>
            <p style={{ fontSize: 17, color: 'var(--ocean-dark)', margin: '10px 0 6px' }}>{current.collocation}</p>
            <p style={{ fontSize: 16, color: '#666', fontStyle: 'italic', lineHeight: 1.6 }}>{current.example}</p>
            <p style={{ fontSize: 15, color: 'var(--deep-blue)', marginTop: 4 }}>{current.translation}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-danger" onClick={() => nextQuiz(false)}>✗ 不會</button>
              <button className="btn btn-mint" onClick={() => nextQuiz(true)}>✓ 會了</button>
            </div>
          </div>
        )}
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={() => setMode('browse')}>退出測驗</button>
      </div>
    );
  }

  return (
    <div className="vocab-wrap animate-fadeInUp">
      <div className="vocab-toolbar">
        <input
          placeholder="🔍 搜尋單字或中文..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <button className="btn btn-primary" onClick={startQuiz}>🎲 隨機測驗</button>
      </div>

      <div className="vocab-filters">
        {SOURCES.map(src => (
          <button
            key={src}
            className={`filter-chip ${filter === src ? 'active' : ''}`}
            onClick={() => setFilter(src)}
          >
            {src}
            <span className="filter-count">
              {src === '全部' ? VOCAB_DATA.length : VOCAB_DATA.filter(w => w.source === src).length}
            </span>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 16, color: 'var(--ocean-dark)', marginBottom: 16 }}>
        顯示 {filtered.length} 個單字 🐠
      </p>

      <div className="vocab-grid">
        {filtered.map(word => (
          <div
            key={word.id}
            className={`vocab-card-wrap ${flipped[word.id] ? 'flipped' : ''}`}
            onClick={() => toggleFlip(word.id)}
          >
            <div className="vocab-card-inner">
              <div className="vocab-card vocab-front">
                <span className={`badge badge-${SOURCE_COLORS[word.source] || 'blue'}`}>{word.source}</span>
                <div className="vocab-word">{word.word}</div>
                <div className="vocab-meaning">{word.meaning}</div>
                <div className="vocab-flip-hint">點擊看詳細 🔄</div>
                <div className="vocab-deco">🐙</div>
              </div>
              <div className="vocab-card vocab-back">
                <div className="vocab-section">
                  <span className="vocab-label">📌 搭配詞</span>
                  <p className="vocab-coll-en">{word.collocation}</p>
                  <p className="vocab-coll-zh">{word.collMeaning}</p>
                </div>
                <div className="vocab-section">
                  <span className="vocab-label">💬 例句</span>
                  <p className="vocab-example">{word.example}</p>
                  <p className="vocab-translation">{word.translation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
