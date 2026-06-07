import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Heart, Calendar, DollarSign, MapPin, Clock, Check, Share2, Plus, Minus, Sparkles, X, Upload, ArrowLeft, Edit2, Trash2, CreditCard, Lock } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import ShareModal from '../components/ShareModal';
import CompletionModal from '../components/CompletionModal';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

const DetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    dreams,
    dreamProgress,
    dreamNotes,
    completionPhotos,
    updateDreamProgress,
    updateDreamNote,
    updateDreamField,
    completeDream,
    toggleBucketItem,
    addCustomBucketItem,
    removeCustomBucketItem,
    updateBucketItem,
    setCompletionPhoto,
    uploadCoverImage,
    freezeAmount,
    deleteDream,
  } = useDreams();

  const dream = dreams.find(d => d.id === id);
  const progress = dreamProgress.find(p => p.dreamId === id);
  const note = dreamNotes.find(n => n.dreamId === id)?.note || '';
  const completionPhoto = completionPhotos.find(p => p.dreamId === id);

  const [saveMonths, setSaveMonths] = useState(12);
  const [savedAmount, setSavedAmount] = useState(progress?.savedAmount || 0);
  const [customItemText, setCustomItemText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showCompletedOverlay, setShowCompletedOverlay] = useState(false);
  const [showCameraAnimation, setShowCameraAnimation] = useState(false);
  
  // Freeze/Card states
  const [linkedCard, setLinkedCard] = useState({ last4: '4832', brand: 'Visa' });
  const [showLinkCardModal, setShowLinkCardModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeAmountInput, setFreezeAmountInput] = useState('');
  const [frozenAmountForModal, setFrozenAmountForModal] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [freezeUntilDate, setFreezeUntilDate] = useState<Date>(new Date(2026, 1, 21)); // Feb 21, 2026
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Delete dream states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Inline editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(dream?.title || '');
  const [isEditingSeason, setIsEditingSeason] = useState(false);
  const [editedSeason, setEditedSeason] = useState(dream?.season || '');
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editedDuration, setEditedDuration] = useState(dream?.duration || '');
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(dream?.price || 0);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(dream?.description || '');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemText, setEditedItemText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSavedAmount(progress?.savedAmount || 0);
  }, [progress]);

  useEffect(() => {
    if (dream) {
      setEditedTitle(dream.title);
      setEditedSeason(dream.season || '');
      setEditedDuration(dream.duration || '');
      setEditedPrice(dream.price || 0);
      setEditedDescription(dream.description || '');
    }
  }, [dream]);

  if (!dream) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <p>Dream not found</p>
      </div>
    );
  }

  const goalPrice = dream.price || 0;
  const progressPercent = goalPrice > 0 ? Math.min((savedAmount / goalPrice) * 100, 100) : 0;
  const remaining = Math.max(goalPrice - savedAmount, 0);

  // Calculator values
  const perMonth = goalPrice > 0 ? (goalPrice - savedAmount) / saveMonths : 0;
  const perWeek = perMonth / 4.33;
  const perDay = perMonth / 30;

  // Completion requirements
  const isProgressComplete = progressPercent >= 100;
  const areAllTasksChecked = dream.bucketItems.length > 0 && dream.bucketItems.every(item => item.checked);
  const hasNotes = note.trim().length > 0;
  const canComplete = isProgressComplete && areAllTasksChecked && hasNotes;

  const handleApplyProgress = () => {
    updateDreamProgress(id!, savedAmount);
    
    // Trigger confetti if 100% - from the Apply button position
    if (progressPercent >= 100 && applyButtonRef.current) {
      const rect = applyButtonRef.current.getBoundingClientRect();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        },
        colors: ['#B8924A', '#7A9B7C', '#E4DDD4'],
      });
    }
  };

  const handleAddCustomItem = () => {
    if (customItemText.trim()) {
      addCustomBucketItem(id!, customItemText.trim());
      setCustomItemText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhoto(id!, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteDream = () => {
    // IMPORTANT: Save note before completion (if it was changed)
    if (note) {
      updateDreamNote(id!, note);
    }
    
    // Show completion modal
    setShowCameraAnimation(true);
  };

  const handleCameraAnimationComplete = () => {
    // Complete the dream FIRST
    completeDream(id!, completionPhoto?.photoUrl);
    
    // Hide camera
    setShowCameraAnimation(false);
    
    // Navigate to completed
    setTimeout(() => {
      navigate('/completed');
    }, 100);
  };

  const handleContinueFromOverlay = () => {
    setShowCompletedOverlay(false);
    navigate('/');
  };

  // Inline editing handlers
  const handleSaveTitle = async () => {
    if (editedTitle.trim()) {
      await updateDreamField(id!, 'title', editedTitle);
      setIsEditingTitle(false);
    }
  };

  const handleSaveSeason = async () => {
    await updateDreamField(id!, 'season', editedSeason);
    setIsEditingSeason(false);
  };

  const handleSaveDuration = async () => {
    await updateDreamField(id!, 'duration', editedDuration);
    setIsEditingDuration(false);
  };

  const handleSavePrice = async () => {
    await updateDreamField(id!, 'price', editedPrice);
    setIsEditingPrice(false);
  };

  const handleSaveDescription = async () => {
    if (editedDescription.trim()) {
      await updateDreamField(id!, 'description', editedDescription);
      setIsEditingDescription(false);
    }
  };

  const handleStartEditItem = (itemId: string, text: string) => {
    setEditingItemId(itemId);
    setEditedItemText(text);
  };

  const handleSaveItem = async () => {
    if (editingItemId && editedItemText.trim()) {
      await updateBucketItem(id!, editingItemId, editedItemText);
      setEditingItemId(null);
      setEditedItemText('');
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditedItemText('');
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) {
      await uploadCoverImage(id, file);
    }
  };

  // Freeze handlers
  const handleFreezeClick = async () => {
    if (!freezeAmountInput || parseFloat(freezeAmountInput) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const amount = parseFloat(freezeAmountInput);
    
    try {
      // Freeze amount
      const freezeUntil = freezeUntilDate;
      await freezeAmount(id!, amount, freezeUntil.toISOString());
      
      // Update progress
      const newSavedAmount = savedAmount + amount;
      setSavedAmount(newSavedAmount);
      updateDreamProgress(id!, newSavedAmount);
      
      // Сохраняем сумму ДО очистки поля
      setFrozenAmountForModal(amount);
      // Show success modal
      setShowFreezeModal(true);
      setFreezeAmountInput('');
      
      // Hide modal after 3s
      setTimeout(() => {
        setShowFreezeModal(false);
      }, 3000);
      
      // Confetti!
      const newProgressPercent = goalPrice > 0 ? Math.min((newSavedAmount / goalPrice) * 100, 100) : 0;
      if (newProgressPercent >= 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#B8924A', '#7A9B7C', '#E4DDD4'],
        });
      }
    } catch (error) {
      console.error('Error freezing amount:', error);
      toast.error('Error while freezing');
    }
  };

  const handleLinkCard = () => {
    const last4 = cardNumber.slice(-4);
    setLinkedCard({ last4, brand: 'Visa' });
    setShowLinkCardModal(false);
    setCardNumber('');
    toast.success('Card linked successfully!');
  };

  const handleDeleteDream = async () => {
    if (deleteConfirmText !== dream?.title) return;
    const deleted = await deleteDream(id!);
    if (!deleted) return;
    toast.success('Dream deleted');
    navigate('/');
  };
  
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-2 lg:px-[30px] overflow-x-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* 3x3 Bento Grid - на десктопе сетка 3x3, на мобильных вертикально друг под другом */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-3 lg:h-[calc(100vh-200px)] lg:max-h-[calc(100vh-200px)]">
        
        {/* Row 1-2, Col 1: Image (spans 2 rows on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="h-[300px] lg:h-auto lg:row-span-2 lg:col-span-1"
        >
          <div className="relative rounded-xl overflow-hidden h-full group">
            <img
              src={dream.image}
              alt={dream.title}
              className="w-full h-full object-cover"
            />
            {dream.location && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                {dream.location}
              </div>
            )}
            <div className="absolute top-3 left-3">
              <div className="text-xs uppercase tracking-wider text-white bg-primary/90 px-2 py-0.5 rounded backdrop-blur-sm">
                {dream.categoryLabel}
              </div>
            </div>
            
            {/* Upload button */}
            <button
              onClick={() => coverImageInputRef.current?.click()}
              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              title="Change cover photo"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            {/* Hidden file input for cover image */}
            <input
              ref={coverImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="hidden"
            />
          </div>
        </motion.div>

        {/* Row 1, Col 2-3: Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 overflow-y-auto lg:col-span-2 lg:p-[30px]"
        >
          {/* Title row with delete button */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {/* Editable Title */}
              {isEditingTitle ? (
                <div>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    onBlur={handleSaveTitle}
                    className="w-full text-2xl italic bg-transparent border-b-2 border-primary focus:outline-none"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveTitle} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedTitle(dream.title);
                        setIsEditingTitle(false);
                      }}
                      className="text-xs px-2 py-1 bg-muted rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h1
                  className="text-2xl italic group cursor-pointer relative inline-block"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  onClick={() => setIsEditingTitle(true)}
                >
                  {dream.title}
                  <Edit2 className="w-3 h-3 absolute -right-5 top-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                </h1>
              )}
            </div>

            {/* Delete dream button — top-right corner */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-40 hover:opacity-100"
              title="Delete dream"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Price */}
            <div>
              <div className="text-xs text-muted-foreground uppercase mb-1">Price</div>
              {isEditingPrice ? (
                <div>
                  <input
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => {
                      if (editedPrice === 0) {
                        setEditedPrice('' as any);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                    onBlur={handleSavePrice}
                    className="w-full px-2 py-1 bg-background border border-primary rounded focus:outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={handleSavePrice} className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">Save</button>
                    <button onClick={() => { setEditedPrice(dream.price || 0); setIsEditingPrice(false); }} className="text-xs px-1.5 py-0.5 bg-muted rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-primary font-medium group cursor-pointer relative" onClick={() => setIsEditingPrice(true)}>
                  ${dream.price?.toLocaleString() || 0}
                  <Edit2 className="w-3 h-3 absolute -right-4 top-0.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              )}
            </div>

            {/* Season */}
            <div>
              <div className="text-xs text-muted-foreground uppercase mb-1">Season</div>
              {isEditingSeason ? (
                <div>
                  <div className="flex gap-1 mb-2">
                    {[
                      { value: '', label: 'None' },
                      { value: 'Spring', label: 'Spring' },
                      { value: 'Summer', label: 'Summer' },
                      { value: 'Fall', label: 'Fall' },
                      { value: 'Winter', label: 'Winter' },
                    ].map((season) => (
                      <button
                        key={season.value}
                        type="button"
                        onClick={() => {
                          setEditedSeason(season.value);
                          // Автосохранение при клике на кнопку
                          updateDreamField(id!, 'season', season.value || undefined);
                          setIsEditingSeason(false);
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                          editedSeason === season.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/70'
                        }`}
                      >
                        {season.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm group cursor-pointer relative" onClick={() => setIsEditingSeason(true)}>
                  {dream.season || 'Not set'}
                  <Edit2 className="w-3 h-3 absolute -right-4 top-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <div className="text-xs text-muted-foreground uppercase mb-1">Duration</div>
              {isEditingDuration ? (
                <div>
                  <input
                    type="text"
                    value={editedDuration}
                    onChange={(e) => setEditedDuration(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDuration()}
                    onBlur={handleSaveDuration}
                    className="w-full px-2 py-1 bg-background border border-primary rounded focus:outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={handleSaveDuration} className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">Save</button>
                    <button onClick={() => { setEditedDuration(dream.duration || ''); setIsEditingDuration(false); }} className="text-xs px-1.5 py-0.5 bg-muted rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm group cursor-pointer relative" onClick={() => setIsEditingDuration(true)}>
                  {dream.duration || 'Not set'}
                  <Edit2 className="w-3 h-3 absolute -right-4 top-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {isEditingDescription ? (
            <div className="mb-4">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleSaveDescription}
                className="w-full px-3 py-2 bg-background border border-primary rounded focus:outline-none resize-none text-sm"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveDescription} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Save</button>
                <button onClick={() => { setEditedDescription(dream.description || ''); setIsEditingDescription(false); }} className="text-xs px-2 py-1 bg-muted rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-muted-foreground leading-relaxed group cursor-pointer relative mb-4"
              onClick={() => setIsEditingDescription(true)}
            >
              {dream.description}
              <Edit2 className="w-3 h-3 absolute -right-5 top-0 opacity-0 group-hover:opacity-50 transition-opacity" />
            </p>
          )}

          {/* Calculator - moved here */}
          <div className="pt-3 border-t border-border">
            <h3 className="text-base mb-3 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Calculator
            </h3>
            <div className="grid grid-cols-[1fr_2fr] gap-4 items-start">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Save in</label>
                <select
                  value={saveMonths}
                  onChange={(e) => setSaveMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none text-sm"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={18}>18 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-0.5">Month</div>
                  <div className="text-sm font-medium text-primary">${perMonth.toFixed(0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-0.5">Week</div>
                  <div className="text-sm font-medium text-primary">${perWeek.toFixed(0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-0.5">Day</div>
                  <div className="text-sm font-medium text-primary">${perDay.toFixed(0)}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 2, Col 2-3: Freeze Savings - ПОЛНОСТЬЮ ПЕРЕРАБОТАН */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 lg:col-span-2"
        >
          {/* Left Column: Dreamcard + Input под ней */}
          <div className="flex-shrink-0 w-full md:w-[280px] flex flex-col gap-4">
            {/* Dreamcard - ТОЧНЫЕ размеры как на CardScreen */}
            <div 
              className="bg-gradient-to-br from-[#3d3529] via-[#4a3f2f] to-[#5a4d38] rounded-2xl md:rounded-3xl p-5 md:p-6 text-white relative overflow-hidden"
              style={{ aspectRatio: '1.586' }}
            >
              {/* Decorative gradient blob */}
              <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-[#B8935E]/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-lg md:text-xl mb-4 md:mb-0" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                    Dreamcard
                  </p>
                </div>

                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-white/70 mb-1">
                    TOTAL SAVED
                  </p>
                  <p className="text-2xl md:text-3xl font-light mb-0.5">
                    ${savedAmount.toLocaleString()}
                  </p>
                  <p className="text-[11px] md:text-xs text-white/60 truncate">
                    {dream.title}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-white/70 tracking-wider text-xs md:text-sm">
                    •••• {linkedCard.last4}
                  </p>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-1.5 h-1.5 bg-[#B8935E] rounded-full animate-pulse" />
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#B8935E]">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Freeze Input + Button - ПОД КАРТОЙ */}
            <div className="flex flex-col gap-2">
              <input
                type="number"
                value={freezeAmountInput}
                onChange={(e) => setFreezeAmountInput(e.target.value)}
                placeholder="Amount to freeze"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-sm transition-colors"
              />
              <button
                onClick={handleFreezeClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#B8935E] to-[#A17D4A] hover:from-[#A17D4A] hover:to-[#8B6A3C] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Lock className="w-4 h-4" />
                FREEZE
              </button>
            </div>
          </div>

          {/* Right: Controls - компактная grid композиция БЕЗ input/button */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            {/* Freeze Until Date - занимает всю ширину */}
            <div className="md:col-span-2 bg-muted/20 rounded-xl p-4 border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                FREEZE UNTIL
              </p>
              <button
                onClick={() => setShowDatePicker(true)}
                className="w-full flex items-center gap-3 hover:bg-muted/30 p-3 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                    {format(freezeUntilDate, 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Click to change</p>
                </div>
              </button>
            </div>

            {/* Progress - левая колонка */}
            <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">PROGRESS</p>
              <div className="mb-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-light text-primary">{progressPercent.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {progressPercent >= 100 ? '🎉 Goal reached!' : `$${remaining.toLocaleString()} remaining`}
                </p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary to-[#B8935E] rounded-full"
                />
              </div>
            </div>

            {/* Lock Info - правая колонка */}
            <div className="bg-muted/20 rounded-xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Money locked until date.<br />Changes via support only
              </p>
            </div>
          </div>
        </motion.div>

        {/* Row 3, Col 1: Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 overflow-hidden flex flex-col lg:p-[30px]"
        >
          <h3 className="text-base mb-3 italic flex-shrink-0" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            What must be done
          </h3>
          <div className="space-y-2 mb-3 overflow-y-auto flex-1 pr-1">
            {dream.bucketItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  // Только если не в режиме редактирования
                  if (editingItemId !== item.id) {
                    toggleBucketItem(id!, item.id);
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all group cursor-pointer ${
                  item.checked ? 'bg-primary/10 border-primary' : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    item.checked ? 'bg-primary border-primary' : 'border-muted'
                  }`}
                >
                  {item.checked && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                
                {editingItemId === item.id ? (
                  <div className="flex-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editedItemText}
                      onChange={(e) => setEditedItemText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
                      className="flex-1 px-2 py-1 bg-background border border-primary rounded focus:outline-none text-xs"
                      autoFocus
                    />
                    <button onClick={handleSaveItem} className="p-1 hover:bg-primary/10 rounded text-primary">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={handleCancelEditItem} className="p-1 hover:bg-muted rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-xs ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditItem(item.id, item.text);
                      }}
                      className="p-1 hover:bg-primary/10 rounded text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomBucketItem(id!, item.id);
                      }}
                      className="p-1 hover:bg-destructive/10 rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={customItemText}
              onChange={(e) => setCustomItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
              placeholder="Add item..."
              className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none text-sm"
            />
            <button
              onClick={handleAddCustomItem}
              className="px-3 py-1.5 bg-muted hover:bg-border rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Row 3, Col 2: Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 flex flex-col lg:p-[30px]"
        >
          <h3 className="text-base mb-3 italic flex-shrink-0" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Notes
          </h3>
          <textarea
            value={note}
            onChange={(e) => updateDreamNote(id!, e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none text-sm resize-none"
          />
        </motion.div>

        {/* Row 3, Col 3: Completion Photo + Complete Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-4 flex flex-col lg:p-[30px]"
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-base italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Completion Photo
            </h3>
          </div>
          
          {completionPhoto ? (
            <div className="relative flex-1 rounded-lg overflow-hidden mb-3">
              <img
                src={completionPhoto.photoUrl}
                alt="Completion"
                className="w-full h-full object-cover"
              />
              {canComplete && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => canComplete && fileInputRef.current?.click()}
              disabled={!canComplete}
              className={`w-full flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors mb-3 ${
                canComplete
                  ? 'border-border hover:border-primary cursor-pointer'
                  : 'border-muted/50 cursor-not-allowed opacity-50'
              }`}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">
                {canComplete ? 'Upload photo' : 'Complete all requirements'}
              </span>
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={!canComplete}
          />

          {/* Requirements checklist */}
          {!canComplete && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg space-y-1.5">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Complete to unlock:</p>
              <div className={`flex items-center gap-2 text-xs ${isProgressComplete ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${isProgressComplete ? 'bg-primary border-primary' : 'border-muted'}`}>
                  {isProgressComplete && <Check className="w-2 h-2 text-primary-foreground" />}
                </div>
                Save 100% ({progressPercent.toFixed(0)}%)
              </div>
              <div className={`flex items-center gap-2 text-xs ${areAllTasksChecked ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${areAllTasksChecked ? 'bg-primary border-primary' : 'border-muted'}`}>
                  {areAllTasksChecked && <Check className="w-2 h-2 text-primary-foreground" />}
                </div>
                Complete all tasks ({dream.bucketItems.filter(i => i.checked).length}/{dream.bucketItems.length})
              </div>
              <div className={`flex items-center gap-2 text-xs ${hasNotes ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasNotes ? 'bg-primary border-primary' : 'border-muted'}`}>
                  {hasNotes && <Check className="w-2 h-2 text-primary-foreground" />}
                </div>
                Write notes
              </div>
            </div>
          )}

          <button
            onClick={handleCompleteDream}
            disabled={!canComplete}
            className={`w-full px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm flex-shrink-0 ${
              canComplete
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            <Check className="w-4 h-4" />
            {canComplete ? 'Mark Complete ✓' : 'Complete Requirements'}
          </button>
        </motion.div>
      </div>

      {/* Share Modal */}
      <ShareModal
        dream={dream}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Completed Overlay */}
      <AnimatePresence>
        {showCompletedOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-lg p-12 text-center max-w-md"
            >
              <div className="text-6xl mb-4">✓</div>
              <h2
                className="text-3xl mb-2 italic"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Dream completed
              </h2>
              <p className="text-muted-foreground mb-8">Moving forward</p>
              <button
                onClick={handleContinueFromOverlay}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Animation */}
      {showCameraAnimation && dream && (
        <CompletionModal
          isOpen={showCameraAnimation}
          dream={dream}
          photoUrl={completionPhoto?.photoUrl || dream.image}
          onSave={(shared) => handleCameraAnimationComplete()}
        />
      )}

      {/* Freeze Success Modal */}
      <AnimatePresence>
        {showFreezeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative bg-gradient-to-br from-card via-card to-sky-50/5 border border-sky-200/20 rounded-2xl p-8 text-center max-w-sm shadow-2xl overflow-hidden"
            >
              {/* Frost overlay effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.15] }}
                transition={{ duration: 1.2, times: [0, 0.5, 1] }}
                className="absolute inset-0 bg-gradient-to-br from-sky-100/30 via-transparent to-blue-100/20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(191, 219, 254, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(224, 242, 254, 0.15) 0%, transparent 50%)',
                }}
              />
              
              {/* Animated snowflakes */}
              {[...Array(12)].map((_, i) => (
                <motion.svg
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 400 - 200,
                    y: -100,
                    rotate: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0.7, 0],
                    scale: [0, 1.2, 1, 0.8],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 600 - 100,
                    rotate: Math.random() * 720
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 1,
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 2L10 18M2 10L18 10M5 5L15 15M15 5L5 15"
                    stroke={i % 3 === 0 ? "#B8924A" : "#7DD3FC"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                  <circle cx="10" cy="10" r="2" fill={i % 3 === 0 ? "#B8924A" : "#7DD3FC"} opacity={0.4} />
                </motion.svg>
              ))}

              {/* Frost crystals growing from edges */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.15 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
              >
                <svg viewBox="0 0 100 100" fill="none">
                  <path
                    d="M0 0 L30 30 L0 60 L30 90 L60 60 L90 90 L60 60 L90 30 L60 0 L30 30 Z"
                    fill="url(#frostGradient1)"
                  />
                  <defs>
                    <linearGradient id="frostGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.15 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none transform rotate-180"
              >
                <svg viewBox="0 0 100 100" fill="none">
                  <path
                    d="M0 0 L30 30 L0 60 L30 90 L60 60 L90 90 L60 60 L90 30 L60 0 L30 30 Z"
                    fill="url(#frostGradient2)"
                  />
                  <defs>
                    <linearGradient id="frostGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Main content */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative z-10"
              >
                <motion.div 
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100/50 to-primary/10 rounded-full flex items-center justify-center relative"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Lock className="w-8 h-8 text-primary" />
                  {/* Ice sparkle */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1, delay: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute top-1 right-2 w-2 h-2 bg-sky-300 rounded-full"
                  />
                </motion.div>
                
                <motion.h2 
                  className="text-2xl italic mb-2" 
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Frozen Successfully!
                </motion.h2>
                
                <motion.p 
                  className="text-lg font-medium text-primary mb-1"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring", bounce: 0.5 }}
                >
                  ${frozenAmountForModal.toLocaleString()}
                </motion.p>
                
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  One step closer to your dream ✨
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Card Modal */}
      <AnimatePresence>
        {showLinkCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLinkCardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Link Card
                </h3>
                <button
                  onClick={() => setShowLinkCardModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
                    maxLength={16}
                  />
                </div>
                
                <button
                  onClick={handleLinkCard}
                  disabled={cardNumber.length < 16}
                  className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                    cardNumber.length >= 16
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Link Card
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowDatePicker(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl md:text-3xl mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Select freeze date
              </h2>

              <p className="text-sm text-muted-foreground mb-6">
                Money will be frozen until this date. Changes only via support.
              </p>

              {/* Calendar */}
              <div className="flex justify-center mb-6 [&_.rdp]:m-0 [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:flex [&_.rdp-caption]:justify-between [&_.rdp-caption]:items-center [&_.rdp-caption]:mb-4 [&_.rdp-caption_button]:hover:bg-muted [&_.rdp-caption_button]:rounded-lg [&_.rdp-caption_button]:p-2 [&_.rdp-caption_button]:transition-colors [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-sm [&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm [&_.rdp-day_button]:w-full [&_.rdp-day_button]:h-full [&_.rdp-day_button]:hover:bg-muted [&_.rdp-day_button]:transition-colors [&_.rdp-day_button]:rounded-lg [&_.rdp-day_button.rdp-day_selected]:bg-primary [&_.rdp-day_button.rdp-day_selected]:text-primary-foreground [&_.rdp-day_button.rdp-day_selected]:hover:bg-primary/90">
                <DayPicker
                  mode="single"
                  selected={freezeUntilDate}
                  onSelect={(date) => {
                    if (date) {
                      setFreezeUntilDate(date);
                    }
                  }}
                  disabled={{ before: new Date() }}
                  defaultMonth={freezeUntilDate}
                />
              </div>

              {/* Selected Date Display */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">SELECTED DATE</p>
                <p className="text-xl" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                  {format(freezeUntilDate, 'MMMM dd, yyyy')}
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  toast.success(`Freeze date set to ${format(freezeUntilDate, 'dd/MM/yyyy')}`);
                }}
                className="w-full bg-gradient-to-r from-[#B8935E] to-[#A17D4A] hover:from-[#A17D4A] hover:to-[#8B6A3C] text-white py-3 md:py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                CONFIRM DATE →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dream Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl md:text-3xl mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Delete Dream
              </h2>

              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this dream? This action cannot be undone.
              </p>

              {/* Confirm Input */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2">
                  Type the dream title to confirm:
                </label>
                <div className="mb-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Dream title</span>
                  <p className="font-medium text-foreground break-words">{dream.title}</p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter the title shown above"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleDeleteDream}
                disabled={deleteConfirmText !== dream.title}
                className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                  deleteConfirmText === dream.title
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                DELETE DREAM
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailScreen;
