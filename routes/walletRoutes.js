const express = require("express");
const { getBalance, addBalance } = require("../controllers/walletController");
const router = express.Router();

router.get("/:userId", getBalance);
router.post("/add", addBalance);

module.exports = router;