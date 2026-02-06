const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.getConnection((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
    } else {
        console.log("MySQL Connected ✅");
    }
});

module.exports = pool.promise();
