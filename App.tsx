
import React, { useState, useCallback } from 'react';
import { GameState, GameStatus, MAX_FAILS, ALPHABET } from './types';
import { fetchNewWord } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    targetWord: '',
    guessedLetters: new Set(),
    fails: [],
    status: 'landing',
    definition: '',
  });

  const [lastGuessedLetter, setLastGuessedLetter] = useState<string | null>(null);

  const startNewGame = useCallback(async () => {
    setGameState(prev => ({ ...prev, status: 'loading' }));
    const data = await fetchNewWord();
    setGameState({
      targetWord: data.word,
      guessedLetters: new Set(),
      fails: [],
      status: 'playing',
      definition: data.definition,
    });
    setLastGuessedLetter(null);
  }, []);

  const handleGuess = (letter: string) => {
    if (gameState.status !== 'playing' || gameState.guessedLetters.has(letter) || gameState.fails.includes(letter)) {
      return;
    }

    setLastGuessedLetter(letter);
    const isCorrect = gameState.targetWord.includes(letter);
    
    setGameState(prev => {
      const newGuessed = new Set(prev.guessedLetters);
      const newFails = [...prev.fails];
      
      if (isCorrect) {
        newGuessed.add(letter);
      } else {
        newFails.push(letter);
      }

      // Check win/loss
      let newStatus: GameStatus = 'playing';
      const isWon = prev.targetWord.split('').every(l => newGuessed.has(l));
      
      if (isWon) {
        newStatus = 'won';
      } else if (newFails.length >= MAX_FAILS) {
        newStatus = 'lost';
      }

      return {
        ...prev,
        guessedLetters: newGuessed,
        fails: newFails,
        status: newStatus,
      };
    });
  };

  if (gameState.status === 'landing') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full"></div>

        <div className="z-10 text-center max-w-lg">
          <div className="flex justify-center gap-2 mb-6">
            {['G', 'U', 'E', 'S'].map((l, i) => (
              <div key={i} className="w-10 h-12 bg-slate-800 border-2 border-slate-700 rounded-xl flex items-center justify-center text-xl font-black text-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                {l}
              </div>
            ))}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 via-white to-cyan-400 bg-clip-text text-transparent mb-4 tracking-tighter">
            You Guess
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
            Unravel the mystery 4-letter word. You have 8 attempts to find the correct letters.
          </p>

          <button
            onClick={startNewGame}
            className="group relative px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-indigo-500/30 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              LAUNCH GAME
              <i className="fa-solid fa-rocket group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    );
  }

  if (gameState.status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-indigo-300 font-bold text-lg animate-pulse tracking-widest uppercase">Summoning...</p>
        </div>
      </div>
    );
  }

  const isGuessed = (letter: string) => gameState.guessedLetters.has(letter);
  const isFailed = (letter: string) => gameState.fails.includes(letter);

  return (
    <div className="h-screen max-h-screen p-4 flex flex-col items-center justify-between max-w-2xl mx-auto overflow-hidden">
      {/* Reduced Header Height */}
      <header className="w-full text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          You Guess
        </h1>
        <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-1">4-Letter Challenge</p>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center py-4 space-y-6 md:space-y-8">
        {/* 4 Boxes (Correct Letters) */}
        <div className="flex gap-2 md:gap-4">
          {gameState.targetWord.split('').map((letter, idx) => {
            const revealed = isGuessed(letter) || gameState.status === 'lost';
            return (
              <div
                key={`${idx}-${revealed}`}
                className={`w-14 h-18 md:w-20 md:h-24 flex items-center justify-center text-3xl md:text-4xl font-black rounded-xl border-2 transition-all duration-300 transform ${
                  revealed
                    ? 'bg-slate-800 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] animate-reveal'
                    : 'bg-slate-800/50 border-slate-700'
                } ${gameState.status === 'lost' && !isGuessed(letter) ? 'text-rose-400 border-rose-500' : 'text-white'}`}
              >
                {revealed ? letter : ''}
              </div>
            );
          })}
        </div>

        {/* Failed Trials - More Compact */}
        <div className={`w-full max-w-sm ${gameState.fails.length > 0 && !isGuessed(lastGuessedLetter || '') ? 'animate-shake' : ''}`}>
          <div className="flex flex-col items-center">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-3">
              Fails ({gameState.fails.length}/{MAX_FAILS})
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: MAX_FAILS }).map((_, idx) => {
                  const hasFail = idx < gameState.fails.length;
                  return (
                      <div
                          key={idx}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-all duration-300 ${
                          hasFail
                              ? 'bg-rose-500/20 border-rose-500 text-rose-500 font-bold scale-105 animate-pop'
                              : 'bg-slate-800/30 border-slate-700 text-slate-700'
                          }`}
                      >
                          {hasFail ? gameState.fails[idx] : '-'}
                      </div>
                  );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Area - Kept Big but compact gap */}
      <div className="w-full pb-4">
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 md:gap-2 max-w-2xl mx-auto px-1">
          {ALPHABET.map((letter) => {
            const used = isGuessed(letter) || isFailed(letter);
            const correct = isGuessed(letter);
            const isLatest = lastGuessedLetter === letter;
            
            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={used || gameState.status !== 'playing'}
                className={`h-11 sm:h-14 flex items-center justify-center rounded-lg font-black text-lg sm:text-xl transition-all duration-200 transform active:scale-90 ${
                  correct
                    ? 'bg-emerald-500 text-white cursor-default shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : isFailed(letter)
                    ? 'bg-slate-800 text-slate-600 opacity-50 cursor-default'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-100 active:bg-indigo-500 shadow-sm'
                } ${isLatest && used ? 'animate-pop' : ''} ${gameState.status !== 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Overlay for Game End */}
      {gameState.status !== 'playing' && gameState.status !== 'loading' && gameState.status !== 'landing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <h2 className={`text-3xl font-black mb-3 ${gameState.status === 'won' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {gameState.status === 'won' ? 'VICTORY!' : 'GAME OVER'}
            </h2>
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest">The word was</p>
              <p className="text-3xl font-bold text-white tracking-[0.2em]">{gameState.targetWord}</p>
            </div>
            <div className="mb-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-left">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Definition</p>
                <p className="text-slate-300 text-xs md:text-sm leading-snug">{gameState.definition}</p>
            </div>
            <button
              onClick={startNewGame}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-right"></i>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="w-full py-2 flex justify-center border-t border-slate-800/50">
        <p className="text-slate-600 text-[8px] uppercase tracking-[0.3em]">AI-Generated 4-Letter Challenge</p>
      </footer>
    </div>
  );
};

export default App;
