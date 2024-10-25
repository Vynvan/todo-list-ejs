import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import pool from './db.js';

async function register(req, res) {
    const { username, name, email, password, password2 } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const resBody = {
        currentPage: 'register',
        title: 'Registrierung',
        username,
        name,
        email,
        password,
        password2,
    };
    let conn;

    if (password !== password2) {
        res.status(400).render('register', {
            ...resBody,
            error: 'Passwort und Bestätigung sind unterschiedlich!',
        });
        return;
    }

    try {
        conn = await pool.getConnection();
        const user = await conn.query('SELECT id FROM users WHERE email=?', [email]);
        if (user) {
            console.error(user);
            res.status(400).render('register', {
                ...resBody,
                error: 'Die Email wird von einem anderen Benutzerkonto verwendet!',
            });
        }

        await conn.query(
            'INSERT INTO users (username, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [username, name, email, hashedPassword]
        );
        res.status(201).redirect('/');
    } catch (err) {
        console.log(`##### ERROR DURING API.JS/register: ${err} #####`);
        res.status(500).render('login', { ...resBody, error: 'Fehler bei der Registrierung!' });
    } finally {
        if (conn !== undefined) conn.release();
    }
}

/**
 * Login user and redirect to "/".
 * If SELECT user FROM username fails, the user is send to login with error message.
 * If user not found OR password doesn't match, the user is send to login with error message.
 */
async function login(req, res) {
    const { username, password } = req.body;
    const resBody = {
        currentPage: 'login',
        title: 'Login',
        username,
        password,
    };
    let conn, user;

    try {
        conn = await pool.getConnection();
        user = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    } catch (err) {
        console.log(`##### ERROR DURING API.JS/login: ${err} #####`);
        return res.status(500).render('login', { ...resBody, error: 'Fehler beim Login!' });
    } finally {
        if (conn !== undefined) conn.release();
    }

    if (user && user.length === 0) {
        return res
            .status(404)
            .render('login', { ...resBody, error: 'Benutzername oder Passwort falsch.' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password_hash);
    if (!isMatch) {
        return res
            .status(403)
            .render('login', { ...resBody, error: 'Benutzername oder Passwort falsch.' });
    }

    config();
    const token = jwt.sign(
        { id: user[0].id },
        process.env.TOKEN_KEY,
        { expiresIn: '1h' }
    );
    res.cookie('token', token, { httpOnly: true }).redirect('/');
}

/**
 * Authenticate user middleware. 
 * If the token verification fails, the user is send to login with 403.
 * If the SELECT user fails, the user is send to login with 500.
 */
async function authenticate(req, res, next) {
    const token = req.cookies['token'];
    if (token) {
        let conn, decoded, user;

        try {
            decoded = jwt.verify(token, process.env.TOKEN_KEY);
        }
        catch (err) {
            console.log(`##### ERROR DURING API.JS/authenticate: ${err} #####`);
            return res.status(403).render('login', { error: 'Fehler beim Authentifizieren!' });
        }

        try {
            conn = await pool.getConnection();
            user = await conn.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        } catch (err) {
            console.log(`##### ERROR DURING API.JS/authenticate: ${err} #####`);
            return res.status(500).render('login', { error: 'Fehler beim Authentifizieren!' });
        } finally {
            if (conn !== undefined) conn.release();
        }
    
        if (user && user.length == 1) {
            req.loggedInUser = user[0];
            res.locals.loggedIn = true;
        }
    }
    next();
}

export default { authenticate, login, register };
