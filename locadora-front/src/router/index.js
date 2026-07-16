import {
    createRouter,
    createWebHistory
} from "vue-router";

import authService from "@/services/authService";

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL
    ),

    routes: [
        {
            path: "/",
            name: "home",
            component: () =>
                import("@/views/HomeView.vue")
        },

        {
            path: "/login",
            name: "login",
            component: () =>
                import("@/views/LoginView.vue"),

            meta: {
                somenteVisitante: true
            }
        },

        {
            path: "/cadastro",
            name: "cadastro",
            component: () =>
                import("@/views/CadastroView.vue"),

            meta: {
                somenteVisitante: true
            }
        },

        {
            path: "/admin/filmes",
            name: "admin-filmes",
            component: () =>
                import("@/views/FilmesView.vue"),

            meta: {
                requerAdmin: true
            }
        },

        {
            path: "/admin/categorias",
            name: "categorias",
            component: () =>
                import("@/views/CategoriasView.vue"),

            meta: {
                requerAdmin: true
            }
        },

        {
            path: "/admin/filmes/novo",
            name: "novo-filme",
            component: () =>
                import(
                    "@/views/FilmeFormularioView.vue"
                ),

            meta: {
                requerAdmin: true
            }
        },

        {
            path: "/admin/filmes/:id/editar",
            name: "editar-filme",
            component: () =>
                import(
                    "@/views/FilmeFormularioView.vue"
                ),

            meta: {
                requerAdmin: true
            }
        },

        {
            path: "/admin/filmes/:id",
            name: "detalhes-filme",
            component: () =>
                import(
                    "@/views/FilmeDetalhesView.vue"
                ),

            meta: {
                requerAdmin: true
            }
        },

        {
            path: "/:caminhoNaoEncontrado(.*)*",
            redirect: "/"
        }
    ]
});

router.beforeEach((rotaDestino) => {
    const autenticado =
        authService.estaAutenticado();

    const administrador =
        authService.ehAdmin();

    /*
     * Protege as páginas administrativas.
     */
    if (rotaDestino.meta.requerAdmin) {
        /*
         * Sem login, envia para a tela de login.
         */
        if (!autenticado) {
            return {
                name: "login"
            };
        }

        /*
         * Está logado, mas não é admin:
         * volta para a Home.
         */
        if (!administrador) {
            return {
                name: "home"
            };
        }
    }

    /*
     * Impede usuário logado de voltar
     * para login ou cadastro.
     */
    if (
        rotaDestino.meta.somenteVisitante &&
        autenticado
    ) {
        /*
         * Admin volta ao painel.
         */
        if (administrador) {
            return {
                name: "admin-filmes"
            };
        }

        /*
         * Usuário comum volta à Home.
         */
        return {
            name: "home"
        };
    }

    return true;
});

export default router;