const API_URL = "https://redesigned-bassoon-q7wp6grxwvpgf9g4x-8000.app.github.dev";

const email = document.getElementById("email");
const senha = document.getElementById("senha");
const olhoSenha = document.getElementById("olhoSenha");
const formulario = document.querySelector("form");
const mensagem = document.getElementById("mensagem");

// Alterar ver/ocultar senha
if (olhoSenha) {
    olhoSenha.addEventListener("click", function() {
        senha.type = senha.type === "password" ? "text" : "password"; 
    });
}

// Envio de formulário de login
formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email.value,
            password: senha.value
        })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            if (data.access_token) {
                localStorage.setItem("token", data.access_token);  
            }

            // Redirecionamento para a página do salão 
            window.location.href = "nextpag/salao.html";

        } else {
            mensagem.textContent = "Usuário ou senha incorretos";
            mensagem.style.color = "red";
        }
    })
    .catch(() => {
        mensagem.textContent = "Usuário ou senha incorretos!";
        mensagem.style.color = "red"; 
    });
});
