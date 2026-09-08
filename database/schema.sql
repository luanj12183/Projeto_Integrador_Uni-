-- Criação do nosso Banco de Dados
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProjetoSQL')
BEGIN
    CREATE DATABASE ProjetoSQL;

END
GO

USE ProjetoSQL;
GO

-- Tabela dos Usuários
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        Id INT IDENTITY (1,1) PRIMARY KEY,
        Nome VARCHAR(100) NOT NULL,
        Email VARCHAR(100) NOT NULL UNIQUE,
        DataCriacao DATE DEFAULT GETDATE()
    );

END;
GO

-- Tabela de Produtos  
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Produtos')
BEGIN
    CREATE TABLE Produtos (
        Id INT IDENTITY (1,1) PRIMARY KEY,
        Nome VARCHAR(100) NOT NULL,
        Quantidade INT NOT NULL DEFAULT 0,
        Preco DECIMAL (10,2) NOT NULL
    );
    
END;
GO

-- Tabela de Vendas 
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vendas')
BEGIN
    CREATE TABLE Vendas (
    Id INT IDENTITY (1,1) PRIMARY KEY,
    UsuariosId INT NOT NULL,
    ProdutosId INT NOT NULL,
    QuantidadeComprada INT NOT NULL,

CONSTRAINT FK_Vendas_Usuarios FOREIGN KEY (UsuariosId) REFERENCES Usuarios(Id),
CONSTRAINT FK_Vendas_Produtos FOREIGN KEY (ProdutosId) REFERENCES Produtos(Id)
    );
    
END;
GO