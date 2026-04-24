const tipsByCategory = {
  plastic: 'Rinse and place in the blue recycling bin.',
  organic: 'Put in compost or wet waste bin.',
  metal: 'Clean and place in metal recycling collection.',
  glass: 'Wrap broken pieces safely before disposal.',
  paper: 'Keep dry and place in paper recycling.'
};

// Dummy classifier until ML service is connected.
const classifyImage = async (file) => {
  const mockPredictions = [
    { category: 'Plastic', confidence: 0.91 },
    { category: 'Organic', confidence: 0.86 },
    { category: 'Metal', confidence: 0.82 },
    { category: 'Glass', confidence: 0.8 },
    { category: 'Paper', confidence: 0.84 }
  ];

  const pick = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
  const tip = tipsByCategory[pick.category.toLowerCase()] || 'Dispose responsibly.';

  return {
    category: pick.category,
    confidence: pick.confidence,
    tip,
    filename: file.filename
  };
};

module.exports = { classifyImage };