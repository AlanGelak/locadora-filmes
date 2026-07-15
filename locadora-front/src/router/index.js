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
            path: "/admin/filmes",
            name: "admin-filmes",
            component: () =>
                import("@/views/FilmesView.vue"),

            meta: {
                requerAutenticacao: true
            }
        },
        {
            path: "/admin/categorias",
            name: "categorias",
            component: () =>
                import("@/views/CategoriasView.vue"),

            meta: {
                requerAutenticacao: true
            }
        },
        {
            path: "/admin/filmes/novo",
            name: "novo-filme",
            component: () =>
                import("@/views/FilmeFormularioView.vue"),

            meta: {
                requerAutenticacao: true
            }
        },
        {
            path: "/admin/filmes/:id/editar",
            name: "editar-filme",
            component: () =>
                import("@/views/FilmeFormularioView.vue"),

            meta: {
                requerAutenticacao: true
            }
        },
        {
            path: "/admin/filmes/:id",
            name: "detalhes-filme",
            component: () =>
                import("@/views/FilmeDetalhesView.vue"),

            meta: {
                requerAutenticacao: true
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

    if (
        rotaDestino.meta.requerAutenticacao &&
        !autenticado
    ) {
        return {
            name: "login"
        };
    }

    if (
        rotaDestino.meta.somenteVisitante &&
        autenticado
    ) {
        return {
            name: "admin-filmes"
        };
    }

    return true;
});

export default router;