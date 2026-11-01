
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { BrainCircuit, Eye, Zap, Wind, RotateCcw, Trophy, ArrowLeft, Grid, Play, Calculator, Search } from 'lucide-react';

type GameMode = 'MENU' | 'SCHULTE' | 'STROOP' | 'BREATHING' | 'MEMORY_MATRIX' | 'MATH_RUSH' | 'VISUAL_SEARCH';

export const BrainGym: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('MENU');

  return (
    <div className="min-h-full w-full flex flex-col">
      {mode === 'MENU' && <GameMenu setMode={setMode} />}
      {mode === 'SCHULTE' && <SchulteTable onBack={() => setMode('MENU')} />}
      {mode === 'STROOP' && <StroopTest onBack={() => setMode('MENU')} />}
      {mode === 'BREATHING' && <BoxBreathing onBack={() => setMode('MENU')} />}
      {mode === 'MEMORY_MATRIX' && <MemoryMatrix onBack={() => setMode('MENU')} />}
      {mode === 'MATH_RUSH' && <MathRush onBack={() => setMode('MENU')} />}
      {mode === 'VISUAL_SEARCH' && <VisualSearch onBack={() => setMode('MENU')} />}
    </div>
  );
};

// --- Main Menu ---
const GameMenu: React.FC<{ setMode: (m: GameMode) => void }> = ({ setMode }) => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-primary" size={32} /> Brain Gym
        </h2>
        <p className="text-slate-400 mt-2 text-lg">Latihan kognitif berbasis neurosains untuk meningkatkan performa belajar.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setMode('SCHULTE')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-blue-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Eye size={64} /></div>
          <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Eye size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Schulte Table</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Melatih penglihatan periferal dan kecepatan membaca (Speed Reading).</p>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Fokus Visual</span>
        </div>

        <div 
          onClick={() => setMode('STROOP')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-orange-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={64} /></div>
          <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <Zap size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Stroop Focus</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Melatih kontrol impuls dan kemampuan mengabaikan gangguan (Inhibition).</p>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Kontrol Kognitif</span>
        </div>

        <div 
          onClick={() => setMode('MEMORY_MATRIX')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-purple-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Grid size={64} /></div>
          <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Grid size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Lumina Memory</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Ingat urutan pola yang menyala. Melatih Working Memory.</p>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Daya Ingat</span>
        </div>

        <div 
          onClick={() => setMode('BREATHING')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-green-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wind size={64} /></div>
          <div className="w-14 h-14 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
            <Wind size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Box Breathing</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Teknik pernapasan untuk menurunkan kortisol dan kecemasan ujian.</p>
          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Anti Stress</span>
        </div>

        <div 
          onClick={() => setMode('MATH_RUSH')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-cyan-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={64} /></div>
          <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
            <Calculator size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Math Rush</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Aritmatika cepat untuk melatih kecepatan pemrosesan dan fluid intelligence.</p>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Kecepatan Logika</span>
        </div>

        <div 
          onClick={() => setMode('VISUAL_SEARCH')}
          className="bg-card border border-slate-700 p-6 rounded-2xl hover:border-pink-500/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Search size={64} /></div>
          <div className="w-14 h-14 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
            <Search size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Visual Search</h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Cari karakter tersembunyi di lautan distraksi untuk fokus visual yang tajam.</p>
          <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">Selective Attention</span>
        </div>
      </div>
    </div>
  );
};

// --- Game 1: Schulte Table ---
const SchulteTable: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [grid, setGrid] = useState<number[]>([]);
  const [nextNum, setNextNum] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bestTime, setBestTime] = useState(0);

  useEffect(() => {
    const savedBest = StorageService.getItem('schulte_best', 0);
    setBestTime(savedBest);
    resetGame();
  }, []);

  useEffect(() => {
    let interval: any;
    if (startTime && !finished) {
      interval = setInterval(() => {
        setTime((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, finished]);

  const resetGame = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    // Fisher-Yates Shuffle
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setGrid(nums);
    setNextNum(1);
    setStartTime(null);
    setTime(0);
    setFinished(false);
  };

  const handleClick = (num: number) => {
    if (finished) return;
    
    if (num === 1 && !startTime) {
      setStartTime(Date.now());
    }

    if (num === nextNum) {
      if (num === 25) {
        setFinished(true);
        if (bestTime === 0 || time < bestTime) {
          setBestTime(time);
          StorageService.setItem('schulte_best', time);
        }
      } else {
        setNextNum(nextNum + 1);
      }
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="text-xs text-slate-400">Waktu</p>
             <p className="font-mono text-xl font-bold text-white">{time.toFixed(1)}s</p>
           </div>
           {bestTime > 0 && (
             <div className="text-right hidden sm:block">
               <p className="text-xs text-slate-400 flex items-center gap-1"><Trophy size={10}/> Terbaik</p>
               <p className="font-mono text-xl font-bold text-yellow-500">{bestTime.toFixed(1)}s</p>
             </div>
           )}
        </div>
      </div>

      <div className="bg-slate-800 p-2 rounded-xl mb-6 shadow-2xl border border-slate-700">
        <div className="grid grid-cols-5 gap-2">
          {grid.map((num) => (
            <button
              key={num}
              onClick={() => handleClick(num)}
              className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg transition-all duration-100 
                ${finished ? 'bg-green-500 text-white' : 
                  (num < nextNum ? 'bg-slate-700 text-slate-500 opacity-50' : 'bg-slate-600 text-white hover:bg-primary hover:scale-105 active:scale-95')
                }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {finished ? (
        <div className="text-center animate-bounce-in">
          <h3 className="text-2xl font-bold text-white mb-2">Selesai! 🎉</h3>
          <p className="text-slate-400 mb-4">Mata Anda semakin terlatih.</p>
          <button 
            onClick={resetGame}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={18} /> Main Lagi
          </button>
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center">
          Tekan angka <span className="text-white font-bold">1 sampai 25</span> secara berurutan secepat mungkin. 
          <br/>Usahakan mata tetap fokus di tengah grid.
        </p>
      )}
    </div>
  );
};

// --- Game 2: Stroop Test ---
const StroopTest: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const colors = [
    { name: 'MERAH', value: '#ef4444' }, // red-500
    { name: 'BIRU', value: '#3b82f6' },  // blue-500
    { name: 'HIJAU', value: '#22c55e' }, // green-500
    { name: 'KUNING', value: '#eab308' } // yellow-500
  ];

  const [currentWord, setCurrentWord] = useState(colors[0]);
  const [inkColor, setInkColor] = useState(colors[1]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    setHighScore(StorageService.getItem('stroop_best', 0));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => endGame(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setGameOver(false);
    nextRound();
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      StorageService.setItem('stroop_best', score);
    }
  };

  const nextRound = () => {
    const randomWord = colors[Math.floor(Math.random() * colors.length)];
    const randomInk = colors[Math.floor(Math.random() * colors.length)];
    setCurrentWord(randomWord);
    setInkColor(randomInk);
  };

  const handleAnswer = (colorValue: string) => {
    if (!isPlaying) return;
    
    if (colorValue === inkColor.value) {
      setScore(s => s + 10);
    } else {
      setScore(s => Math.max(0, s - 5)); // Penalty
    }
    nextRound();
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in h-full">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="text-right">
           <p className="text-xs text-slate-400">Score</p>
           <p className="font-mono text-2xl font-bold text-primary">{score}</p>
        </div>
      </div>

      {!isPlaying && !gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-slate-700">
             <Zap size={40} className="text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Stroop Focus</h2>
          <p className="text-slate-400 mb-8 max-w-xs">
            Pilih tombol sesuai <strong className="text-white">WARNA TINTA</strong>, abaikan tulisan teksnya.
          </p>
          <button onClick={startGame} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary/20">
            Mulai (30s)
          </button>
        </div>
      ) : gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-bold text-white mb-2">{score}</h2>
          <p className="text-slate-400 mb-6">Skor Akhir</p>
          {score >= highScore && score > 0 && <p className="text-yellow-500 font-bold mb-6">🏆 Rekor Baru!</p>}
          <button onClick={startGame} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
            <RotateCcw /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="mb-4 text-slate-500 font-mono text-xl">00:{timeLeft.toString().padStart(2, '0')}</div>
          
          <div className="flex-1 flex items-center justify-center">
             <h1 
               className="text-6xl md:text-8xl font-black tracking-wider transition-all duration-75 transform scale-100"
               style={{ color: inkColor.value, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
             >
               {currentWord.name}
             </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-auto mb-8">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => handleAnswer(c.value)}
                className="h-20 rounded-xl font-bold text-white text-lg shadow-lg transform active:scale-95 transition-transform border border-white/10"
                style={{ backgroundColor: c.value }}
              >
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Game 3: Memory Matrix (Lumina) ---
const MemoryMatrix: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'SHOWING' | 'WAITING' | 'GAME_OVER'>('IDLE');
  const [highlightedTile, setHighlightedTile] = useState<number | null>(null);
  
  const gridSize = 3; // 3x3 grid
  const totalTiles = gridSize * gridSize;

  // Start Level
  const startLevel = () => {
    const newSeq = [];
    const steps = level + 2; // Level 1 = 3 steps, Level 2 = 4 steps...
    for (let i = 0; i < steps; i++) {
      newSeq.push(Math.floor(Math.random() * totalTiles));
    }
    setSequence(newSeq);
    setUserSequence([]);
    setGameState('SHOWING');
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 500)); // Wait before showing next
      setHighlightedTile(seq[i]);
      await new Promise(r => setTimeout(r, 600)); // Show duration
      setHighlightedTile(null);
    }
    setGameState('WAITING');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'WAITING') return;

    // Visual feedback instant
    setHighlightedTile(index);
    setTimeout(() => setHighlightedTile(null), 200);

    const nextIndex = userSequence.length;
    if (sequence[nextIndex] === index) {
      const newUserSeq = [...userSequence, index];
      setUserSequence(newUserSeq);
      
      if (newUserSeq.length === sequence.length) {
        // Level Complete
        setTimeout(() => {
          setLevel(l => l + 1);
          setGameState('IDLE'); // Ready for next
        }, 500);
      }
    } else {
      // Wrong
      setGameState('GAME_OVER');
    }
  };

  const resetGame = () => {
    setLevel(1);
    setGameState('IDLE');
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in h-full">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="text-right">
           <p className="text-xs text-slate-400">Level</p>
           <p className="font-mono text-2xl font-bold text-purple-400">{level}</p>
        </div>
      </div>

      {gameState === 'IDLE' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-purple-500/50">
             <Grid size={40} className="text-purple-400" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-2">Level {level}</h2>
           <p className="text-slate-400 mb-8">Ingat urutan kotak yang menyala.</p>
           <button onClick={startLevel} className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg shadow-purple-600/30">
             <Play size={20} fill="currentColor" /> Mulai
           </button>
        </div>
      )}

      {(gameState === 'SHOWING' || gameState === 'WAITING') && (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
           <p className="mb-8 text-slate-400 font-bold animate-pulse">
             {gameState === 'SHOWING' ? 'Perhatikan Pola...' : 'Ulangi Pola!'}
           </p>
           <div className="grid grid-cols-3 gap-3 p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
              {Array.from({ length: totalTiles }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl transition-all duration-150 transform ${
                    highlightedTile === idx 
                    ? 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)] scale-105 border-transparent' 
                    : 'bg-slate-700 border-slate-600 border hover:bg-slate-600 active:scale-95'
                  }`}
                ></button>
              ))}
           </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-bounce-in">
           <h2 className="text-4xl font-bold text-red-500 mb-2">Game Over</h2>
           <p className="text-slate-400 mb-6">Kamu mencapai Level {level}</p>
           <button onClick={resetGame} className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2">
             <RotateCcw size={18} /> Coba Lagi
           </button>
        </div>
      )}
    </div>
  );
}

// --- Game 4: Box Breathing ---
const BoxBreathing: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [phase, setPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE' | 'WAIT'>('INHALE');
  const [instruction, setInstruction] = useState('Tarik Napas');
  
  useEffect(() => {
    const cycle = () => {
      // 4-4-4-4 Cycle
      setPhase('INHALE'); setInstruction('Tarik Napas...');
      setTimeout(() => {
        setPhase('HOLD'); setInstruction('Tahan...');
        setTimeout(() => {
          setPhase('EXHALE'); setInstruction('Hembuskan...');
          setTimeout(() => {
            setPhase('WAIT'); setInstruction('Tahan...');
          }, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();
    const interval = setInterval(cycle, 16000); // Total 16s per cycle
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center h-full animate-fade-in relative overflow-hidden">
      <button onClick={onBack} className="absolute top-0 left-0 text-slate-400 hover:text-white flex items-center gap-2 z-10">
        <ArrowLeft size={20} /> Kembali
      </button>

      <div className="flex-1 flex flex-col items-center justify-center z-0">
        <div className="relative flex items-center justify-center w-64 h-64">
           {/* Breathing Circle Animation */}
           <div 
             className={`absolute rounded-full bg-primary/30 blur-xl transition-all duration-[4000ms] ease-in-out
               ${phase === 'INHALE' ? 'w-64 h-64 opacity-100' : 
                 phase === 'HOLD' || phase === 'WAIT' ? 'w-64 h-64 opacity-80' : 
                 'w-24 h-24 opacity-50'}`}
           ></div>
           
           <div 
             className={`absolute rounded-full border-4 border-primary transition-all duration-[4000ms] ease-in-out flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]
             ${phase === 'INHALE' ? 'w-56 h-56 bg-primary/20' : 
               phase === 'HOLD' ? 'w-56 h-56 bg-primary/20' : 
               phase === 'EXHALE' ? 'w-20 h-20 bg-primary/0' :
               'w-20 h-20 bg-primary/0'}`}
           >
             <Wind className={`text-white transition-all duration-[4000ms] ${phase === 'INHALE' || phase === 'HOLD' ? 'scale-150' : 'scale-75'}`} size={32} />
           </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-8 mb-2 transition-all duration-500">{instruction}</h2>
        <div className="flex gap-2 mt-4">
          {['INHALE', 'HOLD', 'EXHALE', 'WAIT'].map((p, i) => (
             <div key={p} className={`w-2 h-2 rounded-full transition-colors duration-300 ${phase === p ? 'bg-white' : 'bg-slate-700'}`}></div>
          ))}
        </div>
      </div>

      <div className="mt-auto bg-slate-800/50 p-4 rounded-xl border border-slate-700 max-w-sm text-center">
        <p className="text-sm text-slate-400">
          Teknik 4-4-4-4 menstimulasi saraf Vagus untuk mengirim sinyal aman ke otak, menurunkan detak jantung dan kortisol secara instan.
        </p>
      </div>
    </div>
  );
};

// --- Game 5: Math Rush ---
const MathRush: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [question, setQuestion] = useState({ q: '', a: 0, options: [0, 0, 0, 0] });

  useEffect(() => {
    setHighScore(StorageService.getItem('mathrush_best', 0));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => endGame(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameOver(false);
    nextQuestion();
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      StorageService.setItem('mathrush_best', score);
    }
  };

  const nextQuestion = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, a;
    
    if (op === '+') {
      n1 = Math.floor(Math.random() * 50) + 10;
      n2 = Math.floor(Math.random() * 50) + 10;
      a = n1 + n2;
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * 50) + 20;
      n2 = Math.floor(Math.random() * n1) + 1;
      a = n1 - n2;
    } else {
      n1 = Math.floor(Math.random() * 12) + 2;
      n2 = Math.floor(Math.random() * 12) + 2;
      a = n1 * n2;
    }

    const o = new Set([a]);
    while (o.size < 4) {
      const distractor = a + Math.floor(Math.random() * 20) - 10;
      if (distractor !== a) o.add(distractor);
    }
    
    // Shuffle options
    const options = Array.from(o).sort(() => Math.random() - 0.5);

    setQuestion({ q: `${n1} ${op} ${n2}`, a, options: options as number[] });
  };

  const handleAnswer = (ans: number) => {
    if (!isPlaying) return;
    if (ans === question.a) {
      setScore(s => s + 10);
      nextQuestion();
    } else {
      setScore(s => Math.max(0, s - 5));
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in h-full">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="text-right">
           <p className="text-xs text-slate-400">Score</p>
           <p className="font-mono text-2xl font-bold text-cyan-400">{score}</p>
        </div>
      </div>

      {!isPlaying && !gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-cyan-500/50">
             <Calculator size={40} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Math Rush</h2>
          <p className="text-slate-400 mb-8 max-w-xs">
            Hitung secepat mungkin dalam waktu 60 detik. Jawaban salah = pengurangan poin.
          </p>
          <button onClick={startGame} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/20">
            Mulai (60s)
          </button>
        </div>
      ) : gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-bold text-white mb-2">{score}</h2>
          <p className="text-slate-400 mb-6">Skor Akhir</p>
          {score > highScore && highScore > 0 && <p className="text-yellow-500 font-bold mb-6">🏆 Rekor Baru!</p>}
          <button onClick={startGame} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
            <RotateCcw /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="mb-4 text-slate-500 font-mono text-xl">00:{timeLeft.toString().padStart(2, '0')}</div>
          
          <div className="flex-1 flex items-center justify-center">
             <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider">
               {question.q}
             </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-auto mb-8">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className="h-20 bg-slate-800 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 rounded-xl font-bold text-white text-3xl shadow-lg transform active:scale-95 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Game 6: Visual Search ---
const VisualSearch: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [grid, setGrid] = useState<{char: string, isTarget: boolean}[]>([]);
  const [gridSize, setGridSize] = useState(5);

  const charPairs = [
    { base: 'O', target: 'C' },
    { base: 'p', target: 'q' },
    { base: 'm', target: 'n' },
    { base: 'b', target: 'd' },
    { base: 'E', target: 'F' },
    { base: '6', target: '9' },
    { base: 'I', target: 'l' },
  ];

  useEffect(() => {
    setHighScore(StorageService.getItem('visualsearch_best', 0));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => endGame(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setIsPlaying(true);
    setGameOver(false);
    setGridSize(4);
    nextRound(4);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      StorageService.setItem('visualsearch_best', score);
    }
  };

  const nextRound = (size: number) => {
    const pair = charPairs[Math.floor(Math.random() * charPairs.length)];
    const totalTiles = size * size;
    const targetIdx = Math.floor(Math.random() * totalTiles);
    
    const newGrid = Array.from({ length: totalTiles }, (_, i) => ({
      char: i === targetIdx ? pair.target : pair.base,
      isTarget: i === targetIdx
    }));
    
    setGrid(newGrid);
  };

  const handleTileClick = (isTarget: boolean) => {
    if (!isPlaying) return;
    
    if (isTarget) {
      setScore(s => s + 10);
      const newSize = Math.min(10, gridSize + (score % 20 === 0 && score > 0 ? 1 : 0));
      setGridSize(newSize);
      nextRound(newSize);
    } else {
      setScore(s => Math.max(0, s - 5));
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in h-full">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="text-right">
           <p className="text-xs text-slate-400">Score</p>
           <p className="font-mono text-2xl font-bold text-pink-400">{score}</p>
        </div>
      </div>

      {!isPlaying && !gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-pink-500/50">
             <Search size={40} className="text-pink-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Visual Search</h2>
          <p className="text-slate-400 mb-8 max-w-xs">
            Temukan satu karakter yang <strong className="text-white">BERBEDA</strong> dari yang lain secepat mungkin. Area akan membesar.
          </p>
          <button onClick={startGame} className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-pink-500/20">
            Mulai (45s)
          </button>
        </div>
      ) : gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-bold text-white mb-2">{score}</h2>
          <p className="text-slate-400 mb-6">Skor Akhir</p>
          {score > highScore && highScore > 0 && <p className="text-yellow-500 font-bold mb-6">🏆 Rekor Baru!</p>}
          <button onClick={startGame} className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
            <RotateCcw /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="mb-4 text-slate-500 font-mono text-xl">00:{timeLeft.toString().padStart(2, '0')}</div>
          
          <div className="flex-1 flex items-center justify-center w-full overflow-hidden p-2">
             <div 
               className="grid gap-[2px] sm:gap-1 w-full max-w-[400px] p-2 bg-slate-800 rounded-xl transition-all"
               style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
             >
               {grid.map((cell, i) => (
                 <button
                   key={i}
                   onClick={() => handleTileClick(cell.isTarget)}
                   className="aspect-square flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-base sm:text-xl font-bold text-slate-300 transition-colors"
                 >
                   {cell.char}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

