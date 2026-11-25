const API_URL = "http://127.0.0.1:8000";

const listaServicos = document.querySelector(".servicos-lista");
let servicoSelecionado = null;

fetch(`${API_URL}/servicos`)
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(servicos) { 
        servicos.forEach(function(servico) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.classList.add("servico");
            botao.textContent = servico.nome;

            botao.addEventListener("click", function () {
                const botoesServicos = document.querySelectorAll(".servico");
                botoesServicos.forEach(function(item) {
                    item.classList.remove("selecionado");
                });

                botao.classList.add("selecionado");
                servicoSelecionado = {id: servico.id, nome: servico.nome}; 
                atualizarResumo();
            });
        
            listaServicos.appendChild(botao);
        });
    });

const listaProfissionais = document.querySelector(".profissionais-lista");
let profissionalSelecionado = null;

fetch(`${API_URL}/funcionarios`)
    .then(function(resposta) {
        return resposta.json();
    })

    .then(function(funcionarios) {
        funcionarios.forEach(function(profissional) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.classList.add("profissional");
            botao.textContent = profissional.nome;

            botao.addEventListener("click", function () {
                const botoesProfissionais = document.querySelectorAll(".profissional");
                botoesProfissionais.forEach(function(item) {
                    item.classList.remove("selecionado");
                });

                botao.classList.add("selecionado");
                profissionalSelecionado = {id: profissional.id, nome: profissional.nome };
                horarioSelecionado = "";

                console.log("Profissional escolhido:", profissionalSelecionado);

                if (dataSelecionada) {
                    secaoHorarios.style.display = "block";
                    gerarHorarios();
                }

                atualizarResumo();
            });

            listaProfissionais.appendChild(botao);
        });
    });

const mesAno = document.getElementById("mesAno");

const diasCalendario = document.getElementById("diasCalendario");

const mesAnterior = document.getElementById("mesAnterior");

const proximomes = document.getElementById("proximoMes");

let dataAtual = new Date();

let mes = dataAtual.getMonth();
let ano = dataAtual.getFullYear();

let dataSelecionada = null;
let horarioSelecionado = "";

const listaHorarios = document.getElementById("listaHorarios");
const secaoHorarios = document.getElementById("secaoHorarios");

secaoHorarios.style.display = "none";

async function gerarHorarios() {
if (!dataSelecionada || !profissionalSelecionado) {
    return;
  }

  const anoFormatado = dataSelecionada.getFullYear();
  const mesformatado = String(dataSelecionada.getMonth() +1).padStart(2, "0");
  const diaformatado = String(dataSelecionada.getDate()).padStart(2, "0");
  const dataISO = `${anoFormatado}-${mesformatado}-${diaformatado}`;

  listaHorarios.innerHTML = "";
  const resposta = await fetch(
    `${API_URL}/horarios-disponiveis?data=${dataISO}&funcionario_id=${profissionalSelecionado.id}`
);
const dados = await resposta.json();
const horarios = dados.horarios_disponiveis || [];

if (horarios.length === 0) {
    listaHorarios.innerHTML = "<p>Nenhum horário disponível para este profissional nesta data.</p>";
    return;
}

  horarios.forEach(function (horario) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.textContent = horario;
    botao.classList.add("horario");

    botao.addEventListener("click", function () {
      const botoesHorarios = listaHorarios.querySelectorAll(".horario");

      botoesHorarios.forEach(function (item) {
        item.classList.remove("selecionado");
      });

      botao.classList.add("selecionado");

      horarioSelecionado = horario;

      console.log("Horário escolhido:", horarioSelecionado);

      atualizarResumo();
    });

    listaHorarios.appendChild(botao);
  });
}

