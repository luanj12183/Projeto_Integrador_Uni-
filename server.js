require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const {enviarEmailRedefinicao} = require('./sendgridService'); 
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./banco.db');

const app = express();
app.use(express.json());
app.use(express.static('.')); 

app.post ('/api/solicitar-redefinicao', async (req, res) => {
    const { email } = req.body;

    try {
        const token = crypto.randomBytes(20).toString('hex');
        const expiracao = new Date(Date.now() + 3600000).toISOString(); 

       db.run(
        `UPDATE usuarios SET reset_token = ?, token_expiracao = ? WHERE email = ?`,
        [token, expiracao, email],
        async function (err) {
            if (err) {
                console.error('Erro no SQLite:', err);
                return res.status(500).json({ error: 'Erro ao salvar no banco.' });
            }

            await enviarEmailRedefinicao(email, token);
            res.status(200).json({ message: 'E-mail de recuperação enviado com sucesso!' }); 
        }
    );
} catch (error) {
    console.error('Erro na rota de solicitação', error);
    res.status(500).json({ error: 'Falha ao processar o envio do e-mail.' })
}
});

app.post('/api/redefinir-senha', async (req, res) => {

    const { token, novaSenha } = req.body;

    try {
        res.status(200).json({ message: 'Senha alterada com sucesso!' }); 
    } catch (error) {
        console.error('Erro na rota de redefinição', error);
        res.status(500).json({ error: 'Falha ao redefinir a senha.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});