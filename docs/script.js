window.onload = () => {
  const canvas = document.getElementById("gameCanvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  // ===== 設定 =====
  const ballRadius = 8;
  const paddleWidth = 100;
  const paddleHeight = 12;
  const paddleMarginBottom = 45;

  const blockRow = 8;
  const blockCol = 12;
  const blockWidth = 50;
  const blockHeight = 25;
  const blockPadding = 4;

  const SIDE_LANE_WIDTH = 80;
  const blockOffsetTop = 80;

  const SPLIT_RATE = 0.3; // 30%で分裂

  const map = [
    "000001100000",
    "100000000001",
    "000100001000",
    "010001100010",
    "100000000001",
    "000100001000",
    "000001100000",
    "111100001111"
  ];

  // ===== 状態 =====
  let gameState = "start"; // start, playing, gameover, clear
  let rightPressed = false;
  let leftPressed = false;

  let balls = [];
  let blocks = [];
  let paddleX = 0;

  // ===== 初期化 =====
  function createBall(x, y, dx, dy) {
    return { x, y, dx, dy };
  }

  function initBlocks() {
    blocks = [];
    const playableWidth = canvas.width - SIDE_LANE_WIDTH * 2;
    const totalBlockWidth =
      blockCol * blockWidth + (blockCol - 1) * blockPadding;

    const blockOffsetLeft =
      SIDE_LANE_WIDTH + (playableWidth - totalBlockWidth) / 2;

    for (let c = 0; c < blockCol; c++) {
      blocks[c] = [];
      for (let r = 0; r < blockRow; r++) {
        blocks[c][r] = {
          x: c * (blockWidth + blockPadding) + blockOffsetLeft,
          y: r * (blockHeight + blockPadding) + blockOffsetTop,
          status: 1,
          type: map[r][c] === "1" ? "steel" : "normal"
        };
      }
    }
  }

  function resetGame() {
    balls = [createBall(canvas.width / 2, canvas.height - 80, 4, -4)];
    paddleX = (canvas.width - paddleWidth) / 2;
    initBlocks();
    gameState = "playing";
  }

  // ===== 入力 =====
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") rightPressed = true;
    if (e.key === "ArrowLeft") leftPressed = true;

    if (
      e.key === "Enter" &&
      (gameState === "start" ||
        gameState === "gameover" ||
        gameState === "clear")
    ) {
      resetGame();
    }
  });

  document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") rightPressed = false;
    if (e.key === "ArrowLeft") leftPressed = false;
  });

  // ===== 衝突 =====
  function collisionDetection() {
    balls.forEach(ball => {
      blocks.forEach(col => {
        col.forEach(b => {
          if (b.status !== 1) return;

          if (
            ball.x + ballRadius > b.x &&
            ball.x - ballRadius < b.x + blockWidth &&
            ball.y + ballRadius > b.y &&
            ball.y - ballRadius < b.y + blockHeight
          ) {
            const overlapX = Math.min(
              ball.x + ballRadius - b.x,
              b.x + blockWidth - (ball.x - ballRadius)
            );
            const overlapY = Math.min(
              ball.y + ballRadius - b.y,
              b.y + blockHeight - (ball.y - ballRadius)
            );

            if (overlapX < overlapY) {
  ball.dx = -ball.dx;

  // ===== 位置補正（左右）=====
  if (ball.x < b.x) {
    ball.x = b.x - ballRadius;
  } else {
    ball.x = b.x + blockWidth + ballRadius;
  }
} else {
  ball.dy = -ball.dy;
  if (ball.y < b.y) {
    ball.y = b.y - ballRadius;
  } else {
    ball.y = b.y + blockHeight + ballRadius;
  }
}

            if (b.type === "steel") return;

            b.status = 0;

            // ===== 確率で分裂 =====
            if (Math.random() < SPLIT_RATE) {
              balls.push(
                createBall(
                  ball.x,
                  ball.y,
                  -ball.dx + (Math.random() - 0.5) * 2,
                  ball.dy
                )
              );
            }
          }
        });
      });
    });
  }

  // ===== 描画 =====
  function drawText(text) {
    ctx.fillStyle = "#fff";
    ctx.font = "26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "start") {
      drawText("PRESS ENTER TO START");
      requestAnimationFrame(draw);
      return;
    }

    if (gameState === "gameover") {
      drawText("GAME OVER - PRESS ENTER");
      requestAnimationFrame(draw);
      return;
    }

    if (gameState === "clear") {
      drawText("CLEAR! PRESS ENTER");
      requestAnimationFrame(draw);
      return;
    }

    // ブロック
    blocks.forEach(col => {
      col.forEach(b => {
        if (b.status !== 1) return;
        ctx.fillStyle = b.type === "steel" ? "#555" : "#ff7a00";
        ctx.fillRect(b.x, b.y, blockWidth, blockHeight);
      });
    });

    // パドル
    const paddleY = canvas.height - paddleHeight - paddleMarginBottom;
    ctx.fillStyle = "#fff";
    ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);

    // ボール
    balls.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#00eaff";
      ctx.fill();
    });

    collisionDetection();

    // 移動
    balls.forEach(ball => {
      if (
        ball.x + ball.dx > canvas.width - ballRadius ||
        ball.x + ball.dx < ballRadius
      ) {
        ball.dx = -ball.dx;
      }

      if (ball.y + ball.dy < ballRadius) {
        ball.dy = -ball.dy;
      }

      if (
        ball.y + ball.dy > paddleY - ballRadius &&
        ball.x > paddleX &&
        ball.x < paddleX + paddleWidth
      ) {
        const hit = (ball.x - paddleX) / paddleWidth - 0.5;
        ball.dx = hit * 10;
        ball.dy = -Math.abs(ball.dy);
      }

      ball.x += ball.dx;
      ball.y += ball.dy;
    });

    // 落下判定
    balls = balls.filter(ball => ball.y - ballRadius <= canvas.height);
    if (balls.length === 0) gameState = "gameover";

    // パドル操作
    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
    if (leftPressed && paddleX > 0) paddleX -= 7;

    // クリア判定
    const remaining = blocks
      .flat()
      .some(b => b.status === 1 && b.type !== "steel");
    if (!remaining) gameState = "clear";

    requestAnimationFrame(draw);
  }

  draw();
};
