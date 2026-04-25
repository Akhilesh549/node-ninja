const { database, get, ref, push, set, isFirebaseConfigured } = require('../config/firebase');

const getHistory = async (req, res) => {
  try {
    if (!isFirebaseConfigured()) {
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
    if (!isFirebaseConfigured()) {
      return null;
    }

    const historyRef = ref(database, 'classifications');
    const newRef = push(historyRef);
    const record = {
      ...classification,
      createdAt: new Date().toISOString()
    };

    await set(newRef, record);
    return newRef.key;
  } catch (error) {
    console.error('Error adding history:', error);
    throw error;
  }
};

module.exports = { getHistory, addHistory };
