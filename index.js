import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import getTodos from "./api/api.js";


const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));


// Statische Assets bereitstellen
app.use('/assets', express.static(path.join(dirname, 'public', 'assets')));
app.use('/css', express.static(path.join(dirname, 'public', 'css')));
app.use('/js', express.static(path.join(dirname, 'public', 'js')));
app.use('/theme/css', express.static(path.join(dirname, 'public', 'theme', 'css')));


// EJS als View-Engine einrichten
app.set("view engine", "ejs");


// EJS-Routes
app.get('/', (req, res) => {
  res.render('index', { currentPage: 'index' });
});

app.get('/todo-list', (req, res) => {
  res.render('todo-list', { currentPage: 'todo-list' });
});

app.get('/praesentation', (req, res) => {
  res.render('praesentation', { currentPage: 'presentation' });
});


// JSON-Routes
app.get('/api', express.json(), (req, res) => {
  return getTodos(res);
});


// Server starten
app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});