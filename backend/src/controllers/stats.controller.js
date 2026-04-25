const { database, get, ref, isFirebaseConfigured } = require('../config/firebase');

const normalizeCategory = (category) => {
  const raw = String(category || '').toLowerCase();
  if (raw === 'paper' || raw === 'cardboard' || raw === 'paperboard') {
    return 'organic';
  }
  if (['plastic', 'organic', 'metal', 'glass'].includes(raw)) {
    return raw;
  }
  return 'organic';
};

const getStats = async (req, res) => {
  try {
    if (!isFirebaseConfigured()) {
      return res.status(200).json({
        totalItems: 0,
        breakdown: {
          plastic: 0,
          organic: 0,
          metal: 0,
          glass: 0
        },
        organicCount: 0,
        nonOrganicCount: 0,
        recyclableCount: 0,
        nonRecyclableCount: 0,
        totalPoints: 0,
        totalCarbonCredits: 0,
        note: "Firebase not configured. Set real credentials in .env file."
      });
    }
    
    const historyRef = ref(database, 'classifications');
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      return res.status(200).json({
        totalItems: 0,
        breakdown: {
          plastic: 0,
          organic: 0,
          metal: 0,
          glass: 0
        },
        organicCount: 0,
        nonOrganicCount: 0,
        recyclableCount: 0,
        nonRecyclableCount: 0,
        totalPoints: 0,
        totalCarbonCredits: 0
      });
    }
    
    const data = snapshot.val();
    const items = Object.values(data);
    
    // Count by category
    const breakdown = {
      plastic: 0,
      organic: 0,
      metal: 0,
      glass: 0
    };

    let organicCount = 0;
    let recyclableCount = 0;
    let nonRecyclableCount = 0;
    let totalPoints = 0;
    let totalCarbonCredits = 0;
    
    items.forEach(item => {
      const category = normalizeCategory(item.category);
      if (breakdown[category] !== undefined) {
        breakdown[category]++;
      }

      const recyclable = typeof item.recyclable === 'boolean'
        ? item.recyclable
        : ['plastic', 'metal', 'glass'].includes(category);

      if (category === 'organic') {
        organicCount++;
      }
      if (recyclable) {
        recyclableCount++;
      } else {
        nonRecyclableCount++;
      }

      totalPoints += Number(item.points || 0);
      totalCarbonCredits += Number(item.carbonCredits || 0);
    });
    
    return res.status(200).json({
      totalItems: items.length,
      breakdown,
      organicCount,
      nonOrganicCount: items.length - organicCount,
      recyclableCount,
      nonRecyclableCount,
      totalPoints,
      totalCarbonCredits: Number(totalCarbonCredits.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getStats };
