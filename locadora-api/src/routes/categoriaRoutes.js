const express = require("express");

const {
    listarCategorias,
    buscarCategoriaPorId,
    cadastrarCategoria,
    atualizarCategoria,
    excluirCategoria
} = require("../controllers/categoriaController");

const autenticar = require("../middlewares/autenticacao");

const router = express.Router();

// Consultas públicas
router.get("/", listarCategorias);
router.get("/:id", buscarCategoriaPorId);

// Operações que exigem login
router.post("/", autenticar, cadastrarCategoria);
router.put("/:id", autenticar, atualizarCategoria);
router.delete("/:id", autenticar, excluirCategoria);

module.exports = router;