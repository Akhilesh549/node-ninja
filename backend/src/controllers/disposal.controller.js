const disposalMap = {
  plastic: {
    category: 'Plastic',
    tip: 'Rinse and place in the blue recycling bin.'
  },
  organic: {
    category: 'Organic',
    tip: 'Put in compost or wet waste bin.'
  },
  metal: {
    category: 'Metal',
    tip: 'Clean and place in metal recycling collection.'
  },
  glass: {
    category: 'Glass',
    tip: 'Wrap broken pieces safely before disposal.'
  },
  paper: {
    category: 'Paper',
    tip: 'Keep dry and place in paper recycling.'
  }
};

const getDisposalMethod = (req, res) => {
  const key = String(req.params.category || '').toLowerCase();
  const result = disposalMap[key];

  if (!result) {
    return res.status(404).json({ error: `No disposal method found for category: ${req.params.category}` });
  }

  return res.status(200).json(result);
};

module.exports = { getDisposalMethod };