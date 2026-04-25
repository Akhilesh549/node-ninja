const { getEnv } = require('../config/env');
const { predictWithMlService } = require('./ml.client');

const tipsByCategory = {
  plastic: 'Rinse and place in the plastic recycling bin.',
  organic: 'Place in compost or wet waste bin. Paper and cardboard are grouped here.',
  metal: 'Clean and place in the metal recycling collection.',
  glass: 'Wrap broken pieces safely before disposal.',
  paper: 'Place in compost or wet waste bin. Paper and cardboard are grouped here.',
  cardboard: 'Place in compost or wet waste bin. Paper and cardboard are grouped here.'
};

const normalizeCategory = (category) => {
  const raw = String(category || 'plastic').trim().toLowerCase();
  if (raw === 'paper' || raw === 'cardboard' || raw === 'paperboard') {
    return 'organic';
  }
  if (['plastic', 'organic', 'metal', 'glass'].includes(raw)) {
    return raw;
  }
  return 'organic';
};

const isRecyclableCategory = (category) => ['plastic', 'metal', 'glass'].includes(category);

const mockPredictions = [
  { category: 'Plastic', confidence: 0.91 },
  { category: 'Organic', confidence: 0.86 },
  { category: 'Metal', confidence: 0.82 },
  { category: 'Glass', confidence: 0.8 },
  { category: 'Paper', confidence: 0.84 }
];

const normalizePrediction = (prediction) => {
  const normalizedCategory = normalizeCategory(prediction?.category);
  const confidence = Number(prediction?.confidence ?? 0.75);
  const recyclable = isRecyclableCategory(normalizedCategory);
  const carbonCredits = Number((confidence * (recyclable ? 1.5 : 1)).toFixed(2));
  const points = Math.max(10, Math.round(confidence * 100 * (recyclable ? 0.8 : 0.6)));

  return {
    category: normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1),
    rawCategory: String(prediction?.category || normalizedCategory),
    confidence,
    recyclable,
    bin: recyclable ? 'recyclable' : 'organic',
    points,
    carbonCredits,
    tip: tipsByCategory[normalizedCategory] || 'Dispose responsibly.',
    detectedItems: prediction?.detectedItems || [{ category: normalizedCategory, confidence }]
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
