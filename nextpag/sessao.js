// Linha original que esconde o body 
document.head.insertAdjacentHTML('beforeend', '<style id="auth-hide">body { display: none !important; }</style>');

// Verifica o tempo inativo, passando do período, ele te "joga" para a pág de login
const Minutos_Inatividade = 30;
const Tempo_limite_ms = Minutos_Inatividade * 60 * 1000;

// Ajusta o caminho do logout dinamicamente 
 function obterCaminhoLogin() {
    return window.location.pathname.includes("/nextpag/") ? "../index.html" : "index.html";
 }

 function registrarAtividade () {
    localStorage.setItem("ultimaAtividade", Date.now().toString()); 
 }

 function verificarInatividade () {
    const ultimaAtividade = localStorage.getItem("ultimaAtividade"); 
    if (ultimaAtividade) {
        const tempoInativdade = Date.now() - parseInt(ultimaAtividade, 10);
        if (tempoInativdade > Tempo_limite_ms) {
            alert ("Sua sessão expirou por inatividade.");
            fazerLogout();
            return true;
        }
    }
    return false;
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(event => {
    window.addEventListener(event, () => {
        if (localStorage.getItem("token")) registrarAtividade();
    });
});

// Limpa a sessão e redireciona para o caminho correto
function fazerLogout(event) {
    if (event) event.preventDefault(); 
    localStorage.removeItem("token");
    localStorage.removeItem("ultimaAtividade");
    window.location.replace(obterCaminhoLogin());
}

// Verificação inicial de presença no token e inatividade
const token = localStorage.getItem("token");
if (!token || verificarInatividade()) {
    fazerLogout();
}

// validação de sessão no backend (FastAPI)
(async function verificarAcesso() { 
    try {
        const API_URL = window.location.origin.includes("github.dev")
        ? window.location.origin.replace("-5505", "-8000") 
        : "http://127.0.0.1:8000";

        const resposta = await fetch(`${API_URL}/dados-protegidos`, {
            headers: {"Authorization": `Bearer ${token}` }
        });

        if (resposta.ok) {
            registrarAtividade();
            const styleOcultar = document.getElementById("auth-hide");
            if (styleOcultar) styleOcultar.remove();
        } else if (resposta.status === 401) {
        // Token recusado explicitamente pelo servidor
        fazerLogout();
        } else {
            // Instabilidade ou outros retornos: exibe a página sem deslogar
            const styleOcultar = document.getElementById("auth-hide");
            if (styleOcultar) styleOcultar.remove();
        }
    } catch (erro) {
        // Erros de rede/cancelamento de requisição na navegação deslogam 
        console.warn("Aviso: Falha temporária ao comunicar com o servidor:", erro);
        const styleOcultar = document.getElementById("auth-hide");
        if (styleOcultar) styleOcultar.remove();
    }
})();

// Proteção para o botão "voltar" do navegador (cache do histórico)
window.addEventListener('pageshow', function (event) {
    const tokenAtual = localStorage.getItem("token");
    if (!tokenAtual || verificarInatividade()) {
        if (document.body) document.body.style.display = "none";
        fazerLogout()
    }
});

function renovarSessao() {
    localStorage.setItem("ultimoAcesso", Date.now());
}

window.addEventListener("click", renovarSessao);
window.addEventListener("keydown", renovarSessao);
window.addEventListener("scroll", renovarSessao); 