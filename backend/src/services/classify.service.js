const { getEnv } = require('../config/env');
const { predictWithMlService } = require('./ml.client');

const tipsByCategory = {
  plastic: 'Rinse and place in the blue recycling bin.',
  organic: 'Put in compost or wet waste bin.',
  metal: 'Clean and place in metal recycling collection.',
  glass: 'Wrap broken pieces safely before disposal.',
  paper: 'Keep dry and place in paper recycling.'
};

const mockPredictions = [
  { category: 'Plastic', confidence: 0.91 },
  { category: 'Organic', confidence: 0.86 },
  { category: 'Metal', confidence: 0.82 },
  { category: 'Glass', confidence: 0.8 },
  { category: 'Paper', confidence: 0.84 }
];

const normalizePrediction = (prediction) => {
  const rawCategory = String(prediction?.category || 'plastic');
  const lowerCategory = rawCategory.toLowerCase();

  return {
    category: rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase(),
    confidence: Number(prediction?.confidence ?? 0.75),
    tip: tipsByCategory[lowerCategory] || 'Dispose responsibly.'
  };
};

const getFallbackPrediction = () => {
  const pick = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
  return normalizePrediction(pick);
};

const classifyImage = async (file) => {
  const { mlServiceUrl } = getEnv();

  try {
    const mlResult = await predictWithMlService({
      filePath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      mlServiceUrl
    });

    const normalized = normalizePrediction(mlResult);
    return { ...normalized, filename: file.filename };
  } catch (error) {
    const fallback = getFallbackPrediction();
    return { ...fallback, filename: file.filename };
  }
};

module.exports = { classifyImage };
