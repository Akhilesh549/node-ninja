const express = require('express');
const { uploadImage } = require('../controllers/upload.controller');
const { uploadSingleImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', uploadSingleImage, uploadImage);

module.exports = router;