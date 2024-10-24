import pool from './db.js';

async function getTodos(req, res) {
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
}

async function createTodo(req, res) {
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
}

async function deleteTodo(req, res) {
    const { id } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM todos WHERE id=?', [id]);
        console.log(result)
        res.status(200).end(JSON.stringify({ id: parseInt(result.insertId) }));
    } catch (err) {
        handleError(err, res, 'addTodo');
    } finally {
        if (conn !== undefined) conn.release();
    }
}

function handleError(err, res, method="") {
    console.log(`##### ERROR DURING API.JS/${method}: ${err} #####`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to read data from database.');
}

export default { getTodos, createTodo, deleteTodo };