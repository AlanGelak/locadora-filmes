<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref
} from "vue";

import {
    useRoute,
    useRouter
} from "vue-router";

import categoriaService from "@/services/categoriaService";
import filmeService from "@/services/filmeService";
import { API_ORIGIN } from "@/services/api";

const route = useRoute();
const router = useRouter();

const modoEdicao = computed(() => {
    return Boolean(route.params.id);
});

const categorias = ref([]);

const imagemSelecionada = ref(null);
const imagemPreview = ref(null);
const imagemTemporaria = ref(null);

const carregando = ref(false);
const carregandoDados = ref(false);
const carregandoCategorias = ref(false);

const mensagemErro = ref("");
const mensagemSucesso = ref("");

const formulario = reactive({
    titulo: "",
    sinopse: "",
    ano: "",
    duracaoMinutos: "",
    nota: 0,
    quantidadeEstoque: 0,
    valorLocacao: 0,
    categoriaId: ""
});

async function carregarCategorias() {
    try {
        carregandoCategorias.value = true;

        categorias.value =
            await categoriaService.listar();
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar as categorias.";
    } finally {
        carregandoCategorias.value = false;
    }
}

async function carregarFilme() {
    if (!modoEdicao.value) {
        return;
    }

    try {
        carregandoDados.value = true;
        mensagemErro.value = "";

        const filme =
            await filmeService.buscarPorId(
                route.params.id
            );

        formulario.titulo =
            filme.titulo ?? "";

        formulario.sinopse =
            filme.sinopse ?? "";

        formulario.ano =
            filme.ano ?? "";

        formulario.duracaoMinutos =
            filme.duracaoMinutos ?? "";

        formulario.nota =
            filme.nota ?? 0;

        formulario.quantidadeEstoque =
            filme.quantidadeEstoque ?? 0;

        formulario.valorLocacao =
            filme.valorLocacao ?? 0;

        formulario.categoriaId =
            filme.categoriaId ?? "";

        if (filme.imagemUrl) {
            imagemPreview.value =
                `${API_ORIGIN}${filme.imagemUrl}`;
        }
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível carregar o filme.";
    } finally {
        carregandoDados.value = false;
    }
}

function selecionarImagem(evento) {
    const arquivo =
        evento.target.files?.[0];

    imagemSelecionada.value =
        arquivo || null;

    if (imagemTemporaria.value) {
        URL.revokeObjectURL(
            imagemTemporaria.value
        );
    }

    imagemTemporaria.value = arquivo
        ? URL.createObjectURL(arquivo)
        : null;

    if (imagemTemporaria.value) {
        imagemPreview.value =
            imagemTemporaria.value;
    }
}

function montarDadosFormulario() {
    const dados = new FormData();

    dados.append(
        "titulo",
        formulario.titulo.trim()
    );

    dados.append(
        "sinopse",
        formulario.sinopse.trim()
    );

    dados.append(
        "ano",
        formulario.ano
    );

    dados.append(
        "duracaoMinutos",
        formulario.duracaoMinutos
    );

    dados.append(
        "nota",
        formulario.nota
    );

    dados.append(
        "quantidadeEstoque",
        formulario.quantidadeEstoque
    );

    dados.append(
        "valorLocacao",
        formulario.valorLocacao
    );

    dados.append(
        "categoriaId",
        formulario.categoriaId
    );

    if (imagemSelecionada.value) {
        dados.append(
            "imagem",
            imagemSelecionada.value
        );
    }

    return dados;
}

