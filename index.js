import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(dirname)
console.log(path.join(dirname, 'assets'))

// Statische Assets bereitstellen
app.use('/assets', express.static(path.join(dirname, 'assets')));
app.use('/css', express.static(path.join(dirname, 'css')));
app.use('/theme/css', express.static(path.join(dirname, 'theme', 'css')));


// EJS als View-Engine einrichten
app.set("view engine", "ejs");


// Routes
app.get('/', (req, res) => {
  res.render('index', { currentPage: 'index' });
});

app.get('/todo-list', (req, res) => {
  res.render('todo-list', { currentPage: 'todo-list' });
});

app.get('/praesentation', (req, res) => {
  res.render('praesentation', { currentPage: 'presentation' });
});


// Server starten
app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
