<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de BH</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <style>
        body {
            background-color: #f8f9fa;
        }
        .container {
            margin-top: 50px;
            max-width: 600px;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Solicitação de BH</h1>
        <form action="/solicitar-bh" method="POST">
            <div class="form-group">
                <label for="matricula">Matrícula:</label>
                <input type="text" id="matricula" name="matricula" maxlength="7" required class="form-control">
            </div>
            <div class="form-group">
                <label for="dataBH">Data do BH:</label>
                <input type="date" id="dataBH" name="dataBH" required class="form-control">
            </div>
            <div class="form-group">
                <label for="horaInicio">Hora Início:</label>
                <input type="time" id="horaInicio" name="horaInicio" required class="form-control">
            </div>
            <div class="form-group">
                <label for="horaFim">Hora Fim:</label>
                <input type="time" id="horaFim" name="horaFim" required class="form-control">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Solicitar BH</button>
        </form>
    </div>
    <footer>
        Desenvolvedor Thiago Porto Almeida - Dass Nordeste Itaberaba
    </footer>
</body>
</html>
