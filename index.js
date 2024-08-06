const express = require("express");
const app = express();
// const server = require("http").createServer(app);
const { Server } = require("socket.io");
const { addUser, getUser, removeUser, getUsersInRoom } = require("./utils/users");
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
    cors: {
        origin: "https://whiteboard-frontend-henna.vercel.app",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

// Routes
app.get("/", (req, res) => {
    res.send("This is the server for the whiteboard app");
});

// let roomIdGlobal, imgURLGlobal;

io.on("connection", (socket) => {
    let roomIdGlobal, imgURLGlobal;
    // console.log("user connected1");
    socket.on("userJoined", (data) => {
        const { name, roomId, userId, host, presenter } = data;
        roomIdGlobal = roomId;
        socket.join(roomId);
        // const socketId1 = `${socket.id}`;
        // console.log(socket.id);
        // const users = addUser(name, roomId, userId, host, presenter, socketId: socket.id);
        const users = addUser({
            name,
            roomId,
            userId,
            host,
            presenter,
            socketId: socket.id
        });

        // console.log("user connected2");
        socket.emit("userIsJoined", { success: true, users });
        socket.broadcast.to(roomId).emit("userIsJoinedMessageBroadcasted", name);
        socket.broadcast.to(roomId).emit("allUsers", users);
        socket.broadcast.to(roomId).emit("whiteBoardDataResponse", {
            imgURL: imgURLGlobal,
        })
        // console.log(users);
        // console.log(data);
        // const user = getUser(socket.id);
        // console.log(user);
    });

    socket.on("message", (data) => {
        const { message } = data;
        // console.log(message);
        const user = getUser(socket.id);
        // console.log(socket.id);
        // console.log(user);
        // console.log("roomid", roomIdGlobal);
        // socket.broadcast.to(roomIdGlobal).emit("messageResponse", { message, name: "" });
        if (user) {
            socket.broadcast.to(user.roomId).emit("messageResponse", { message, name: user.name });
            // console.log(user.name);
        }
    })

    socket.on("disconnect", () => {
        // console.log("someone disconnected")
        // socket.broadcast.to(roomIdGlobal).emit("userLeftMessageBroadcasted", "Someone");
        // console.log(socket.id);
        const user = getUser(socket.id);
        // console.log(user);
        if (user) {
            removeUser(socket.id);
            const users = getUsersInRoom(roomIdGlobal);
            // console.log("users", users);
            socket.broadcast.to(user.roomId).emit("userLeftMessageBroadcasted", user.name);
            socket.broadcast.to(user.roomId).emit("allUsers", users);
        } else {
            socket.broadcast.to(roomIdGlobal).emit("userLeftMessageBroadcasted", "Someone");
        }
    });

    socket.on("whiteboardData", (data) => {
        imgURLGlobal = data;
        socket.broadcast.to(roomIdGlobal).emit("whiteBoardDataResponse", {
            imgURL: data,
        })
    });
});


// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server is running on port ${port}`));