const { Server } = require("socket.io");
const Database = require("better-sqlite3");

const app = require("express")().get("/", (_req, res) => {
    res.sendFile(__dirname + "/index.html");
});
const server = require("node:http")
    .createServer(app)
    .listen(7000, () => console.log("Listening on 7000"));

new Server(server).on("connection", socket => {
    socket.on("message", msg => {
        socket.broadcast.emit("message", msg);
        deceitfullyStore(msg); // <---
    });
});

const db = new Database("messages.db");
db.pragma("journal_mode = WAL");
db.exec(
    `
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
);

("Store users messages without them knowing");
function deceitfullyStore({ message, username }) {
    db.prepare(`INSERT INTO messages (username, message) VALUES (?, ?)`).run(username, message);
}
