const { MongoClient } = require('mongodb');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const url = 'mongodb://localhost:27017'; 
const client = new MongoClient(url);
const dbName = 'alunos'; 

async function iniciarProjeto() {
    try {
        await client.connect();
        console.log("✅ Conectado ao MongoDB!");
        const db = client.db(dbName);
        const colecao = db.collection('alunos');

        // ROTA PARA CARREGAR O SITE
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // 1. [FIND] - Buscar por turma
        app.get('/buscar/:turma', async (req, res) => {
            const resultados = await colecao.find({ turma: req.params.turma }).toArray();
            res.json(resultados);
        });

        // 2. [INSERT] - Cadastrar novo aluno
        app.post('/cadastrar', async (req, res) => {
            const novoAluno = req.body;
            await colecao.insertOne(novoAluno);
            res.json({ mensagem: "Aluno cadastrado com sucesso!" });
        });

        // 3. [UPDATE] - Atualizar nota de um aluno
        app.put('/atualizar-nota', async (req, res) => {
            const { matricula, novaNota } = req.body;
            await colecao.updateOne(
                { matricula: matricula },
                { $set: { "disciplinas.Banco de Dados": parseFloat(novaNota) } }
            );
            res.json({ mensagem: "Nota de BD atualizada!" });
        });

        // 4. [DELETE] - Remover aluno pela matrícula
        app.delete('/remover/:matricula', async (req, res) => {
            await colecao.deleteOne({ matricula: req.params.matricula });
            res.json({ mensagem: "Aluno removido do sistema!" });
        });

        // 5. [AGGREGATE] - Calcular média da turma em Banco de Dados
        app.get('/media-bd', async (req, res) => {
            const pipeline = [
                { $group: { _id: null, mediaGeral: { $avg: "$disciplinas.Banco de Dados" } } }
            ];
            const resultado = await colecao.aggregate(pipeline).toArray();
            res.json(resultado);
        });

        // Inicia o servidor e NÃO deixa o processo fechar
        app.listen(3000, () => {
            console.log("🚀 SERVIDOR ATIVO!");
            console.log("Acesse: http://localhost:3000");
        });

    } catch (err) {
        console.error("❌ Erro ao conectar:", err.message);
    }
}

iniciarProjeto();