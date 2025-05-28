const gameContainer = document.getElementById('gameContainer');
const scoreElement = document.getElementById('score');
let sunlight = 50;
let score = 0;
let gameRunning = true;
let plants = [];
let zombies = [];
let peas = [];
let suns = [];
let lawnmowers = [];
let draggedPlant = null;
let shovelDragging = false;

// 初始化小推车
function initLawnmowers() {
    for (let i = 0; i < 5; i++) {
        const lawnmower = document.createElement('div');
        lawnmower.className = 'lawnmower';
        lawnmower.style.top = (i * 80) + 'px';
        lawnmower.style.left = '0px';
        gameContainer.appendChild(lawnmower);
        lawnmowers.push({ element: lawnmower, x: 0, y: i * 80, active: true });
    }
}

// 设置拖拽事件
document.querySelectorAll('.plant-card').forEach(card => {
    card.draggable = true;
    
    card.addEventListener('dragstart', (e) => {
        draggedPlant = card.dataset.plant;
        const cost = draggedPlant === 'sunflower' ? 50 : 100;
        if (sunlight < cost) {
            e.preventDefault();
            return;
        }
        card.classList.add('dragging');
        
        // 创建拖拽时的预览图像
        const dragIcon = document.createElement('img');
        dragIcon.src = draggedPlant === 'sunflower' ? 'sunflower.svg' : 'plant.svg';
        dragIcon.style.width = '50px';
        dragIcon.style.height = '50px';
        e.dataTransfer.setDragImage(dragIcon, 25, 25);
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedPlant = null;
    });
});

// 设置放置区域
gameContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedPlant) return;
    
    const rect = gameContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 显示网格预览
    const gridX = Math.floor(x / 80) * 80;
    const gridY = Math.floor(y / 80) * 80;
    
    // 移除之前的预览
    const prevPreview = document.querySelector('.plant-preview');
    if (prevPreview) {
        prevPreview.remove();
    }
    
    // 创建新的预览
    if (gridX >= 0 && gridX < 800 && gridY >= 0 && gridY < 400) {
        const preview = document.createElement('div');
        preview.className = `plant ${draggedPlant} plant-preview`;
        preview.style.left = gridX + 'px';
        preview.style.top = gridY + 'px';
        preview.style.opacity = '0.5';
        gameContainer.appendChild(preview);
    }
});

gameContainer.addEventListener('dragleave', () => {
    const preview = document.querySelector('.plant-preview');
    if (preview) {
        preview.remove();
    }
});

gameContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // 移除预览
    const preview = document.querySelector('.plant-preview');
    if (preview) {
        preview.remove();
    }
    
    if (!draggedPlant) return;
    
    const cost = draggedPlant === 'sunflower' ? 50 : 100;
    if (sunlight >= cost) {
        const rect = gameContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 将位置对齐到网格
        const gridX = Math.floor(x / 80) * 80;
        const gridY = Math.floor(y / 80) * 80;
        
        // 检查该位置是否已有植物
        const existingPlant = plants.find(p => p.x === gridX && p.y === gridY);
        if (!existingPlant && gridX >= 0 && gridX < 800 && gridY >= 0 && gridY < 400) {
            const plant = document.createElement('div');
            plant.className = `plant ${draggedPlant}`;
            plant.style.left = gridX + 'px';
            plant.style.top = gridY + 'px';
            gameContainer.appendChild(plant);
            plants.push({ 
                element: plant, 
                x: gridX, 
                y: gridY, 
                type: draggedPlant,
                lastShot: 0 
            });
            sunlight -= cost;
            updateScore();
            enablePlantRemove();
        }
    }
});

