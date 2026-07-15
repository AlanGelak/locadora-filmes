const express = require("express");

const {
    cadastrarUsuario,
    realizarLogin,
    consultarPerfil
} = require("../controllers/authController");

const autenticar = require("../middlewares/autenticacao");

const router = express.Router();

router.post("/cadastrar", cadastrarUsuario);
router.post("/login", realizarLogin);
router.get("/perfil", autenticar, consultarPerfil);

module.exports = router;