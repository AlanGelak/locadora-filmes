const banco = require("../config/banco");

async function verificarApi(req, res) {
    return res.status(200).json({
        api: "online",
        mensagem: "API da locadora está funcionando.",
        dataHora: new Date()
    });
}

async function verificarBanco(req, res) {
    try {
        const [resultado] = await banco.execute(`
            SELECT
                DATABASE() AS banco,
                NOW() AS dataHora
        `);

        return res.status(200).json({
            api: "online",
            banco: "online",
            mensagem: "Conexão com o MySQL realizada com sucesso.",
            dados: resultado[0]
        });
    } catch (erro) {
        console.error("Erro ao conectar com o banco:", erro);

        return res.status(500).json({
            api: "online",
            banco: "offline",
            mensagem: "Não foi possível conectar com o MySQL.",
            erro: erro.message
        });
    }
}

module.exports = {
    verificarApi,
    verificarBanco
};