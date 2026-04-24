const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const classifyRoutes = require('./routes/classify.routes');
const historyRoutes = require('./routes/history.routes');
const disposalRoutes = require('./routes/disposal.routes');
const statsRoutes = require('./routes/stats.routes');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'waste-backend' });
});

app.use('/api/classify-waste', classifyRoutes);
app.use('/api/upload-image', uploadRoutes);
app.use('/api/disposal-methods', disposalRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;