const express = require("express");

const {
    pesquisar,
    buscarDetalhes,
    importarFilme
} = require("../controllers/tmdbController");

const autenticar = require(
    "../middlewares/autenticacao"
);

const router = express.Router();

// Consultas públicas
router.get("/pesquisar", pesquisar);
router.get("/filmes/:tmdbId", buscarDetalhes);

// Importação protegida por login
router.post(
    "/importar/:tmdbId",
    autenticar,
    importarFilme
);

module.exports = router;