const banco = require("../config/banco");

function validarId(id) {
    const idConvertido = Number(id);

    if (!Number.isInteger(idConvertido) || idConvertido <= 0) {
        return null;
    }

    return idConvertido;
}

function converterNumeroOpcional(valor, nomeCampo, opcoes = {}) {
    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return {
            valor: null,
            erro: null
        };
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return {
            valor: null,
            erro: `${nomeCampo} deve ser um número válido.`
        };
    }

    if (opcoes.inteiro && !Number.isInteger(numero)) {
        return {
            valor: null,
            erro: `${nomeCampo} deve ser um número inteiro.`
        };
    }

    if (
        opcoes.minimo !== undefined &&
        numero < opcoes.minimo
    ) {
        return {
            valor: null,
            erro: `${nomeCampo} deve ser maior ou igual a ${opcoes.minimo}.`
        };
    }

    if (
        opcoes.maximo !== undefined &&
        numero > opcoes.maximo
    ) {
        return {
            valor: null,
            erro: `${nomeCampo} deve ser menor ou igual a ${opcoes.maximo}.`
        };
    }

    return {
        valor: numero,
        erro: null
    };
}

function tratarTextoOpcional(valor) {
    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    return String(valor).trim();
}

function normalizarFilme(body) {
    const titulo = tratarTextoOpcional(body.titulo);
    const sinopse = tratarTextoOpcional(body.sinopse);

    if (!titulo) {
        return {
            erro: "O título do filme é obrigatório."
        };
    }

    if (titulo.length > 200) {
        return {
            erro: "O título deve possuir no máximo 200 caracteres."
        };
    }

    const ano = converterNumeroOpcional(
        body.ano,
        "O ano",
        {
            inteiro: true,
            minimo: 1,
            maximo: 65535
        }
    );

    if (ano.erro) {
        return { erro: ano.erro };
    }

    const duracao = converterNumeroOpcional(
        body.duracaoMinutos,
        "A duração",
        {
            inteiro: true,
            minimo: 1,
            maximo: 65535
        }
    );

    if (duracao.erro) {
        return { erro: duracao.erro };
    }

    const nota = converterNumeroOpcional(
        body.nota,
        "A nota",
        {
            minimo: 0,
            maximo: 10
        }
    );

    if (nota.erro) {
        return { erro: nota.erro };
    }

    const quantidadeEstoque = converterNumeroOpcional(
        body.quantidadeEstoque,
        "A quantidade em estoque",
        {
            inteiro: true,
            minimo: 0
        }
    );

    if (quantidadeEstoque.erro) {
        return { erro: quantidadeEstoque.erro };
    }

    const valorLocacao = converterNumeroOpcional(
        body.valorLocacao,
        "O valor da locação",
        {
            minimo: 0
        }
    );

    if (valorLocacao.erro) {
        return { erro: valorLocacao.erro };
    }

    const categoriaId = converterNumeroOpcional(
        body.categoriaId,
        "O ID da categoria",
        {
            inteiro: true,
            minimo: 1
        }
    );

    if (categoriaId.erro) {
        return { erro: categoriaId.erro };
    }

    const tmdbId = converterNumeroOpcional(
        body.tmdbId,
        "O ID da TMDB",
        {
            inteiro: true,
            minimo: 1
        }
    );

    if (tmdbId.erro) {
        return { erro: tmdbId.erro };
    }

    return {
        erro: null,

        filme: {
            titulo,
            sinopse,
            ano: ano.valor,
            duracaoMinutos: duracao.valor,
            nota: nota.valor ?? 0,
            quantidadeEstoque: quantidadeEstoque.valor ?? 0,
            valorLocacao: valorLocacao.valor ?? 0,
            categoriaId: categoriaId.valor,
            tmdbId: tmdbId.valor
        }
    };
}

async function verificarCategoria(categoriaId) {
    if (categoriaId === null) {
        return true;
    }

    const [categorias] = await banco.execute(
        `
            SELECT id
            FROM categorias
            WHERE id = ?
        `,
        [categoriaId]
    );

    return categorias.length > 0;
}

async function consultarFilmeNoBanco(id) {
    const [filmes] = await banco.execute(
        `
            SELECT
                filme.id,
                filme.titulo,
                filme.sinopse,
                filme.ano,
                filme.duracao_minutos AS duracaoMinutos,
                filme.nota,
                filme.quantidade_estoque AS quantidadeEstoque,
                filme.valor_locacao AS valorLocacao,
                filme.categoria_id AS categoriaId,
                categoria.nome AS categoriaNome,
                filme.tmdb_id AS tmdbId,

                CASE
                    WHEN filme.imagem IS NULL THEN FALSE
                    ELSE TRUE
                END AS temImagem,

                CASE
                    WHEN filme.imagem IS NULL THEN NULL
                    ELSE CONCAT(
                        '/api/filmes/',
                        filme.id,
                        '/imagem'
                    )
                END AS imagemUrl,

                filme.criado_em AS criadoEm,
                filme.atualizado_em AS atualizadoEm

            FROM filmes filme

            LEFT JOIN categorias categoria
                ON categoria.id = filme.categoria_id

            WHERE filme.id = ?
        `,
        [id]
    );

    return filmes.length > 0
        ? filmes[0]
        : null;
}

