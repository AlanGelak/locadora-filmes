<script setup>
import {
    onMounted,
    ref
} from "vue";

import {
    useRoute,
    useRouter
} from "vue-router";

import filmeService from "@/services/filmeService";
import { API_ORIGIN } from "@/services/api";

const route = useRoute();
const router = useRouter();

const filme = ref(null);
const carregando = ref(true);
const mensagemErro = ref("");

function obterUrlImagem() {
    if (!filme.value?.imagemUrl) {
        return null;
    }

    return `${API_ORIGIN}${filme.value.imagemUrl}`;
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

async function carregarFilme() {
    try {
        carregando.value = true;
        mensagemErro.value = "";

        filme.value =
            await filmeService.buscarPorId(
                route.params.id
            );
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar o filme.";
    } finally {
        carregando.value = false;
    }
}

function voltar() {
    router.push({
        name: "admin-filmes"
    });
}

function editarFilme() {
    router.push({
        name: "editar-filme",
        params: {
            id: filme.value.id
        }
    });
}

onMounted(carregarFilme);
</script>

<template>
    <main class="pagina">
        <header class="cabecalho">
            <div>
                <h1>🎬 Detalhes do filme</h1>
                <p>Informações cadastradas no banco</p>
            </div>

            <button
                class="botao-voltar"
                type="button"
                @click="voltar"
            >
                Voltar
            </button>
        </header>

        <section class="conteudo">
            <p
                v-if="carregando"
                class="estado"
            >
                Carregando filme...
            </p>

            <p
                v-else-if="mensagemErro"
                class="mensagem-erro"
            >
                {{ mensagemErro }}
            </p>

            <article
                v-else-if="filme"
                class="detalhes"
            >
                <div class="area-imagem">
                    <img
                        v-if="obterUrlImagem()"
                        :src="obterUrlImagem()"
                        :alt="`Capa do filme ${filme.titulo}`"
                    />

                    <div
                        v-else
                        class="sem-imagem"
                    >
                        🎞️
                    </div>
                </div>

                <div class="informacoes">
                    <div class="titulo-acoes">
                        <div>
                            <h2>{{ filme.titulo }}</h2>

                            <p class="categoria">
                                {{
                                    filme.categoriaNome ||
                                    "Sem categoria"
                                }}
                            </p>
                        </div>

                        <button
                            class="botao-editar"
                            type="button"
                            title="Editar filme"
                            aria-label="Editar filme"
                            @click="editarFilme"
                        >
                            ✏️
                        </button>
                    </div>

                    <div class="grade-dados">
                        <div class="dado">
                            <span>Ano</span>
                            <strong>
                                {{ filme.ano || "Não informado" }}
                            </strong>
                        </div>

                        <div class="dado">
                            <span>Duração</span>
                            <strong>
                                {{
                                    filme.duracaoMinutos
                                        ? `${filme.duracaoMinutos} minutos`
                                        : "Não informada"
                                }}
                            </strong>
                        </div>

                        <div class="dado">
                            <span>Nota</span>
                            <strong>
                                ⭐ {{ filme.nota || 0 }}
                            </strong>
                        </div>

                        <div class="dado">
                            <span>Estoque</span>
                            <strong>
                                {{ filme.quantidadeEstoque }}
                            </strong>
                        </div>

                        <div class="dado">
                            <span>Valor da locação</span>
                            <strong>
                                {{
                                    formatarValor(
                                        filme.valorLocacao
                                    )
                                }}
                            </strong>
                        </div>

                        <div class="dado">
                            <span>Categoria</span>
                            <strong>
                                {{
                                    filme.categoriaNome ||
                                    "Sem categoria"
                                }}
                            </strong>
                        </div>
                    </div>

                    <section class="sinopse">
                        <h3>Sinopse</h3>

                        <p>
                            {{
                                filme.sinopse ||
                                "Nenhuma sinopse cadastrada."
                            }}
                        </p>
                    </section>
                </div>
            </article>
        </section>
    </main>
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
    width: min(1100px, 92%);
    margin: 0 auto;
    padding: 40px 0;
}

.detalhes {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 34px;
    padding: 28px;
    border: 1px solid #293247;
    border-radius: 16px;
    background: #181f2d;
}

.area-imagem {
    overflow: hidden;
    height: 470px;
    border-radius: 12px;
    background: #101521;
}

.area-imagem img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.sem-imagem {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    font-size: 70px;
}

.titulo-acoes {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
}

.titulo-acoes h2 {
    margin: 0 0 8px;
    font-size: 34px;
    color: #ffffff;
}

.categoria {
    margin: 0;
    color: #91a6f6;
}

.botao-editar {
    display: grid;
    place-items: center;
    min-width: 48px;
    height: 48px;
    padding: 0;
    border: 1px solid #5269bd;
    border-radius: 10px;
    font-size: 21px;
    cursor: pointer;
    background: #293b7a;
}

.botao-editar:hover {
    background: #3852a4;
}

.grade-dados {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 30px;
}

.dado {
    display: grid;
    gap: 6px;
    padding: 15px;
    border: 1px solid #303a50;
    border-radius: 10px;
    background: #111724;
}

.dado span {
    font-size: 14px;
    color: #929db1;
}

.dado strong {
    color: #ffffff;
}

.sinopse {
    margin-top: 28px;
}

.sinopse h3 {
    margin-bottom: 10px;
    color: #ffffff;
}

.sinopse p {
    margin: 0;
    line-height: 1.7;
    color: #c3cad7;
}

.botao-voltar {
    padding: 11px 18px;
    border: 0;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    background: #353e50;
}

.estado,
.mensagem-erro {
    padding: 30px;
    text-align: center;
    border-radius: 12px;
}

.estado {
    color: #aeb8ca;
}

.mensagem-erro {
    color: #ffb4c0;
    background: #371c25;
}

@media (max-width: 800px) {
    .detalhes {
        grid-template-columns: 1fr;
    }

    .area-imagem {
        max-width: 350px;
        margin: 0 auto;
    }

    .grade-dados {
        grid-template-columns: 1fr;
    }
}
</style>