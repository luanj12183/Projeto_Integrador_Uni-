// Injeta o CSS para esconder a tela de renderizar (evita o "Piscar" do conteúdo)
document.head.insertAdjacentHTML('beforeend', '<style id="auth-hide">body { display: none !important; }</style>');

const token = localStorage.getItem("token");
// Redireciona na hora se nem houver token salvo
if (!token) {
    window.location.replace ("../index.html"); 
}

(async function verificarAcesso() {
    try {
            const API_URL = window.location.origin.includes("github.dev") ? window.location.origin.replace("-5505", "-8000") : "http://127.0.0.1:8000";

            const resposta = await fetch(`${API_URL}/dados-protegidos`, {
                headers: {"Authorization": `Bearer ${token}` }
        });    

        if (resposta.ok) {
            // Se o token for válido, remove a ocultação e exibe a página
            const styleOcultar = document.getElementById("auth-hide");
            if (styleOcultar) styleOcultar.remove();
        } else {
            localStorage.removeItem("token");
            window.location.replace ("../index.html");
        }
    } catch (erro) {
        console.error("Erro ao validar o token no servidor:", erro);
        window.location.replace ("../index.html");
    }
})();

function fazerLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem("token");
    window.location.replace ("../index.html"); 
}

window.addEventListener('pageshow', function (event) {
    const token = localStorage.getItem("token");
    if (!token) {
        if (document.body) document.body.style.display = "none";
        window.location.replace ("../index.html"); 
    }
}); 