async function listarFilmes(req, res) {
    try {
        const titulo = tratarTextoOpcional(req.query.titulo);
        const categoriaId = validarId(req.query.categoriaId);

        let sql = `
            SELECT
                filme.id,
                filme.titulo,
                filme.sinopse,
                filme.ano,
                filme.duracao_minutos AS duracaoMinutos,
                filme.nota,
                filme.quantidade_estoque AS quantidadeEstoque,
                filme.valor_locacao AS valorLocacao,
                filme.categoria_id AS categoriaId,
                categoria.nome AS categoriaNome,
                filme.tmdb_id AS tmdbId,

                CASE
                    WHEN filme.imagem IS NULL THEN FALSE
                    ELSE TRUE
                END AS temImagem,

                CASE
                    WHEN filme.imagem IS NULL THEN NULL
                    ELSE CONCAT(
                        '/api/filmes/',
                        filme.id,
                        '/imagem'
                    )
                END AS imagemUrl,

                filme.criado_em AS criadoEm,
                filme.atualizado_em AS atualizadoEm

            FROM filmes filme

            LEFT JOIN categorias categoria
                ON categoria.id = filme.categoria_id

            WHERE 1 = 1
        `;

        const parametros = [];

        if (titulo) {
            sql += `
                AND filme.titulo LIKE ?
            `;

            parametros.push(`%${titulo}%`);
        }

        if (categoriaId) {
            sql += `
                AND filme.categoria_id = ?
            `;

            parametros.push(categoriaId);
        }

        sql += `
            ORDER BY filme.titulo
        `;

        const [filmes] = await banco.execute(
            sql,
            parametros
        );

        return res.status(200).json(filmes);
    } catch (erro) {
        console.error("Erro ao listar filmes:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível listar os filmes."
        });
    }
}

async function buscarFilmePorId(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID do filme é inválido."
        });
    }

    try {
        const filme = await consultarFilmeNoBanco(id);

        if (!filme) {
            return res.status(404).json({
                mensagem: "Filme não encontrado."
            });
        }

        return res.status(200).json(filme);
    } catch (erro) {
        console.error("Erro ao buscar filme:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível buscar o filme."
        });
    }
}

async function cadastrarFilme(req, res) {
    const resultadoValidacao = normalizarFilme(req.body);

    if (resultadoValidacao.erro) {
        return res.status(400).json({
            mensagem: resultadoValidacao.erro
        });
    }

    const filme = resultadoValidacao.filme;

    try {
        const categoriaExiste = await verificarCategoria(
            filme.categoriaId
        );

        if (!categoriaExiste) {
            return res.status(400).json({
                mensagem: "A categoria informada não existe."
            });
        }

        const imagem = req.file
            ? req.file.buffer
            : null;

        const imagemTipo = req.file
            ? req.file.mimetype
            : null;

        const [resultado] = await banco.execute(
            `
                INSERT INTO filmes
                (
                    titulo,
                    sinopse,
                    ano,
                    duracao_minutos,
                    nota,
                    quantidade_estoque,
                    valor_locacao,
                    categoria_id,
                    tmdb_id,
                    imagem,
                    imagem_tipo
                )
                VALUES
                (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            `,
            [
                filme.titulo,
                filme.sinopse,
                filme.ano,
                filme.duracaoMinutos,
                filme.nota,
                filme.quantidadeEstoque,
                filme.valorLocacao,
                filme.categoriaId,
                filme.tmdbId,
                imagem,
                imagemTipo
            ]
        );

        const filmeCadastrado =
            await consultarFilmeNoBanco(resultado.insertId);

        return res.status(201).json({
            mensagem: "Filme cadastrado com sucesso.",
            filme: filmeCadastrado
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem:
                    "Esse filme já foi cadastrado com o mesmo ID da TMDB."
            });
        }

        console.error("Erro ao cadastrar filme:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível cadastrar o filme."
        });
    }
}

