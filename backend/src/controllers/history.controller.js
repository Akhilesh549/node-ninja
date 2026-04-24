const mockHistory = [
  {
    id: 'h1',
    category: 'Plastic',
    confidence: 0.91,
    tip: 'Rinse and place in the blue recycling bin.',
    createdAt: '2026-04-24T10:00:00.000Z'
  },
  {
    id: 'h2',
    category: 'Organic',
    confidence: 0.88,
    tip: 'Put in compost or wet waste bin.',
    createdAt: '2026-04-24T11:30:00.000Z'
  }
];

const getHistory = (req, res) => {
  res.status(200).json({ items: mockHistory, total: mockHistory.length });
};

module.exports = { getHistory };