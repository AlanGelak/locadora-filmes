<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import authService from "@/services/authService";

const router = useRouter();

const email = ref("");
const senha = ref("");

const carregando = ref(false);
const mensagemErro = ref("");

async function entrar() {
    mensagemErro.value = "";

    if (!email.value.trim() || !senha.value) {
        mensagemErro.value =
            "Informe o e-mail e a senha.";

        return;
    }

    try {
        carregando.value = true;

        const resposta =
            await authService.login(
                email.value.trim(),
                senha.value
            );

        if (
            authService.ehAdmin(
                resposta.usuario
            )
        ) {
            await router.push({
                name: "admin-filmes"
            });

            return;
        }
        await router.push({
            name: "home"
        });
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível realizar o login.";
    } finally {
        carregando.value = false;
    }
}
</script>

<template>
    <main class="pagina-login">
        <section class="caixa-login">
            <div class="titulo">
                <span class="icone">🎬</span>

                <div>
                    <h1>Locadora de Filmes</h1>
                    <p>Entre para gerenciar o catálogo</p>
                </div>
            </div>

            <form @submit.prevent="entrar">
                <div class="campo">
                    <label for="email">E-mail</label>

                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        placeholder="admin@locadora.com"
                        autocomplete="email"
                    />
                </div>

                <div class="campo">
                    <label for="senha">Senha</label>

                    <input
                        id="senha"
                        v-model="senha"
                        type="password"
                        placeholder="Digite sua senha"
                        autocomplete="current-password"
                    />
                </div>

                <p
                    v-if="mensagemErro"
                    class="mensagem-erro"
                >
                    {{ mensagemErro }}
                </p>

                <button
                    type="submit"
                    :disabled="carregando"
                >
                    {{
                        carregando
                            ? "Entrando..."
                            : "Entrar"
                    }}
                </button>
            </form>
        </section>
    </main>
</template>

<style scoped>
.pagina-login {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
        radial-gradient(
            circle at top,
            #26334f,
            #101522 55%
        );
}

.caixa-login {
    width: 100%;
    max-width: 430px;
    padding: 36px;
    border: 1px solid #303b50;
    border-radius: 18px;
    background: #171d2a;
    box-shadow: 0 20px 50px rgb(0 0 0 / 35%);
}

.titulo {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 30px;
}

.icone {
    font-size: 42px;
}

h1 {
    margin: 0 0 6px;
    font-size: 26px;
    color: #ffffff;
}

.titulo p {
    margin: 0;
    color: #9da8bd;
}

.campo {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
}

label {
    font-weight: 600;
    color: #dce3ef;
}

input {
    width: 100%;
    padding: 13px 14px;
    border: 1px solid #39445a;
    border-radius: 9px;
    outline: none;
    color: #ffffff;
    background: #101521;
}

input:focus {
    border-color: #6f8cff;
    box-shadow: 0 0 0 3px rgb(111 140 255 / 15%);
}

button {
    width: 100%;
    padding: 13px;
    border: 0;
    border-radius: 9px;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    background: #4e6de6;
}

button:hover {
    background: #607df0;
}

button:disabled {
    cursor: wait;
    opacity: 0.7;
}

.mensagem-erro {
    padding: 11px;
    border: 1px solid #733b47;
    border-radius: 8px;
    color: #ffb4c0;
    background: #371c25;
}
</style>