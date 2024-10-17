const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const xlsx = require('xlsx'); // Importa a biblioteca xlsx

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

// Função para ler os dados da planilha Excel
function lerPlanilha(caminho) {
    const workbook = xlsx.readFile(caminho);
    const sheetName = workbook.SheetNames[0]; // Assume que você quer ler a primeira planilha
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Lê os dados como um array de arrays
    return data;
}

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { codigoBarra } = req.body;

    // Lê os dados da planilha local
    const dadosPlanilha = lerPlanilha('Código de barras crachá.xlsx');
    
    // Busca o código de barras na planilha
    const row = dadosPlanilha.find(row => row[0].toString().trim() === codigoBarra.trim());

    if (row) {
        const colaboradorNome = row[2]; // Assume que o nome do colaborador está na coluna C (índice 2)
        req.session.codigoBarra = codigoBarra;
        req.session.colaboradorNome = colaboradorNome; 
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
