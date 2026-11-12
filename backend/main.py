from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pathlib import Path 
import os 
import secrets 
import bcrypt 
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session 
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail 
import ssl 
ssl._create_default_https_context = ssl._create_unverified_context

# Instância da API 
app = FastAPI(title="API - Recuperação de Senha")

BASE_DIR = Path(__file__).resolve().parent 

arquivos_path = BASE_DIR / "Arquivos"
nextpag_path = BASE_DIR / "nextpag"

arquivos_path.mkdir(parents=True, exist_ok=True)
nextpag_path.mkdir(parents=True, exist_ok=True) 

# Libera o acesso às pastas para o navegador carregar as imagens
app.mount("/Arquivos", StaticFiles(directory=arquivos_path), name="arquivos")
app.mount("/nextpag", StaticFiles(directory=nextpag_path), name="nextpag")

# Adição do CORS e configuração universal para toda a equipe 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5505",
        "http://127.0.0.1:5505",
    ],
    allow_origin_regex=r"https://.*\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenta ler o comando .env (se exisitir). Se não existir, usa a string padrão automaticamente.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env") 

# Lê as variáveis geradas no .env 
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY") 
SENDER_EMAIL = os.getenv("SENDER_EMAIL") 
DATABASE_URL = os.getenv("DATABASE_URL") 

# Ajuste do prefixo do Postgres se necessário 
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
# Conexão direta com o PostgreSQL do Neon 
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    connect_args={"connect_timeout": 15}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_password_hash(password: str) -> str:
    print(">>> PASSOU PELA FUNÇÃO CORRIGIDA! <<<")
    safe_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(safe_bytes, salt).decode('utf-8') 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    safe_password = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(safe_password, hashed_bytes) 

# Modelos do Banco de Dados
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False) 
    password_hash = Column(String(255), nullable=False)
    token_sessao = Column(String(255), nullable=True)
    
Usuario = User 

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)

# Cria as tabelas de forma automática, caso nenhuma delas existir
Base.metadata.create_all(bind=engine)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel): 
    token: str 
    new_password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
            db.close()

# Função para envio do e-mail via SendGrid (API)

def send_reset_email_sendgrid(to_email: str, token: str) -> bool:
    
    codespace_name = os.getenv("CODESPACE_NAME")
    reset_url = (
    f"https://{codespace_name}-5505.app.github.dev/redefinirsenha.html?token={token}"
    if codespace_name
    else f"http://127.0.0.1:5505/redefinirsenha.html?token={token}"
    )

    content = f"""
    <h3>Recuperação de Senha</h3>
    <p>Você solicitou a redefinição de senha para a sua conta.</p>
    <p>Clique no link abaixo para criar uma nova senha (válido por 20 minutos!)</p>
    <a href="{reset_url}">Redefinir minha Senha</a>
    """

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject="Redefinição de Senha",
        html_content=content 
    ) 

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f">>> E-MAIL ENVIADO COM SUCESSO! Status: {response.status_code}")
        return True
    except Exception as e:
        if hasattr(e, 'body'):
            print(f"ERRO DETALHADO SENDGRID: {e.body.decode('utf-8')}")
        else:
            print(f">>> ERRO AO ENVIAR PELO SENDGRID: {e}")
        return False

@app.post("/auth/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db) 
):
    user = db.query(User).filter(User.email == payload.email) .first()

    # ! Se caso o usuário não existir nos testes, cria um automaticamente para facilitar
    if not user:
        user = User (email=payload.email, password_hash=get_password_hash("Senha_inicial_"))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = secrets.token_hex(32)
    print(">>> TOKEN GERADO:", token)
    expiration = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=20) 

    db_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expiration
        )
    db.add(db_token)
    db.commit()

    background_tasks.add_task(send_reset_email_sendgrid, user.email, token)

    return {"message": "Se o e-mail estiver cadastrado, a mensagem será enviado ao destino..."}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Usuário já cadastrado")
        
    hashed_password = get_password_hash(payload.password)
    new_user = User(email=payload.email, password_hash=hashed_password)
        
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
        
    return {"message": "Usuário registrado com sucesso!"}

# Criação da estrutura para aceitar o email e a senha do JSON 
class LoginRequest(BaseModel): 
    email: EmailStr
    password: str 

security = HTTPBearer()

def get_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
            
    token = credentials.credentials
    usuario = db.query(Usuario).filter(Usuario.token_sessao == token).first()
            
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario
                          
@app.post("/auth/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    
    if not usuario or not verify_password(dados.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    
    token_acesso = secrets.token_hex(32)
    usuario.token_sessao = token_acesso
    db.commit()
    
    return {
        "access_token": token_acesso,
        "token_type": "bearer",
        "message": "Login realizado com sucesso!"
    }
    
@app.get("/dados-protegidos")
def checar_acesso(usuario_logado: Usuario = Depends(get_usuario_atual)):
    return {"status": "Autorizado", "usuario": usuario_logado.email}
        
@app.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token == payload.token, PasswordResetToken.used == False).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado.")

    expires_at = token_record.expires_at.replace(tzinfo=timezone.utc) if token_record.expires_at.tzinfo is None else token_record.expires_at
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="token expirado.") 

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    user.password_hash = get_password_hash(payload.new_password) 
    token_record.used = True

    db.commit()

    return {"message": "Senha alterada com Sucesso!"} 