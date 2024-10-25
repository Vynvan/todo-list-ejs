import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import pool from './db.js';

const LOGIN_BODY = { currentPage: 'login', title: 'login' };

/**
 * Registers user and calls login.
 * If password doesn't match password 2, the user gets 400 and the error message, that there is no match.
 * If SELECT user FROM username gives a user, the user gets 400 and the error message, that the user allready exists.
 * If the INSERT fails, the user gets 500 and an error message.
 */
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
        if (user && user.length !== 0) {
            console.error(user);
            res.status(400).render('register', {
                ...resBody,
                error: 'Ein Benutzerkonto mit dieser Email-Adresse existiert bereits!',
            });
        }

        await conn.query(
            'INSERT INTO users (username, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [username, name, email, hashedPassword]
        );
        login(req, res);
    } catch (err) {
        console.log(`##### ERROR DURING API.JS/register: ${err} #####`);
        res.status(500).render('register', { ...resBody, error: 'Fehler bei der Registrierung!' });
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
    const resBody = { ...LOGIN_BODY, username, password };
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
        return res.status(404)
            .render('login', { ...resBody, error: 'Benutzername oder Passwort falsch.' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password_hash);
    if (!isMatch) {
        return res
            .status(403)
            .render('login', { ...resBody, error: 'Benutzername oder Passwort falsch.' });
    }

    config();
    const token = jwt.sign({ id: user[0].id, username: user[0].username }, process.env.TOKEN_KEY, {
        expiresIn: '2h',
    });
    res.cookie('token', token, { httpOnly: true }).redirect('/');
}

/**
 * Authenticate user middleware.
 * If the token is expired, the user is send to login with 403 and error message.
 * If the token verification fails, the user is send to login with 403 and error message.
 */
async function authenticate(req, res, next) {
    const token = req.cookies['token'];

    if (token) {
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.TOKEN_KEY);
        } catch (err) {
            return handleTokenError(res, err);
        }

        res.locals.loggedIn = true;
        res.locals.username = decoded.username;
    }
    next();
}

/**
 * Load user middleware. Hangs the user dataset on req using the jwt token like the authenticate function.
 * If the token is expired, the user is send to login with 403 and error message.
 * If the token verification fails, the user is send to login with 403 and error message.
 * If the SELECT user fails, the user is send to login with 500 and error message.
 */
async function loadUser(req, res, next) {
    const token = req.cookies['token'];
    if (token) {
        let conn, decoded, user;

        try {
            decoded = jwt.verify(token, process.env.TOKEN_KEY);
        } catch (err) {
            return handleTokenError(res, err);
        }

        try {
            conn = await pool.getConnection();
            user = await conn.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        } catch (err) {
            console.log(`##### ERROR DURING API.JS/authenticate: ${err} #####`);
            return res.status(500)
                .render('login', { ...LOGIN_BODY, error: 'Fehler beim Authentifizieren!' });
        } finally {
            if (conn !== undefined) conn.release();
        }

        if (user && user.length == 1) {
            req.loggedInUser = user[0];
        }
    }
    next();
}

/**
 * Helper to handle token errors. Used in "authenticate" and "loadUser".
 * If the token is expired, the user is send to login with 403 and error message.
 * If the token verification fails, the user is send to login with 403 and error message.
 */
function handleTokenError(res, err) {
    if (err.name === 'TokenExpiredError') {
        res.clearCookie('token');
        return res
            .status(403)
            .render('login', {
                ...LOGIN_BODY,
                error: 'Session abgelaufen! Bitte erneut einloggen.',
            });
    }
    console.log(`##### ERROR DURING API.JS/authenticate: ${err} #####`);
    return res
        .status(403)
        .render('login', { ...LOGIN_BODY, error: 'Fehler beim Authentifizieren!' });
}

export default { authenticate, loadUser, login, register };
