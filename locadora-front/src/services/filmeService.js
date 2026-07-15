import api from "./api";

async function listar(filtros = {}) {
    const resposta = await api.get(
        "/filmes",
        {
            params: filtros
        }
    );

    return resposta.data;
}

async function buscarPorId(id) {
    const resposta = await api.get(
        `/filmes/${id}`
    );

    return resposta.data;
}

async function cadastrar(dadosFilme) {
    const resposta = await api.post(
        "/filmes",
        dadosFilme
    );

    return resposta.data;
}

async function atualizar(id, dadosFilme) {
    const resposta = await api.put(
        `/filmes/${id}`,
        dadosFilme
    );

    return resposta.data;
}

async function excluir(id) {
    const resposta = await api.delete(
        `/filmes/${id}`
    );

    return resposta.data;
}

export default {
    listar,
    buscarPorId,
    cadastrar,
    atualizar,
    excluir
};