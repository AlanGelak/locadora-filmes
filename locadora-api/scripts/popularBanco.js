require("dotenv").config();

const banco = require("../src/config/banco");

const {
    listarGeneros,
    listarFilmesPopulares,
    buscarDetalhesFilme,
    baixarImagem
} = require("../src/services/tmdbService");

const META_TOTAL_FILMES = 100;
const TAMANHO_LOTE = 5;
const MAXIMO_PAGINAS = 30;

const ESTOQUE_PADRAO = 3;
const VALOR_LOCACAO_PADRAO = 12.90;

const descricoesCategorias = {
    "Aventura":
        "Histórias de exploração, jornadas e grandes desafios.",

    "Animação":
        "Produções desenvolvidas com diferentes técnicas de animação.",

    "Comédia":
        "Filmes voltados ao humor e ao entretenimento.",

    "Crime":
        "Histórias relacionadas a crimes, investigações e organizações criminosas.",

    "Documentário":
        "Produções baseadas em fatos, pessoas e acontecimentos reais.",

    "Drama":
        "Histórias focadas em conflitos humanos e emocionais.",

    "Família":
        "Filmes indicados para diferentes faixas etárias.",

    "Fantasia":
        "Histórias com elementos mágicos e mundos imaginários.",

    "História":
        "Filmes baseados em acontecimentos ou períodos históricos.",

    "Terror":
        "Filmes voltados ao medo, suspense e situações sobrenaturais.",

    "Música":
        "Produções com forte presença de música, artistas e apresentações.",

    "Mistério":
        "Histórias envolvendo enigmas, segredos e investigações.",

    "Romance":
        "Histórias centradas em relacionamentos e vínculos afetivos.",

    "Ficção científica":
        "Filmes sobre ciência, tecnologia e futuros imaginários.",

    "Cinema TV":
        "Produções desenvolvidas originalmente para televisão.",

    "Thriller":
        "Filmes marcados por tensão, perigo e suspense intenso.",

    "Guerra":
        "Histórias relacionadas a conflitos militares e seus impactos.",

    "Faroeste":
        "Filmes ambientados no período e estilo do Velho Oeste."
};

function obterDescricaoCategoria(nome) {
    return (
        descricoesCategorias[nome] ||
        `Filmes pertencentes ao gênero ${nome.toLowerCase()}.`
    );
}

function obterAno(dataLancamento) {
    if (!dataLancamento) {
        return null;
    }

    const ano = Number(
        String(dataLancamento).substring(0, 4)
    );

    if (!Number.isInteger(ano) || ano <= 0) {
        return null;
    }

    return ano;
}

function limitarTexto(texto, tamanhoMaximo) {
    if (!texto) {
        return null;
    }

    return String(texto)
        .trim()
        .substring(0, tamanhoMaximo);
}

async function cadastrarCategorias() {
    console.log("");
    console.log("Buscando gêneros da TMDB...");

    const generos = await listarGeneros();

    const categoriasPorGeneroTmdb =
        new Map();

    for (const genero of generos) {
        const nome = limitarTexto(
            genero.name,
            100
        );

        const descricao =
            obterDescricaoCategoria(nome);

        const [categoriasExistentes] =
            await banco.execute(
                `
                    SELECT id
                    FROM categorias
                    WHERE nome = ?
                `,
                [nome]
            );

        let categoriaId;

        if (categoriasExistentes.length > 0) {
            categoriaId =
                categoriasExistentes[0].id;

            await banco.execute(
                `
                    UPDATE categorias
                    SET descricao = ?
                    WHERE id = ?
                `,
                [
                    descricao,
                    categoriaId
                ]
            );

            console.log(
                `Categoria atualizada: ${nome}`
            );
        } else {
            const [resultado] =
                await banco.execute(
                    `
                        INSERT INTO categorias
                        (
                            nome,
                            descricao
                        )
                        VALUES (?, ?)
                    `,
                    [
                        nome,
                        descricao
                    ]
                );

            categoriaId =
                resultado.insertId;

            console.log(
                `Categoria cadastrada: ${nome}`
            );
        }

        categoriasPorGeneroTmdb.set(
            genero.id,
            categoriaId
        );
    }

    return categoriasPorGeneroTmdb;
}

async function contarFilmesCadastrados() {
    const [resultado] =
        await banco.execute(
            `
                SELECT COUNT(*) AS total
                FROM filmes
            `
        );

    return Number(
        resultado[0].total
    );
}

async function buscarTmdbIdsExistentes() {
    const [filmes] =
        await banco.execute(
            `
                SELECT tmdb_id AS tmdbId
                FROM filmes
                WHERE tmdb_id IS NOT NULL
            `
        );

    return new Set(
        filmes.map((filme) => filme.tmdbId)
    );
}

