import os
from datetime import datetime, timedelta 
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Configuração da URL de conexão (substitua a senha de teste se for rodar localmente)
DATABASE_AGENDAMENTO_URL = os.environ.get( 
    "DATABASE_AGENDAMENTO_URL", 
    "postgresql://neondb_owner:npg_dj9lmUShAGJ8@ep-twilight-leaf-b5163efn-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

def get_bancoDeDados():
    """Abre conexão com o PostgreSQL na Neon."""
    return psycopg2.connect(DATABASE_AGENDAMENTO_URL, cursor_factory=RealDictCursor) 

def init_bancodeDados(): 
    """Cria as tabelas no banco de dados com segurança (apenas se não existirem)."""
    conexao = get_bancoDeDados()
    cursor = conexao.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS funcionarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL UNIQUE,
            horario_inicio VARCHAR(5) DEFAULT '08:00',
            horario_fim VARCHAR(5) DEFAULT '17:00'
        );
    ''') 
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS servicos (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL UNIQUE,
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
            horario VARCHAR(5) NOT NULL,
            UNIQUE (funcionario_id, data, horario)
        );
    ''')
    
    conexao.commit()
    cursor.close()
    conexao.close()

# Inicializa o banco ao rodar o arquivo
init_bancodeDados()

def gerar_horarios(inicio_str, fim_str, intervalo_minutos=30):
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

class CriarAgendamento(BaseModel): 
    cliente_nome: str
    funcionario_id: int 
    servico_id: int
    data: str
    horario: str

# --- 1. CONSULTA DE DADOS BÁSICOS ---

@router.get('/servicos')
def listar_servicos():
    """Retorna os serviços oferecidos pelo salão."""
    conexao = get_bancoDeDados()
    cursor = conexao.cursor()
    cursor.execute("SELECT id, nome, duracao_minutos FROM servicos ORDER BY id ASC;")
    servicos = cursor.fetchall()
    cursor.close()
    conexao.close()
    return servicos


@router.get('/funcionarios') 
def listar_funcionarios():
    """Retorna os funcionários cadastrados."""
    conexao = get_bancoDeDados()
    cursor = conexao.cursor()
    cursor.execute("SELECT id, nome, horario_inicio, horario_fim FROM funcionarios ORDER BY id ASC;")
    servicos = cursor.fetchall()
    cursor.close()
    conexao.close()
    return servicos


# --- 2. REGRAS E FILTROS DE DISPONIBILIDADE ---

@router.get('/horarios-disponiveis') 
def horarios_disponiveis(data: str, funcionario_id: int): 
    conexao = get_bancoDeDados()
    cursor = conexao.cursor()

    cursor.execute("SELECT horario_inicio, horario_fim FROM funcionarios WHERE id = %s;", (funcionario_id,))
    func = cursor.fetchone()

    if not func:
        cursor.close()
        conexao.close()
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

    todos_horarios = gerar_horarios(func['horario_inicio'], func['horario_fim'], 30)

    cursor.execute(
        "SELECT horario FROM agendamentos WHERE data = %s AND funcionario_id = %s;",
        (data, funcionario_id)
    )
    agendamentos = cursor.fetchall()
    cursor.close()
    conexao.close()

    horarios_ocupados = [item['horario'] for item in agendamentos]
    horarios_livres = [h for h in todos_horarios if h not in horarios_ocupados]

    return {
        "expediente": f"{func['horario_inicio']} às {func['horario_fim']}", 
        "horarios_disponiveis": horarios_livres
    } 


@router.get('/funcionarios-disponiveis')
def funcionarios_disponiveis(data: str, horario: str): 
    conexao = get_bancoDeDados()
    cursor = conexao.cursor()

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
    conexao.close()

    return ({"funcionarios_disponiveis": funcionarios_livres}) 


# --- 3. CRIAR AGENDAMENTO ---

@router.post('/agendar', status_code=201) 
def criar_agendamento(dados: CriarAgendamento):
    if not all([dados.cliente_nome.strip(), dados.funcionario_id, dados.servico_id, dados.data, dados.horario]):
        raise HTTPException(status_code=400, detail="Preencha todos os campos obrigatórios.")

    conexao = get_bancoDeDados()
    cursor = conexao.cursor()

    cursor.execute(
        "SELECT id FROM agendamentos WHERE data = %s AND horario = %s AND funcionario_id = %s;",
        (dados.data, dados.horario, dados.funcionario_id) 
    )
    if cursor.fetchone():
        cursor.close()
        conexao.close()
        raise HTTPException(status_code=409, detail="Este horário já foi preenchido por outro cliente.") 

    cursor.execute(
        """
        INSERT INTO agendamentos (cliente_nome, funcionario_id, servico_id, data, horario)
        VALUES (%s, %s, %s, %s, %s) RETURNING id;
        """,
        (dados.cliente_nome.strip(), dados.funcionario_id, dados.servico_id, dados.data, dados.horario)
    )
    novo_id = cursor.fetchone()['id']
    conexao.commit()
    cursor.close()
    conexao.close()

    return {"mensagem": "Agendamento realizado com sucesso!", "id": novo_id} 