const express = require("express");
const path = require("path");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

let numberOfRooms = 0;

app.use(express.static("."));
app.get("/", (request, respond) => {
  respond.sendFile(path.join(__dirname, "client/index.html"));
});

io.on("connection", (socket) => {
  // 새 게임 생성
  socket.on("createGame", (data) => {
    socket.join(`${++numberOfRooms}`);
    socket.emit(`newGame`, { name: data.name, room: `${numberOfRooms}` });
  });

  // 방에 참여
  socket.on("joinGame", function (data) {
    if (data.room > numberOfRooms) {
      socket.emit("err", { message: `해당 방은 존재하지않습니다!` });
      return;
    }

    const room = io.nsps["/"].adapter.rooms[data.room];

    if (room && room.length < 2) {
      socket.join(data.room);
      socket.broadcast.to(data.room).emit("player1", {});
      socket.emit("player2", { name: data.name, room: data.room });
    } else {
      socket.emit("err", { message: `방이 닫혔습니다!` });
    }
  });

  socket.on("playTurn", (data) => {
    socket.broadcast.to(data.room).emit("turnPlayed", {
      tile: data.tile,
      room: data.room,
    });
  });

  socket.on("gameEnded", (data) => {
    numberOfRooms--;
    socket.broadcast.to(data.room).emit("gameEnd", data);
    socket.leave(data.room);
  });

  socket.on("disconnecting", function () {
    if (numberOfRooms >= 1) {
      numberOfRooms--;
    }
    var self = this;
    var rooms = Object.keys(self.rooms);

    rooms.forEach(function (room) {
      self.to(room).emit("userDisconnect", numberOfRooms);
      socket.leave();
    });
  });

  // 채팅
  socket.on("chat message", function (message) {
    console.log(message);
    socket.broadcast.emit("chat message", message);
  });
});

server.listen(process.env.PORT || 8888);
