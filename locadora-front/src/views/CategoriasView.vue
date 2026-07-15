<script setup>
import {
    onMounted,
    reactive,
    ref
} from "vue";

import { useRouter } from "vue-router";

import categoriaService from "@/services/categoriaService";

const router = useRouter();

const categorias = ref([]);

const carregando = ref(false);
const carregandoLista = ref(false);

const mensagemErro = ref("");
const mensagemSucesso = ref("");

const categoriaEditandoId = ref(null);

const formulario = reactive({
    nome: "",
    descricao: ""
});

function limparFormulario() {
    formulario.nome = "";
    formulario.descricao = "";
    categoriaEditandoId.value = null;
}

async function carregarCategorias() {
    try {
        carregandoLista.value = true;
        mensagemErro.value = "";

        categorias.value =
            await categoriaService.listar();
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar as categorias.";
    } finally {
        carregandoLista.value = false;
    }
}

async function salvarCategoria() {
    mensagemErro.value = "";
    mensagemSucesso.value = "";

    if (!formulario.nome.trim()) {
        mensagemErro.value =
            "O nome da categoria é obrigatório.";

        return;
    }

    const dadosCategoria = {
        nome: formulario.nome.trim(),
        descricao:
            formulario.descricao.trim() || null
    };

    try {
        carregando.value = true;

        let resposta;

        if (categoriaEditandoId.value) {
            resposta =
                await categoriaService.atualizar(
                    categoriaEditandoId.value,
                    dadosCategoria
                );
        } else {
            resposta =
                await categoriaService.cadastrar(
                    dadosCategoria
                );
        }

        mensagemSucesso.value =
            resposta.mensagem;

        limparFormulario();
        await carregarCategorias();
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível salvar a categoria.";
    } finally {
        carregando.value = false;
    }
}

function editarCategoria(categoria) {
    categoriaEditandoId.value =
        categoria.id;

    formulario.nome =
        categoria.nome || "";

    formulario.descricao =
        categoria.descricao || "";

    mensagemErro.value = "";
    mensagemSucesso.value = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function excluirCategoria(categoria) {
    const confirmou = window.confirm(
        `Deseja excluir a categoria "${categoria.nome}"?`
    );

    if (!confirmou) {
        return;
    }

    try {
        mensagemErro.value = "";
        mensagemSucesso.value = "";

        const resposta =
            await categoriaService.excluir(
                categoria.id
            );

        mensagemSucesso.value =
            resposta.mensagem;

        if (
            categoriaEditandoId.value ===
            categoria.id
        ) {
            limparFormulario();
        }

        await carregarCategorias();
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível excluir a categoria.";
    }
}

function cancelarEdicao() {
    limparFormulario();
    mensagemErro.value = "";
    mensagemSucesso.value = "";
}

function voltar() {
    router.push({
        name: "admin-filmes"
    });
}

onMounted(carregarCategorias);
</script>

<template>
    <main class="pagina">
        <header class="cabecalho">
            <div>
                <h1>🎬 Categorias</h1>

                <p>
                    Cadastre e gerencie as categorias
                    dos filmes
                </p>
            </div>

            <button
                type="button"
                class="botao-secundario"
                @click="voltar"
            >
                Voltar
            </button>
        </header>

        <section class="conteudo">
            <form
                class="formulario"
                @submit.prevent="salvarCategoria"
            >
                <h2>
                    {{
                        categoriaEditandoId
                            ? "Editar categoria"
                            : "Adicionar categoria"
                    }}
                </h2>

                <div class="campo">
                    <label for="nome">
                        Nome *
                    </label>

                    <input
                        id="nome"
                        v-model="formulario.nome"
                        type="text"
                        maxlength="100"
                        placeholder="Ex.: Ficção científica"
                        required
                    />
                </div>

                <div class="campo">
                    <label for="descricao">
                        Descrição
                    </label>

                    <textarea
                        id="descricao"
                        v-model="formulario.descricao"
                        rows="4"
                        maxlength="255"
                        placeholder="Descrição da categoria"
                    />
                </div>

                <div
                    v-if="mensagemErro"
                    class="mensagem erro"
                >
                    {{ mensagemErro }}
                </div>

                <div
                    v-if="mensagemSucesso"
                    class="mensagem sucesso"
                >
                    {{ mensagemSucesso }}
                </div>

                <div class="acoes-formulario">
                    <button
                        v-if="categoriaEditandoId"
                        type="button"
                        class="botao-secundario"
                        :disabled="carregando"
                        @click="cancelarEdicao"
                    >
                        Cancelar edição
                    </button>

                    <button
                        type="submit"
                        class="botao-principal"
                        :disabled="carregando"
                    >
                        {{
                            carregando
                                ? "Salvando..."
                                : categoriaEditandoId
                                    ? "Salvar alterações"
                                    : "Adicionar categoria"
                        }}
                    </button>
                </div>
            </form>

            <section class="lista">
                <div class="titulo-lista">
                    <div>
                        <h2>Categorias cadastradas</h2>

                        <p>
                            {{ categorias.length }}
                            categoria(s)
                        </p>
                    </div>
                </div>

                <p
                    v-if="carregandoLista"
                    class="estado"
                >
                    Carregando categorias...
                </p>

                <div
                    v-else-if="categorias.length"
                    class="grade-categorias"
                >
                    <article
                        v-for="categoria in categorias"
                        :key="categoria.id"
                        class="cartao-categoria"
                    >
                        <div>
                            <h3>
                                {{ categoria.nome }}
                            </h3>

                            <p>
                                {{
                                    categoria.descricao ||
                                    "Sem descrição."
                                }}
                            </p>
                        </div>

                        <div class="acoes-categoria">
                            <button
                                type="button"
                                class="botao-editar"
                                title="Editar categoria"
                                @click="editarCategoria(categoria)"
                            >
                                ✏️
                            </button>

                            <button
                                type="button"
                                class="botao-excluir"
                                title="Excluir categoria"
                                @click="excluirCategoria(categoria)"
                            >
                                🗑️
                            </button>
                        </div>
                    </article>
                </div>

                <div
                    v-else
                    class="estado-vazio"
                >
                    <span>📁</span>

                    <h3>
                        Nenhuma categoria cadastrada
                    </h3>

                    <p>
                        Utilize o formulário para adicionar
                        a primeira categoria.
                    </p>
                </div>
            </section>
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
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 28px;
    width: min(1200px, 92%);
    margin: 0 auto;
    padding: 36px 0;
}