async function atualizarFilme(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID do filme é inválido."
        });
    }

    const resultadoValidacao = normalizarFilme(req.body);

    if (resultadoValidacao.erro) {
        return res.status(400).json({
            mensagem: resultadoValidacao.erro
        });
    }

    const filme = resultadoValidacao.filme;

    try {
        const filmeExistente =
            await consultarFilmeNoBanco(id);

        if (!filmeExistente) {
            return res.status(404).json({
                mensagem: "Filme não encontrado."
            });
        }

        const categoriaExiste = await verificarCategoria(
            filme.categoriaId
        );

        if (!categoriaExiste) {
            return res.status(400).json({
                mensagem: "A categoria informada não existe."
            });
        }

        const removerImagem =
            String(req.body.removerImagem).toLowerCase() ===
            "true";

        if (req.file) {
            await banco.execute(
                `
                    UPDATE filmes
                    SET
                        titulo = ?,
                        sinopse = ?,
                        ano = ?,
                        duracao_minutos = ?,
                        nota = ?,
                        quantidade_estoque = ?,
                        valor_locacao = ?,
                        categoria_id = ?,
                        tmdb_id = ?,
                        imagem = ?,
                        imagem_tipo = ?
                    WHERE id = ?
                `,
                [
                    filme.titulo,
                    filme.sinopse,
                    filme.ano,
                    filme.duracaoMinutos,
                    filme.nota,
                    filme.quantidadeEstoque,
                    filme.valorLocacao,
                    filme.categoriaId,
                    filme.tmdbId,
                    req.file.buffer,
                    req.file.mimetype,
                    id
                ]
            );
        } else if (removerImagem) {
            await banco.execute(
                `
                    UPDATE filmes
                    SET
                        titulo = ?,
                        sinopse = ?,
                        ano = ?,
                        duracao_minutos = ?,
                        nota = ?,
                        quantidade_estoque = ?,
                        valor_locacao = ?,
                        categoria_id = ?,
                        tmdb_id = ?,
                        imagem = NULL,
                        imagem_tipo = NULL
                    WHERE id = ?
                `,
                [
                    filme.titulo,
                    filme.sinopse,
                    filme.ano,
                    filme.duracaoMinutos,
                    filme.nota,
                    filme.quantidadeEstoque,
                    filme.valorLocacao,
                    filme.categoriaId,
                    filme.tmdbId,
                    id
                ]
            );
        } else {
            await banco.execute(
                `
                    UPDATE filmes
                    SET
                        titulo = ?,
                        sinopse = ?,
                        ano = ?,
                        duracao_minutos = ?,
                        nota = ?,
                        quantidade_estoque = ?,
                        valor_locacao = ?,
                        categoria_id = ?,
                        tmdb_id = ?
                    WHERE id = ?
                `,
                [
                    filme.titulo,
                    filme.sinopse,
                    filme.ano,
                    filme.duracaoMinutos,
                    filme.nota,
                    filme.quantidadeEstoque,
                    filme.valorLocacao,
                    filme.categoriaId,
                    filme.tmdbId,
                    id
                ]
            );
        }

        const filmeAtualizado =
            await consultarFilmeNoBanco(id);

        return res.status(200).json({
            mensagem: "Filme atualizado com sucesso.",
            filme: filmeAtualizado
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem:
                    "Outro filme já utiliza esse ID da TMDB."
            });
        }

        console.error("Erro ao atualizar filme:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível atualizar o filme."
        });
    }
}

async function excluirFilme(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID do filme é inválido."
        });
    }

    try {
        const [resultado] = await banco.execute(
            `
                DELETE FROM filmes
                WHERE id = ?
            `,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Filme não encontrado."
            });
        }

        return res.status(200).json({
            mensagem: "Filme excluído com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao excluir filme:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível excluir o filme."
        });
    }
}

async function buscarImagemFilme(req, res) {
    const id = validarId(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "O ID do filme é inválido."
        });
    }

    try {
        const [filmes] = await banco.execute(
            `
                SELECT
                    imagem,
                    imagem_tipo AS imagemTipo
                FROM filmes
                WHERE id = ?
            `,
            [id]
        );

        if (filmes.length === 0) {
            return res.status(404).json({
                mensagem: "Filme não encontrado."
            });
        }

        const filme = filmes[0];

        if (!filme.imagem) {
            return res.status(404).json({
                mensagem: "O filme não possui imagem."
            });
        }

        res.setHeader(
            "Content-Type",
            filme.imagemTipo || "application/octet-stream"
        );

        res.setHeader(
            "Cache-Control",
            "public, max-age=3600"
        );

        return res.send(filme.imagem);
    } catch (erro) {
        console.error("Erro ao buscar imagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível buscar a imagem."
        });
    }
}

module.exports = {
    listarFilmes,
    buscarFilmePorId,
    cadastrarFilme,
    atualizarFilme,
    excluirFilme,
    buscarImagemFilme
};