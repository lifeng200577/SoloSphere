// 植物颜色配置
function getPlantColor(type) {
    switch(type) {
        case 'sunflower': return '#FFD700';  // 金色
        case 'peashooter': return '#4CAF50'; // 绿色
        case 'lawnmower': return '#607D8B';  // 灰蓝色
        default: return '#666666';
    }
}

let canvas, ctx;
let sunCount = 50;
let selectedPlant = null;
let plants = [];
let zombies = [];
let projectiles = [];
let suns = [];
let gameLoop;
let isGameRunning = false;
let score = 0;
let spawnRate = 5000; // 僵尸生成间隔（毫秒）
let lastSpawnTime = 0;
let grid = [];

// 游戏配置
const GRID_SIZE = 80; // 网格大小
const GRID_COLS = 10; // 列数
const GRID_ROWS = 6;  // 行数
const PLANT_COSTS = {
    'sunflower': 50,
    'peashooter': 100,
    'lawnmower': 150
};

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 初始化网格
    for (let row = 0; row < GRID_ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_COLS; col++) {
            grid[row][col] = null;
        }
    }

    // 设置植物选择器点击事件
    document.querySelectorAll('.plant-option').forEach(option => {
        option.addEventListener('click', () => {
            const plant = option.dataset.plant;
            const cost = parseInt(option.dataset.cost);
            
            if (sunCount >= cost) {
                if (selectedPlant === plant) {
                    selectedPlant = null;
                    document.querySelectorAll('.plant-option').forEach(opt => opt.classList.remove('selected'));
                } else {
                    selectedPlant = plant;
                    document.querySelectorAll('.plant-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                }
            }
        });
    });

    // 设置画布点击事件
    canvas.addEventListener('click', handleCanvasClick);

    // 设置游戏控制按钮
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('pauseButton').addEventListener('click', togglePause);
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // 绘制初始游戏场景
    drawGame();
}

function startGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        gameLoop = setInterval(updateGame, 1000/60); // 60 FPS
        document.getElementById('startButton').textContent = '继续';
    }
}

function togglePause() {
    if (isGameRunning) {
        clearInterval(gameLoop);
        isGameRunning = false;
        document.getElementById('startButton').textContent = '继续';
    } else {
        startGame();
    }
}

function restartGame() {
    clearInterval(gameLoop);
    sunCount = 50;
    plants = [];
    zombies = [];
    projectiles = [];
    suns = [];
    score = 0;
    spawnRate = 5000;
    lastSpawnTime = 0;
    selectedPlant = null;
    document.querySelectorAll('.plant-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('sunCount').textContent = sunCount;
    
    // 重置网格
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            grid[row][col] = null;
        }
    }
    
    drawGame();
    startGame();
}

function handleCanvasClick(event) {
    if (!selectedPlant) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);
    
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        // 检查是否有足够的阳光
        if (sunCount < PLANT_COSTS[selectedPlant]) {
            // 显示提示信息
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.font = '20px Arial';
            ctx.fillText('阳光不足!', x, y - 20);
            return;
        }
        
        // 检查格子是否已被占用
        if (grid[row][col]) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.font = '20px Arial';
            ctx.fillText('此处已有植物!', x, y - 20);
            return;
        }
        
        // 种植植物
        placePlant(row, col, selectedPlant);
        sunCount -= PLANT_COSTS[selectedPlant];
        document.getElementById('sunCount').textContent = sunCount;
        
        // 取消选中状态
        selectedPlant = null;
        document.querySelectorAll('.plant-option').forEach(opt => opt.classList.remove('selected'));
    }
}

function placePlant(row, col, type) {
    const plant = {
        type: type,
        row: row,
        col: col,
        health: 100,
        lastShootTime: 0,
        lastSunTime: 0
    };
    
    plants.push(plant);
    grid[row][col] = plant;
}

function spawnZombie() {
    const now = Date.now();
    if (now - lastSpawnTime >= spawnRate) {
        const row = Math.floor(Math.random() * GRID_ROWS);
        zombies.push({
            row: row,
            x: canvas.width,
            health: 100,
            speed: 0.5
        });
        lastSpawnTime = now;
        
        // 随着游戏进行，加快僵尸生成速度
        spawnRate = Math.max(2000, spawnRate - 100);
    }
}

function spawnSun() {
    if (Math.random() < 0.01) { // 1% 概率生成阳光
        suns.push({
            x: Math.random() * (canvas.width - 40),
            y: 0,
            speed: 1,
            collected: false
        });
    }
}

