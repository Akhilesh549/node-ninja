const { database, get, ref, push, set } = require('../config/firebase');

const getHistory = async (req, res) => {
  try {
    // Check if Firebase is configured with real credentials
    const dbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!dbUrl || dbUrl.includes('your-project')) {
      // Return mock data if Firebase not configured
      return res.status(200).json({ 
        items: [], 
        total: 0,
        note: "Firebase not configured. Set real credentials in .env file."
      });
    }
    
    const historyRef = ref(database, 'classifications');
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      return res.status(200).json({ items: [], total: 0 });
    }
    
    const data = snapshot.val();
    const items = Object.entries(data).map(([id, value]) => ({
      id,
      ...value
    })).map((item) => {
      const category = String(item.category || '').toLowerCase();
      const recyclable = typeof item.recyclable === 'boolean'
        ? item.recyclable
        : ['plastic', 'metal', 'glass'].includes(category);

      return {
        ...item,
        category: item.category || 'Organic',
        recyclable,
        bin: item.bin || (recyclable ? 'recyclable' : 'organic'),
        points: Number(item.points || 0),
        carbonCredits: Number(item.carbonCredits || 0)
      };
    });
    
    // Sort by date descending
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.status(200).json({ 
      items, 
      total: items.length 
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const addHistory = async (classification) => {
  try {
    const historyRef = ref(database, 'classifications');
    const newRef = push(historyRef);
    await set(newRef, {
      ...classification,
      createdAt: new Date().toISOString()
    });
    return newRef.key;
  } catch (error) {
    console.error('Error adding history:', error);
    throw error;
  }
};

module.exports = { getHistory, addHistory };
