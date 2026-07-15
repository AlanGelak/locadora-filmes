const banco = require("../config/banco");

const {
    pesquisarFilmes,
    buscarDetalhesFilme,
    montarUrlImagem,
    baixarImagem
} = require("../services/tmdbService");

function validarId(valor) {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
}

function converterNumeroOpcional(
    valor,
    nomeCampo,
    opcoes = {}
) {
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

    if (
        opcoes.inteiro &&
        !Number.isInteger(numero)
    ) {
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

    return {
        valor: numero,
        erro: null
    };
}

function obterAno(dataLancamento) {
    if (!dataLancamento) {
        return null;
    }

    const ano = Number(
        String(dataLancamento).substring(0, 4)
    );

    return Number.isInteger(ano) && ano > 0
        ? ano
        : null;
}

function simplificarFilme(filme) {
    return {
        tmdbId: filme.id,
        titulo: filme.title,
        tituloOriginal: filme.original_title,
        sinopse: filme.overview || null,
        dataLancamento: filme.release_date || null,
        ano: obterAno(filme.release_date),
        nota: filme.vote_average,
        quantidadeVotos: filme.vote_count,
        posterPath: filme.poster_path,
        posterUrl: montarUrlImagem(filme.poster_path),
        imagemFundoUrl: montarUrlImagem(
            filme.backdrop_path,
            "w780"
        )
    };
}

function tratarErroTmdb(erro, res, mensagemPadrao) {
    console.error("Erro na integração com a TMDB:", erro);

    if (
        erro.response &&
        erro.response.status === 401
    ) {
        return res.status(502).json({
            mensagem:
                "O token da TMDB é inválido ou não foi autorizado."
        });
    }

    if (
        erro.response &&
        erro.response.status === 404
    ) {
        return res.status(404).json({
            mensagem: "Filme não encontrado na TMDB."
        });
    }

    if (erro.code === "ECONNABORTED") {
        return res.status(504).json({
            mensagem:
                "A TMDB demorou muito para responder."
        });
    }

    return res.status(502).json({
        mensagem: mensagemPadrao,
        erro: erro.message
    });
}

async function pesquisar(req, res) {
    const titulo = String(
        req.query.titulo || ""
    ).trim();

    if (!titulo) {
        return res.status(400).json({
            mensagem:
                "Informe o título que deseja pesquisar."
        });
    }

    const paginaInformada = Number(
        req.query.pagina || 1
    );

    const pagina =
        Number.isInteger(paginaInformada) &&
        paginaInformada > 0
            ? paginaInformada
            : 1;

    try {
        const resultado =
            await pesquisarFilmes(titulo, pagina);

        return res.status(200).json({
            pagina: resultado.page,
            totalPaginas: resultado.total_pages,
            totalResultados: resultado.total_results,

            resultados: resultado.results.map(
                simplificarFilme
            )
        });
    } catch (erro) {
        return tratarErroTmdb(
            erro,
            res,
            "Não foi possível pesquisar os filmes na TMDB."
        );
    }
}

async function buscarDetalhes(req, res) {
    const tmdbId = validarId(req.params.tmdbId);

    if (!tmdbId) {
        return res.status(400).json({
            mensagem: "O ID da TMDB é inválido."
        });
    }

    try {
        const filme =
            await buscarDetalhesFilme(tmdbId);

        return res.status(200).json({
            ...simplificarFilme(filme),

            duracaoMinutos: filme.runtime || null,

            generos: filme.genres.map(
                (genero) => ({
                    id: genero.id,
                    nome: genero.name
                })
            ),

            status: filme.status,
            idiomaOriginal: filme.original_language,
            orcamento: filme.budget,
            receita: filme.revenue
        });
    } catch (erro) {
        return tratarErroTmdb(
            erro,
            res,
            "Não foi possível consultar os detalhes do filme."
        );
    }
}

async function importarFilme(req, res) {
    const tmdbId = validarId(req.params.tmdbId);

    if (!tmdbId) {
        return res.status(400).json({
            mensagem: "O ID da TMDB é inválido."
        });
    }

    const categoria = converterNumeroOpcional(
        req.body.categoriaId,
        "O ID da categoria",
        {
            inteiro: true,
            minimo: 1
        }
    );

    if (categoria.erro) {
        return res.status(400).json({
            mensagem: categoria.erro
        });
    }

    const quantidade = converterNumeroOpcional(
        req.body.quantidadeEstoque,
        "A quantidade em estoque",
        {
            inteiro: true,
            minimo: 0
        }
    );

    if (quantidade.erro) {
        return res.status(400).json({
            mensagem: quantidade.erro
        });
    }

    const valorLocacao = converterNumeroOpcional(
        req.body.valorLocacao,
        "O valor da locação",
        {
            minimo: 0
        }
    );

    if (valorLocacao.erro) {
        return res.status(400).json({
            mensagem: valorLocacao.erro
        });
    }

    try {
        const [filmesExistentes] =
            await banco.execute(
                `
                    SELECT
                        id,
                        titulo
                    FROM filmes
                    WHERE tmdb_id = ?
                `,
                [tmdbId]
            );

        if (filmesExistentes.length > 0) {
            return res.status(409).json({
                mensagem:
                    "Esse filme já foi importado da TMDB.",
                filme: filmesExistentes[0]
            });
        }

        if (categoria.valor !== null) {
            const [categorias] =
                await banco.execute(
                    `
                        SELECT id
                        FROM categorias
                        WHERE id = ?
                    `,
                    [categoria.valor]
                );

            if (categorias.length === 0) {
                return res.status(400).json({
                    mensagem:
                        "A categoria informada não existe."
                });
            }
        }

        const filmeTmdb =
            await buscarDetalhesFilme(tmdbId);

        let imagem = null;
        let imagemTipo = null;
        let avisoImagem = null;

        if (filmeTmdb.poster_path) {
            try {
                const imagemBaixada =
                    await baixarImagem(
                        filmeTmdb.poster_path
                    );

                imagem = imagemBaixada.buffer;
                imagemTipo = imagemBaixada.tipo;
            } catch (erroImagem) {
                console.error(
                    "Não foi possível baixar a capa:",
                    erroImagem.message
                );

                avisoImagem =
                    "O filme foi importado, mas a capa não pôde ser baixada.";
            }
        } else {
            avisoImagem =
                "O filme foi importado, mas não possui capa na TMDB.";
        }

        const titulo =
            filmeTmdb.title ||
            filmeTmdb.original_title ||
            "Filme sem título";

        const sinopse =
            filmeTmdb.overview || null;

        const ano = obterAno(
            filmeTmdb.release_date
        );

        const duracaoMinutos =
            filmeTmdb.runtime || null;

        const nota = Number(
            Number(
                filmeTmdb.vote_average || 0
            ).toFixed(1)
        );

        const [resultado] =
            await banco.execute(
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
                    titulo,
                    sinopse,
                    ano,
                    duracaoMinutos,
                    nota,
                    quantidade.valor ?? 0,
                    valorLocacao.valor ?? 0,
                    categoria.valor,
                    tmdbId,
                    imagem,
                    imagemTipo
                ]
            );

        const [filmesCadastrados] =
            await banco.execute(
                `
                    SELECT
                        filme.id,
                        filme.titulo,
                        filme.sinopse,
                        filme.ano,
                        filme.duracao_minutos
                            AS duracaoMinutos,
                        filme.nota,
                        filme.quantidade_estoque
                            AS quantidadeEstoque,
                        filme.valor_locacao
                            AS valorLocacao,
                        filme.categoria_id
                            AS categoriaId,
                        categoria.nome
                            AS categoriaNome,
                        filme.tmdb_id
                            AS tmdbId,

                        CASE
                            WHEN filme.imagem IS NULL
                                THEN FALSE
                            ELSE TRUE
                        END AS temImagem,

                        CASE
                            WHEN filme.imagem IS NULL
                                THEN NULL
                            ELSE CONCAT(
                                '/api/filmes/',
                                filme.id,
                                '/imagem'
                            )
                        END AS imagemUrl

                    FROM filmes filme

                    LEFT JOIN categorias categoria
                        ON categoria.id =
                           filme.categoria_id

                    WHERE filme.id = ?
                `,
                [resultado.insertId]
            );

        return res.status(201).json({
            mensagem:
                "Filme importado da TMDB com sucesso.",

            aviso: avisoImagem,

            filme: filmesCadastrados[0]
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem:
                    "Esse filme já foi importado da TMDB."
            });
        }

        return tratarErroTmdb(
            erro,
            res,
            "Não foi possível importar o filme."
        );
    }
}

module.exports = {
    pesquisar,
    buscarDetalhes,
    importarFilme
};