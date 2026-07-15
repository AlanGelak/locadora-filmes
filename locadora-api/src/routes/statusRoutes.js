const express = require("express");

const {
    verificarApi,
    verificarBanco
} = require("../controllers/statusController");

const router = express.Router();

router.get("/", verificarApi);
router.get("/banco", verificarBanco);

module.exports = router;