async function salvarFilme() {
    mensagemErro.value = "";
    mensagemSucesso.value = "";

    if (!formulario.titulo.trim()) {
        mensagemErro.value =
            "O título do filme é obrigatório.";

        return;
    }

    try {
        carregando.value = true;

        const dados =
            montarDadosFormulario();

        let resposta;

        if (modoEdicao.value) {
            resposta =
                await filmeService.atualizar(
                    route.params.id,
                    dados
                );
        } else {
            resposta =
                await filmeService.cadastrar(
                    dados
                );
        }

        mensagemSucesso.value =
            resposta.mensagem ||
            (
                modoEdicao.value
                    ? "Filme atualizado com sucesso."
                    : "Filme cadastrado com sucesso."
            );

        const filmeId =
            resposta.filme?.id ||
            route.params.id;

        setTimeout(() => {
            router.push({
                name: "detalhes-filme",
                params: {
                    id: filmeId
                }
            });
        }, 700);
    } catch (erro) {
        mensagemErro.value =
            erro.response?.data?.mensagem ||
            "Não foi possível salvar o filme.";
    } finally {
        carregando.value = false;
    }
}

function voltar() {
    if (modoEdicao.value) {
        router.push({
            name: "detalhes-filme",
            params: {
                id: route.params.id
            }
        });

        return;
    }

    router.push({
        name: "admin-filmes"
    });
}

onMounted(async () => {
    await Promise.all([
        carregarCategorias(),
        carregarFilme()
    ]);
});

onBeforeUnmount(() => {
    if (imagemTemporaria.value) {
        URL.revokeObjectURL(
            imagemTemporaria.value
        );
    }
});
</script>

<template>
    <main class="pagina">
        <header class="cabecalho">
            <div>
                <h1>
                    🎬
                    {{
                        modoEdicao
                            ? "Editar filme"
                            : "Adicionar filme"
                    }}
                </h1>

                <p>
                    {{
                        modoEdicao
                            ? "Altere as informações do filme"
                            : "Cadastre um filme manualmente"
                    }}
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
            <div
                v-if="carregandoDados"
                class="estado-carregamento"
            >
                Carregando dados do filme...
            </div>

            <form
                v-else
                class="formulario"
                @submit.prevent="salvarFilme"
            >
                <div class="coluna-formulario">
                    <div class="campo">
                        <label for="titulo">
                            Título *
                        </label>

                        <input
                            id="titulo"
                            v-model="formulario.titulo"
                            type="text"
                            maxlength="200"
                            placeholder="Ex.: Matrix"
                            required
                        />
                    </div>

                    <div class="campo">
                        <label for="sinopse">
                            Sinopse
                        </label>

                        <textarea
                            id="sinopse"
                            v-model="formulario.sinopse"
                            rows="6"
                            placeholder="Digite a sinopse do filme"
                        />
                    </div>

                    <div class="grade-campos">
                        <div class="campo">
                            <label for="ano">
                                Ano
                            </label>

                            <input
                                id="ano"
                                v-model="formulario.ano"
                                type="number"
                                min="1"
                                max="65535"
                                placeholder="1999"
                            />
                        </div>

                        <div class="campo">
                            <label for="duracao">
                                Duração em minutos
                            </label>

                            <input
                                id="duracao"
                                v-model="formulario.duracaoMinutos"
                                type="number"
                                min="1"
                                max="65535"
                                placeholder="136"
                            />
                        </div>

                        <div class="campo">
                            <label for="nota">
                                Nota
                            </label>

                            <input
                                id="nota"
                                v-model="formulario.nota"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                            />
                        </div>

                        <div class="campo">
                            <label for="estoque">
                                Quantidade em estoque
                            </label>

                            <input
                                id="estoque"
                                v-model="formulario.quantidadeEstoque"
                                type="number"
                                min="0"
                            />
                        </div>

                        <div class="campo">
                            <label for="valor">
                                Valor da locação
                            </label>

                            <input
                                id="valor"
                                v-model="formulario.valorLocacao"
                                type="number"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div class="campo">
                            <label for="categoria">
                                Categoria
                            </label>

                            <select
                                id="categoria"
                                v-model="formulario.categoriaId"
                                :disabled="carregandoCategorias"
                            >
                                <option value="">
                                    Sem categoria
                                </option>

                                <option
                                    v-for="categoria in categorias"
                                    :key="categoria.id"
                                    :value="categoria.id"
                                >
                                    {{ categoria.nome }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <aside class="coluna-imagem">
                    <label
                        for="imagem"
                        class="titulo-imagem"
                    >
                        Capa do filme
                    </label>

                    <div class="preview-imagem">
                        <img
                            v-if="imagemPreview"
                            :src="imagemPreview"
                            alt="Pré-visualização da capa do filme"
                        />

                        <div
                            v-else
                            class="sem-imagem"
                        >
                            <span>🎞️</span>

                            <p>
                                Nenhuma imagem selecionada
                            </p>
                        </div>
                    </div>

                    <input
                        id="imagem"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        @change="selecionarImagem"
                    />

                    <small>
                        JPG, PNG ou WEBP. Máximo de 5 MB.
                    </small>

                    <small v-if="modoEdicao">
                        Se nenhuma nova imagem for selecionada,
                        a capa atual será mantida.
                    </small>
                </aside>

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

                <div class="acoes">
                    <button
                        type="button"
                        class="botao-secundario"
                        :disabled="carregando"
                        @click="voltar"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="botao-principal"
                        :disabled="
                            carregando ||
                            carregandoDados
                        "
                    >
                        {{
                            carregando
                                ? "Salvando..."
                                : modoEdicao
                                    ? "Salvar alterações"
                                    : "Salvar filme"
                        }}
                    </button>
                </div>
            </form>
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
    padding: 36px 0;
}

