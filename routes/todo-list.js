import express from 'express';
import pool from '../api/db.js';
import auth from '../api/auth.js';

const router = express.Router();
router.use(express.json());
router.use(auth.loadUser);

router.get('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT id, text, completed AS done, ix FROM todos WHERE userid=?',
            [req.loggedInUser.id]
        );
        res.writeHead(200, {
            'Content-Type': 'application/json;charset=utf-8',
        });
        res.end(JSON.stringify(rows));
    } catch (err) {
        handleError(err, res, 'getTodos');
    } finally {
        if (conn) conn.release();
    }
});

router.post('/', async (req, res) => {
    const { text } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const [{ maxIx }] = await conn.query('SELECT COALESCE(MAX(ix), -1) AS maxIx FROM todos');
        const ix = maxIx + 1;
        const result = await conn.query('INSERT INTO todos (text, userid, ix) VALUES (?, ?, ?)', [
            text,
            req.loggedInUser.id,
            ix,
        ]);
        res.status(200).end(JSON.stringify({ id: parseInt(result.insertId), ix }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn) conn.release();
    }
});

router.delete('/', async (req, res) => {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM todos WHERE id=? AND userid=?', [
            id,
            req.loggedInUser.id,
        ]);
        res.status(200).end(JSON.stringify({ success: result.affectedRows }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn) conn.release();
    }
});

router.put('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        if (req.body.items && req.body.items.length > 0) {
            let affectedRows = 0;
            req.body.items.forEach(async ({ id, ix, text, done }) => {
                const result = updateItem(conn, req.loggedInUser.id, id, done, ix, text);
                if (result)
                    affectedRows += result.affectedRows || 0;
            });
            res.status(200).end(JSON.stringify({ success: affectedRows }));
        }
        else {
            const { id, ix, text, done } = req.body;
            const result = updateItem(conn, req.loggedInUser.id, id, done, ix, text);
            res.status(200).end(JSON.stringify({ success: result ? result.affectedRows : 0 }));
        }
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn) conn.release();
    }
});

function handleError(err, res, method = '') {
    console.log(`##### ERROR DURING TODO-LIST.JS/${method}: ${err} #####`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to read data from database.');
}

async function updateItem(conn, userId, id, done, ix, text) {
    const result = await conn.query(
        'UPDATE todos SET completed=?, ix=?, text=? WHERE id=? AND userid=?', [
            done ? 1 : 0,
            ix,
            text,
            id,
            userId,
    ]);
    return result;
}


export default router;
