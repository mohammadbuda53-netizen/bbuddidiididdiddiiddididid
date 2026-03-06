const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', (req, res) => {
  res.json(store.getDashboardStats());
});

module.exports = router;