.formulario,
.lista {
    padding: 26px;
    border: 1px solid #293247;
    border-radius: 14px;
    background: #181f2d;
}

.formulario {
    align-self: start;
}

.formulario h2,
.lista h2 {
    margin-top: 0;
    color: #ffffff;
}

.campo {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
}

label {
    font-weight: 700;
    color: #dce3ef;
}

input,
textarea {
    width: 100%;
    padding: 12px 13px;
    border: 1px solid #39445a;
    border-radius: 8px;
    outline: none;
    color: #ffffff;
    background: #101521;
}

textarea {
    resize: vertical;
}

input:focus,
textarea:focus {
    border-color: #6f8cff;
    box-shadow:
        0 0 0 3px
        rgb(111 140 255 / 15%);
}

.acoes-formulario {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

button {
    padding: 11px 16px;
    border: 0;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-principal {
    background: #4e6de6;
}

.botao-secundario {
    background: #353e50;
}

button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.mensagem {
    margin-bottom: 14px;
    padding: 12px;
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

.titulo-lista {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.titulo-lista p {
    margin: 5px 0 0;
    color: #9da8bd;
}

.grade-categorias {
    display: grid;
    gap: 13px;
}

.cartao-categoria {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    padding: 17px;
    border: 1px solid #303a50;
    border-radius: 10px;
    background: #111724;
}

.cartao-categoria h3 {
    margin: 0 0 6px;
    color: #ffffff;
}

.cartao-categoria p {
    margin: 0;
    line-height: 1.5;
    color: #aeb8ca;
}

.acoes-categoria {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}

.botao-editar,
.botao-excluir {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    padding: 0;
}

.botao-editar {
    background: #293b7a;
}

.botao-excluir {
    background: #6b2836;
}

.estado,
.estado-vazio {
    padding: 30px;
    text-align: center;
    color: #aeb8ca;
}

.estado-vazio {
    border: 1px dashed #39445a;
    border-radius: 10px;
}

.estado-vazio span {
    font-size: 45px;
}

.estado-vazio h3 {
    color: #ffffff;
}

@media (max-width: 850px) {
    .conteudo {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .cabecalho {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .cartao-categoria {
        align-items: flex-start;
        flex-direction: column;
    }

    .acoes-categoria {
        width: 100%;
    }

    .acoes-categoria button {
        flex: 1;
    }

    .acoes-formulario {
        flex-direction: column-reverse;
    }

    .acoes-formulario button {
        width: 100%;
    }
}
</style>