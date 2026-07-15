require("dotenv").config();

const express = require("express");
const cors = require("cors");

const statusRoutes = require("./src/routes/statusRoutes");
const authRoutes = require("./src/routes/authRoutes");
const categoriaRoutes = require("./src/routes/categoriaRoutes");
const filmeRoutes = require("./src/routes/filmeRoutes");
const tmdbRoutes = require("./src/routes/tmdbRoutes");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    return res.status(200).json({
        mensagem: "Bem-vindo à API da Locadora de Filmes."
    });
});

app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/filmes", filmeRoutes);
app.use("/api/tmdb", tmdbRoutes);

app.use((req, res) => {
    return res.status(404).json({
        mensagem: "Rota não encontrada."
    });
});

app.use((erro, req, res, next) => {
    console.error("Erro interno da API:", erro);

    return res.status(500).json({
        mensagem: "Ocorreu um erro interno na API."
    });
});

const porta = Number(process.env.PORT) || 3000;

app.listen(porta, () => {
    console.log("----------------------------------------");
    console.log("API da Locadora iniciada com sucesso.");
    console.log(`Endereço: http://localhost:${porta}`);
    console.log("----------------------------------------");
});