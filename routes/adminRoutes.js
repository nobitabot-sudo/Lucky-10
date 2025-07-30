const express = require("express");
const { setResult, leaderboard } = require("../controllers/adminController");
const router = express.Router();

router.post("/set-result", setResult);
router.get("/leaderboard", leaderboard);

module.exports = router;