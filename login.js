const API_URL = "https://redesigned-bassoon-q7wp6grxwvpgf9g4x-8000.app.github.dev";

const email = document.getElementById("email");
const senha = document.getElementById("senha");
const formulario = document.querySelector("form");

function mostrarFeedback(texto, tipo) {
    const feedback = document.getElementById("mensagem-feedback") || document.querySelector(".mensagem-feedback"); 
    if (! feedback) return;

    feedback.textContent = texto;
    feedback.className = `mensagem-feedback ${tipo}`;

    setTimeout(() => {
        feedback.className = "mensagem-feedback";
    }, 3000);
}

// Envio de formulário de login
 if (formulario) {
     formulario.addEventListener("submit", function(event) {
        event.preventDefault();

        if (!email.value.trim() || !senha.value) {
            mostrarFeedback("Preencha todos os campos!", "erro");
            return;
        }

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
        mostrarFeedback("Login Realizado com Sucesso!", "sucesso");
        setTimeout(() => {
            window.location.href = "nextpag/salao.html";
        }, 1500);

        } else {
            const msgErro = typeof data.detail === "string" ? data.detail : "Usuário ou senha incorretos";
            mostrarFeedback(msgErro, "erro");
        }
    })
    .catch(() => {
        mostrarFeedback("Erro ao conectar com o servidor!", "erro");
    });
});
 }