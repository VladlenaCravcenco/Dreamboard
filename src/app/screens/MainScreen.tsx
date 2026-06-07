import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, BarChart3 } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import DreamCard from '../components/DreamCard';
import AddDreamModal from '../components/AddDreamModal';
import DreamTemplates from '../components/DreamTemplates';
import { Category, Dream } from '../types';
import { toast } from 'sonner';

const categories: { value: Category | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '✨' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'personal', label: 'Personal', emoji: '🌱' },
  { value: 'style-health', label: 'Style & Health', emoji: '💫' },
  { value: 'material', label: 'Material', emoji: '🎁' },
];

const MainScreen: React.FC = () => {
  const { dreams, dreamProgress, completedDreams, addDream, loading, syncing, syncError, refreshDreams } = useDreams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter dreams
  const activeDreams = dreams.filter(d => !d.done);
  const filteredDreams = activeDreams.filter(dream => {
    const matchesSearch = dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dream.tag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dream.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Generate random rotations for scattered feel (deterministic based on ID)
  const getRotation = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((hash % 5) - 2); // Random between -2 and 2 degrees
  };

  // Handle template addition with animation
  const handleAddTemplate = async (template: Partial<Dream>) => {
    const created = await addDream(template as Omit<Dream, 'id' | 'done'>);
    if (!created) return;

    toast.success(`✨ "${template.title}" added to your dreams!`, {
      duration: 3000,
      position: 'bottom-center',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 overflow-x-hidden">
      {/* Search Bar */}
      {(syncing || syncError) && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          syncError
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-border bg-muted text-muted-foreground'
        }`}>
          {syncError ? (
            <div className="flex items-center justify-between gap-3">
              <span>Sync error: {syncError}</span>
              <button onClick={refreshDreams} className="font-medium underline">Retry</button>
            </div>
          ) : (
            'Syncing dreams…'
          )}
        </div>
      )}

      <div className="mb-4 md:mb-6 relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search dreams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-sm md:text-base bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
      </div>

      {/* Dream Templates - Inspiration Feed */}
      <DreamTemplates onAddTemplate={handleAddTemplate} />

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition-all ${
              selectedCategory === cat.value
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border hover:border-primary'
            }`}
          >
            <span className="mr-1 md:mr-1.5">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dream Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Loading your dreams…</p>
        </div>
      ) : filteredDreams.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6 mb-20 md:mb-24">
          {filteredDreams.map(dream => (
            <DreamCard
              key={dream.id}
              dream={dream}
              progress={dreamProgress.find(p => p.dreamId === dream.id)}
              rotation={getRotation(dream.id)}
              onClick={() => navigate(`/dream/${dream.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 md:py-20 flex flex-col items-center gap-4">
          <p
            className="text-xl md:text-2xl text-muted-foreground italic px-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {searchQuery || selectedCategory !== 'all'
              ? 'Nothing found. Try adjusting your search or filters.'
              : 'Your dreamboard is empty. Add your first dream ✨'}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add your first dream
            </button>
          )}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-3 md:py-4 px-4 md:px-6 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          <div className="flex gap-3 md:gap-6 text-xs md:text-sm">
            <div>
              <span className="text-muted-foreground">Active:</span>
              <span className="ml-1 md:ml-2 font-medium">{activeDreams.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Done:</span>
              <span className="ml-1 md:ml-2 font-medium">{completedDreams.length}</span>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => navigate('/stats')}
              className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg border border-border hover:border-primary transition-colors flex items-center gap-1.5 md:gap-2"
            >
              <BarChart3 className="w-3.5 md:w-4 h-3.5 md:h-4" />
              <span className="hidden sm:inline">Stats →</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 md:gap-2"
            >
              <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" />
              <span className="hidden sm:inline">Add dream</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Dream Modal */}
      <AddDreamModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default MainScreen;
