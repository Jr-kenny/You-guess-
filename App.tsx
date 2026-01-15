
import React, { useState, useCallback } from 'react';
import { GameState, GameStatus, MAX_FAILS, ALPHABET } from './types.ts';
import { fetchNewWord } from './services/geminiService.ts';

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
    try {
      const data = await fetchNewWord();
      setGameState({
        targetWord: data.word,
        guessedLetters: new Set(),
        fails: [],
        status: 'playing',
        definition: data.definition,
      });
    } catch (err) {
      console.error("Failed to start session:", err);
      // Fallback is handled within geminiService, but we ensure status resets
    }
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

  const isGuessed = (letter: string) => gameState.guessedLetters.has(letter);
  const isFailed = (letter: string) => gameState.fails.includes(letter);

  if (gameState.status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 text-xs font-medium tracking-[0.4em] uppercase animate-pulse">Initializing Word</p>
        </div>
      </div>
    );
  }

  if (gameState.status === 'landing') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="z-10 text-center space-y-8 max-w-sm">
          <div className="space-y-2">
            <span className="text-indigo-500 text-[10px] font-bold tracking-[0.5em] uppercase text-shadow-glow">Word Challenge</span>
            <h1 className="text-6xl font-black text-slate-50 tracking-tighter">
              You Guess
            </h1>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Identify the mystery four-letter sequence. Precision and logic are required.
          </p>

          <button
            onClick={startNewGame}
            className="w-full py-4 bg-slate-50 text-slate-950 font-bold text-sm tracking-widest rounded-full transition-all hover:bg-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/20 uppercase"
          >
            Launch Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 flex flex-col items-center justify-between overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      <header className="w-full flex justify-between items-center max-w-2xl px-2 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-50 tracking-tight">You Guess</h2>
          <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
            Attempt {Math.min(gameState.fails.length + 1, MAX_FAILS)} of {MAX_FAILS}
          </span>
        </div>
        <button 
          onClick={startNewGame}
          className="p-2 text-slate-600 hover:text-slate-300 transition-colors"
          title="Reset"
        >
          <i className="fa-solid fa-arrow-rotate-left text-sm"></i>
        </button>
      </header>

      <div className="flex-1 w-full flex flex-col items-center justify-center space-y-6 md:space-y-10 min-h-0">
        <div className="flex gap-2.5 md:gap-4 shrink-0">
          {gameState.targetWord.split('').map((letter, idx) => {
            const revealed = isGuessed(letter) || gameState.status === 'lost';
            return (
              <div
                key={`${idx}-${revealed}`}
                className={`w-14 h-20 md:w-20 md:h-28 flex items-center justify-center text-4xl font-light rounded-2xl border transition-all duration-500 ${
                  revealed
                    ? 'bg-slate-900 border-slate-700 text-slate-50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)] animate-reveal'
                    : 'bg-slate-900/30 border-slate-800 text-transparent'
                } ${gameState.status === 'lost' && !isGuessed(letter) ? 'border-rose-900/40 text-rose-500/60' : ''}`}
              >
                {revealed ? letter : ''}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center space-y-3 shrink-0">
          <div className="flex gap-2.5">
            {Array.from({ length: MAX_FAILS }).map((_, idx) => {
              const hasFail = idx < gameState.fails.length;
              return (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    hasFail ? 'bg-rose-500 scale-125' : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
          {gameState.fails.length > 0 && (
            <div className="flex gap-2.5 h-4 overflow-hidden">
              {gameState.fails.map((letter, i) => (
                <span key={i} className="text-rose-500/40 text-[10px] font-mono font-bold animate-reveal uppercase">{letter}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl pb-4 shrink-0">
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 md:gap-2 px-1">
          {ALPHABET.map((letter) => {
            const used = isGuessed(letter) || isFailed(letter);
            const correct = isGuessed(letter);
            const failed = isFailed(letter);
            
            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={used || gameState.status !== 'playing'}
                className={`h-11 md:h-14 flex items-center justify-center rounded-xl text-xs md:text-sm font-bold transition-all duration-200 key-shadow ${
                  correct
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
                    : failed
                    ? 'bg-slate-900 text-slate-800 border-transparent opacity-30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700/50 hover:border-slate-600 active:scale-95 active:bg-slate-700'
                } ${gameState.status !== 'playing' && !used ? 'opacity-30' : ''}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {gameState.status !== 'playing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="w-full max-w-sm glass-panel p-8 md:p-10 rounded-[2.5rem] text-center space-y-6 md:space-y-8 animate-pop">
            <div className="space-y-2">
              <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${gameState.status === 'won' ? 'text-indigo-400' : 'text-rose-500'}`}>
                {gameState.status === 'won' ? 'Session Success' : 'Session Terminated'}
              </span>
              <h2 className="text-4xl font-black text-slate-50 tracking-tight">
                {gameState.status === 'won' ? 'Victory' : 'Defeat'}
              </h2>
            </div>

            <div className="py-5 border-y border-slate-800/50">
              <p className="text-slate-600 text-[10px] uppercase tracking-widest mb-1 font-bold">The Target Word</p>
              <p className="text-3xl font-light text-slate-50 tracking-[0.4em]">{gameState.targetWord}</p>
            </div>

            <div className="text-left bg-slate-950/50 p-4 md:p-5 rounded-2xl border border-slate-800/50">
              <p className="text-indigo-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Context</p>
              <p className="text-slate-400 text-xs leading-relaxed italic">"{gameState.definition}"</p>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-4 bg-slate-100 text-slate-950 font-bold text-xs tracking-widest rounded-full hover:bg-white transition-all uppercase active:scale-95 shadow-xl shadow-black/20"
            >
              Restart Session
            </button>
          </div>
        </div>
      )}

      <footer className="w-full flex justify-center py-2 shrink-0">
        <div className="flex items-center gap-4 opacity-10">
            <div className="h-px w-6 bg-slate-500"></div>
            <span className="text-[7px] font-black tracking-[0.5em] text-slate-500 uppercase">Core System 1.0.5</span>
            <div className="h-px w-6 bg-slate-500"></div>
        </div>
      </footer>
    </div>
  );
};

export default App;
