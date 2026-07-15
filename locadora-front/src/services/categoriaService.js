import api from "./api";

async function listar() {
    const resposta = await api.get(
        "/categorias"
    );

    return resposta.data;
}

async function buscarPorId(id) {
    const resposta = await api.get(
        `/categorias/${id}`
    );

    return resposta.data;
}

async function cadastrar(dadosCategoria) {
    const resposta = await api.post(
        "/categorias",
        dadosCategoria
    );

    return resposta.data;
}

async function atualizar(id, dadosCategoria) {
    const resposta = await api.put(
        `/categorias/${id}`,
        dadosCategoria
    );

    return resposta.data;
}

async function excluir(id) {
    const resposta = await api.delete(
        `/categorias/${id}`
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