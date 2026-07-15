const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const banco = require("../config/banco");

function validarEmail(email) {
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}

function validarCadastro(nome, email, senha) {
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
        return "O nome é obrigatório.";
    }

    if (nome.trim().length > 100) {
        return "O nome deve possuir no máximo 100 caracteres.";
    }

    if (!email || typeof email !== "string") {
        return "O e-mail é obrigatório.";
    }

    if (!validarEmail(email.trim())) {
        return "O e-mail informado é inválido.";
    }

    if (email.trim().length > 150) {
        return "O e-mail deve possuir no máximo 150 caracteres.";
    }

    if (!senha || typeof senha !== "string") {
        return "A senha é obrigatória.";
    }

    if (senha.length < 8) {
        return "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (Buffer.byteLength(senha, "utf8") > 72) {
        return "A senha informada é muito longa.";
    }

    return null;
}

async function cadastrarUsuario(req, res) {
    const { nome, email, senha } = req.body;

    const erroValidacao = validarCadastro(nome, email, senha);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    const nomeTratado = nome.trim();
    const emailTratado = email.trim().toLowerCase();

    try {
        const [usuariosExistentes] = await banco.execute(
            `
                SELECT id
                FROM usuarios
                WHERE email = ?
            `,
            [emailTratado]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um usuário cadastrado com esse e-mail."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const [resultado] = await banco.execute(
            `
                INSERT INTO usuarios
                (
                    nome,
                    email,
                    senha_hash
                )
                VALUES (?, ?, ?)
            `,
            [
                nomeTratado,
                emailTratado,
                senhaHash
            ]
        );

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso.",
            usuario: {
                id: resultado.insertId,
                nome: nomeTratado,
                email: emailTratado
            }
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um usuário cadastrado com esse e-mail."
            });
        }

        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível cadastrar o usuário."
        });
    }
}

async function realizarLogin(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: "E-mail e senha são obrigatórios."
        });
    }

    if (typeof email !== "string" || typeof senha !== "string") {
        return res.status(400).json({
            mensagem: "E-mail ou senha inválidos."
        });
    }

    const emailTratado = email.trim().toLowerCase();

    try {
        const [usuarios] = await banco.execute(
            `
                SELECT
                    id,
                    nome,
                    email,
                    senha_hash
                FROM usuarios
                WHERE email = ?
            `,
            [emailTratado]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            });
        }

        const usuario = usuarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            });
        }

        const token = jwt.sign(
            {
                nome: usuario.nome,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            {
                subject: String(usuario.id),
                expiresIn: process.env.JWT_EXPIRES_IN || "2h",
                algorithm: "HS256"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível realizar o login."
        });
    }
}

async function consultarPerfil(req, res) {
    const usuarioId = Number(req.usuario.sub);

    try {
        const [usuarios] = await banco.execute(
            `
                SELECT
                    id,
                    nome,
                    email,
                    criado_em AS criadoEm
                FROM usuarios
                WHERE id = ?
            `,
            [usuarioId]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json(usuarios[0]);
    } catch (erro) {
        console.error("Erro ao consultar perfil:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível consultar o perfil."
        });
    }
}

module.exports = {
    cadastrarUsuario,
    realizarLogin,
    consultarPerfil
};