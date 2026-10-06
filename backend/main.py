from fastapi import FastAPI, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path 
import os 
import secrets 
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session 
from passlib.context import CryptContext 
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail 
from datetime import datetime, timedelta, timezone
import ssl 
ssl._create_default_https_context = ssl._create_unverified_context

# Abaixo será carregada as variáveis do arquivo .env
load_dotenv()

# Instância da API 
app = FastAPI(title="API - Recuperação de Senha")

# Adição do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env") 

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY") 
SENDER_EMAIL = os.getenv("SENDER_EMAIL") 
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./teste.db")

# Suporte das 2 plataformas: do SQL LITE ao SQL SERVER
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush= False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext (schemes=["bcrypt"], deprecated="auto")

# Modelos do Banco de Dados
class User (Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False) 
    password_hash = Column(String(255), nullable=False)

class PasswordResetToken(Base):
    __tablename__ = "PasswordResetTokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
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
    reset_url = f"http://localhost:3000/redefinir-senha?token={token}"

    content = f"""
    <h3>Recuperação de Senha</h3>
    <p>Você solicitou a redefinição de senha para a sua conta.<p>
    <p>Clique no link abaixo para criar uma nova senha (válido por 20 minutos!):<p>
    <a href="{reset_url}">Redefinir minha Senha</a>
    """

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject="Redefinição de Senha",
        html_content=content 
    ) 

    try:
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
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
        user = User (email=payload.email, password_hash=pwd_context.hash("Senha_inicial_"))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = secrets.token_hex(32)
    print(">>> TOKEN GERADO:", token)
    expiration = datetime.now(timezone.utc) + timedelta(minutes=20)

    db_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expiration
        )
    db.add(db_token)
    db.commit()

    background_tasks.add_task(send_reset_email_sendgrid, user.email, token)

    return {"message": "Se o e-mail estiver cadastrado, a mensagem chegará..."}

@app.post("/auth/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_record = db.query(PasswordResetToken).filter( 
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False 
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado.")

    if datetime.now(timezone.utc) > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Token Expirado.") 

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    user.password_hash = pwd_context.hash(payload.new_password) 
    token_record.used = True

    db.commit()

    return {"message": "Senha alterada com Sucesso!"} 