// 创建阳光
function createSun(fromSunflower = false, x = null, y = null) {
    const sun = document.createElement('div');
    sun.className = 'sun';
    
    if (fromSunflower) {
        sun.style.left = x + 'px';
        sun.style.top = y + 'px';
    } else {
        const randomX = Math.random() * (gameContainer.offsetWidth - 40);
        sun.style.left = randomX + 'px';
        sun.style.top = '0px';
    }
    
    gameContainer.appendChild(sun);
    
    const sunObj = {
        element: sun,
        x: parseFloat(sun.style.left),
        y: parseFloat(sun.style.top),
        collected: false
    };
    
    sun.addEventListener('click', () => collectSun(sunObj));
    suns.push(sunObj);
    
    if (!fromSunflower) {
        // 自然掉落的阳光会慢慢下落
        const finalY = Math.random() * (gameContainer.offsetHeight - 40);
        const fallInterval = setInterval(() => {
            if (sunObj.collected || !gameRunning) {
                clearInterval(fallInterval);
                return;
            }
            
            sunObj.y += 1;
            sun.style.top = sunObj.y + 'px';
            
            if (sunObj.y >= finalY) {
                clearInterval(fallInterval);
            }
        }, 50);
    }
}

// 收集阳光
function collectSun(sunObj) {
    if (!sunObj.collected) {
        sunObj.collected = true;
        sunlight += 25;
        updateScore();
        sunObj.element.style.transition = 'all 0.5s';
        sunObj.element.style.opacity = '0';
        setTimeout(() => {
            if (sunObj.element.parentNode) {
                gameContainer.removeChild(sunObj.element);
            }
            suns = suns.filter(s => s !== sunObj);
        }, 500);
    }
}

// 创建僵尸
function createZombie() {
    if (!gameRunning) return;
    
    const zombie = document.createElement('div');
    zombie.className = 'zombie';
    const lane = Math.floor(Math.random() * 5); // 随机选择一条路
    const y = lane * 80;
    zombie.style.left = '750px';
    zombie.style.top = y + 'px';
    gameContainer.appendChild(zombie);
    zombies.push({ element: zombie, x: 750, y: y, health: 3 });
}

// 发射豌豆
function shootPeas() {
    const now = Date.now();
    plants.forEach(plant => {
        if (plant.type === 'peashooter' && now - plant.lastShot >= 2000) {
            // 检查这一行是否有僵尸
            const zombiesInRow = zombies.some(zombie => zombie.y === plant.y);
            if (zombiesInRow) {
                const pea = document.createElement('div');
                pea.className = 'pea';
                pea.style.left = (plant.x + 50) + 'px';
                pea.style.top = (plant.y + 25) + 'px';
                gameContainer.appendChild(pea);
                peas.push({ element: pea, x: plant.x + 50, y: plant.y + 25 });
                plant.lastShot = now;
            }
        }
    });
}

// 向日葵产生阳光
function generateSunflowerSun() {
    plants.forEach(plant => {
        if (plant.type === 'sunflower') {
            createSun(true, plant.x, plant.y);
        }
    });
}

