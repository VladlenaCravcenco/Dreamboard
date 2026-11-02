export function dreamStats(dreams, completedDreams) {
  const total = dreams.length + completedDreams.length;
  const budgeted = dreams.filter(d => Number.isFinite(d.price) && d.price > 0);
  const goal = budgeted.reduce((sum, d) => sum + d.price, 0);
  const saved = budgeted.reduce((sum, d) => sum + Math.max(0, d.saved_amount || 0), 0);
  return {
    active: dreams.length,
    completed: completedDreams.length,
    completedPercent: total ? Math.round(completedDreams.length / total * 100) : 0,
    goal,
    saved,
    remaining: Math.max(0, goal - saved),
  };
}
