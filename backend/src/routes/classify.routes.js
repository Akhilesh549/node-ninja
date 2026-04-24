const express = require('express');
const { classifyWaste } = require('../controllers/classify.controller');
const { uploadSingleImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', uploadSingleImage, classifyWaste);

module.exports = router;