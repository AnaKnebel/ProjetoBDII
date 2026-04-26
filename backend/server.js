require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connect = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

let db;

// função para acessar coleção
const alunos = () => {
    if (!db) {
        throw new Error("Banco de dados ainda não conectado");
    }
    return db.collection("alunos");
};

async function gerarMatricula() {
    const ultimoAluno = await alunos()
        .find({ matricula: { $exists: true, $ne: null, $ne: "" } })
        .sort({ matricula: -1 })
        .limit(1)
        .toArray();

    if (ultimoAluno.length === 0) {
        return "2023001";
    }

    const ultimaMatricula = parseInt(ultimoAluno[0].matricula, 10);

    if (isNaN(ultimaMatricula)) {
        return "2023001";
    }

    return String(ultimaMatricula + 1);
}

// INSERT - cadastrar aluno novo
app.post("/alunos", async (req, res) => {
    try {
        const { nome, turma, disciplinas } = req.body;

        if (!nome || nome.trim() === "" || !turma || turma.trim() === "" || !disciplinas || Object.keys(disciplinas).length === 0) {
            return res.status(400).json({ mensagem: "Dados inválidos" });
        }

        const nomesDisciplinas = Object.keys(disciplinas);
        const disciplinaInvalida = nomesDisciplinas.some(d => !d || d.trim() === "");
        const notaInvalida = nomesDisciplinas.some(d => disciplinas[d] === null || disciplinas[d] === "" || isNaN(disciplinas[d]));

        if (disciplinaInvalida) {
            return res.status(400).json({ mensagem: "Nome da disciplina inválido" });
        }

        if (notaInvalida) {
            return res.status(400).json({ mensagem: "Nota inválida" });
        }

        const alunoExistente = await alunos().findOne({
            nome: nome.trim()
        });

        if (alunoExistente) {
            return res.status(400).json({ mensagem: "Aluno já cadastrado" });
        }

        const matricula = await gerarMatricula();

        await alunos().insertOne({
            nome: nome.trim(),
            matricula,
            turma: turma.trim(),
            disciplinas
        });

        res.json({
            mensagem: "Aluno cadastrado com sucesso",
            matricula
        });
    } catch (erro) {
        console.error("Erro ao cadastrar aluno:", erro);
        res.status(500).json({ mensagem: "Erro ao cadastrar aluno" });
    }
});

// FIND - pesquisar por turma, nome e disciplina
app.get("/alunos", async (req, res) => {
    try {
        const { turma, nome, disciplina } = req.query;

        const filtro = {
            nome: { $exists: true, $nin: [null, ""] },
            turma: { $exists: true, $nin: [null, ""] },
            disciplinas: { $exists: true, $ne: null }
        };

        if (turma && turma.trim() !== "") {
            filtro.turma = {
                $regex: turma.trim(),
                $options: "i"
            };
        }

        if (nome && nome.trim() !== "") {
            filtro.nome = {
                $regex: nome.trim(),
                $options: "i"
            };
        }

        if (disciplina && disciplina.trim() !== "") {
            filtro[`disciplinas.${disciplina.trim()}`] = { $exists: true };
        }

        const lista = await alunos().find(filtro).toArray();

        const listaLimpa = lista.filter(aluno =>
            aluno &&
            aluno.nome &&
            String(aluno.nome).trim() !== "" &&
            aluno.turma &&
            String(aluno.turma).trim() !== "" &&
            aluno.disciplinas &&
            typeof aluno.disciplinas === "object" &&
            Object.keys(aluno.disciplinas).length > 0
        );

        res.json(listaLimpa);
    } catch (erro) {
        console.error("Erro ao buscar alunos:", erro);
        res.status(500).json({ mensagem: "Erro ao buscar alunos" });
    }
});

