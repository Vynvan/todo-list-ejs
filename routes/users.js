import express from 'express';
import auth from "../api/auth.js";

const router = express.Router();


// Registration
router.get("/register", (req, res) => {
    res.render("register", { currentPage: "register", title: "Registrierung" });
});

router.post("/register", auth.register);


// Login
router.get("/login", (req, res) => {
    res.render("login", { currentPage: "login", title: "Login" });
});

router.post("/login", auth.login);


// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

export default router;
