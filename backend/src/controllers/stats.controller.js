const { get, ref } = require('../config/firebase');
const { database } = require('../config/firebase');

const getStats = async (req, res) => {
  try {
    // Check if Firebase is configured with real credentials
    const dbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!dbUrl || dbUrl.includes('your-project')) {
      // Return mock data if Firebase not configured
      return res.status(200).json({
        totalItems: 0,
        breakdown: {
          plastic: 0,
          organic: 0,
          metal: 0,
          glass: 0,
          paper: 0
        },
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
          glass: 0,
          paper: 0
        }
      });
    }
    
    const data = snapshot.val();
    const items = Object.values(data);
    
    // Count by category
    const breakdown = {
      plastic: 0,
      organic: 0,
      metal: 0,
      glass: 0,
      paper: 0
    };
    
    items.forEach(item => {
      const category = (item.category || '').toLowerCase();
      if (breakdown[category] !== undefined) {
        breakdown[category]++;
      }
    });
    
    return res.status(200).json({
      totalItems: items.length,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getStats };