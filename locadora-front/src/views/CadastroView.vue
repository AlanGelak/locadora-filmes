<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import authService from "@/services/authService";

const router = useRouter();

const nome = ref("");
const email = ref("");
const senha = ref("");
const confirmarSenha = ref("");

const carregando = ref(false);
const mensagemErro = ref("");
const mensagemSucesso = ref("");

async function cadastrarUsuario() {
    mensagemErro.value = "";
    mensagemSucesso.value = "";

    if (
        !nome.value.trim() ||
        !email.value.trim() ||
        !senha.value ||
        !confirmarSenha.value
    ) {
        mensagemErro.value =
            "Preencha todos os campos.";

        return;
    }

    if (senha.value.length < 8) {
        mensagemErro.value =
            "A senha deve possuir pelo menos 8 caracteres.";

        return;
    }

    if (senha.value !== confirmarSenha.value) {
        mensagemErro.value =
            "As senhas informadas não são iguais.";

        return;
    }

    try {
        carregando.value = true;

        const resposta =
            await authService.cadastrar(
                nome.value.trim(),
                email.value.trim(),
                senha.value
            );

        mensagemSucesso.value =
            resposta.mensagem ||
            "Usuário cadastrado com sucesso.";

        setTimeout(() => {
            router.push({
                name: "login"
            });
        }, 1000);
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível cadastrar o usuário.";
    } finally {
        carregando.value = false;
    }
}

function voltarParaHome() {
    router.push({
        name: "home"
    });
}

function irParaLogin() {
    router.push({
        name: "login"
    });
}
</script>

<template>
    <main class="pagina-cadastro">
        <section class="caixa-cadastro">
            <div class="titulo">
                <span class="icone">🎬</span>

                <div>
                    <h1>Criar conta</h1>

                    <p>
                        Cadastre um novo usuário
                    </p>
                </div>
            </div>

            <form @submit.prevent="cadastrarUsuario">
                <div class="campo">
                    <label for="nome">
                        Nome
                    </label>

                    <input
                        id="nome"
                        v-model="nome"
                        type="text"
                        maxlength="100"
                        placeholder="Digite seu nome"
                        autocomplete="name"
                    />
                </div>

                <div class="campo">
                    <label for="email">
                        E-mail
                    </label>

                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        maxlength="150"
                        placeholder="usuario@email.com"
                        autocomplete="email"
                    />
                </div>

                <div class="campo">
                    <label for="senha">
                        Senha
                    </label>

                    <input
                        id="senha"
                        v-model="senha"
                        type="password"
                        placeholder="Mínimo de 8 caracteres"
                        autocomplete="new-password"
                    />
                </div>

                <div class="campo">
                    <label for="confirmarSenha">
                        Confirmar senha
                    </label>

                    <input
                        id="confirmarSenha"
                        v-model="confirmarSenha"
                        type="password"
                        placeholder="Digite a senha novamente"
                        autocomplete="new-password"
                    />
                </div>

                <p
                    v-if="mensagemErro"
                    class="mensagem erro"
                >
                    {{ mensagemErro }}
                </p>

                <p
                    v-if="mensagemSucesso"
                    class="mensagem sucesso"
                >
                    {{ mensagemSucesso }}
                </p>

                <button
                    type="submit"
                    class="botao-principal"
                    :disabled="carregando"
                >
                    {{
                        carregando
                            ? "Cadastrando..."
                            : "Cadastrar"
                    }}
                </button>

                <button
                    type="button"
                    class="botao-login"
                    :disabled="carregando"
                    @click="irParaLogin"
                >
                    Já tenho uma conta
                </button>

                <button
                    type="button"
                    class="botao-voltar"
                    :disabled="carregando"
                    @click="voltarParaHome"
                >
                    Voltar para a home
                </button>
            </form>
        </section>
    </main>
</template>

<style scoped>
.pagina-cadastro {
    display: grid;
    place-items: center;
    min-height: 100vh;
    padding: 24px;
    background:
        radial-gradient(
            circle at top,
            #26334f,
            #101522 55%
        );
}

.caixa-cadastro {
    width: 100%;
    max-width: 440px;
    padding: 34px;
    border: 1px solid #303b50;
    border-radius: 18px;
    background: #171d2a;
    box-shadow: 0 20px 50px rgb(0 0 0 / 35%);
}

.titulo {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
}

.icone {
    font-size: 42px;
}

h1 {
    margin: 0 0 5px;
    color: #ffffff;
}

.titulo p {
    margin: 0;
    color: #9da8bd;
}

.campo {
    display: grid;
    gap: 8px;
    margin-bottom: 17px;
}

label {
    font-weight: 700;
    color: #dce3ef;
}

input {
    width: 100%;
    padding: 13px;
    border: 1px solid #39445a;
    border-radius: 9px;
    outline: none;
    color: #ffffff;
    background: #101521;
}

input:focus {
    border-color: #6f8cff;
    box-shadow:
        0 0 0 3px
        rgb(111 140 255 / 15%);
}

button {
    width: 100%;
    padding: 13px;
    border: 0;
    border-radius: 9px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-principal {
    margin-top: 5px;
    background: #4e6de6;
}

.botao-principal:hover {
    background: #607df0;
}

.botao-login {
    margin-top: 11px;
    background: #293b7a;
}

.botao-voltar {
    margin-top: 11px;
    background: #353e50;
}

button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.mensagem {
    padding: 11px;
    border-radius: 8px;
}

.erro {
    color: #ffb4c0;
    background: #371c25;
}

.sucesso {
    color: #b5f3c5;
    background: #193723;
}
</style>