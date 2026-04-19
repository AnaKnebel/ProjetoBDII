const API = "http://localhost:3000";

let acaoConfirmada = {
    tipo: null,
    nome: "",
    disciplina: ""
};

let contextoEdicao = {
    nome: "",
    disciplina: "",
    notaAtual: 0
};

// ABAS
function abrirAba(nomeAba, botaoClicado) {
    const abas = document.querySelectorAll(".aba");
    abas.forEach(aba => aba.classList.remove("ativa"));

    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => tab.classList.remove("active"));

    document.getElementById(nomeAba).classList.add("ativa");
    botaoClicado.classList.add("active");
}

// TOASTS
function mostrarToast(mensagem, tipo = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("sumir");
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// LIMPEZA
function limparCamposCadastro() {
    document.getElementById("nome").value = "";
    document.getElementById("turma").value = "";
    document.getElementById("disciplina").value = "";
    document.getElementById("nota").value = "";
}

function limparPesquisa() {
    document.getElementById("filtroTurma").value = "";
    document.getElementById("filtroNome").value = "";
    document.getElementById("filtroDisciplina").value = "";
    pesquisar();
}

// MODAL DE CONFIRMAÇÃO
function abrirModalExcluirAluno(nome) {
    acaoConfirmada = {
        tipo: "aluno",
        nome,
        disciplina: ""
    };

    document.getElementById("confirmTitle").textContent = "Confirmar exclusão";
    document.getElementById("confirmMessage").textContent =
        `Deseja realmente excluir o aluno ${nome}?`;

    document.getElementById("confirmModal").classList.add("show");
}

function abrirModalExcluirDisciplina(nome, disciplina) {
    acaoConfirmada = {
        tipo: "disciplina",
        nome,
        disciplina
    };

    document.getElementById("confirmTitle").textContent = "Confirmar exclusão";
    document.getElementById("confirmMessage").textContent =
        `Deseja realmente excluir a disciplina ${disciplina} do aluno ${nome}?`;

    document.getElementById("confirmModal").classList.add("show");
}

function fecharModalConfirmacao() {
    acaoConfirmada = {
        tipo: null,
        nome: "",
        disciplina: ""
    };

    document.getElementById("confirmModal").classList.remove("show");
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    if (!acaoConfirmada.tipo) return;

    const { tipo, nome, disciplina } = acaoConfirmada;
    fecharModalConfirmacao();

    try {
        if (tipo === "aluno") {
            const res = await fetch(`${API}/alunos/${encodeURIComponent(nome)}`, {
                method: "DELETE"
            });

            const dados = await res.json();

            if (!res.ok) {
                mostrarToast(dados.mensagem || "Erro ao remover aluno", "erro");
                return;
            }

            mostrarToast(dados.mensagem || "Aluno removido com sucesso", "sucesso");
            pesquisar();
            return;
        }

        if (tipo === "disciplina") {
            const res = await fetch(
                `${API}/alunos/${encodeURIComponent(nome)}/disciplina/${encodeURIComponent(disciplina)}`,
                { method: "DELETE" }
            );

            const dados = await res.json();

            if (!res.ok) {
                mostrarToast(dados.mensagem || "Erro ao excluir disciplina", "erro");
                return;
            }

            mostrarToast(dados.mensagem || "Disciplina removida com sucesso", "sucesso");
            pesquisar();
        }
    } catch (erro) {
        mostrarToast("Erro ao conectar com o servidor", "erro");
    }
});

// MODAL EDIÇÃO
function abrirModalEdicao(nome, disciplina, notaAtual) {
    contextoEdicao = { nome, disciplina, notaAtual };

    document.getElementById("editInfo").textContent =
        `${nome} • ${disciplina}`;

    document.getElementById("editNotaInput").value = notaAtual;
    document.getElementById("editModal").classList.add("show");
}

function fecharModalEdicao() {
    document.getElementById("editModal").classList.remove("show");
    contextoEdicao = {
        nome: "",
        disciplina: "",
        notaAtual: 0
    };
}

