import Game from "./Game.js";
import Player from "./Player.js";

const socket = io.connect("http://Localhost:8888");

function init() {
  const player1 = "white";
  const player2 = "black";

  // 새로운 게임 생성
  $("#new").on("click", () => {
    const name = $("#makeName").val();
    if (!name) {
      alert("사용자의 닉네임을 입력해주세요!");
      return;
    }
    player = new Player(name, player1);
    socket.emit("createGame", { name });
  });

  // Join an existing game on the entered roomId.
  $("#join").on("click", () => {
    const name = $("#roomJoin").val();
    const room = $("#room").val();

    if (!name || !room) {
      alert("접속할 방의 정보를 확인해주세요!");
      return;
    }
    player = new Player(name, player2);
    socket.emit("joinGame", { name, room });
  });

  // 엔터입력
  $("#makeName").keyup((e) => {
    if (e.which == 13) {
      $("#new").click();
    }
  });

  $("#roomJoin").keyup((e) => {
    if (e.which == 13) {
      $("#join").click();
    }
  });

  $("#room").keyup((e) => {
    if (e.which == 13) {
      $("#join").click();
    }
  });

  // 새로운 게임이 만들어짐
  socket.on("newGame", (data) => {
    const message = `Hello ${data.name}<br/> Game ID: 
        ${data.room}<br/> Waiting for player 2...`;

    // 방만들어짐
    game = new Game(data.room);
    game.displayBoard(message);
  });

  // player1 접속했을 때
  socket.on("player1", (data) => {
    const message = `반갑습니다. ${player.getName()}`;
    $("#userHello").html(message);
    player.setMyTurn(false);
  });

  // player2 접속했을 때
  socket.on("player2", (data) => {
    const message = `반갑습니다. ${data.name}`;

    // Create game for player 2
    game = new Game(data.room);
    game.displayBoard(message);
    player.setMyTurn(true);
  });

  //After played turn update board and give new turn to other player
  socket.on("turnPlayed", (data) => {
    let row = game.getRow(data.tile);
    let col = game.getCol(data.tile);

    const opponentColor = player.getColor() === player1 ? player2 : player1;
    game.updateBoard(opponentColor, row, col, data.tile);
    player.setMyTurn(true);
  });

  //Notify users that game has ended
  socket.on("gameEnd", (data) => {
    game.endGameMessage(data.message);
  });

  //If there is error, send message and reload page
  socket.on("err", (data) => {
    alert(data.message);
    location.reload();
  });

  socket.on("userDisconnect", () => {
    const message = `You win! Other player was disconnected!`;
    game.endGameMessage(message);
  });
}

init();
