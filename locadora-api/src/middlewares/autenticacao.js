const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
    const autorizacao = req.headers.authorization;

    if (!autorizacao) {
        return res.status(401).json({
            mensagem: "Token de autenticação não informado."
        });
    }

    const partes = autorizacao.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            mensagem: "Formato do token inválido."
        });
    }

    const token = partes[1];

    try {
        const dadosToken = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        req.usuario = dadosToken;

        return next();
    } catch (erro) {
        if (erro.name === "TokenExpiredError") {
            return res.status(401).json({
                mensagem: "O token de autenticação expirou."
            });
        }

        return res.status(401).json({
            mensagem: "Token de autenticação inválido."
        });
    }
}

module.exports = autenticar;