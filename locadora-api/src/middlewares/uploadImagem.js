const multer = require("multer");

const armazenamento = multer.memoryStorage();

const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const upload = multer({
    storage: armazenamento,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, callback) => {
        if (!tiposPermitidos.includes(file.mimetype)) {
            return callback(
                new Error(
                    "Formato de imagem inválido. Use JPG, PNG ou WEBP."
                )
            );
        }

        return callback(null, true);
    }
});

function processarImagem(req, res, next) {
    upload.single("imagem")(req, res, (erro) => {
        if (!erro) {
            return next();
        }

        if (erro instanceof multer.MulterError) {
            if (erro.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    mensagem: "A imagem deve possuir no máximo 5 MB."
                });
            }

            return res.status(400).json({
                mensagem: "Não foi possível processar a imagem.",
                erro: erro.message
            });
        }

        return res.status(400).json({
            mensagem: erro.message
        });
    });
}

module.exports = processarImagem;