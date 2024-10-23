import bcript from "bcryptjs";
import pool from "./db.js";

async function register(req, res) {
    const { username, name, email, password } = req.body;
    const hashedPassword = await bcript.hash(password, 10);
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            "INSERT INTO users (username, name, email, password_hash) VALUES (?, ?, ?, ?)",
            [username, name, email, hashedPassword]
        );
        res.status(201).redirect("/");
    }
    catch (err) {
        console.log("##### ERROR DURING AUTH.JS:", err);
        res.status(500).send("Fehler bei der Registrierung");
    }
    finally {
        conn.release();
    }
}

export default register;