// UPDATE - atualizar nota
app.put("/alunos/:nome", async (req, res) => {
    try {
        const nome = req.params.nome;
        const { disciplina, nota } = req.body;

        if (!disciplina || disciplina.trim() === "" || nota === undefined || nota === null || nota === "" || isNaN(nota)) {
            return res.status(400).json({ mensagem: "Disciplina ou nota inválida" });
        }

        const resultado = await alunos().updateOne(
            { nome },
            { $set: { [`disciplinas.${disciplina.trim()}`]: Number(nota) } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ mensagem: "Aluno não encontrado" });
        }

        res.json({ mensagem: "Nota atualizada com sucesso" });
    } catch (erro) {
        console.error("Erro ao atualizar nota:", erro);
        res.status(500).json({ mensagem: "Erro ao atualizar nota" });
    }
});

// UPDATE - adicionar disciplina para aluno existente
app.patch("/alunos/:nome/disciplina", async (req, res) => {
    try {
        const nome = req.params.nome;
        const { disciplina, nota } = req.body;

        if (!disciplina || disciplina.trim() === "" || nota === undefined || nota === null || nota === "" || isNaN(nota)) {
            return res.status(400).json({ mensagem: "Disciplina ou nota inválida" });
        }

        const resultado = await alunos().updateOne(
            { nome },
            { $set: { [`disciplinas.${disciplina.trim()}`]: Number(nota) } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ mensagem: "Aluno não encontrado" });
        }

        res.json({ mensagem: "Disciplina adicionada com sucesso" });
    } catch (erro) {
        console.error("Erro ao adicionar disciplina:", erro);
        res.status(500).json({ mensagem: "Erro ao adicionar disciplina" });
    }
});

// DELETE - remover aluno
app.delete("/alunos/:nome", async (req, res) => {
    try {
        const resultado = await alunos().deleteOne({ nome: req.params.nome });

        if (resultado.deletedCount === 0) {
            return res.status(404).json({ mensagem: "Aluno não encontrado" });
        }

        res.json({ mensagem: "Aluno removido com sucesso" });
    } catch (erro) {
        console.error("Erro ao remover aluno:", erro);
        res.status(500).json({ mensagem: "Erro ao remover aluno" });
    }
});

// DELETE - remover disciplina do aluno
app.delete("/alunos/:nome/disciplina/:disciplina", async (req, res) => {
    try {
        const nome = req.params.nome;
        const disciplina = req.params.disciplina;

        if (!disciplina || disciplina.trim() === "") {
            return res.status(400).json({ mensagem: "Disciplina inválida" });
        }

        const resultado = await alunos().updateOne(
            { nome },
            { $unset: { [`disciplinas.${disciplina}`]: "" } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ mensagem: "Aluno não encontrado" });
        }

        res.json({ mensagem: "Disciplina removida com sucesso" });
    } catch (erro) {
        console.error("Erro ao remover disciplina:", erro);
        res.status(500).json({ mensagem: "Erro ao remover disciplina" });
    }
});

// AGGREGATE - média por disciplina
app.get("/media", async (req, res) => {
    try {
        const resultado = await alunos().aggregate([
            {
                $match: {
                    disciplinas: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    disciplinasArray: { $objectToArray: "$disciplinas" }
                }
            },
            { $unwind: "$disciplinasArray" },
            {
                $project: {
                    disciplina: { $trim: { input: "$disciplinasArray.k" } },
                    nota: "$disciplinasArray.v"
                }
            },
            {
                $match: {
                    disciplina: { $nin: ["", null] },
                    nota: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$disciplina",
                    media: { $avg: "$nota" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        res.json(resultado);
    } catch (erro) {
        console.error("Erro na rota /media:", erro);
        res.status(500).json({ mensagem: "Erro ao calcular médias" });
    }
});

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        db = await connect();
        console.log("Banco conectado com sucesso");

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (erro) {
        console.error("Erro ao conectar no MongoDB:", erro);
        process.exit(1);
    }
}

iniciarServidor();