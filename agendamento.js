const botoesServicos = document.querySelectorAll(".servico");

let servicoSelecionado = "";

botoesServicos.forEach(function(botao) {

    botao.addEventListener("click", function() {

        botoesServicos.forEach(function(item) {
            item.classList.remove("selecionado");
  });

  botao.classList.add("selecionado");

  servicoSelecionado = botao.dataset.servico;

  console.log("Serviço escolhido:", servicoSelecionado);

   atualizarResumo();


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

 function gerarHorarios() {

    const horarios = [

        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
    ];

    listaHorarios.innerHTML = "";

    horarios.forEach(function(horario) {
   const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = horario;
        botao.classList.add("horario");

        botao.addEventListener("click", function() {
            
            const botoesHorarios = listaHorarios.querySelectorAll(".horario");
            
            botoesHorarios.forEach(function(item) {
                item.classList.remove("selecionado");
            });

            botao.classList.add("selecionado");

            horarioSelecionado = horario;

            console.log("Horário escolhido:",horarioSelecionado);

            atualizarResumo();
        });

        listaHorarios.appendChild(botao);
    });

 }

function gerarCalendario() {
    
    const primeiroDia = new Date(ano, mes, 1).getDay();

    
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();


    const nomeMes = new Date(ano, mes).toLocaleDateString("pt-BR", {

        month: "long" 
    });


    mesAno.textContent = `${nomeMes} de ${ano}`;

    diasCalendario.innerHTML = ""; 

    for (let i = 0; i < primeiroDia; i++) {

        const espaco = document.createElement("span");

        diasCalendario.appendChild(espaco)

    }
    
    for (let dia = 1; dia <= ultimoDia; dia++) {

        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = dia;

        botao.addEventListener("click", function() {

            dataSelecionada = new Date(ano, mes, dia);

            const botoesDias = diasCalendario.querySelectorAll("button");
            
            botoesDias.forEach(function(item) {
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
mesAnterior.addEventListener("click", function() {

    mes--;

    if (mes <  0) {
        mes = 11;
        ano--;
    }
    
    gerarCalendario();

});
 

proximomes.addEventListener("click", function ()  {

    mes++;

    if (mes > 11) {
      mes = 0; 
      ano++;

    }

    gerarCalendario();

});

 gerarCalendario();

 const botoesProfissionais = document.querySelectorAll(".profissional");

 let profissionalSelecionado = "";

 botoesProfissionais.forEach(function(botao) {

botao.addEventListener("click", function() {

    botoesProfissionais.forEach(function(item) {
        item.classList.remove("selecionado");
    });

    botao.classList.add("selecionado");

    profissionalSelecionado = botao.dataset.profissional;

    console.log("profissional escolhido:", profissionalSelecionado);
    atualizarResumo();
 });


 });

  const resumoServico = document.getElementById("resumoServico");
  const resumoData = document.getElementById("resumoData");
  const resumoHorario = document.getElementById("resumoHorario");
  const resumoProfissional = document.getElementById("resumoProfissional");

  const secaoResumo = document.getElementById("secaoResumo");

  secaoResumo.style.display = "none";

  function atualizarResumo() {

    if  (
    servicoSelecionado &&
    dataSelecionada &&
    horarioSelecionado &&
    profissionalSelecionado
    ) {
 
   resumoServico.textContent = servicoSelecionado;

   resumoData.textContent = dataSelecionada.toLocaleDateString("pt-BR");

   resumoHorario.textContent = horarioSelecionado;

   resumoProfissional.textContent = profissionalSelecionado;

   secaoResumo.style.display = "block";

} else {

    secaoResumo.style.display = "none";

}
  
  }

  const botaoConfirmar = document.getElementById("confirmarAgendamento");

  const mensagemConfirmacao = document.getElementById("mensagemConfirmacao");

  botaoConfirmar.addEventListener("click", function() {


  if (

    ! servicoSelecionado ||
    ! dataSelecionada ||
    ! horarioSelecionado ||
    !profissionalSelecionado 
 ) {
    alert("por favor, preencha todos os campos!")

    return;

  }

  mensagemConfirmacao.textContent = "Agendamento confirmado com sucesso!";

  mensagemConfirmacao.style.display = "block";

  botaoConfirmar.textContent = "Agendamento confirmado"

  botaoConfirmar.disabled = true;

});






