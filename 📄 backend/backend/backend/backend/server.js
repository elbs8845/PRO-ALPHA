const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
const { auth } = require('./middleware');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'alpha_secreta';

/* LOGIN */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM usuarios WHERE email=? AND ativo=1', [email], async (e, r) => {
    if (!r.length) return res.sendStatus(401);
    const ok = await bcrypt.compare(senha, r[0].senha);
    if (!ok) return res.sendStatus(401);

    const token = jwt.sign({
      id: r[0].id,
      perfil: r[0].perfil,
      equipe: r[0].equipe
    }, SECRET);

    res.json({ token, perfil: r[0].perfil });
  });
});

/* ADM cria usuários */
app.post('/usuarios', auth, (req, res) => {
  if (req.user.perfil !== 'adm') return res.sendStatus(403);
  const hash = bcrypt.hashSync(req.body.senha, 10);
  db.query(
    'INSERT INTO usuarios (nome,email,senha,perfil,equipe) VALUES (?,?,?,?,?)',
    [req.body.nome, req.body.email, hash, req.body.perfil, req.body.equipe]
  );
  res.sendStatus(200);
});

/* Leads */
app.post('/leads', auth, (req, res) => {
  db.query(
    'INSERT INTO leads (nome,telefone,email,vendedor_id) VALUES (?,?,?,?)',
    [req.body.nome, req.body.telefone, req.body.email, req.user.id]
  );
  res.sendStatus(200);
});

app.get('/leads', auth, (req, res) => {
  let sql = req.user.perfil === 'vendedor'
    ? `SELECT * FROM leads WHERE vendedor_id=${req.user.id}`
    : `SELECT l.* FROM leads l JOIN usuarios u ON l.vendedor_id=u.id WHERE u.equipe='${req.user.equipe}'`;

  db.query(sql, (e, r) => res.json(r));
});

/* Dashboard */
app.get('/dashboard', auth, (req, res) => {
  db.query(`
    SELECT 
    (SELECT SUM(valor) FROM vendas) total,
    (SELECT valor FROM metas LIMIT 1) meta
  `, (e, r) => res.json(r[0]));
});

/* Ranking */
app.get('/ranking', auth, (req, res) => {
  db.query(`
    SELECT u.nome, SUM(v.valor) total
    FROM vendas v JOIN usuarios u ON v.usuario_id=u.id
    GROUP BY u.id ORDER BY total DESC
  `, (e, r) => res.json(r));
});

app.listen(3000, () => console.log('🚀 Backend rodando'));