async function salvarEdicaoNota() {
    const novaNota = document.getElementById("editNotaInput").value.trim();

    if (novaNota === "" || isNaN(novaNota) || Number(novaNota) < 0 || Number(novaNota) > 10) {
        mostrarToast("Digite uma nota válida entre 0 e 10", "aviso");
        return;
    }

    try {
        const res = await fetch(`${API}/alunos/${encodeURIComponent(contextoEdicao.nome)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                disciplina: contextoEdicao.disciplina,
                nota: Number(novaNota)
            })
        });

        const dados = await res.json();

        if (!res.ok) {
            mostrarToast(dados.mensagem || "Erro ao atualizar nota", "erro");
            return;
        }

        fecharModalEdicao();
        mostrarToast(dados.mensagem || "Nota atualizada com sucesso", "sucesso");
        pesquisar();
    } catch (erro) {
        mostrarToast("Erro ao conectar com o servidor", "erro");
    }
}

// SVG ÍCONES
function iconeLapis() {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
    `;
}

function iconeLixeira() {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18"/>
            <path d="M8 6V4h8v2"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
        </svg>
    `;
}

function iconeExcluirDisciplina() {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
        </svg>
    `;
}

// PESQUISA
async function pesquisar() {
    const inputTurma = document.getElementById("filtroTurma");
    const inputNome = document.getElementById("filtroNome");
    const inputDisciplina = document.getElementById("filtroDisciplina");

    const turma = inputTurma.value.trim();
    const nome = inputNome.value.trim();
    const disciplina = inputDisciplina.value.trim();

    const params = new URLSearchParams();

    if (turma) params.append("turma", turma);
    if (nome) params.append("nome", nome);
    if (disciplina) params.append("disciplina", disciplina);

    let url = `${API}/alunos`;
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    try {
        const res = await fetch(url);
        const dados = await res.json();

        if (!res.ok) {
            mostrarToast(dados.mensagem || "Erro ao buscar alunos", "erro");
            return;
        }

        renderizarAlunos(dados, disciplina);

        inputTurma.value = "";
        inputNome.value = "";
        inputDisciplina.value = "";
    } catch (erro) {
        mostrarToast("Erro ao conectar com o servidor", "erro");
    }
}

function renderizarAlunos(listaAlunos, disciplinaFiltro = "") {
    const container = document.getElementById("resultadoPesquisa");
    container.innerHTML = "";

    if (!listaAlunos || listaAlunos.length === 0) {
        container.innerHTML = `<div class="mensagem-vazia">Nenhum aluno encontrado.</div>`;
        return;
    }

    listaAlunos.forEach(aluno => {
        if (
            !aluno ||
            !aluno.nome ||
            String(aluno.nome).trim() === "" ||
            !aluno.turma ||
            String(aluno.turma).trim() === "" ||
            !aluno.disciplinas ||
            typeof aluno.disciplinas !== "object"
        ) {
            return;
        }

        const card = document.createElement("div");
        card.className = "card";

        let disciplinasHTML = "";
        let disciplinasParaMostrar = [];

        if (disciplinaFiltro) {
            const disciplinaEncontrada = Object.keys(aluno.disciplinas).find(
                d => d.toLowerCase() === disciplinaFiltro.toLowerCase()
            );

            if (disciplinaEncontrada) {
                disciplinasParaMostrar.push(disciplinaEncontrada);
            }
        } else {
            disciplinasParaMostrar = Object.keys(aluno.disciplinas);
        }

        disciplinasParaMostrar.forEach(disciplina => {
            const nota = aluno.disciplinas[disciplina];

            let classeNota = "";
            if (nota >= 7) classeNota = "nota-alta";
            else if (nota >= 5) classeNota = "nota-media";
            else classeNota = "nota-baixa";

            disciplinasHTML += `
                <div class="linha-disciplina">
                    <span class="disciplina-info">
                        <strong>${disciplina}</strong>
                        <span class="${classeNota}">${nota}</span>
                    </span>

                    <div class="acoes-disciplina">
                        <button class="icon-btn" onclick="abrirModalEdicao('${escapeAspas(aluno.nome)}', '${escapeAspas(disciplina)}', ${nota})" title="Editar nota">
                            ${iconeLapis()}
                        </button>

                        <button class="icon-btn danger-soft" onclick="abrirModalExcluirDisciplina('${escapeAspas(aluno.nome)}', '${escapeAspas(disciplina)}')" title="Excluir disciplina">
                            ${iconeExcluirDisciplina()}
                        </button>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="card-topo">
                <div class="card-titulo">
                    <h3>${aluno.nome}</h3>
                    <p>Turma: ${aluno.turma}</p>
                </div>

                <button class="icon-btn danger" onclick="abrirModalExcluirAluno('${escapeAspas(aluno.nome)}')" title="Excluir aluno">
                    ${iconeLixeira()}
                </button>
            </div>

            <div class="disciplinas">
                ${disciplinasHTML}
            </div>
        `;

        container.appendChild(card);
    });
}

function escapeAspas(texto) {
    return texto.replace(/'/g, "\\'");
}

// INSERT
async function addAluno() {
    const nome = document.getElementById("nome").value.trim();
    const turma = document.getElementById("turma").value.trim();
    const disciplina = document.getElementById("disciplina").value.trim();
    const nota = parseFloat(document.getElementById("nota").value);

    if (!nome || !turma || !disciplina || isNaN(nota) || nota < 0 || nota > 10) {
        mostrarToast("Preencha nome, turma, disciplina e uma nota entre 0 e 10", "aviso");
        return;
    }

    try {
        const res = await fetch(`${API}/alunos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                turma,
                disciplinas: {
                    [disciplina]: nota
                }
            })
        });

        const dados = await res.json();

        if (!res.ok) {
            mostrarToast(dados.mensagem || "Erro ao cadastrar aluno", "erro");
            return;
        }

        mostrarToast(dados.mensagem || "Aluno cadastrado com sucesso", "sucesso");
        limparCamposCadastro();
        pesquisar();
    } catch (erro) {
        mostrarToast("Erro ao conectar com o servidor", "erro");
    }
}

// UPDATE - adicionar disciplina
async function adicionarDisciplina() {
    const nome = document.getElementById("nome").value.trim();
    const disciplina = document.getElementById("disciplina").value.trim();
    const nota = parseFloat(document.getElementById("nota").value);

    if (!nome || !disciplina || isNaN(nota) || nota < 0 || nota > 10) {
        mostrarToast("Preencha nome, disciplina e uma nota entre 0 e 10", "aviso");
        return;
    }

    try {
        const res = await fetch(`${API}/alunos/${encodeURIComponent(nome)}/disciplina`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                disciplina,
                nota
            })
        });

        const dados = await res.json();

        if (!res.ok) {
            mostrarToast(dados.mensagem || "Erro ao adicionar disciplina", "erro");
            return;
        }

        mostrarToast(dados.mensagem || "Disciplina adicionada com sucesso", "sucesso");
        limparCamposCadastro();
        pesquisar();
    } catch (erro) {
        mostrarToast("Erro ao conectar com o servidor", "erro");
    }
}

// MÉDIAS
async function verMedia() {
    const container = document.getElementById("resultadoMedias");
    container.innerHTML = `<div class="mensagem-vazia">Carregando médias...</div>`;

    try {
        const res = await fetch(`${API}/media`);
        const dados = await res.json();

        container.innerHTML = "";

        if (!res.ok) {
            container.innerHTML = `<div class="mensagem-vazia">${dados.mensagem || "Erro ao carregar médias."}</div>`;
            return;
        }

        if (!Array.isArray(dados) || dados.length === 0) {
            container.innerHTML = `<div class="mensagem-vazia">Nenhuma média encontrada.</div>`;
            return;
        }

        dados.forEach(item => {
            const card = document.createElement("div");
            card.className = "card media-card";

            card.innerHTML = `
                <h3>${item._id}</h3>
                <p>Média da disciplina</p>
                <strong>${Number(item.media).toFixed(2)}</strong>
            `;

            container.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro no frontend /media:", erro);
        container.innerHTML = `<div class="mensagem-vazia">Erro ao conectar com o servidor.</div>`;
    }
}

// ENTER NOS CAMPOS
document.addEventListener("DOMContentLoaded", () => {
    const filtroTurma = document.getElementById("filtroTurma");
    const filtroNome = document.getElementById("filtroNome");
    const filtroDisciplina = document.getElementById("filtroDisciplina");

    const nome = document.getElementById("nome");
    const turma = document.getElementById("turma");
    const disciplina = document.getElementById("disciplina");
    const nota = document.getElementById("nota");

    [filtroTurma, filtroNome, filtroDisciplina].forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                pesquisar();
            }
        });
    });

    [nome, turma, disciplina, nota].forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addAluno();
            }
        });
    });
});

// carregar pesquisa inicial
pesquisar();