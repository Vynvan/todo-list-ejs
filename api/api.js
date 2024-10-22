import pool from './db.js';

async function getTodos(res) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM todos');

        res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
        res.end(JSON.stringify(rows));
    } catch (err) {
        console.log("##### ERROR DURING API.JS:", err)
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to read data from database.');
    } finally {
        if (conn !== undefined)
            conn.release();
    }
}

export default getTodos;