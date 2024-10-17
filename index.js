const fs = require('fs');
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
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

// Carrega as credenciais da API do Google
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Função para conectar ao Google Sheets
function getAuthenticatedSheetsClient() {
    return new Promise((resolve, reject) => {
        fs.readFile('token.json', (err, token) => {
            if (err) return getNewToken(oAuth2Client, resolve);
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(google.sheets({ version: 'v4', auth: oAuth2Client }));
        });
    });
}

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { codigoBarra } = req.body;

    // Conecta ao Google Sheets
    const sheets = await getAuthenticatedSheetsClient();
    const spreadsheetId = '1JRvyL6ULSpJpW7vww-eym0bsSk75DzHCzdy6dle5BpY'; // ID da sua planilha

    // Busca todos os códigos de barras da coluna A e os nomes da coluna C
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:C', // Colunas A (código de barras) e C (nomes)
    });

    const rows = response.data.values || [];
    console.log('Dados encontrados na planilha:', rows); // Log para verificar os dados

    // Verifica se o código de barras existe, removendo espaços
    const row = rows.find(row => row[0].trim() === codigoBarra.trim());

    if (row) {
        const colaboradorNome = row[2]; // Nome do colaborador na coluna C
        // Armazena o código de barras e o nome na sessão
        req.session.codigoBarra = codigoBarra;
        req.session.colaboradorNome = colaboradorNome; 
        // Retorna sucesso e nome do colaborador
        res.json({ success: true, nome: colaboradorNome });
    } else {
        res.status(401).json({ success: false, message: "Código de barras não encontrado." });
    }
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
