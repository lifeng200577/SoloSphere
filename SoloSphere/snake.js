// 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const gameMode = urlParams.get('mode');
const roomCode = urlParams.get('room');

// 游戏变量
let canvas, ctx;
let snake = [];
let food = { x: 10, y: 10 };
let direction = 'right';
let score = 0;
let gameLoop;
let ws;
let otherPlayers = {};
let isMultiplayer = gameMode === 'multiplayer';

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 初始化蛇的位置
    snake = [{ x: 20, y: 20 }];
    
    if (isMultiplayer) {
        connectWebSocket();
    } else {
        startGameLoop();
    }

    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyPress);
}

// 连接WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8765`;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('游戏WebSocket连接已建立');
        startGameLoop();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleGameMessage(data);
    };

    ws.onclose = () => {
        console.log('游戏WebSocket连接已关闭');
        alert('与服务器的连接已断开，游戏结束');
        window.location.href = 'snake-mode.html';
    };
}

// 处理游戏消息
function handleGameMessage(data) {
    if (data.type === 'state_update') {
        // 更新其他玩家的位置
        otherPlayers = {};
        Object.entries(data.state.players).forEach(([playerId, playerData]) => {
            if (playerData.position.length > 0) {
                otherPlayers[playerId] = {
                    position: playerData.position,
                    score: playerData.score
                };
            }
        });
        
        // 更新食物位置
        food = data.state.food_position;
    }
}

// 游戏循环
function startGameLoop() {
    gameLoop = setInterval(() => {
        moveSnake();
        if (isMultiplayer) {
            sendGameState();
        }
        drawGame();
        checkCollision();
    }, 100);
}

// 发送游戏状态
function sendGameState() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'update_position',
            room_code: roomCode,
            position: snake,
            direction: direction,
            score: score
        }));
    }
}

// 移动蛇
function moveSnake() {
    const head = { ...snake[0] };
    
    switch(direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        if (!isMultiplayer) {
            generateFood();
        }
    } else {
        snake.pop();
    }
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制食物
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * 10, food.y * 10, 10, 10);
    
    // 绘制玩家的蛇
    ctx.fillStyle = '#00ff00';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * 10, segment.y * 10, 10, 10);
    });
    
    // 绘制其他玩家的蛇
    if (isMultiplayer) {
        Object.entries(otherPlayers).forEach(([playerId, playerData]) => {
            ctx.fillStyle = '#0000ff';
            playerData.position.forEach(segment => {
                ctx.fillRect(segment.x * 10, segment.y * 10, 10, 10);
            });
        });
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 40) {
        gameOver();
        return;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // 多人模式下检查与其他玩家的碰撞
    if (isMultiplayer) {
        Object.values(otherPlayers).forEach(player => {
            player.position.forEach(segment => {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver();
                    return;
                }
            });
        });
    }
}

// 处理键盘输入
function handleKeyPress(event) {
    switch(event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
}

// 生成食物
function generateFood() {
    food = {
        x: Math.floor(Math.random() * 40),
        y: Math.floor(Math.random() * 40)
    };
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = `分数: ${score}`;
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    
    if (isMultiplayer && ws) {
        ws.close();
    }
}

// 重新开始游戏
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    snake = [{ x: 20, y: 20 }];
    direction = 'right';
    score = 0;
    updateScore();
    
    if (!isMultiplayer) {
        generateFood();
    }
    
    if (isMultiplayer) {
        window.location.href = 'snake-multiplayer.html';
    } else {
        startGameLoop();
    }
}

// 初始化游戏
window.onload = initGame; 