const API_URL = "https://redesigned-bassoon-q7wp6grxwvpgf9g4x-8000.app.github.dev";
const token = new URLSearchParams(window.location.search).get("token");
const senha = document.getElementById("senha");
const olhoSenha = document.getElementById("olhoSenha");
const ConfirmarSenha = document.getElementById("ConfirmarSenha");
const formulario = document.querySelector("form");
const mensagem = document.getElementById("mensagem-feedback");
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

    if (!token) {
        mensagem.textContent = "Link inválido ou sem token!";
        mensagem.className = "mensagem-feedback erro";
        return; 
    }

    if (senha.value ==="") {
        mensagem.textContent = "digite uma senha!";
        mensagem.className = "mensagem-feedback erro";
  } else {
if (senha.value===ConfirmarSenha.value){

    fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, new_password: senha.value }) 
    })

    .then(async res => {
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            mensagem.textContent = "Senha alterada com sucesso!";
            mensagem.className = "mensagem-feedback sucesso";
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        } else {
            const msgErro = typeof data.detail === "string" ? data.detail : "Erro ao alterar no servidor.";
            mensagem.textContent = msgErro;
            mensagem.className = "mensagem-feedback erro";
        }
    })
    
.catch(() => {
        mensagem.textContent = "Erro de conexão!";
        mensagem.className = "mensagem-feedback erro";
    });

} else { 
    mensagem.textContent = "As senhas nao coincidem!";
    mensagem.className = "mensagem-feedback erro";
    ConfirmarSenha.value = "";
}
}
  });

ConfirmarSenha.addEventListener("input" , function() {
    mensagem.textContent ="";
    mensagem.className = "mensagem-feedback";
});

 olhoConfirmarSenha.addEventListener("click", function() {

if (ConfirmarSenha.type === "password"){
ConfirmarSenha.type = "text";
} else { 
    ConfirmarSenha.type ="password";
}
});