<script setup>
import {
    computed,
    onBeforeUnmount,
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
const termoPesquisa = ref("");
const filmeSelecionado = ref(null);

const carregando = ref(false);
const mensagemErro = ref("");

/*
 * Retorna true quando existe usuário
 * e existe um token salvo.
 */
const autenticado = computed(() => {
    return Boolean(
        usuario.value &&
        authService.estaAutenticado()
    );
});

/*
 * Verifica se o e-mail do usuário
 * contém a palavra "admin".
 */
const administrador = computed(() => {
    return authService.ehAdmin(
        usuario.value
    );
});

function abrirLogin() {
    router.push({
        name: "login"
    });
}

function abrirCadastro() {
    router.push({
        name: "cadastro"
    });
}

function abrirPainelAdmin() {
    router.push({
        name: "admin-filmes"
    });
}

function sair() {
    authService.logout();

    usuario.value = null;
}

function abrirDetalhes(filme) {
    filmeSelecionado.value = filme;

    document.body.style.overflow = "hidden";
}

function fecharDetalhes() {
    filmeSelecionado.value = null;

    document.body.style.overflow = "";
}

function fecharComEscape(evento) {
    if (
        evento.key === "Escape" &&
        filmeSelecionado.value
    ) {
        fecharDetalhes();
    }
}

function obterUrlImagem(filme) {
    if (!filme?.imagemUrl) {
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

        const filtros = {};

        if (termoPesquisa.value.trim()) {
            filtros.titulo =
                termoPesquisa.value.trim();
        }

        filmes.value =
            await filmeService.listar(filtros);
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar os filmes.";
    } finally {
        carregando.value = false;
    }
}

async function limparPesquisa() {
    termoPesquisa.value = "";

    await carregarFilmes();
}

onMounted(() => {
    carregarFilmes();

    window.addEventListener(
        "keydown",
        fecharComEscape
    );
});

onBeforeUnmount(() => {
    window.removeEventListener(
        "keydown",
        fecharComEscape
    );

    document.body.style.overflow = "";
});
</script>

<template>
    <div class="pagina">
        <header class="cabecalho">
            <div class="marca">
                <span class="icone-marca">
                    🎬
                </span>

                <div>
                    <h1>Locadora de Filmes</h1>

                    <p>
                        Encontre seu próximo filme
                    </p>
                </div>
            </div>

            <div class="acoes-usuario">
                <!-- Usuário autenticado -->
                <template v-if="autenticado">
                    <span class="nome-usuario">
                        Olá, {{ usuario.nome }}
                    </span>

                    <button
                        v-if="administrador"
                        type="button"
                        class="botao-admin"
                        @click="abrirPainelAdmin"
                    >
                        Painel administrativo
                    </button>

                    <button
                        type="button"
                        class="botao-sair"
                        @click="sair"
                    >
                        Sair
                    </button>
                </template>

                <!-- Visitante -->
                <template v-else>
                    <button
                        type="button"
                        class="botao-cadastro"
                        @click="abrirCadastro"
                    >
                        Cadastrar
                    </button>

                    <button
                        type="button"
                        class="botao-login"
                        @click="abrirLogin"
                    >
                        Entrar
                    </button>
                </template>
            </div>
        </header>

        <main class="conteudo">
            <section class="apresentacao">
                <p class="destaque">
                    Nosso catálogo
                </p>

                <h2>
                    Filmes para todos os momentos
                </h2>

                <p class="descricao">
                    Pesquise pelo título e consulte os
                    filmes disponíveis na locadora.
                </p>

                <form
                    class="barra-pesquisa"
                    @submit.prevent="carregarFilmes"
                >
                    <input
                        v-model="termoPesquisa"
                        type="search"
                        placeholder="Pesquisar por título..."
                        aria-label="Pesquisar filmes pelo título"
                    />

                    <button
                        type="submit"
                        class="botao-pesquisar"
                        :disabled="carregando"
                    >
                        {{
                            carregando
                                ? "Pesquisando..."
                                : "Pesquisar"
                        }}
                    </button>

                    <button
                        v-if="termoPesquisa"
                        type="button"
                        class="botao-limpar"
                        :disabled="carregando"
                        @click="limparPesquisa"
                    >
                        Limpar
                    </button>
                </form>
            </section>

            <section class="catalogo">
                <div class="titulo-catalogo">
                    <div>
                        <h2>Filmes disponíveis</h2>

                        <p>
                            {{ filmes.length }}
                            filme(s) encontrado(s)
                        </p>
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
                    class="mensagem-erro"
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
                        :aria-label="
                            `Ver detalhes do filme ${filme.titulo}`
                        "
                        @click="abrirDetalhes(filme)"
                        @keydown.enter="abrirDetalhes(filme)"
                        @keydown.space.prevent="
                            abrirDetalhes(filme)
                        "
                    >
                        <div class="area-imagem">
                            <img
                                v-if="obterUrlImagem(filme)"
                                :src="obterUrlImagem(filme)"
                                :alt="
                                    `Capa do filme ${filme.titulo}`
                                "
                                loading="lazy"
                            />

                            <div
                                v-else
                                class="sem-imagem"
                            >
                                🎞️
                            </div>

                            <span class="nota">
                                ⭐ {{ filme.nota || 0 }}
                            </span>
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
                                    📅
                                    {{ filme.ano || "—" }}
                                </span>

                                <span>
                                    {{
                                        filme.duracaoMinutos
                                            ? `${filme.duracaoMinutos} min`
                                            : "Duração não informada"
                                    }}
                                </span>
                            </div>

                            <div class="rodape-cartao">
                                <div>
                                    <small>
                                        Locação
                                    </small>

                                    <strong>
                                        {{
                                            formatarValor(
                                                filme.valorLocacao
                                            )
                                        }}
                                    </strong>
                                </div>

                                <span
                                    :class="[
                                        'estoque',
                                        {
                                            indisponivel:
                                                filme.quantidadeEstoque <= 0
                                        }
                                    ]"
                                >
                                    {{
                                        filme.quantidadeEstoque > 0
                                            ? `${filme.quantidadeEstoque} disponível(is)`
                                            : "Indisponível"
                                    }}
                                </span>
                            </div>
                        </div>
                    </article>
                </div>

                <div
                    v-else
                    class="estado-vazio"
                >
                    <span>🔎</span>

                    <h3>
                        Nenhum filme encontrado
                    </h3>

                    <p>
                        Tente pesquisar usando outro título.
                    </p>

                    <button
                        type="button"
                        class="botao-limpar-resultado"
                        @click="limparPesquisa"
                    >
                        Mostrar todos
                    </button>
                </div>
            </section>
        </main>

        <!-- Modal com detalhes do filme -->
        <div
            v-if="filmeSelecionado"
            class="fundo-modal"
            role="presentation"
            @click.self="fecharDetalhes"
        >
            <article
                class="modal-filme"
                role="dialog"
                aria-modal="true"
                :aria-label="
                    `Detalhes do filme ${filmeSelecionado.titulo}`
                "
            >
                <button
                    type="button"
                    class="botao-fechar"
                    title="Fechar"
                    aria-label="Fechar detalhes"
                    @click="fecharDetalhes"
                >
                    ×
                </button>

                <div class="modal-conteudo">
                    <div class="modal-imagem">
                        <img
                            v-if="
                                obterUrlImagem(
                                    filmeSelecionado
                                )
                            "
                            :src="
                                obterUrlImagem(
                                    filmeSelecionado
                                )
                            "
                            :alt="
                                `Capa do filme ${filmeSelecionado.titulo}`
                            "
                        />

                        <div
                            v-else
                            class="sem-imagem"
                        >
                            🎞️
                        </div>
                    </div>

                    <div class="modal-informacoes">
                        <h2>
                            {{ filmeSelecionado.titulo }}
                        </h2>

                        <p class="modal-categoria">
                            {{
                                filmeSelecionado.categoriaNome ||
                                "Sem categoria"
                            }}
                        </p>

                        <div class="modal-dados">
                            <span>
                                📅
                                {{
                                    filmeSelecionado.ano ||
                                    "Ano não informado"
                                }}
                            </span>

                            <span>
                                ⭐
                                {{
                                    filmeSelecionado.nota ||
                                    0
                                }}
                            </span>

                            <span>
                                ⏱️
                                {{
                                    filmeSelecionado.duracaoMinutos
                                        ? `${filmeSelecionado.duracaoMinutos} minutos`
                                        : "Duração não informada"
                                }}
                            </span>
                        </div>

                        <section class="modal-sinopse">
                            <h3>Sinopse</h3>

                            <p>
                                {{
                                    filmeSelecionado.sinopse ||
                                    "Nenhuma descrição cadastrada para este filme."
                                }}
                            </p>
                        </section>

                        <div class="modal-rodape">
                            <div>
                                <small>
                                    Valor da locação
                                </small>

                                <strong>
                                    {{
                                        formatarValor(
                                            filmeSelecionado.valorLocacao
                                        )
                                    }}
                                </strong>
                            </div>

                            <span
                                :class="[
                                    'estoque-modal',
                                    {
                                        indisponivel:
                                            filmeSelecionado.quantidadeEstoque <= 0
                                    }
                                ]"
                            >
                                {{
                                    filmeSelecionado.quantidadeEstoque > 0
                                        ? `${filmeSelecionado.quantidadeEstoque} disponível(is)`
                                        : "Indisponível"
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </div>

        <footer class="rodape">
            <p>
                🎬 Locadora de Filmes
            </p>

            <span>
                Catálogo desenvolvido com Vue e Node.js
            </span>
        </footer>
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
    padding: 18px 6%;
    border-bottom: 1px solid #273044;
    background: #171d2a;
}

.marca {
    display: flex;
    align-items: center;
    gap: 14px;
}

.icone-marca {
    font-size: 38px;
}

.marca h1 {
    margin: 0;
    color: #ffffff;
}

.marca p {
    margin: 4px 0 0;
    color: #9da8bd;
}

/* Área do usuário */

.acoes-usuario {
    display: flex;
    align-items: center;
    gap: 10px;
}

.nome-usuario {
    margin-right: 5px;
    font-weight: 700;
    color: #ffffff;
}

.acoes-usuario button {
    padding: 11px 18px;
    border-radius: 9px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-login,
.botao-admin {
    border: 1px solid #6379cc;
    background: #293b7a;
}

.botao-login:hover,
.botao-admin:hover {
    background: #3852a4;
}

.botao-cadastro,
.botao-sair {
    border: 1px solid #53617c;
    background: #353e50;
}

.botao-cadastro:hover,
.botao-sair:hover {
    background: #465166;
}

.conteudo {
    width: min(1280px, 92%);
    margin: 0 auto;
}

.apresentacao {
    padding: 65px 0 45px;
    text-align: center;
}

.destaque {
    margin: 0 0 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #91a6f6;
}

.apresentacao h2 {
    max-width: 750px;
    margin: 0 auto;
    font-size: clamp(32px, 5vw, 54px);
    color: #ffffff;
}

.descricao {
    max-width: 620px;
    margin: 18px auto 28px;
    line-height: 1.6;
    color: #aeb8ca;
}

.barra-pesquisa {
    display: flex;
    gap: 10px;
    width: min(750px, 100%);
    margin: 0 auto;
    padding: 8px;
    border: 1px solid #303a50;
    border-radius: 13px;
    background: #181f2d;
}

.barra-pesquisa input {
    flex: 1;
    min-width: 0;
    padding: 13px 15px;
    border: 0;
    outline: none;
    color: #ffffff;
    background: transparent;
}

.barra-pesquisa input::placeholder {
    color: #7f899c;
}

.barra-pesquisa button {
    padding: 12px 18px;
    border: 0;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-pesquisar {
    background: #4e6de6;
}

.botao-limpar {
    background: #353e50;
}

.barra-pesquisa button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.catalogo {
    padding-bottom: 55px;
}

.titulo-catalogo {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
}

.titulo-catalogo h2 {
    margin: 0;
    color: #ffffff;
}

.titulo-catalogo p {
    margin: 6px 0 0;
    color: #9da8bd;
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
    outline: none;
    cursor: pointer;
    background: #181f2d;
    transition:
        transform 0.2s,
        border-color 0.2s,
        box-shadow 0.2s;
}

.cartao-filme:hover {
    transform: translateY(-5px);
    border-color: #5875df;
    box-shadow: 0 14px 30px rgb(0 0 0 / 28%);
}

.cartao-filme:focus {
    border-color: #6f8cff;
    box-shadow:
        0 0 0 3px
        rgb(111 140 255 / 20%);
}

.area-imagem {
    position: relative;
    height: 330px;
    background: #252e40;
}

.area-imagem img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.sem-imagem {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    font-size: 55px;
    background: #252e40;
}

.nota {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 7px 9px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    background: rgb(15 20 32 / 88%);
    backdrop-filter: blur(5px);
}

.informacoes {
    padding: 17px;
}

.informacoes h3 {
    overflow: hidden;
    margin: 0 0 7px;
    color: #ffffff;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.categoria {
    margin: 0 0 15px;
    color: #91a6f6;
}

.dados {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    min-height: 22px;
    font-size: 14px;
    color: #aeb8ca;
}

.rodape-cartao {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    margin-top: 17px;
    padding-top: 15px;
    border-top: 1px solid #303a50;
}

.rodape-cartao div {
    display: grid;
    gap: 3px;
}

.rodape-cartao small {
    color: #8e99ac;
}

.rodape-cartao strong {
    color: #ffffff;
}

.estoque {
    padding: 6px 8px;
    border-radius: 7px;
    font-size: 12px;
    color: #b5f3c5;
    background: #193723;
}

.estoque.indisponivel {
    color: #ffb4c0;
    background: #371c25;
}

.estado,
.mensagem-erro,
.estado-vazio {
    padding: 40px;
    text-align: center;
    border-radius: 13px;
}

.estado {
    color: #aeb8ca;
}

.mensagem-erro {
    border: 1px solid #733b47;
    color: #ffb4c0;
    background: #371c25;
}

.estado-vazio {
    border: 1px dashed #39445a;
    color: #aeb8ca;
}

.estado-vazio span {
    font-size: 48px;
}

.estado-vazio h3 {
    margin-bottom: 7px;
    color: #ffffff;
}

.botao-limpar-resultado {
    margin-top: 12px;
    padding: 10px 16px;
    border: 0;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    background: #4e6de6;
}

/* Modal */

.fundo-modal {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 78%);
    backdrop-filter: blur(3px);
}

.modal-filme {
    position: relative;
    width: min(900px, 100%);
    max-height: 90vh;
    overflow: auto;
    border: 1px solid #39445a;
    border-radius: 16px;
    background: #181f2d;
    box-shadow: 0 25px 70px rgb(0 0 0 / 55%);
}

.botao-fechar {
    position: absolute;
    z-index: 2;
    top: 14px;
    right: 14px;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    font-size: 28px;
    line-height: 1;
    color: #ffffff;
    cursor: pointer;
    background: rgb(15 20 32 / 90%);
}

.botao-fechar:hover {
    background: #465166;
}

.modal-conteudo {
    display: grid;
    grid-template-columns: 310px 1fr;
}

.modal-imagem {
    min-height: 470px;
    background: #101521;
}

.modal-imagem img {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 470px;
    object-fit: cover;
}

.modal-informacoes {
    padding: 36px;
}

.modal-informacoes h2 {
    margin: 0 50px 7px 0;
    font-size: 32px;
    color: #ffffff;
}

.modal-categoria {
    margin: 0;
    color: #91a6f6;
}

.modal-dados {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 24px;
    color: #aeb8ca;
}

.modal-sinopse {
    margin-top: 28px;
}

.modal-sinopse h3 {
    margin-bottom: 10px;
    color: #ffffff;
}

.modal-sinopse p {
    margin: 0;
    line-height: 1.7;
    color: #c3cad7;
}

.modal-rodape {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid #303a50;
}

.modal-rodape div {
    display: grid;
    gap: 4px;
}

.modal-rodape small {
    color: #8e99ac;
}

.modal-rodape strong {
    font-size: 22px;
    color: #ffffff;
}

.estoque-modal {
    padding: 8px 10px;
    border-radius: 8px;
    color: #b5f3c5;
    background: #193723;
}

.estoque-modal.indisponivel {
    color: #ffb4c0;
    background: #371c25;
}

.rodape {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 6%;
    border-top: 1px solid #273044;
    color: #8e99ac;
    background: #171d2a;
}

.rodape p {
    margin: 0;
    font-weight: 700;
    color: #ffffff;
}

@media (max-width: 700px) {
    .cabecalho {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .acoes-usuario {
        width: 100%;
        align-items: stretch;
        flex-direction: column;
    }

    .acoes-usuario button {
        width: 100%;
    }

    .nome-usuario {
        margin: 0 0 5px;
    }

    .barra-pesquisa {
        flex-direction: column;
    }

    .barra-pesquisa button {
        width: 100%;
    }

    .modal-conteudo {
        grid-template-columns: 1fr;
    }

    .modal-imagem {
        min-height: 420px;
        max-height: 520px;
    }

    .modal-imagem img {
        min-height: 420px;
        max-height: 520px;
    }

    .modal-informacoes {
        padding: 25px;
    }

    .modal-informacoes h2 {
        font-size: 27px;
    }

    .modal-rodape {
        align-items: flex-start;
        flex-direction: column;
    }

    .rodape {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
    }
}
</style>