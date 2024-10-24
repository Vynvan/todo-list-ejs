import bcript from 'bcryptjs';
import pool from './db.js';

async function register(req, res) {
    const { username, name, email, password, password2 } = req.body;
    const hashedPassword = await bcript.hash(password, 10);
    let conn;

    if (password !== password2) {
        res.status(400).render('register', {
            currentPage: 'register',
            title: 'Registrierung',
            err: 'Passwort bestätigen und Passwort ungleich!',
        });
    }

    try {
        conn = await pool.getConnection();

        const user = await conn.query('SELECT id FROM users WHERE email=?', [
            email,
        ]);
        if (user) {
            console.error(user);
            res.status(400).render('register', {
                currentPage: 'register',
                title: 'Registrierung',
                err: 'Die Email wird von einem anderen Benutzerkonto verwendet!',
            });
        }

        await conn.query(
            'INSERT INTO users (username, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [username, name, email, hashedPassword]
        );
        res.status(201).redirect('/');
    } catch (err) {
        console.log('##### ERROR DURING AUTH.JS:', err);
        res.status(500).send('Fehler bei der Registrierung');
    } finally {
        if (conn !== undefined) conn.release();
    }
}

export default { register };
