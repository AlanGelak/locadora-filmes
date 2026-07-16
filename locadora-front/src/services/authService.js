import api from "./api";

const CHAVE_TOKEN = "token";
const CHAVE_USUARIO = "usuario";

async function cadastrar(nome, email, senha) {
    const resposta = await api.post(
        "/auth/cadastrar",
        {
            nome,
            email,
            senha
        }
    );
    return resposta.data;
}

async function login(email, senha) {
    const resposta = await api.post(
        "/auth/login",
        {
            email,
            senha
        }
    );

    localStorage.setItem(
        CHAVE_TOKEN,
        resposta.data.token
    );

    localStorage.setItem(
        CHAVE_USUARIO,
        JSON.stringify(resposta.data.usuario)
    );

    return resposta.data;
}

function ehAdmin(usuario = obterUsuario()) {
    const email = String(
        usuario?.email || ""
    ).toLowerCase();
    return email.includes("admin");
}

function logout() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
}

function obterToken() {
    return localStorage.getItem(CHAVE_TOKEN);
}

function obterUsuario() {
    const usuarioSalvo =
        localStorage.getItem(CHAVE_USUARIO);

    if (!usuarioSalvo) {
        return null;
    }

    try {
        return JSON.parse(usuarioSalvo);
    } catch {
        localStorage.removeItem(CHAVE_USUARIO);

        return null;
    }
}

function estaAutenticado() {
    return Boolean(obterToken());
}

export default {
    cadastrar,
    login,
    logout,
    obterToken,
    obterUsuario,
    estaAutenticado,
    ehAdmin
};