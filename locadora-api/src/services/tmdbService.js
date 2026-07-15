const axios = require("axios");

const tmdbApi = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    timeout: 15000,
    headers: {
        Accept: "application/json"
    }
});

function validarConfiguracao() {
    if (!process.env.TMDB_TOKEN) {
        throw new Error(
            "O token da TMDB não foi configurado no arquivo .env."
        );
    }
}

function obterCabecalhoAutorizacao() {
    validarConfiguracao();

    return {
        Authorization: `Bearer ${process.env.TMDB_TOKEN}`
    };
}

async function pesquisarFilmes(titulo, pagina = 1) {
    const resposta = await tmdbApi.get(
        "/search/movie",
        {
            headers: obterCabecalhoAutorizacao(),

            params: {
                query: titulo,
                page: pagina,
                language: "pt-BR",
                include_adult: false
            }
        }
    );

    return resposta.data;
}

async function buscarDetalhesFilme(tmdbId) {
    const resposta = await tmdbApi.get(
        `/movie/${tmdbId}`,
        {
            headers: obterCabecalhoAutorizacao(),

            params: {
                language: "pt-BR"
            }
        }
    );

    return resposta.data;
}

async function listarGeneros() {
    const resposta = await tmdbApi.get(
        "/genre/movie/list",
        {
            headers: obterCabecalhoAutorizacao(),

            params: {
                language: "pt-BR"
            }
        }
    );

    return resposta.data.genres || [];
}

async function listarFilmesPopulares(pagina = 1) {
    const resposta = await tmdbApi.get(
        "/movie/popular",
        {
            headers: obterCabecalhoAutorizacao(),

            params: {
                page: pagina,
                language: "pt-BR"
            }
        }
    );

    return resposta.data;
}

function montarUrlImagem(
    caminhoImagem,
    tamanho = "w500"
) {
    if (!caminhoImagem) {
        return null;
    }

    return (
        `https://image.tmdb.org/t/p/` +
        `${tamanho}${caminhoImagem}`
    );
}

async function baixarImagem(
    caminhoImagem,
    tamanho = "w500"
) {
    if (!caminhoImagem) {
        return null;
    }

    const url = montarUrlImagem(
        caminhoImagem,
        tamanho
    );

    const resposta = await axios.get(
        url,
        {
            responseType: "arraybuffer",
            timeout: 20000
        }
    );

    return {
        buffer: Buffer.from(resposta.data),

        tipo:
            resposta.headers["content-type"] ||
            "image/jpeg"
    };
}

module.exports = {
    pesquisarFilmes,
    buscarDetalhesFilme,
    listarGeneros,
    listarFilmesPopulares,
    montarUrlImagem,
    baixarImagem
};