function gerarCalendario() {
  const primeiroDia = new Date(ano, mes, 1).getDay();

  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  const nomeMes = new Date(ano, mes).toLocaleDateString("pt-BR", {
    month: "long",
  });

  mesAno.textContent = `${nomeMes} de ${ano}`;

  diasCalendario.innerHTML = "";

  for (let i = 0; i < primeiroDia; i++) {
    const espaco = document.createElement("span");

    diasCalendario.appendChild(espaco);
  }

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.textContent = dia;

    botao.addEventListener("click", function () {
        if (!profissionalSelecionado) {
            alert("Por favor, escolha um profissional primeiro!");
            return;
        }

        dataSelecionada = new Date(ano, mes, dia);

      const botoesDias = diasCalendario.querySelectorAll("button");

      botoesDias.forEach(function (item) {
        item.classList.remove("dia-selecionado");
      });
      botao.classList.add("dia-selecionado");

      horarioSelecionado = "";

      secaoHorarios.style.display = "block";
      gerarHorarios();

      atualizarResumo();

      console.log("Data escolhida:", dataSelecionada);
    });

    diasCalendario.appendChild(botao);
  }
}
mesAnterior.addEventListener("click", function () {
  mes--;

  if (mes < 0) {
    mes = 11;
    ano--;
  }

  gerarCalendario();
});

proximomes.addEventListener("click", function () {
  mes++;

  if (mes > 11) {
    mes = 0;
    ano++;
  }

  gerarCalendario();
});

gerarCalendario();

const resumoServico = document.getElementById("resumoServico");
const resumoData = document.getElementById("resumoData");
const resumoHorario = document.getElementById("resumoHorario");
const resumoProfissional = document.getElementById("resumoProfissional");

const secaoResumo = document.getElementById("secaoResumo");

secaoResumo.style.display = "none";

function atualizarResumo() {
  if (
    servicoSelecionado &&
    dataSelecionada &&
    horarioSelecionado &&
    profissionalSelecionado
  ) {
    resumoServico.textContent = servicoSelecionado ? servicoSelecionado.nome : "Não selecionado";

    resumoData.textContent = dataSelecionada.toLocaleDateString("pt-BR");

    resumoHorario.textContent = horarioSelecionado;

    resumoProfissional.textContent = profissionalSelecionado ? profissionalSelecionado.nome : "Não selecionado";

    secaoResumo.style.display = "block";
  } else {
    secaoResumo.style.display = "none";
  }
}

const botaoConfirmar = document.getElementById("confirmarAgendamento");

botaoConfirmar.addEventListener("click", async function () {
  if (
    !servicoSelecionado ||
    !dataSelecionada ||
    !horarioSelecionado ||
    !profissionalSelecionado
  ) {
    alert("por favor, preencha todos os campos!");

    return;
  }

  const anoFormatado = dataSelecionada.getFullYear();
  const mesFormatado = String(dataSelecionada.getMonth() + 1).padStart(2, "0");
  const diaFormatado = String(dataSelecionada.getDate()).padStart(2, "0");
  const dataISO = `${anoFormatado}-${mesFormatado}-${diaFormatado}`;

  try  {
    const resposta = await fetch (`${API_URL}/agendar`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            servico_id: servicoSelecionado.id,
            funcionario_id: profissionalSelecionado.id,
            data: dataISO,
            horario: horarioSelecionado,
        }),
    });

    const dados = await resposta.json();

    if(!resposta.ok) {
        mostrarFeedback(dados.detail || "Erro ao confirmar agendamento.", "erro");
        return;
    }

  mostrarFeedback("Agendamento confirmado com sucesso!", "sucesso");

  botaoConfirmar.textContent = "Agendamento confirmado";
  botaoConfirmar.disabled = true;

  } catch (erro) {
    console.error("Erro na requisição", erro);
    mostrarFeedback("Erro ao conectar com o servidor.", "erro");
  }
});

function mostrarFeedback(mensagem, tipo) {
  const feedback = document.getElementById("mensagem-feedback");
  if (!feedback) return;

  feedback.textContent = mensagem;
  feedback.className = `mensagem-feedback ${tipo}`;

  setTimeout(() => {
    feedback.className = "mensagem-feedback";
  }, 3000);
}