<script setup>
import {
    onMounted,
    ref
} from "vue";

import { useRouter } from "vue-router";

import authService from "@/services/authService";
import filmeService from "@/services/filmeService";
import { API_ORIGIN } from "@/services/api";

const router = useRouter();

const usuario = ref(
    authService.obterUsuario()
);

const filmes = ref([]);
const carregando = ref(true);
const mensagemErro = ref("");

function obterUrlImagem(filme) {
    if (!filme.imagemUrl) {
        return null;
    }

    return `${API_ORIGIN}${filme.imagemUrl}`;
}

function formatarValor(valor) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

async function carregarFilmes() {
    try {
        carregando.value = true;
        mensagemErro.value = "";

        filmes.value =
            await filmeService.listar();
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar os filmes.";
    } finally {
        carregando.value = false;
    }
}

function adicionarFilme() {
    router.push({
        name: "novo-filme"
    });
}

function adicionarCategoria() {
    router.push({
        name: "categorias"
    });
}

function abrirDetalhes(id) {
    router.push({
        name: "detalhes-filme",
        params: {
            id
        }
    });
}

async function sair() {
    authService.logout();

    await router.push({
        name: "login"
    });
}

onMounted(carregarFilmes);
</script>

<template>
    <div class="pagina">
        <header class="cabecalho">
            <div>
                <h1>🎬 Locadora de Filmes</h1>

                <p>
                    Bem-vindo,
                    {{ usuario?.nome || "usuário" }}
                </p>
            </div>

            <button
                type="button"
                class="botao-sair"
                @click="sair"
            >
                Sair
            </button>
        </header>

        <main class="conteudo">
            <div class="barra-superior">
                <div>
                    <h2>Catálogo</h2>

                    <p>
                        Filmes cadastrados no banco
                    </p>
                </div>

                <div class="acoes-cabecalho">
                    <button
                        type="button"
                        class="botao-categoria"
                        @click="adicionarCategoria"
                    >
                        + Adicionar categoria
                    </button>

                    <button
                        type="button"
                        class="botao-principal"
                        @click="adicionarFilme"
                    >
                        + Adicionar filme
                    </button>
                </div>
            </div>

            <p
                v-if="carregando"
                class="estado"
            >
                Carregando filmes...
            </p>

            <p
                v-else-if="mensagemErro"
                class="erro"
            >
                {{ mensagemErro }}
            </p>

            <div
                v-else-if="filmes.length"
                class="grade-filmes"
            >
                <article
                    v-for="filme in filmes"
                    :key="filme.id"
                    class="cartao-filme"
                    role="button"
                    tabindex="0"
                    @click="abrirDetalhes(filme.id)"
                    @keydown.enter="abrirDetalhes(filme.id)"
                >
                    <img
                        v-if="obterUrlImagem(filme)"
                        :src="obterUrlImagem(filme)"
                        :alt="`Capa do filme ${filme.titulo}`"
                    />

                    <div
                        v-else
                        class="sem-imagem"
                    >
                        🎞️
                    </div>

                    <div class="informacoes">
                        <h3>
                            {{ filme.titulo }}
                        </h3>

                        <p class="categoria">
                            {{
                                filme.categoriaNome ||
                                "Sem categoria"
                            }}
                        </p>

                        <div class="dados">
                            <span>
                                📅 {{ filme.ano || "—" }}
                            </span>

                            <span>
                                ⭐ {{ filme.nota || 0 }}
                            </span>
                        </div>

                        <div class="dados">
                            <span>
                                Estoque:
                                {{ filme.quantidadeEstoque }}
                            </span>

                            <strong>
                                {{
                                    formatarValor(
                                        filme.valorLocacao
                                    )
                                }}
                            </strong>
                        </div>
                    </div>
                </article>
            </div>

            <div
                v-else
                class="estado-vazio"
            >
                <span>🎥</span>

                <h3>
                    Nenhum filme cadastrado
                </h3>

                <p>
                    Importe um filme da TMDB ou
                    cadastre manualmente.
                </p>
            </div>
        </main>
    </div>
</template>

<style scoped>
.pagina {
    min-height: 100vh;
    background: #0f1420;
}

.cabecalho {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 6%;
    border-bottom: 1px solid #273044;
    background: #171d2a;
}

.cabecalho h1 {
    margin: 0;
    color: #ffffff;
}

.cabecalho p {
    margin: 5px 0 0;
    color: #9da8bd;
}

.conteudo {
    width: min(1200px, 92%);
    margin: 0 auto;
    padding: 36px 0;
}

.barra-superior {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
}

.barra-superior h2 {
    margin: 0;
    color: #ffffff;
}

.barra-superior p {
    margin: 6px 0 0;
    color: #9da8bd;
}

.acoes-cabecalho {
    display: flex;
    align-items: center;
    gap: 12px;
}

.botao-sair,
.botao-principal,
.botao-categoria {
    padding: 11px 17px;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-sair {
    border: 0;
    background: #353e50;
}

.botao-sair:hover {
    background: #465166;
}

.botao-principal {
    border: 0;
    background: #4e6de6;
}

.botao-principal:hover {
    background: #607df0;
}

.botao-categoria {
    border: 1px solid #53617c;
    background: #353e50;
}

.botao-categoria:hover {
    background: #465166;
}

.grade-filmes {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
}

.cartao-filme {
    overflow: hidden;
    border: 1px solid #293247;
    border-radius: 14px;
    cursor: pointer;
    outline: none;
    background: #181f2d;
    transition:
        transform 0.2s,
        border-color 0.2s,
        box-shadow 0.2s;
}

.cartao-filme:hover {
    transform: translateY(-4px);
    border-color: #5875df;
    box-shadow: 0 12px 25px rgb(0 0 0 / 25%);
}

.cartao-filme:focus {
    border-color: #6f8cff;
    box-shadow:
        0 0 0 3px
        rgb(111 140 255 / 20%);
}

.cartao-filme img,
.sem-imagem {
    width: 100%;
    height: 320px;
}

.cartao-filme img {
    display: block;
    object-fit: cover;
}

.sem-imagem {
    display: grid;
    place-items: center;
    font-size: 54px;
    background: #252e40;
}

.informacoes {
    padding: 17px;
}

.informacoes h3 {
    margin: 0 0 7px;
    color: #ffffff;
}

.categoria {
    margin: 0 0 15px;
    color: #91a6f6;
}

.dados {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    color: #aeb8ca;
}

.dados strong {
    color: #ffffff;
}

.estado,
.erro,
.estado-vazio {
    padding: 30px;
    text-align: center;
    border-radius: 12px;
}

.estado {
    color: #aeb8ca;
}

.erro {
    border: 1px solid #733b47;
    color: #ffb4c0;
    background: #371c25;
}

.estado-vazio {
    border: 1px dashed #39445a;
    color: #aeb8ca;
}

.estado-vazio span {
    font-size: 50px;
}

.estado-vazio h3 {
    margin-bottom: 6px;
    color: #ffffff;
}

@media (max-width: 700px) {
    .cabecalho,
    .barra-superior {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .acoes-cabecalho {
        width: 100%;
        flex-direction: column;
    }

    .acoes-cabecalho button {
        width: 100%;
    }

    .botao-sair {
        width: 100%;
    }
}
</style>