.estado-carregamento {
    padding: 40px;
    border: 1px solid #293247;
    border-radius: 14px;
    text-align: center;
    color: #aeb8ca;
    background: #181f2d;
}

.formulario {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 28px;
    padding: 28px;
    border: 1px solid #293247;
    border-radius: 14px;
    background: #181f2d;
}

.grade-campos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
}

.campo {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
}

label,
.titulo-imagem {
    font-weight: 700;
    color: #dce3ef;
}

input,
textarea,
select {
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
textarea:focus,
select:focus {
    border-color: #6f8cff;
    box-shadow:
        0 0 0 3px
        rgb(111 140 255 / 15%);
}

select:disabled {
    cursor: wait;
    opacity: 0.6;
}

.coluna-imagem {
    display: flex;
    flex-direction: column;
    gap: 13px;
}

.preview-imagem {
    overflow: hidden;
    height: 390px;
    border: 1px dashed #46516a;
    border-radius: 12px;
    background: #101521;
}

.preview-imagem img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.sem-imagem {
    display: grid;
    place-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
    color: #9da8bd;
}

.sem-imagem span {
    font-size: 52px;
}

.sem-imagem p {
    margin: 10px 0 0;
}

small {
    line-height: 1.4;
    color: #9da8bd;
}

.acoes,
.mensagem {
    grid-column: 1 / -1;
}

.acoes {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #293247;
}

button {
    padding: 11px 18px;
    border: 0;
    border-radius: 8px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.botao-principal {
    background: #4e6de6;
}

.botao-principal:hover {
    background: #607df0;
}

.botao-secundario {
    background: #353e50;
}

.botao-secundario:hover {
    background: #465166;
}

button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.mensagem {
    padding: 13px;
    border-radius: 8px;
}

.erro {
    border: 1px solid #733b47;
    color: #ffb4c0;
    background: #371c25;
}

.sucesso {
    border: 1px solid #38764b;
    color: #b5f3c5;
    background: #193723;
}

@media (max-width: 800px) {
    .cabecalho {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .formulario {
        grid-template-columns: 1fr;
    }

    .grade-campos {
        grid-template-columns: 1fr;
    }

    .preview-imagem {
        height: 430px;
    }

    .acoes {
        flex-direction: column-reverse;
    }

    .acoes button {
        width: 100%;
    }
}
</style>