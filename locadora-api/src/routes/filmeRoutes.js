const express = require("express");

const {
    listarFilmes,
    buscarFilmePorId,
    cadastrarFilme,
    atualizarFilme,
    excluirFilme,
    buscarImagemFilme
} = require("../controllers/filmeController");

const autenticar = require("../middlewares/autenticacao");
const processarImagem = require("../middlewares/uploadImagem");

const router = express.Router();

// Consultas públicas
router.get("/", listarFilmes);
router.get("/:id/imagem", buscarImagemFilme);
router.get("/:id", buscarFilmePorId);

// Operações protegidas
router.post(
    "/",
    autenticar,
    processarImagem,
    cadastrarFilme
);

router.put(
    "/:id",
    autenticar,
    processarImagem,
    atualizarFilme
);

router.delete(
    "/:id",
    autenticar,
    excluirFilme
);

module.exports = router;