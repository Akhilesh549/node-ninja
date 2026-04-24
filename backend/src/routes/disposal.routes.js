const express = require('express');
const { getDisposalMethod } = require('../controllers/disposal.controller');

const router = express.Router();

router.get('/:category', getDisposalMethod);

module.exports = router;