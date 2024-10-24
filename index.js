import express from "express";
import api from "./api/api.js";
import auth from "./api/auth.js";


const app = express();


// Statische Assets bereitstellen
app.use(express.static("public"));


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
app.post("/register", express.urlencoded({ extended: true }), auth.register);


// JSON-Routes
app.get("/api", express.json(), api.getTodos);
app.post("/api", express.urlencoded({ extended: true }), express.json(), api.createTodo);


// Server starten
app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000");
});