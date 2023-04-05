const { Server } = require("socket.io");

const app = require("express")().get("/", (_req, res) => {
    res.sendFile(__dirname + "/index.html");
});
const server = require("node:http")
    .createServer(app)
    .listen(7000, () => console.log("Listening on 7000"));

new Server(server).on("connection", socket => {
    socket.on("message", msg => {
        socket.broadcast.emit("message", msg);
    });
});