function updateGame() {
    if (!isGameRunning) return;

    const now = Date.now();
    
    // 更新向日葵
    plants.forEach(plant => {
        if (plant.type === 'sunflower' && now - plant.lastSunTime >= 10000) {
            suns.push({
                x: plant.col * GRID_SIZE + GRID_SIZE/2,
                y: plant.row * GRID_SIZE,
                speed: 0,
                collected: false
            });
            plant.lastSunTime = now;
        }
    });

    // 更新豌豆射手
    plants.forEach(plant => {
        if (plant.type === 'peashooter' && now - plant.lastShootTime >= 2000) {
            // 检查这一行是否有僵尸
            const zombiesInRow = zombies.some(zombie => zombie.row === plant.row);
            if (zombiesInRow) {
                projectiles.push({
                    x: plant.col * GRID_SIZE + GRID_SIZE,
                    y: plant.row * GRID_SIZE + GRID_SIZE/2,
                    row: plant.row,
                    speed: 5
                });
                plant.lastShootTime = now;
            }
        }
    });

    // 更新僵尸
    zombies.forEach((zombie, index) => {
        zombie.x -= zombie.speed;
        
        // 检查是否有植物在僵尸前面
        plants.forEach((plant, plantIndex) => {
            if (plant.row === zombie.row && 
                Math.abs(zombie.x - (plant.col * GRID_SIZE + GRID_SIZE)) < 10) {
                plant.health -= 0.5;
                if (plant.health <= 0) {
                    plants.splice(plantIndex, 1);
                    grid[plant.row][plant.col] = null;
                }
                zombie.speed = 0;
            }
        });
        
        // 检查僵尸是否到达左边界
        if (zombie.x <= 0) {
            gameOver();
        }
    });

    // 更新豌豆
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.speed;
        
        // 检查是否击中僵尸
        zombies.forEach((zombie, zombieIndex) => {
            if (zombie.row === projectile.row &&
                Math.abs(zombie.x - projectile.x) < GRID_SIZE/2) {
                zombie.health -= 25;
                if (zombie.health <= 0) {
                    zombies.splice(zombieIndex, 1);
                    score += 100;
                }
                projectiles.splice(index, 1);
            }
        });
        
        // 移除超出边界的豌豆
        if (projectile.x > canvas.width) {
            projectiles.splice(index, 1);
        }
    });

    // 更新阳光
    suns.forEach((sun, index) => {
        if (!sun.collected) {
            sun.y += sun.speed;
            if (sun.y > canvas.height) {
                suns.splice(index, 1);
            }
        }
    });

    // 生成新的僵尸和阳光
    spawnZombie();
    spawnSun();

    // 重绘游戏场景
    drawGame();
}

function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制草坪背景
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            // 交替深浅绿色
            ctx.fillStyle = (row + col) % 2 === 0 ? '#90EE90' : '#7CCD7C';
            ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            
            // 绘制网格线
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.strokeRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }

    // 绘制植物
    plants.forEach(plant => {
        // 绘制植物底座
        ctx.fillStyle = '#8B4513';  // 土壤颜色
        ctx.fillRect(
            plant.col * GRID_SIZE + 15,
            plant.row * GRID_SIZE + GRID_SIZE - 25,
            GRID_SIZE - 30,
            15
        );

        // 绘制植物主体
        ctx.fillStyle = getPlantColor(plant.type);
        if (plant.type === 'sunflower') {
            // 向日葵
            ctx.beginPath();
            ctx.arc(
                plant.col * GRID_SIZE + GRID_SIZE/2,
                plant.row * GRID_SIZE + GRID_SIZE/2,
                25,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else if (plant.type === 'peashooter') {
            // 豌豆射手
            ctx.fillRect(
                plant.col * GRID_SIZE + 20,
                plant.row * GRID_SIZE + 15,
                GRID_SIZE - 40,
                GRID_SIZE - 35
            );
            // 绘制炮管
            ctx.fillRect(
                plant.col * GRID_SIZE + GRID_SIZE - 30,
                plant.row * GRID_SIZE + GRID_SIZE/2 - 5,
                20,
                10
            );
        }
    });

    // 绘制僵尸
    zombies.forEach(zombie => {
        // 绘制僵尸身体
        ctx.fillStyle = '#666';
        ctx.fillRect(
            zombie.x,
            zombie.row * GRID_SIZE + 10,
            30,
            GRID_SIZE - 20
        );
        
        // 绘制僵尸头部
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(
            zombie.x + 15,
            zombie.row * GRID_SIZE + 20,
            12,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // 绘制豌豆
    ctx.fillStyle = '#4CAF50';
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // 绘制阳光
    suns.forEach(sun => {
        if (!sun.collected) {
            // 发光效果
            const gradient = ctx.createRadialGradient(
                sun.x, sun.y, 0,
                sun.x, sun.y, 20
            );
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 绘制分数
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`分数: ${score}`, 10, 30);
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2);
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${score}`, canvas.width/2, canvas.height/2 + 40);
    
    document.getElementById('startButton').textContent = '重新开始';
}

// 添加阳光收集功能
// 添加阳光收集功能
function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // 先检查是否在收集阳光
    let sunCollected = false;
    suns.forEach((sun, index) => {
        if (!sun.collected &&
            Math.abs(clickX - sun.x) < 20 &&
            Math.abs(clickY - sun.y) < 20) {
            sun.collected = true;
            suns.splice(index, 1);
            sunCount += 25;
            document.getElementById('sunCount').textContent = sunCount;
            sunCollected = true;
        }
    });
    
    // 如果没有收集阳光，则尝试种植植物
    if (!sunCollected) {
        handleCanvasClick(event);
    }
}

canvas.addEventListener('click', handleClick);