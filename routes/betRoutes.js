const express = require("express");
const { placeBet } = require("../controllers/betController");
const router = express.Router();

router.post("/place", placeBet);

module.exports = router;