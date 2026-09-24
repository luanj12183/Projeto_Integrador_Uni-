const senha = document.getElementById("senha");
const olhoSenha = document.getElementById("olhoSenha");
olhoSenha.addEventListener("click", function() {
if (senha.type === "password"){
senha.type = "text";
} else { 
    senha.type ="password";
}
});
