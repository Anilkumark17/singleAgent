const express = require("express");
const { tavilySearch } = require("./langchain.controller");
const router = express.Router();

router.post("/search", tavilySearch);

module.exports = router;