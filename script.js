const API_URL = "https://redesigned-bassoon-q7wp6grxwvpgf9g4x-8000.app.github.dev";

const senha = document.getElementById("senha");
const olhoSenha = document.getElementById("olhoSenha");
const formulario = document.querySelector("form");
const mensagem = document.getElementById("mensagem");

olhoSenha.addEventListener("click", function() {

if (senha.type === "password"){
senha.type = "text";
} else { 
    senha.type ="password";
}
});
  formulario.addEventListener("submit", function(event){
    event.preventDefault();
    if (senha.value ==="") {
        mensagem.textContent = "digite uma senha!";
        mensagem.style.color = "Red";
    } else if (senha.value ==="123456") {
         mensagem.textContent = "Senha correta!";
        mensagem.style.color = "green";
    }
            else {
                mensagem.textContent = "senha incorreta!";
                mensagem.style.color = "red";
            }
        });


  
