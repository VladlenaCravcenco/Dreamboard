import React from 'react';
import { Plus, Sparkles, RefreshCw } from 'lucide-react';
import { Dream, Category } from '../types';

interface DreamTemplate {
  title: string;
  category: Category;
  categoryLabel: string;
  tag: string;
  description: string;
  target_amount: number;
  bucketItems: { text: string; checked: boolean }[];
  image: string;
  emoji: string;
}

const templates: DreamTemplate[] = [
  // Travel
  {
    title: 'Two weeks in Bali',
    category: 'travel',
    categoryLabel: 'Travel',
    tag: 'Paradise Escape',
    description: 'Remote work from paradise beaches, temple visits, and surf lessons',
    target_amount: 4500,
    bucketItems: [
      { text: 'Get/renew passport', checked: false },
      { text: 'Book round-trip flights', checked: false },
      { text: 'Find beachfront villa', checked: false },
      { text: 'Plan temple tour route', checked: false },
      { text: 'Book surf lessons', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    emoji: '🏝️',
  },
  {
    title: 'Backpacking through Japan',
    category: 'travel',
    categoryLabel: 'Travel',
    tag: 'Cultural Journey',
    description: 'Tokyo streets, Kyoto temples, Mount Fuji, and authentic ramen adventures',
    target_amount: 6000,
    bucketItems: [
      { text: 'Apply for Japan visa', checked: false },
      { text: 'Buy JR Rail Pass', checked: false },
      { text: 'Book hostels in major cities', checked: false },
      { text: 'Learn basic Japanese phrases', checked: false },
      { text: 'Plan Mount Fuji climb', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    emoji: '🗾',
  },
  {
    title: 'Iceland Northern Lights',
    category: 'travel',
    categoryLabel: 'Travel',
    tag: 'Natural Wonder',
    description: 'Chase Aurora Borealis, Blue Lagoon, black sand beaches, and ice caves',
    target_amount: 5500,
    bucketItems: [
      { text: 'Book September-March dates', checked: false },
      { text: 'Rent 4x4 car', checked: false },
      { text: 'Reserve Blue Lagoon entry', checked: false },
      { text: 'Book northern lights tour', checked: false },
      { text: 'Pack winter gear', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&q=80',
    emoji: '🌌',
  },

  // Adventure
  {
    title: 'Learn to Scuba Dive',
    category: 'adventure',
    categoryLabel: 'Adventure',
    tag: 'Underwater Explorer',
    description: 'PADI Open Water certification and first ocean dive experience',
    target_amount: 1200,
    bucketItems: [
      { text: 'Find PADI certified school', checked: false },
      { text: 'Complete online theory', checked: false },
      { text: 'Book pool training sessions', checked: false },
      { text: 'Pass certification exam', checked: false },
      { text: 'Plan first ocean dive', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    emoji: '🤿',
  },
  {
    title: 'Complete a Marathon',
    category: 'adventure',
    categoryLabel: 'Adventure',
    tag: 'Endurance Goal',
    description: '26.2 miles of determination, training plan, and crossing the finish line',
    target_amount: 800,
    bucketItems: [
      { text: 'Choose marathon event', checked: false },
      { text: 'Register for race', checked: false },
      { text: 'Buy proper running shoes', checked: false },
      { text: 'Follow 16-week training plan', checked: false },
      { text: 'Prepare race day nutrition', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80',
    emoji: '🏃',
  },

  // Personal
  {
    title: 'Learn Spanish Fluently',
    category: 'personal',
    categoryLabel: 'Personal Growth',
    tag: 'Language Mastery',
    description: 'Intensive course + immersion trip to Spain for real conversation practice',
    target_amount: 3500,
    bucketItems: [
      { text: 'Enroll in intensive course', checked: false },
      { text: 'Practice daily with Duolingo', checked: false },
      { text: 'Find conversation partner', checked: false },
      { text: 'Book 2-week Spain immersion', checked: false },
      { text: 'Take DELE certification', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    emoji: '📚',
  },
  {
    title: 'Write My First Novel',
    category: 'personal',
    categoryLabel: 'Personal Growth',
    tag: 'Creative Writing',
    description: '50,000 words, professional editing, and self-publishing journey',
    target_amount: 2000,
    bucketItems: [
      { text: 'Outline full story arc', checked: false },
      { text: 'Write 1000 words daily', checked: false },
      { text: 'Finish first draft', checked: false },
      { text: 'Hire professional editor', checked: false },
      { text: 'Design cover and publish', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    emoji: '✍️',
  },

  // Style & Health
  {
    title: 'Complete Wardrobe Refresh',
    category: 'style-health',
    categoryLabel: 'Style & Health',
    tag: 'Style Upgrade',
    description: 'Capsule wardrobe with timeless pieces and personal stylist consultation',
    target_amount: 2500,
    bucketItems: [
      { text: 'Book stylist consultation', checked: false },
      { text: 'Donate old clothes', checked: false },
      { text: 'Build color palette', checked: false },
      { text: 'Invest in quality basics', checked: false },
      { text: 'Add statement pieces', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    emoji: '👔',
  },
  {
    title: 'Yoga Teacher Training',
    category: 'style-health',
    categoryLabel: 'Style & Health',
    tag: 'Wellness Journey',
    description: '200-hour YTT certification in Bali with daily practice and meditation',
    target_amount: 4200,
    bucketItems: [
      { text: 'Choose certified program', checked: false },
      { text: 'Practice yoga 5x/week', checked: false },
      { text: 'Study anatomy and philosophy', checked: false },
      { text: 'Complete 200-hour training', checked: false },
      { text: 'Pass teaching exam', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    emoji: '🧘',
  },

  // Material
  {
    title: 'MacBook Pro M3 Max',
    category: 'material',
    categoryLabel: 'Material',
    tag: 'Creative Powerhouse',
    description: 'Top-spec laptop for video editing, 3D work, and professional workflow',
    target_amount: 3999,
    bucketItems: [
      { text: 'Research specs and reviews', checked: false },
      { text: 'Compare M3 Pro vs Max', checked: false },
      { text: 'Check education discount', checked: false },
      { text: 'Trade in old laptop', checked: false },
      { text: 'Order with AppleCare+', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    emoji: '💻',
  },
  {
    title: 'Professional Camera Setup',
    category: 'material',
    categoryLabel: 'Material',
    tag: 'Photography Gear',
    description: 'Sony A7 IV, 24-70mm lens, and essential accessories for stunning photos',
    target_amount: 4500,
    bucketItems: [
      { text: 'Choose camera body', checked: false },
      { text: 'Buy versatile lens', checked: false },
      { text: 'Get camera bag and SD cards', checked: false },
      { text: 'Take photography course', checked: false },
      { text: 'Plan first photo project', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    emoji: '📷',
  },
  {
    title: 'Home Recording Studio',
    category: 'material',
    categoryLabel: 'Material',
    tag: 'Music Production',
    description: 'Audio interface, microphone, monitors, and acoustic treatment for pro sound',
    target_amount: 3200,
    bucketItems: [
      { text: 'Buy audio interface', checked: false },
      { text: 'Get condenser microphone', checked: false },
      { text: 'Purchase studio monitors', checked: false },
      { text: 'Add acoustic panels', checked: false },
      { text: 'Set up DAW software', checked: false },
    ],
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    emoji: '🎵',
  },
];

interface DreamTemplatesProps {
  onAddTemplate: (template: Partial<Dream>) => void;
}

const DreamTemplates: React.FC<DreamTemplatesProps> = ({ onAddTemplate }) => {
  const [addedId, setAddedId] = React.useState<number | null>(null);
  const [displayedTemplates, setDisplayedTemplates] = React.useState<DreamTemplate[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  // Функция для рандомизации и выбора 12 шаблонов
  const shuffleTemplates = () => {
    setIsRefreshing(true);
    
    // Fade out
    setIsVisible(false);
    
    // После fade out меняем контент
    setTimeout(() => {
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      setDisplayedTemplates(shuffled.slice(0, 12));
      
      // Fade in
      setTimeout(() => {
        setIsVisible(true);
        setIsRefreshing(false);
      }, 50);
    }, 300);
  };

  // Инициализация при первом рендере
  React.useEffect(() => {
    shuffleTemplates();
  }, []);

  const handleAddTemplate = (template: DreamTemplate, idx: number) => {
    const newDream: Partial<Dream> = {
      title: template.title,
      category: template.category,
      categoryLabel: template.categoryLabel,
      tag: template.tag,
      description: template.description,
      price: template.target_amount, // Для отображения в калькуляторе
      target_amount: template.target_amount, // Для Dreamcard
      bucketItems: template.bucketItems.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        text: item.text,
        checked: item.checked,
      })),
      image: template.image,
      done: false,
      saved_amount: 0,
      season: 'Not set', // Добавляем дефолтные значения
      duration: 'Not set',
      location: 'Not set',
      difficulty: 'Not set',
    };

    onAddTemplate(newDream);
    
    // Trigger animation
    setAddedId(idx);
    setTimeout(() => setAddedId(null), 600);
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-primary" />
          <h2 
            className="text-base md:text-lg text-foreground"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Dream Inspiration
          </h2>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={shuffleTemplates}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-xs md:text-sm font-medium"
          title="Refresh templates"
        >
          <RefreshCw className={`w-3.5 md:w-4 h-3.5 md:h-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
          <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="relative -mx-4 md:mx-0">
        <div data-swipe-nav-ignore className="overflow-x-auto scrollbar-hide px-4 md:px-0">
          <div 
            className={`flex gap-3 md:gap-4 pb-2 transition-all duration-300 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            {displayedTemplates.map((template, idx) => (
              <div
                key={`${template.title}-${idx}`}
                className={`flex-shrink-0 w-[210px] sm:w-[230px] md:w-[320px] bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-500 group ${
                  isVisible ? 'animate-slide-in' : ''
                }`}
                style={{ 
                  animationDelay: `${idx * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                {/* Image */}
                <div className="relative h-24 sm:h-28 md:h-40 overflow-hidden bg-muted">
                  <img
                    src={template.image}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-background/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-sm md:text-xl">
                    {template.emoji}
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5 md:p-4">
                  {/* Category Tag */}
                  <div className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] md:text-xs rounded-full mb-1.5 md:mb-2">
                    {template.categoryLabel}
                  </div>

                  {/* Title */}
                  <h3 
                    className="text-sm md:text-lg font-medium text-foreground mb-1 line-clamp-1"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {template.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 leading-snug">
                    {template.description}
                  </p>

                  {/* Price & Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Target</div>
                      <div 
                        className="text-sm md:text-xl font-medium text-primary"
                        style={{ fontFamily: 'Cormorant Garamond, serif' }}
                      >
                        ${template.target_amount.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddTemplate(template, idx)}
                      className={`flex items-center gap-1 px-2.5 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-[11px] md:text-sm font-medium shadow-md hover:shadow-lg active:scale-95 ${addedId === idx ? 'animate-bounce' : ''}`}
                    >
                      <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DreamTemplates;
