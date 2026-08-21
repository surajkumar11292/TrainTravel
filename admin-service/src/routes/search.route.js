const express = require('express');
const { autocomplete, searchTrains } = require('../controllers/search.controller');

const router = express.Router();

// Public search endpoints
router.get('/autocomplete', autocomplete);
router.get('/trains', searchTrains);

module.exports = router;
