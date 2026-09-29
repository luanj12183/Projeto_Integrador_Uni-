require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function enviarEmailRedefinicao(emailDestino, token) {
const linkRedefinicao = `${process.env.URL_SITE}/redefinirSenha.html?token=${token}`;

const msg = {
    to: emailDestino,
    from: process.env.EMAIL_REMETENTE,
    subject: 'Redefinição de Senha',
    html: `<p>Clique no link para redefinir sua senha: <a href="${linkRedefinicao}">Redefinir Senha</a></p>`
};

return await sgMail.send(msg);
}

module.exports = {enviarEmailRedefinicao};