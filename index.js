import express from "express";
import cookieParser from "cookie-parser";
import api from "./api/api.js";
import auth from "./api/auth.js";


const app = express();


// Middlewares
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auth.authenticate);

// EJS als View-Engine einrichten
app.set("view engine", "ejs");


// EJS-Routes
app.get("/", (req, res) => {
    res.render("index", { currentPage: "index" });
});

app.get("/todo-list", (req, res) => {
    res.render("todo-list", { currentPage: "todo-list" });
});

app.get("/praesentation", (req, res) => {
    res.render("praesentation", { currentPage: "presentation" });
});


// Registration
app.get("/register", (req, res) => {
    res.render("register", { currentPage: "register", title: "Registrierung" });
});
app.post("/register", auth.register);


// Login
app.get("/login", (req, res) => {
    res.render("login", { currentPage: "login", title: "Login" });
});
app.post("/login", auth.login);
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// JSON-Routes
app.get("/api", express.json(), api.getTodos);
app.post("/api", express.json(), api.createTodo);
app.delete("/api", express.json(), api.deleteTodo);

// Server starten
app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000");
});