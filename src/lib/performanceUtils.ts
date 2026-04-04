export interface SetterMetrics {
  totalLeads: number;
  totalDials: number;
  totalBooked: number;
  conversionRate: number;
  powerScore: number;
  projectedRevenue: number;
}

export function calculateSetterMetrics(
  allLeads: any[],
  allNotes: Record<string, any>,
  userId: string,
  timeframe: 'today' | 'month' | 'all' = 'all'
): SetterMetrics {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const DEAL_VALUE = 6500;

  const notesArray = Object.values(allNotes);

  const filteredNotes = notesArray.filter((n: any) => {
    // SECURITY: Always filter by the current user for individual performance
    if (n.setter_id !== userId) return false;

    if (timeframe === 'today') {
      return n.synced_at?.startsWith(todayStr);
    } else if (timeframe === 'month') {
      const d = new Date(n.synced_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });

  const totalDials = filteredNotes.filter((n: any) => n.status !== "new" && n.status !== "ignored").length;
  const totalBooked = filteredNotes.filter((n: any) => n.status === "booked").length;
  const conversionRate = totalDials > 0 ? (totalBooked / totalDials) * 100 : 0;
  
  // Power Score = (ConvRate * 0.7) + (Bookings/10 * 30) - capped at 100
  const powerScore = Math.min(Math.round((conversionRate * 0.7) + (Math.min(totalBooked, 10) * 3)), 100);

  return {
    totalLeads: allLeads.length,
    totalDials,
    totalBooked,
    conversionRate,
    powerScore,
    projectedRevenue: totalBooked * DEAL_VALUE
  };
}
