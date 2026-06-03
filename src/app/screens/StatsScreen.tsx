import React from 'react';
import { useDreams } from '../context/DreamContext';
import { motion } from 'motion/react';

const StatsScreen: React.FC = () => {
  const { dreams, completedDreams, dreamProgress } = useDreams();

  const activeDreams = dreams.filter(d => !d.done);
  const totalDreams = dreams.length;
  const completedCount = completedDreams.length;
  const completedPercent = totalDreams > 0 ? Math.round((completedCount / totalDreams) * 100) : 0;

  // Calculate total saved and total goal
  const pricedDreams = activeDreams.filter(d => d.price);
  const totalGoal = pricedDreams.reduce((sum, d) => sum + (d.price || 0), 0);
  const totalSaved = pricedDreams.reduce((sum, d) => {
    const progress = dreamProgress.find(p => p.dreamId === d.id);
    return sum + (progress?.savedAmount || 0);
  }, 0);

  // Calculate average progress
  const avgProgress = pricedDreams.length > 0
    ? pricedDreams.reduce((sum, d) => {
        const progress = dreamProgress.find(p => p.dreamId === d.id);
        const percent = d.price ? ((progress?.savedAmount || 0) / d.price) * 100 : 0;
        return sum + percent;
      }, 0) / pricedDreams.length
    : 0;

  // Category stats
  const categoryStats = [
    { category: 'Travel', emoji: '✈️', count: activeDreams.filter(d => d.category === 'travel').length },
    { category: 'Adventure', emoji: '🏔️', count: activeDreams.filter(d => d.category === 'adventure').length },
    { category: 'Personal', emoji: '🌱', count: activeDreams.filter(d => d.category === 'personal').length },
    { category: 'Style & Health', emoji: '💫', count: activeDreams.filter(d => d.category === 'style-health').length },
    { category: 'Material', emoji: '🎁', count: activeDreams.filter(d => d.category === 'material').length },
  ];

  const maxCategoryCount = Math.max(...categoryStats.map(s => s.count), 1);

  // Most expensive dreams
  const expensiveDreams = [...activeDreams]
    .filter(d => d.price)
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 4);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 overflow-x-hidden">
      {/* Header */}
      <h1
        className="text-4xl mb-8"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        My stats
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-card border border-border rounded-lg p-4 md:p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Active Dreams</div>
          <div className="text-3xl md:text-4xl font-medium text-primary">
            {activeDreams.length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-4 md:p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Completed</div>
          <div className="text-3xl md:text-4xl font-medium text-primary mb-1">
            {completedCount}
          </div>
          <div className="text-sm text-muted-foreground">
            {completedPercent}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-4 md:p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Total Budget</div>
          <div className="text-xl md:text-2xl font-medium text-primary mb-1">
            ${totalSaved.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">
            of ${totalGoal.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-4 md:p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Avg Progress</div>
          <div className="text-3xl md:text-4xl font-medium text-primary">
            {avgProgress.toFixed(0)}%
          </div>
        </motion.div>
      </div>

      {/* Category Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-lg p-6 mb-8"
      >
        <h2
          className="text-2xl mb-6"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Dreams by Category
        </h2>

        <div className="space-y-4">
          {categoryStats.map((stat, index) => (
            <div key={stat.category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{stat.emoji}</span>
                  <span className="text-sm">{stat.category}</span>
                </div>
                <span className="text-sm font-medium">{stat.count}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.count / maxCategoryCount) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Most Expensive Dreams */}
      {expensiveDreams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2
            className="text-2xl mb-6"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Most Expensive Dreams
          </h2>

          <div className="space-y-4">
            {expensiveDreams.map((dream, index) => (
              <motion.div
                key={dream.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={dream.image}
                    alt={dream.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase text-muted-foreground mb-1">
                    {dream.tag}
                  </div>
                  <h3
                    className="text-lg truncate italic"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {dream.title}
                  </h3>
                </div>

                <div className="text-xl font-medium text-primary flex-shrink-0">
                  ${dream.price?.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StatsScreen;