// 更新游戏状态
function updateGame() {
    if (!gameRunning) return;
    
    // 移动豌豆
    peas.forEach((pea, peaIndex) => {
        pea.x += 3;
        pea.element.style.left = pea.x + 'px';
        
        // 检查豌豆是否击中僵尸
        zombies.forEach((zombie, zombieIndex) => {
            if (pea.x >= zombie.x && pea.x <= zombie.x + 50 &&
                pea.y >= zombie.y && pea.y <= zombie.y + 70) {
                // 击中僵尸
                zombie.health--;
                gameContainer.removeChild(pea.element);
                peas.splice(peaIndex, 1);
                
                if (zombie.health <= 0) {
                    gameContainer.removeChild(zombie.element);
                    zombies.splice(zombieIndex, 1);
                    score += 10;
                    updateScore();
                }
            }
        });
        
        // 移除超出边界的豌豆
        if (pea.x > 800) {
            gameContainer.removeChild(pea.element);
            peas.splice(peaIndex, 1);
        }
    });
    
    // 移动僵尸
    zombies.forEach((zombie, zombieIndex) => {
        zombie.x -= 0.2;
        zombie.element.style.left = zombie.x + 'px';
        
        // 检查僵尸是否到达房子或触发小推车
        if (zombie.x <= 0) {
            const lawnmower = lawnmowers.find(l => l.y === zombie.y && l.active);
            if (lawnmower) {
                // 激活小推车
                activateLawnmower(lawnmower, zombie.y);
            } else {
                gameOver();
                return;
            }
        }
        
        // 检查僵尸是否吃掉植物
        plants.forEach((plant, plantIndex) => {
            if (zombie.x <= plant.x + 50 && zombie.x + 50 >= plant.x &&
                zombie.y === plant.y) {
                gameContainer.removeChild(plant.element);
                plants.splice(plantIndex, 1);
            }
        });
    });
    
    // 更新小推车
    lawnmowers.forEach((lawnmower, index) => {
        if (lawnmower.moving) {
            lawnmower.x += 5;
            lawnmower.element.style.left = lawnmower.x + 'px';
            
            // 检查小推车是否击中僵尸
            zombies.forEach((zombie, zombieIndex) => {
                if (zombie.y === lawnmower.y &&
                    lawnmower.x <= zombie.x + 50 && lawnmower.x + 60 >= zombie.x) {
                    gameContainer.removeChild(zombie.element);
                    zombies.splice(zombieIndex, 1);
                    sunlight += 25;
                    updateScore();
                }
            });
            
            // 移除超出边界的小推车
            if (lawnmower.x > 800) {
                gameContainer.removeChild(lawnmower.element);
                lawnmowers.splice(index, 1);
            }
        }
    });
}

// 激活小推车
function activateLawnmower(lawnmower, y) {
    lawnmower.moving = true;
    lawnmower.active = false;
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = `阳光: ${sunlight} | 分数: ${score}`;
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = score;
}

// 重新开始游戏
function restartGame() {
    // 清除所有现有元素
    while (gameContainer.children.length > 2) {
        gameContainer.removeChild(gameContainer.lastChild);
    }
    
    // 重置游戏状态
    plants = [];
    zombies = [];
    peas = [];
    suns = [];
    lawnmowers = [];
    sunlight = 50;
    score = 0;
    gameRunning = true;
    draggedPlant = null;
    
    // 初始化小推车
    initLawnmowers();
    
    // 隐藏游戏结束画面
    document.getElementById('gameOver').style.display = 'none';
    document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
    updateScore();
    enablePlantRemove();
}

// 初始化游戏
initLawnmowers();

// 定期生成阳光
setInterval(() => {
    if (gameRunning) {
        createSun();
    }
}, 10000);

// 向日葵产生阳光
setInterval(generateSunflowerSun, 8000);

// 定期生成僵尸（改为5秒）
setInterval(createZombie, 5000);

// 定期发射豌豆
setInterval(shootPeas, 1000);

// 游戏主循环
setInterval(updateGame, 50);

// 添加点击事件监听器来放置植物
gameContainer.addEventListener('click', createPlant);

// 铲子拖拽事件
const shovel = document.getElementById('shovel');
if (shovel) {
    shovel.addEventListener('dragstart', (e) => {
        shovelDragging = true;
        shovel.classList.add('dragging');
        // 拖拽时显示铲子图标
        const dragIcon = document.createElement('img');
        dragIcon.src = 'shovel.svg';
        dragIcon.style.width = '48px';
        dragIcon.style.height = '48px';
        e.dataTransfer.setDragImage(dragIcon, 24, 24);
    });
    shovel.addEventListener('dragend', () => {
        shovelDragging = false;
        shovel.classList.remove('dragging');
    });
}

// 植物支持被铲除
function enablePlantRemove() {
    plants.forEach(plantObj => {
        plantObj.element.setAttribute('droppable', 'true');
        plantObj.element.addEventListener('dragover', (e) => {
            if (shovelDragging) {
                e.preventDefault();
            }
        });
        plantObj.element.addEventListener('drop', (e) => {
            if (shovelDragging) {
                e.preventDefault();
                // 移除植物
                if (plantObj.element.parentNode) {
                    gameContainer.removeChild(plantObj.element);
                }
                plants = plants.filter(p => p !== plantObj);
                sunlight += 100;
                updateScore();
            }
        });
    });
} 