import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)  # Permite a comunicação com o Frontend HTML/JS

# Configuração da URL de conexão (substitua a senha de teste se for rodar localmente)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_dj9lmUShAGJ8@ep-twilight-leaf-b5163efn-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

def get_db():
    """Abre conexão com o PostgreSQL na Neon."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    """Cria as tabelas no banco de dados com segurança (apenas se não existirem)."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS funcionarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            horario_inicio VARCHAR(5) DEFAULT '08:00',
            horario_fim VARCHAR(5) DEFAULT '17:00'
        );
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS servicos (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            duracao_minutos INT NOT NULL
        );
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agendamentos (
            id SERIAL PRIMARY KEY,
            funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE,
            servico_id INT REFERENCES servicos(id) ON DELETE CASCADE,
            cliente_nome VARCHAR(100) NOT NULL,
            data DATE NOT NULL,
            horario VARCHAR(5) NOT NULL
        );
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()

# Inicializa o banco ao rodar o arquivo
init_db()

def gerar_grade_horarios(inicio_str, fim_str, intervalo_minutos=30):
    """Gera a lista de horários com base no expediente de cada funcionário."""
    formato = "%H:%M"
    inicio = datetime.strptime(inicio_str, formato)
    fim = datetime.strptime(fim_str, formato)
    
    horarios = []
    atual = inicio
    while atual < fim:
        horarios.append(atual.strftime(formato))
        atual += timedelta(minutes=intervalo_minutos)
        
    return horarios


# --- 1. CONSULTA DE DADOS BÁSICOS ---

@app.route('/servicos', methods=['GET'])
def listar_servicos():
    """Retorna os serviços oferecidos pelo salão."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, duracao_minutos FROM servicos ORDER BY id ASC;")
    servicos = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(servicos), 200


@app.route('/funcionarios', methods=['GET'])
def listar_funcionarios():
    """Retorna os funcionários cadastrados."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, horario_inicio, horario_fim FROM funcionarios ORDER BY id ASC;")
    funcionarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(funcionarios), 200


# --- 2. REGRAS E FILTROS DE DISPONIBILIDADE ---

@app.route('/horarios-disponiveis', methods=['GET'])
def horarios_disponiveis():
    """
    Filtro 1: Dado um funcionário e uma data, retorna os horários vagos do expediente dele.
    Exemplo: GET /horarios-disponiveis?data=2026-10-15&funcionario_id=1
    """
    data = request.args.get('data')
    funcionario_id = request.args.get('funcionario_id')

    if not data or not funcionario_id:
        return jsonify({"erro": "Informe os parâmetros 'data' e 'funcionario_id'."}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Busca o turno de trabalho do funcionário
    cursor.execute("SELECT horario_inicio, horario_fim FROM funcionarios WHERE id = %s;", (funcionario_id,))
    func = cursor.fetchone()

    if not func:
        cursor.close()
        conn.close()
        return jsonify({"erro": "Funcionário não encontrado."}), 404

    # Gera todos os horários possíveis para aquele profissional
    todos_horarios = gerar_grade_horarios(func['horario_inicio'], func['horario_fim'], 30)

    # Busca no banco quais horários já estão agendados para ele nesse dia
    cursor.execute(
        "SELECT horario FROM agendamentos WHERE data = %s AND funcionario_id = %s;",
        (data, funcionario_id)
    )
    agendamentos = cursor.fetchall()
    cursor.close()
    conn.close()

    horarios_ocupados = [item['horario'] for item in agendamentos]
    horarios_livres = [h for h in todos_horarios if h not in horarios_ocupados]

    return jsonify({
        "expediente": f"{func['horario_inicio']} às {func['horario_fim']}",
        "horarios_disponiveis": horarios_livres
    }), 200


@app.route('/funcionarios-disponiveis', methods=['GET'])
def funcionarios_disponiveis():
    """
    Filtro 2: Dada uma data e um horário, retorna quais funcionários estão livres.
    Exemplo: GET /funcionarios-disponiveis?data=2026-10-15&horario=10:30
    """
    data = request.args.get('data')
    horario = request.args.get('horario')

    if not data or not horario:
        return jsonify({"erro": "Informe os parâmetros 'data' e 'horario'."}), 400

    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT id, nome, horario_inicio, horario_fim FROM funcionarios 
        WHERE id NOT IN (
            SELECT funcionario_id FROM agendamentos 
            WHERE data = %s AND horario = %s
        )
        AND %s >= horario_inicio AND %s < horario_fim
        ORDER BY id ASC;
    """
    cursor.execute(query, (data, horario, horario, horario))
    funcionarios_livres = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"funcionarios_disponiveis": funcionarios_livres}), 200


# --- 3. CRIAR AGENDAMENTO ---

@app.route('/agendar', methods=['POST'])
def criar_agendamento():
    """Recebe a solicitação de agendamento do cliente e grava no Neon."""
    dados = request.get_json()

    cliente_nome = dados.get('cliente_nome')
    funcionario_id = dados.get('funcionario_id')
    servico_id = dados.get('servico_id')
    data = dados.get('data')
    horario = dados.get('horario')

    if not all([cliente_nome, funcionario_id, servico_id, data, horario]):
        return jsonify({"erro": "Preencha todos os campos obrigatórios."}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Validação para evitar agendamento duplo
    cursor.execute(
        "SELECT id FROM agendamentos WHERE data = %s AND horario = %s AND funcionario_id = %s;",
        (data, horario, funcionario_id)
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"erro": "Este horário já foi preenchido por outro cliente."}), 409

    cursor.execute(
        """
        INSERT INTO agendamentos (cliente_nome, funcionario_id, servico_id, data, horario)
        VALUES (%s, %s, %s, %s, %s) RETURNING id;
        """,
        (cliente_nome, funcionario_id, servico_id, data, horario)
    )
    novo_id = cursor.fetchone()['id']
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"mensagem": "Agendamento realizado com sucesso!", "id": novo_id}), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000)