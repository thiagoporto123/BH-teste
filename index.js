const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do express-session
app.use(session({
    secret: 'seu_segredo_aqui', // Troque por um segredo real
    resave: false,
    saveUninitialized: true,
}));

// Serve arquivos estáticos (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Adicionando suporte para JSON

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { codigoBarra } = req.body;

    // Aqui você pode definir o nome do colaborador manualmente
    // ou fazer alguma lógica diferente em vez de buscar na planilha
    const colaboradorNome = 'Colaborador Exemplo'; // Defina o nome aqui ou faça outra lógica

    // Armazena o código de barras e o nome na sessão
    req.session.codigoBarra = codigoBarra;
    req.session.colaboradorNome = colaboradorNome; 
    res.json({ success: true, nome: colaboradorNome });
});

// Rota principal
app.get('/', (req, res) => {
    // Verifica se o usuário está logado
    if (!req.session.codigoBarra) {
        return res.redirect('/login'); // Redireciona para o login se não estiver logado
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
