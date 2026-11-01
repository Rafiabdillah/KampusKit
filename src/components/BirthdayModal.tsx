import { useStore } from '../store/useStore';
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Sparkles, Gift, Heart, Stars } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BirthdayModalProps {
  onClose: () => void;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({ onClose }) => {
  const userProfile = useStore(state => state.userProfile);

  useEffect(() => {
    // Fire confetti when modal opens
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const isMale = userProfile.gender === 'male';
  const isFemale = userProfile.gender === 'female';

  const getGreeting = () => {
    if (isMale) {
      return (
        <>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Selamat ulang tahun, Pria Hebat! 🎉 Di hari spesialmu ini, semoga setiap langkahmu selalu diiringi kesuksesan dan kebahagiaan. 
          </p>
          <p className="text-zinc-300 leading-relaxed font-medium italic">
            "Semoga kamu tumbuh menjadi sosok pemimpin yang tangguh, penuh kasih, dan terus menjadi inspirasi bagi orang-orang di sekitarmu. Teruslah mengejar mimpimu dengan semangat yang tak pernah padam."
          </p>
        </>
      );
    } else if (isFemale) {
      return (
        <>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Selamat ulang tahun, Wanita Cantik! 🌸 Di hari spesialmu ini, semoga duniamu dipenuhi dengan cinta, tawa, dan keajaiban.
          </p>
          <p className="text-zinc-300 leading-relaxed font-medium italic">
            "Semoga kecantikan hatimu terus bersinar dan menginspirasi dunia. Tetaplah menjadi sosok yang lembut namun kuat, dan semoga setiap harapan indahmu segera terwujud dalam pelukan kebahagiaan."
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Selamat ulang tahun, Bintang Paling Terang! ✨ Di hari spesialmu ini, semoga kebahagiaan tanpa henti selalu menghampirimu.
          </p>
          <p className="text-zinc-300 leading-relaxed font-medium italic">
            "Semoga setiap impianmu terbang tinggi dan menjadi kenyataan. Teruslah melangkah dengan penuh keyakinan dan jadilah versi terbaik dari dirimu sendiri yang luar biasa."
          </p>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-zinc-900 border border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)] animate-slide-up overflow-hidden text-center">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent"></div>
        <div className="absolute -top-10 -right-10 text-primary/10 rotate-12">
           <Stars size={120} />
        </div>
        <div className="absolute -bottom-10 -left-10 text-pink-500/10 -rotate-12">
           <Heart size={120} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6 animate-bounce-slow">
            <Gift size={40} />
          </div>
          
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400 mb-2">
            Happy Birthday, {userProfile.name.split(' ')[0]}!
          </h2>
          
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-pink-500 rounded-full mb-6"></div>

          <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5 mb-8 text-left">
            {getGreeting()}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            <span>Terima Kasih!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
