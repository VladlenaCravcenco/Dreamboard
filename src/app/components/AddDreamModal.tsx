import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AddDreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDreamModal: React.FC<AddDreamModalProps> = ({ isOpen, onClose }) => {
  const { addDream } = useDreams();
  const [formData, setFormData] = useState({
    title: '',
    category: 'travel' as Category,
    tag: '',
    location: '',
    description: '',
    price: '',
    season: '',
    duration: '',
    difficulty: '',
    image: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addDream({
      category: formData.category,
      categoryLabel: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
      tag: formData.tag,
      title: formData.title,
      location: formData.location || undefined,
      season: formData.season || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty || undefined,
      description: formData.description,
      bucketItems: [],
      image: formData.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    });

    // Reset form
    setFormData({
      title: '',
      category: 'travel',
      tag: '',
      location: '',
      description: '',
      price: '',
      season: '',
      duration: '',
      difficulty: '',
      image: '',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Add New Dream
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="travel">Travel</option>
                  <option value="adventure">Adventure</option>
                  <option value="personal">Personal</option>
                  <option value="style-health">Style & Health</option>
                  <option value="material">Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Tag *</label>
                <input
                  type="text"
                  required
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Description *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Season</label>
                <div className="flex gap-1">
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
                      onClick={() => setFormData({ ...formData, season: season.value })}
                      className={`flex-1 px-2 py-2 rounded text-xs transition-all ${
                        formData.season === season.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/70'
                      }`}
                    >
                      {season.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  onFocus={(e) => {
                    if (e.target.value === '0' || e.target.value === '') {
                      setFormData({ ...formData, price: '' });
                    }
                  }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add Dream
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddDreamModal;