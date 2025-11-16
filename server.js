// ============= BERSERK CANDY - BACKEND v2.1 =============
// E-commerce de cupcakes artesanais
// Desenvolvido para PIT de Engenharia de Software II

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "db.json");

// ============= MIDDLEWARES =============
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============= FUNÇÕES DE BANCO DE DADOS =============
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        usuarios: [],
        produtos: [],
        pedidos: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      console.log("✅ Banco de dados criado!");
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("❌ Erro ao ler banco:", error);
    return { usuarios: [], produtos: [], pedidos: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("❌ Erro ao escrever no banco:", error);
    return false;
  }
}

// ============= POPULAR PRODUTOS =============
function popularProdutos() {
  const db = readDB();
  
  if (db.produtos.length === 0) {
    db.produtos = [
      {
        id: 1,
        nome: "Cupcake de Chocolate Belga",
        preco: 8.99,
        descricao: "Massa de chocolate com cobertura de ganache belga premium",
        imagem: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400",
        estoque: 50,
        categoria: "chocolate"
      },
      {
        id: 2,
        nome: "Cupcake Red Velvet",
        preco: 9.99,
        descricao: "Tradicional red velvet com cream cheese",
        imagem: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400",
        estoque: 30,
        categoria: "especial"
      },
      {
        id: 3,
        nome: "Cupcake de Baunilha",
        preco: 7.99,
        descricao: "Baunilha pura de Madagascar com buttercream",
        imagem: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400",
        estoque: 40,
        categoria: "classico"
      },
      {
        id: 4,
        nome: "Cupcake de Morango",
        preco: 8.99,
        descricao: "Morangos frescos com cobertura de chantilly",
        imagem: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400",
        estoque: 35,
        categoria: "frutas"
      },
      {
        id: 5,
        nome: "Cupcake Limão Siciliano",
        preco: 8.99,
        descricao: "Refrescante cupcake de limão siciliano",
        imagem: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=400",
        estoque: 25,
        categoria: "frutas"
      },
      {
        id: 6,
        nome: "Cupcake Nutella",
        preco: 10.99,
        descricao: "Recheado com Nutella e cobertura de avelãs",
        imagem: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
        estoque: 20,
        categoria: "especial"
      }
    ];
    
    writeDB(db);
    console.log("✅ Produtos populados no banco!");
  }
}

// Popular produtos ao iniciar
popularProdutos();

// ============= ROTAS DE AUTENTICAÇÃO =============

// Cadastro
app.post("/api/cadastro", async (req, res) => {
  try {
    const { nome, email, senha, telefone, endereco } = req.body;
    
    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        erro: "Nome, email e senha são obrigatórios" 
      });
    }
    
    if (senha.length < 6) {
      return res.status(400).json({ 
        erro: "Senha deve ter no mínimo 6 caracteres" 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        erro: "Email inválido" 
      });
    }
    
    const db = readDB();
    
    // Verificar se email já existe
    const usuarioExiste = db.usuarios.find(u => u.email === email);
    if (usuarioExiste) {
      return res.status(400).json({ 
        erro: "Email já cadastrado" 
      });
    }
    
    // Criptografar senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Criar novo usuário
    const novoUsuario = {
      id: db.usuarios.length + 1,
      nome,
      email,
      senha: senhaHash,
      telefone: telefone || "",
      endereco: endereco || "",
      dataCadastro: new Date().toISOString()
    };
    
    db.usuarios.push(novoUsuario);
    writeDB(db);
    
    // Retornar sem a senha
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    
    res.status(201).json({ 
      mensagem: "Usuário cadastrado com sucesso!",
      usuario: usuarioSemSenha
    });
    
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Validações
    if (!email || !senha) {
      return res.status(400).json({ 
        erro: "Email e senha são obrigatórios" 
      });
    }
    
    const db = readDB();
    
    // Buscar usuário
    const usuario = db.usuarios.find(u => u.email === email);
    if (!usuario) {
      return res.status(401).json({ 
        erro: "Email ou senha incorretos" 
      });
    }
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ 
        erro: "Email ou senha incorretos" 
      });
    }
    
    // Retornar sem a senha
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    res.json({ 
      mensagem: "Login realizado com sucesso!",
      usuario: usuarioSemSenha
    });
    
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro ao fazer login" });
  }
});

// ============= ROTAS DE PRODUTOS =============

// Listar produtos
app.get("/api/produtos", (req, res) => {
  try {
    const db = readDB();
    const { categoria, busca } = req.query;
    
    let produtos = db.produtos;
    
    // Filtrar por categoria
    if (categoria && categoria !== "todos") {
      produtos = produtos.filter(p => p.categoria === categoria);
    }
    
    // Buscar por nome
    if (busca) {
      const termo = busca.toLowerCase();
      produtos = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo)
      );
    }
    
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ erro: "Erro ao listar produtos" });
  }
});

// Buscar produto por ID
app.get("/api/produtos/:id", (req, res) => {
  try {
    const db = readDB();
    const produto = db.produtos.find(p => p.id === parseInt(req.params.id));
    
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    
    res.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});

// ============= ROTAS DE PEDIDOS =============

// Criar pedido
app.post("/api/pedidos", (req, res) => {
  try {
    const { usuarioId, itens, total } = req.body;
    
    // Validações
    if (!usuarioId || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ 
        erro: "Dados do pedido inválidos" 
      });
    }
    
    const db = readDB();
    
    // Verificar usuário
    const usuario = db.usuarios.find(u => u.id === usuarioId);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    
    // Verificar estoque
    for (const item of itens) {
      const produto = db.produtos.find(p => p.id === item.produtoId);
      if (!produto) {
        return res.status(404).json({ 
          erro: `Produto ${item.produtoId} não encontrado` 
        });
      }
      if (produto.estoque < item.quantidade) {
        return res.status(400).json({ 
          erro: `Estoque insuficiente para ${produto.nome}` 
        });
      }
    }
    
    // Atualizar estoque
    for (const item of itens) {
      const produto = db.produtos.find(p => p.id === item.produtoId);
      produto.estoque -= item.quantidade;
    }
    
    // Criar pedido
    const novoPedido = {
      id: db.pedidos.length + 1,
      usuarioId,
      itens,
      total,
      status: "pendente",
      dataPedido: new Date().toISOString()
    };
    
    db.pedidos.push(novoPedido);
    writeDB(db);
    
    res.status(201).json({ 
      mensagem: "Pedido realizado com sucesso!",
      pedido: novoPedido
    });
    
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

// Listar pedidos do usuário
app.get("/api/pedidos/:usuarioId", (req, res) => {
  try {
    const db = readDB();
    const usuarioId = parseInt(req.params.usuarioId);
    
    const pedidos = db.pedidos.filter(p => p.usuarioId === usuarioId);
    
    // Adicionar detalhes dos produtos
    const pedidosDetalhados = pedidos.map(pedido => {
      const itensDetalhados = pedido.itens.map(item => {
        const produto = db.produtos.find(p => p.id === item.produtoId);
        return {
          ...item,
          nome: produto ? produto.nome : "Produto removido",
          imagem: produto ? produto.imagem : ""
        };
      });
      
      return {
        ...pedido,
        itens: itensDetalhados
      };
    });
    
    res.json(pedidosDetalhados);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

// ============= ROTA DE SAÚDE =============
app.get("/api/health", (req, res) => {
  const db = readDB();
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    stats: {
      usuarios: db.usuarios.length,
      produtos: db.produtos.length,
      pedidos: db.pedidos.length
    }
  });
});

// ============= TRATAMENTO DE ERROS =============
app.use((err, req, res, next) => {
  console.error("Erro:", err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

// ============= INICIAR SERVIDOR =============
app.listen(PORT, () => {
  console.log("🧁 ========================================");
  console.log("🧁   BERSERK CANDY - Backend v2.1");
  console.log("🧁 ========================================");
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log("🧁 ========================================");
});
