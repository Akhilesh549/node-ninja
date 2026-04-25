const { classifyImage } = require('../services/classify.service');
const { addHistory } = require('./history.controller');

const classifyWaste = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (field name: image).' });
    }

    const result = await classifyImage(req.file);

    // Save to Firebase history
    await addHistory({
      category: result.category,
      confidence: result.confidence,
      tip: result.tip,
      filename: result.filename
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { classifyWaste };