import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:3000/api",

    timeout: 15000
});

api.interceptors.request.use(
    (configuracao) => {
        const token = localStorage.getItem("token");

        if (token) {
            configuracao.headers =
                configuracao.headers || {};

            configuracao.headers.Authorization =
                `Bearer ${token}`;
        }

        return configuracao;
    },
    (erro) => {
        return Promise.reject(erro);
    }
);

export const API_ORIGIN = new URL(
    api.defaults.baseURL
).origin;

export default api;