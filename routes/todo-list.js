import express from 'express';
import pool from '../api/db.js';

const router = express.Router();

router.get("/", express.json(), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM todos');
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

router.post("/", express.json(), async (req, res) => {
    const { text } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO todos (text) VALUES (?)', [text]);
        res.status(200).end(JSON.stringify({ id: parseInt(result.insertId) }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

router.delete("/", express.json(), async (req, res) => {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM todos WHERE id=?', [id]);
        res.status(200).end(JSON.stringify({ success: result.affectedRows }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
});

router.put("/", express.json(), async (req, res) => {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE todos SET completed=NOT completed WHERE id=?', [id]);
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
