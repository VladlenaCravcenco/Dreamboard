import React, { useState, useRef } from 'react';
import { useDreams } from '../context/DreamContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { CreditCard, Lock, Calendar, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

export default function CardScreen() {
  const { dreams, dreamProgress } = useDreams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Freeze date
  const [freezeUntilDate, setFreezeUntilDate] = useState<Date>(new Date(2026, 1, 21));
  const [showCalendar, setShowCalendar] = useState(false);

  // Link card
  const [linkCardModalOpen, setLinkCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [linkedCards, setLinkedCards] = useState([
    { id: '1', last4: '4832', brand: 'Visa', bank: 'Bank' },
  ]);

  // Freeze amount — две независимые переменные, никаких null
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [popupAmount, setPopupAmount] = useState(0);
  const [extraFrozen, setExtraFrozen] = useState(0);

  // Derived
  const activeDreams = dreams.filter((d) => !d.done);
  const totalSaved = dreamProgress.reduce((s, p) => s + (p.savedAmount || 0), 0) + extraFrozen;

  const recentDeposits = [
    { id: '1', emoji: '✈️', title: 'Japan in sakura season', date: 'Feb 26 2026', amount: 50 },
    { id: '2', emoji: '💻', title: 'Contax T2', date: 'Feb 20 2026', amount: 100 },
    { id: '3', emoji: '💰', title: 'Dream computer', date: 'Feb 18 2026', amount: 200 },
    { id: '4', emoji: '🌴', title: 'Auto-deposit — Baikal', date: 'Feb 1 2026', amount: 10 },
  ];

  // ── Freeze handler ───────────────────────────────────────────
  function handleFreeze() {
    const raw = inputRef.current?.value ?? '';
    const n = parseFloat(raw.replace(',', '.'));
    if (!raw || isNaN(n) || n <= 0) return;

    // Сначала запоминаем сумму, потом показываем попап
    setPopupAmount(n);
    setExtraFrozen((prev) => prev + n);
    if (inputRef.current) inputRef.current.value = '';
    setShowSuccess(true);
  }

  function handleLinkCard() {
    if (!cardNumber || !cardExpiry || !cardCvv) return;
    setLinkedCards((prev) => [
      ...prev,
      { id: String(Date.now()), last4: cardNumber.replace(/\s/g, '').slice(-4), brand: 'Visa', bank: 'Bank' },
    ]);
    setLinkCardModalOpen(false);
    setCardNumber(''); setCardExpiry(''); setCardCvv('');
  }

  // ── Auth guard ───────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Sign in to access Dreamcard
          </h2>
          <p className="text-muted-foreground mb-6">
            Dreamcard lets you freeze money toward your dreams with permanent savings locks.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">

      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl mb-2"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
              Dreamcard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Untouchable savings — each section for your dream
            </p>
          </div>
          <button
            onClick={() => setLinkCardModalOpen(true)}
            className="self-start px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> LINK CARD
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid lg:grid-cols-[minmax(320px,400px)_1fr] gap-6 md:gap-8">

          {/* Left */}
          <div className="space-y-4 md:space-y-6">

            {/* Card visual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#3d3529] via-[#4a3f2f] to-[#5a4d38] rounded-3xl p-8 text-white relative overflow-hidden"
              style={{ aspectRatio: '1.586' }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8935E]/20 rounded-full blur-3xl" />
              <div className="relative z-10 h-full flex flex-col">
                <p className="text-2xl mb-8" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                  Dreamcard
                </p>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-white/70 mb-2">TOTAL SAVED</p>
                  <p className="text-5xl font-light mb-1">${totalSaved.toLocaleString()}</p>
                  <p className="text-sm text-white/60">{activeDreams.length} active dreams</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-white/70 tracking-wider">**** **** **** 2025</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#B8935E] rounded-full animate-pulse" />
                    <span className="text-xs uppercase tracking-wider text-[#B8935E]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Freeze block */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Freeze savings</h3>
                  <p className="text-sm text-muted-foreground">
                    Money cannot be withdrawn until selected date
                  </p>
                </div>
              </div>

              {/* Uncontrolled input через ref */}
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount to freeze"
                  defaultValue=""
                  className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFreeze(); }}
                />
              </div>

              <button
                onClick={handleFreeze}
                className="w-full bg-gradient-to-r from-[#B8935E] to-[#A17D4A] hover:from-[#A17D4A] hover:to-[#8B6A3C] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Lock className="w-4 h-4" />
                FREEZE AMOUNT
              </button>
            </div>

            {/* Freeze until */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">FREEZE UNTIL</p>
              <button
                onClick={() => setShowCalendar(true)}
                className="w-full flex items-center gap-2 hover:bg-muted/30 p-2 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg flex-1 text-left"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                  {format(freezeUntilDate, 'dd/MM/yyyy')}
                </span>
              </button>
            </div>

            {/* Recent deposits */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">RECENT DEPOSITS</p>
              <div className="space-y-3">
                {recentDeposits.map((d) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{d.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.date}</p>
                    </div>
                    <p className="text-sm font-medium text-primary">+${d.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — dream sections */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground">DREAM SECTIONS</h2>
              <p className="text-xs text-muted-foreground">{activeDreams.length} sections</p>
            </div>

            {activeDreams.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No active dreams</p>
                <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">Add dream</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {activeDreams.map((dream) => {
                  const prog = dreamProgress.find((p) => p.dreamId === dream.id);
                  const saved = prog?.savedAmount || 0;
                  const target = dream.price || 0;
                  return (
                    <motion.div key={dream.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                    >
                      <div className="relative h-24 sm:h-28 md:h-32 bg-muted overflow-hidden">
                        <img src={dream.image} alt={dream.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <div className="p-3 md:p-4">
                        <p className="text-[10px] md:text-xs uppercase tracking-wider text-primary mb-1 md:mb-2">
                          {dream.categoryLabel}
                        </p>
                        <h3 className="text-base md:text-lg mb-2 md:mb-3 line-clamp-2 leading-snug"
                          style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                          {dream.title}
                        </h3>
                        {saved > 0 && target > 0 && (
                          <div className="mb-2 md:mb-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                style={{ width: `${Math.min((saved / target) * 100, 100)}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <div>
                            <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">saved</p>
                            <p className="font-medium">${saved}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">goal</p>
                            <p className="font-medium text-primary">${target}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <button onClick={() => navigate('/')}
                  className="bg-card border border-dashed border-border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-3 min-h-[200px] sm:min-h-[240px] md:min-h-[280px]"
                >
                  <Plus className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add 1 more</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ SUCCESS MODAL ══════════════════════════════════════════
          showSuccess — boolean
          popupAmount — число, установленное ДО setShowSuccess(true)
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#f5f0e8] to-[#ede8de] rounded-3xl p-10 max-w-sm w-full relative text-center shadow-2xl"
            >
              <span className="absolute top-6 right-8 text-[#B8935E]/40 text-2xl select-none">✦</span>
              <span className="absolute bottom-8 left-7 text-[#B8935E]/30 text-lg select-none">✦</span>

              <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-9 h-9 text-[#B8935E]" />
              </div>

              <h2 className="text-3xl mb-4 text-[#2a2018]"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Frozen Successfully!
              </h2>

              {/* popupAmount здесь — это уже зафиксированное число */}
              <p className="text-5xl mb-3 text-[#B8935E]"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                ${popupAmount % 1 === 0
                  ? popupAmount.toLocaleString()
                  : popupAmount.toFixed(2)}
              </p>

              <p className="text-sm text-[#7a6a55] mb-8">One step closer to your dream ✨</p>

              <button
                onClick={() => setShowSuccess(false)}
                className="px-8 py-3 bg-[#B8935E] hover:bg-[#A17D4A] text-white rounded-xl font-medium transition-colors text-sm"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ LINK CARD MODAL ════════════════════════════════════════ */}
      <AnimatePresence>
        {linkCardModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setLinkCardModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-8 max-w-md w-full relative"
            >
              <button onClick={() => setLinkCardModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl md:text-3xl mb-2"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Link card
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Money is charged from your card and frozen in dream sections
              </p>
              {linkedCards.map((card) => (
                <div key={card.id} className="bg-muted/50 border border-border rounded-xl p-4 mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">•••• •••• •••• {card.last4}</p>
                    <p className="text-xs text-muted-foreground">{card.brand} · {card.bank}</p>
                  </div>
                  <Check className="w-5 h-5 text-primary" />
                </div>
              ))}
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">ADD CARD</p>
              <div className="space-y-4">
                <input type="text" placeholder="0000 0000 0000 0000"
                  value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  maxLength={19} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY"
                    value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                    className="bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    maxLength={5} />
                  <input type="text" placeholder="CVV"
                    value={cardCvv} onChange={(e) => setCardCvv(e.target.value)}
                    className="bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    maxLength={3} />
                </div>
                <button onClick={handleLinkCard}
                  disabled={!cardNumber || !cardExpiry || !cardCvv}
                  className="w-full bg-[#B8935E] hover:bg-[#A17D4A] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  LINK CARD →
                </button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Data protected by PCI DSS encryption
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CALENDAR MODAL ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 md:p-8 max-w-md w-full relative"
            >
              <button onClick={() => setShowCalendar(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl md:text-3xl mb-6"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Select freeze date
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Money will be frozen until this date. Changes only via support.
              </p>
              <div className="flex justify-center mb-6">
                <DayPicker
                  mode="single"
                  selected={freezeUntilDate}
                  onSelect={(date) => { if (date) setFreezeUntilDate(date); }}
                  disabled={{ before: new Date() }}
                  defaultMonth={freezeUntilDate}
                />
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">SELECTED DATE</p>
                <p className="text-xl" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                  {format(freezeUntilDate, 'MMMM dd, yyyy')}
                </p>
              </div>
              <button onClick={() => setShowCalendar(false)}
                className="w-full bg-gradient-to-r from-[#B8935E] to-[#A17D4A] hover:from-[#A17D4A] hover:to-[#8B6A3C] text-white py-3 md:py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> CONFIRM DATE →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
