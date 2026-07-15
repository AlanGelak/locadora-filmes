const banco = require("../config/banco");

function validarId(id) {
    const idConvertido = Number(id);

    return Number.isInteger(idConvertido) && idConvertido > 0
        ? idConvertido
        : null;
}

function validarCategoria(nome, descricao) {
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
        return "O nome da categoria é obrigatório.";
    }

    if (nome.trim().length > 100) {
        return "O nome da categoria deve possuir no máximo 100 caracteres.";
    }

    if (
        descricao !== undefined &&
        descricao !== null &&
        typeof descricao !== "string"
    ) {
        return "A descrição deve ser um texto.";
    }

    if (descricao && descricao.trim().length > 255) {
        return "A descrição deve possuir no máximo 255 caracteres.";
    }

    return null;
}

async function listarCategorias(req, res) {
    try {
        const [categorias] = await banco.execute(`
            SELECT
                id,
                nome,
                descricao,
                criado_em AS criadoEm,
                atualizado_em AS atualizadoEm
            FROM categorias
            ORDER BY nome
        `);

        return res.status(200).json(categorias);
    } catch (erro) {
        console.error("Erro ao listar categorias:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível listar as categorias."
        });
    }
}

async function buscarCategoriaPorId(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID da categoria é inválido."
        });
    }

    try {
        const [categorias] = await banco.execute(
            `
                SELECT
                    id,
                    nome,
                    descricao,
                    criado_em AS criadoEm,
                    atualizado_em AS atualizadoEm
                FROM categorias
                WHERE id = ?
            `,
            [id]
        );

        if (categorias.length === 0) {
            return res.status(404).json({
                mensagem: "Categoria não encontrada."
            });
        }

        return res.status(200).json(categorias[0]);
    } catch (erro) {
        console.error("Erro ao buscar categoria:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível buscar a categoria."
        });
    }
}

async function cadastrarCategoria(req, res) {
    const { nome, descricao } = req.body;

    const erroValidacao = validarCategoria(nome, descricao);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    const nomeTratado = nome.trim();
    const descricaoTratada =
        descricao && descricao.trim() !== ""
            ? descricao.trim()
            : null;

    try {
        const [resultado] = await banco.execute(
            `
                INSERT INTO categorias
                (
                    nome,
                    descricao
                )
                VALUES (?, ?)
            `,
            [nomeTratado, descricaoTratada]
        );

        const [categorias] = await banco.execute(
            `
                SELECT
                    id,
                    nome,
                    descricao,
                    criado_em AS criadoEm,
                    atualizado_em AS atualizadoEm
                FROM categorias
                WHERE id = ?
            `,
            [resultado.insertId]
        );

        return res.status(201).json({
            mensagem: "Categoria cadastrada com sucesso.",
            categoria: categorias[0]
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe uma categoria com esse nome."
            });
        }

        console.error("Erro ao cadastrar categoria:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível cadastrar a categoria."
        });
    }
}

async function atualizarCategoria(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID da categoria é inválido."
        });
    }

    const { nome, descricao } = req.body;

    const erroValidacao = validarCategoria(nome, descricao);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    const nomeTratado = nome.trim();
    const descricaoTratada =
        descricao && descricao.trim() !== ""
            ? descricao.trim()
            : null;

    try {
        const [categoriasExistentes] = await banco.execute(
            `
                SELECT id
                FROM categorias
                WHERE id = ?
            `,
            [id]
        );

        if (categoriasExistentes.length === 0) {
            return res.status(404).json({
                mensagem: "Categoria não encontrada."
            });
        }

        await banco.execute(
            `
                UPDATE categorias
                SET
                    nome = ?,
                    descricao = ?
                WHERE id = ?
            `,
            [nomeTratado, descricaoTratada, id]
        );

        const [categorias] = await banco.execute(
            `
                SELECT
                    id,
                    nome,
                    descricao,
                    criado_em AS criadoEm,
                    atualizado_em AS atualizadoEm
                FROM categorias
                WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            mensagem: "Categoria atualizada com sucesso.",
            categoria: categorias[0]
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe uma categoria com esse nome."
            });
        }

        console.error("Erro ao atualizar categoria:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível atualizar a categoria."
        });
    }
}

async function excluirCategoria(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID da categoria é inválido."
        });
    }

    try {
        const [resultado] = await banco.execute(
            `
                DELETE FROM categorias
                WHERE id = ?
            `,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Categoria não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Categoria excluída com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível excluir a categoria."
        });
    }
}

module.exports = {
    listarCategorias,
    buscarCategoriaPorId,
    cadastrarCategoria,
    atualizarCategoria,
    excluirCategoria
};