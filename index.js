import express from "express";
import cookieParser from "cookie-parser";
import pagesRouter from "./routes/pages.js";
import todolistRouter from "./routes/todo-list.js";
import usersRouter from "./routes/users.js";
import auth from "./api/auth.js";

const app = express();

// EJS als View-Engine einrichten
app.set("view engine", "ejs");

// Middlewares
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auth.authenticate);

// Routers
app.use('/', pagesRouter);
app.use('/', usersRouter);
app.use('/api', todolistRouter);

// Server starten
app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000");
});