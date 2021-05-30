var time; // 시간 전역관리

class Game {
  constructor(room) {
    this.room = room; // 방
    this.board = []; // 맵
    this.changes = 0; // 움직임 횟수
  }

  // 게임 판 만들기
  createBoard() {
    function createHandler() {
      let row, col;

      row = game.getRow(this.id);
      col = game.getCol(this.id);

      // 사용자의 턴이 아닐 때
      if (!player.getMyTurn() || !game) {
        alert("유저의 턴이 아닙니다!");
        return;
      }

      // 이미 시작된 경우
      if ($(this).prop("disabled")) {
        alert("이미 시작된 경기입니다!");
        return;
      }

      // 게임판 업데이트
      game.updateTurn(this);
      game.updateBoard(player.getColor(), row, col, this.id);

      // 승리 체크
      game.checkWin();
      player.setMyTurn(false);
    }

    $("#color").css("background-color", `${player.getColor()}`);
    game.makeTile(createHandler);

    if (player.getColor() != "white" && this.changes == 0) {
      game.setTimer();
    } else {
      $(".center").prop(`disabled`, true);
    }
  }

  // 판 만들기
  makeTile(clickHandler) {
    // 돔에 그려줘야한다.
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 14; j++) {
        $(".center").append(
          `<button class="tile" id="button_${i}_${j}"></button>`
        );
      }
      $(".center").append(
        `<button class="tile" id="button_${i}_14" style="float:none;"/>`
      );
    }

    // 클릭 이벤트 등록
    for (let i = 0; i < 15; i++) {
      this.board.push([""]);
      for (let j = 0; j < 15; j++) {
        $(`#button_${i}_${j}`).on("click", clickHandler);
      }
    }
  }

  // 타이머 설정
  setTimer() {
    $("#time").text(`Time : ${player.getTime()}`);

    time = setInterval(() => {
      player.timeLimit--; // 시간 감소
      $("#time").text(`Time : ${player.getTime()}`);

      // 남은 시간이 0초일 때
      if (player.getTime() == 0) {
        let winner;

        if (player.getColor() == "white") {
          winner = "black";
        } else {
          winner = "white";
        }

        socket.emit("gameEnded", {
          room: game.getRoom(),
          message: winner,
        });
        console.log(winner);
        game.gameEnd(winner);

        clearInterval(time);
      }
    }, 1000);
  }

  // 게임 판을 보여주기 위한 함수
  displayBoard(msg) {
    $(".menu").css("display", "none");
    $(".gameBoard").css("display", "block");
    $(".chat").css("display", "block");
    $("#userHello").html(msg);
    this.createBoard();
  }

  // 게임 판 업데이트
  updateBoard(color, row, col, tile) {
    clearInterval(time);
    $("#time").text(`당신의 턴이 아닙니다!`);
    $(".center").prop(`disabled`, true);
    if (!player.getMyTurn()) {
      game.setTimer();
      $(".center").prop(`disabled`, false);
    }
    $(`#${tile}`)
      .css("backgroundImage", `url(/client/public/images/${color}Pawn.png)`)
      .prop("disabled", true);
    this.board[row][col] = color[0];
    this.changes++;
  }

  // 행 구하는 함수
  getRow(id) {
    let row;
    if (id.split("_")[1][1] != undefined) {
      row = id.split("_")[1][0] + id.split("_")[1][1];
    } else {
      row = id.split("_")[1][0];
    }
    return row;
  }

  // 열 구하는 함수
  getCol(id) {
    let col;
    if (id.split("_")[2][1] != undefined) {
      col = id.split("_")[2][0] + id.split("_")[2][1];
    } else {
      col = id.split("_")[2][0];
    }
    return col;
  }

  getRoom() {
    return this.room;
  }

  // 상대방 게임판에 업데이트 요청 함수
  updateTurn(tile) {
    const clickedTile = $(tile).attr("id");

    // 턴 체인지
    socket.emit("playTurn", {
      tile: clickedTile,
      room: this.getRoom(),
    });
  }

  // 게임 종료시 메세지
  gameEnd(message) {
    $(".tile").attr("disabled", true);

    setTimeout(function () {
      $(".gameBoard").css("display", "none");
      $(".chat").css("display", "none");
      $(".center").empty();
      if (message.includes(player.getColor())) {
        $("#message").text("당신이 승리했습니다!!");
        setTimeout(function () {
          location.reload();
        }, 1500);
      } else if (message.includes("접속끊김")) {
        $("#message").text(message);
        setTimeout(function () {
          location.reload();
        }, 1500);
      } else if (message.includes("draw")) {
        $("#message").text(message);
        setTimeout(function () {
          location.reload();
        }, 1500);
      } else {
        $("#message").text("You loose!");
        setTimeout(function () {
          location.reload();
        }, 1500);
      }

      $(".menu").css("display", "block");
      $(".welcome").remove();
    }, 1000);
  }

  // 행 5개 일치하는지 체크 함수
  checkInHorizontal(color) {
    let value = 0;
    for (let row = 0; row < 15; row++) {
      value = 0;
      for (let col = 0; col < 15; col++) {
        if (game.board[row][col] != color) {
          value = 0;
        } else {
          value++;
        }
        if (value == 5) {
          this.sendEnd();
          return;
        }
      }
    }
  }

  // 열 5개 일치하는지 체크 함수
  checkInVertical(color) {
    let value = 0;
    for (let col = 0; col < 15; col++) {
      value = 0;
      for (let row = 0; row < 15; row++) {
        if (game.board[row][col] != color) {
          value = 0;
        } else {
          value++;
        }
        if (value == 5) {
          this.sendEnd();
          return;
        }
      }
    }
  }

  // 왼쪽 상단, 오른쪽 하단 대각 체크
  checkTopLeftBottomRight(color) {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 10; row++) {
        let match = true;
        for (let i = 0; i < 5; i++) {
          if (color != game.board[row + i][col + i]) {
            match = false;
          }
        }
        if (match) {
          this.sendEnd();
          return;
        }
      }
    }
  }

  // 왼쪽 하단, 오른쪽 상단 대각 체크
  checkTopRightBottomLeft(color) {
    for (let col = 0; col < 15; col++) {
      if (col > 4) {
        for (let row = 0; row < 10; row++) {
          let match = true;
          for (let i = 0; i < 5; i++) {
            if (color != game.board[row + i][col - i]) {
              match = false;
            }
          }

          if (match) {
            this.sendEnd();
            return;
          }
        }
      }
    }
  }

  // 유저가 플레이 한 뒤 승리했는 지 조건 확인하는 함수
  checkWin() {
    this.checkInHorizontal(player.getColor()[0]);
    this.checkInVertical(player.getColor()[0]);
    this.checkTopLeftBottomRight(player.getColor()[0]);
    this.checkTopRightBottomLeft(player.getColor()[0]);

    // 무승부가 됐을 때 !
    const draw = "이번 경기는 무승부입니다!";
    if (this.checkdraw()) {
      socket.emit("gameEnded", {
        room: this.getRoom(),
        message: draw,
      });
      this.gameEnd(draw);
    }
  }

  checkdraw() {
    return this.changes >= 15 * 15;
  }

  // 사용자가 접속이 끊겼을 때
  onDisconnected() {
    socket.emit("gameEnded", {
      room: this.getRoom(),
      message: "접속끊김 : 상대편이 도망가서 승리했습니다!",
    });
  }

  // 승리했을 때 종료 메시지를 전달!
  sendEnd() {
    const winColor = player.getColor();
    socket.emit("gameEnded", {
      room: this.getRoom(),
      message: winColor,
    });
    this.gameEnd(winColor);
  }
}
