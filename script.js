const senha = document.getElementById("senha");
const olhoSenha = document.getElementById("olhoSenha");
const ConfirmarSenha = document.getElementById("ConfirmarSenha");
const formulario = document.querySelector("form");
const mensagem = document.getElementById("mensagem");
const olhoConfirmarSenha = document.getElementById("olhoConfirmarSenha");

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
  } else {
if (senha.value===ConfirmarSenha.value){
 mensagem.textContent="Senha Correta!";
 mensagem.style.color = "green";
} else{
    mensagem.textContent= "Senha incorreta!";
    mensagem.style.color = "red";
    ConfirmarSenha.value = "";
}
}});
ConfirmarSenha.addEventListener("input" , function() {
    mensagem.textContent ="";
});

 olhoConfirmarSenha.addEventListener("click", function() {

if (ConfirmarSenha.type === "password"){
ConfirmarSenha.type = "text";
} else { 
    ConfirmarSenha.type ="password";
}
});

  
