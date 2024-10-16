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

// Rota para a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { codigoBarra } = req.body;

    // Conecta ao Google Sheets
    const sheets = await getAuthenticatedSheetsClient();
    const spreadsheetId = '1JRvyL6ULSpJpW7vww-eym0bsSk75DzHCzdy6dle5BpY'; // ID da sua planilha

    // Busca todos os códigos de barras da coluna A
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:A', // Coluna A
    });

    const rows = response.data.values || []; // Certifique-se de que rows não é undefined
    console.log('Códigos de barras encontrados na planilha:', rows); // Log para verificar os dados

    // Verifica se o código de barras existe, removendo espaços
    const codigoValido = rows.some(row => row[0].trim() === codigoBarra.trim());

    if (codigoValido) {
        // Armazena o código de barras na sessão
        req.session.codigoBarra = codigoBarra; 
        // Redireciona para a página principal após login
        res.redirect('/');
    } else {
        res.status(401).send('<script>alert("Acesso negado, código de barras não encontrado."); window.history.back();</script>');
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

// Rota para buscar o colaborador
app.get('/buscar-colaborador', async (req, res) => {
    const { matricula } = req.query;
    const sheets = await getAuthenticatedSheetsClient();
    const spreadsheetId = '18IwIenWl-d8ckK8kD_Ck8lQTsZIFWQzwR4LRVVyTSCE'; // ID da planilha para buscar colaborador

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'E:F', // Colunas a serem lidas
    });

    const rows = response.data.values || [];
    let colaboradorNome = '';

    if (rows.length) {
        for (const row of rows) {
            if (row[0] === matricula) {
                colaboradorNome = row[1]; // Nome do colaborador na coluna F
                break;
            }
        }
    }

    res.json({ nome: colaboradorNome });
});

// Rota para processar o formulário
app.post('/solicitar-bh', async (req, res) => {
    const { matricula, dataBH, horaInicio, horaFim } = req.body;
    const codigoBarra = req.session.codigoBarra; // Pega o código de barras da sessão

    const sheets = await getAuthenticatedSheetsClient();
    const spreadsheetId = '1Iip-bR9Y18qy7zHdTjF7A5jmtmrwnag_46fzjwXoGTU'; // ID da sua planilha

    // Verificar se a matrícula existe
    const verificaResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: '18IwIenWl-d8ckK8kD_Ck8lQTsZIFWQzwR4LRVVyTSCE',
        range: 'E:F', // Colunas a serem lidas
    });

    const verificaRows = verificaResponse.data.values || [];
    let colaboradorNome = '';
    let matriculaValida = false;

    if (verificaRows.length) {
        for (const row of verificaRows) {
            if (row[0] === matricula) { // Verifica se a matrícula está na coluna E
                matriculaValida = true;
                colaboradorNome = row[1]; // Nome do colaborador na coluna F
                break;
            }
        }
    }

    if (!matriculaValida) {
        return res.send(`<script>alert('Matrícula inválida'); window.history.back();</script>`); // Pop-up para matrícula inválida
    }

    // Se a matrícula for válida, prossegue com o envio
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A:H', // Colunas a serem preenchidas
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[matricula, colaboradorNome, dataBH, horaInicio, horaFim, new Date().toLocaleDateString(), new Date().toLocaleTimeString(), codigoBarra]], // Usa o código de barras
        },
    }, (err, result) => {
        if (err) {
            console.log(err);
            res.send('Erro ao enviar dados!');
        } else {
            res.send('Solicitação enviada com sucesso!');
        }
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