async function importarFilme(
    filmePopular,
    categoriasPorGeneroTmdb
) {
    const tmdbId =
        Number(filmePopular.id);

    try {
        const filme =
            await buscarDetalhesFilme(tmdbId);

        const primeiroGenero =
            filme.genres?.[0];

        const categoriaId =
            primeiroGenero
                ? categoriasPorGeneroTmdb.get(
                    primeiroGenero.id
                ) || null
                : null;

        let imagem = null;
        let imagemTipo = null;

        if (filme.poster_path) {
            try {
                /*
                 * w342 reduz o tamanho armazenado
                 * no banco sem perder muita qualidade.
                 */
                const imagemBaixada =
                    await baixarImagem(
                        filme.poster_path,
                        "w342"
                    );

                imagem =
                    imagemBaixada?.buffer || null;

                imagemTipo =
                    imagemBaixada?.tipo || null;
            } catch (erroImagem) {
                console.log(
                    `Capa não baixada: ` +
                    `${filme.title}`
                );
            }
        }

        const titulo =
            limitarTexto(
                filme.title ||
                filme.original_title ||
                "Filme sem título",
                200
            );

        const sinopse =
            filme.overview
                ? String(filme.overview).trim()
                : null;

        const ano =
            obterAno(filme.release_date);

        const duracaoMinutos =
            filme.runtime || null;

        const nota = Number(
            Number(
                filme.vote_average || 0
            ).toFixed(1)
        );

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
                ESTOQUE_PADRAO,
                VALOR_LOCACAO_PADRAO,
                categoriaId,
                tmdbId,
                imagem,
                imagemTipo
            ]
        );

        return {
            sucesso: true,
            tmdbId,
            titulo
        };
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return {
                sucesso: false,
                ignorado: true,
                tmdbId,
                titulo:
                    filmePopular.title ||
                    "Filme duplicado"
            };
        }

        return {
            sucesso: false,
            ignorado: false,
            tmdbId,
            titulo:
                filmePopular.title ||
                "Filme desconhecido",
            erro: erro.message
        };
    }
}

async function processarFilmesEmLotes(
    filmes,
    categoriasPorGeneroTmdb,
    tmdbIdsExistentes,
    quantidadeNecessaria
) {
    let quantidadeImportada = 0;
    let indice = 0;

    while (
        indice < filmes.length &&
        quantidadeImportada < quantidadeNecessaria
    ) {
        const quantidadeDisponivel =
            quantidadeNecessaria -
            quantidadeImportada;

        const tamanhoDoLote =
            Math.min(
                TAMANHO_LOTE,
                quantidadeDisponivel
            );

        const lote = filmes.slice(
            indice,
            indice + tamanhoDoLote
        );

        indice += lote.length;

        const resultados =
            await Promise.all(
                lote.map((filme) =>
                    importarFilme(
                        filme,
                        categoriasPorGeneroTmdb
                    )
                )
            );

        for (const resultado of resultados) {
            if (resultado.tmdbId) {
                tmdbIdsExistentes.add(
                    resultado.tmdbId
                );
            }

            if (resultado.sucesso) {
                quantidadeImportada++;

                console.log(
                    `Filme importado: ` +
                    `${resultado.titulo}`
                );
            } else if (resultado.ignorado) {
                console.log(
                    `Filme já existente: ` +
                    `${resultado.titulo}`
                );
            } else {
                console.log(
                    `Erro ao importar ` +
                    `${resultado.titulo}: ` +
                    `${resultado.erro}`
                );
            }
        }
    }

    return quantidadeImportada;
}

async function executarCarga() {
    console.log(
        "======================================"
    );

    console.log(
        "Iniciando carga da locadora"
    );

    console.log(
        "======================================"
    );

    const categoriasPorGeneroTmdb =
        await cadastrarCategorias();

    const totalInicial =
        await contarFilmesCadastrados();

    console.log("");
    console.log(
        `Filmes existentes no banco: ${totalInicial}`
    );

    if (totalInicial >= META_TOTAL_FILMES) {
        console.log(
            `O banco já possui ${totalInicial} filmes.`
        );

        console.log(
            `A meta de ${META_TOTAL_FILMES} já foi atingida.`
        );

        return;
    }

    const tmdbIdsExistentes =
        await buscarTmdbIdsExistentes();

    let quantidadeRestante =
        META_TOTAL_FILMES -
        totalInicial;

    let pagina = 1;

    while (
        quantidadeRestante > 0 &&
        pagina <= MAXIMO_PAGINAS
    ) {
        console.log("");
        console.log(
            `Buscando página ${pagina} ` +
            `de filmes populares...`
        );

        const resposta =
            await listarFilmesPopulares(
                pagina
            );

        const filmesDaPagina =
            resposta.results || [];

        const filmesNaoCadastrados =
            filmesDaPagina.filter(
                (filme) =>
                    !tmdbIdsExistentes.has(
                        filme.id
                    )
            );

        const quantidadeImportada =
            await processarFilmesEmLotes(
                filmesNaoCadastrados,
                categoriasPorGeneroTmdb,
                tmdbIdsExistentes,
                quantidadeRestante
            );

        quantidadeRestante -=
            quantidadeImportada;

        if (
            pagina >=
            Number(resposta.total_pages || 0)
        ) {
            break;
        }

        pagina++;
    }

    const totalFinal =
        await contarFilmesCadastrados();

    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        `Carga concluída. Total de filmes: ${totalFinal}`
    );

    if (totalFinal < META_TOTAL_FILMES) {
        console.log(
            `Não foi possível alcançar a meta de ` +
            `${META_TOTAL_FILMES} filmes.`
        );
    }

    console.log(
        "======================================"
    );
}

async function iniciar() {
    try {
        await executarCarga();
    } catch (erro) {
        console.error("");
        console.error(
            "Erro ao executar a carga:"
        );

        console.error(
            erro.response?.data ||
            erro.message ||
            erro
        );

        process.exitCode = 1;
    } finally {
        await banco.end();
    }
}

iniciar();