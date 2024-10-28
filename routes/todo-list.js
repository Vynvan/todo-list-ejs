import express from 'express';
import pool from '../api/db.js';
import auth from '../api/auth.js';

const router = express.Router();
router.use(express.json());
router.use(auth.loadUser);

router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT id, text, completed AS done, ix FROM todos WHERE userid=?', [req.loggedInUser.id]);
        res.writeHead(200, {
            'Content-Type': 'application/json;charset=utf-8',
        });
        res.end(JSON.stringify(rows));
    } catch (err) {
        handleError(err, res, 'getTodos');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

router.post("/", async (req, res) => {
    const { text } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const max = await conn.query('SELECT COALESCE(MAX(ix), -1) AS maxIx FROM todos');
        const result = await conn.query('INSERT INTO todos (text, userid, ix) VALUES (?, ?, ?)', 
            [text, req.loggedInUser.id, max[0].maxIx + 1]);
        res.status(200).end(JSON.stringify({ id: parseInt(result.insertId) }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

router.delete("/", async (req, res) => {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM todos WHERE id=? AND userid=?', [id, req.loggedInUser.id]);
        res.status(200).end(JSON.stringify({ success: result.affectedRows }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

router.put("/", async (req, res) => {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE todos SET completed=NOT completed WHERE id=? AND userid=?', [id, req.loggedInUser.id]);
        res.status(200).end(JSON.stringify({ success: result.affectedRows }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

function handleError(err, res, method="") {
    console.log(`##### ERROR DURING TODO-LIST.JS/${method}: ${err} #####`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to read data from database.');
}

export default router;
