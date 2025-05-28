// 检查登录状态
function checkLoginStatus() {
    const username = localStorage.getItem('username');
    const loginContainer = document.getElementById('loginContainer');
    const userInfo = document.getElementById('userInfo');
    
    if (username) {
        loginContainer.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('username').textContent = username;
        
        // 更新所有需要显示用户名的元素
        const usernamePlaceholders = document.querySelectorAll('.username-placeholder');
        usernamePlaceholders.forEach(element => {
            element.textContent = username;
        });
    } else {
        loginContainer.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// 显示登录模态框
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'flex';
    switchLoginTab('login');
}

// 隐藏登录模态框
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'none';
}

// 切换登录/注册标签
function switchLoginTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// 处理登录
async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            if (rememberMe) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
            }
            hideLoginModal();
            checkLoginStatus();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('登录失败，请重试');
    }
}

// 处理注册
async function handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            alert('注册成功！请登录');
            switchLoginTab('login');
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = password;
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('注册失败，请重试');
    }
}

// 处理登出
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        const data = await response.json();
        if (data.success) {
            localStorage.removeItem('username');
            localStorage.removeItem('password');
            checkLoginStatus();
        }
    } catch (error) {
        alert('登出失败，请重试');
    }
}

// 导出导航栏HTML
function getNavHTML() {
    return `
    <nav class="nav-container">
        <div class="nav-content">
            <div class="nav-left">
                <a href="/" class="nav-logo">SoloSphere</a>
            </div>
            <div class="nav-right">
                <div id="loginContainer">
                    <button onclick="showLoginModal()" class="login-btn">登录</button>
                </div>
                <div id="userInfo" style="display: none;">
                    <span id="username"></span>
                    <button onclick="handleLogout()" class="logout-btn">退出</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- 登录模态框 -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="tab-container">
                    <button id="loginTab" class="tab active" onclick="switchLoginTab('login')">登录</button>
                    <button id="registerTab" class="tab" onclick="switchLoginTab('register')">注册</button>
                </div>
                <span class="close" onclick="hideLoginModal()">&times;</span>
            </div>

            <!-- 登录表单 -->
            <div id="loginForm">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="loginUsername" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="loginPassword" placeholder="请输入密码">
                </div>
                <div class="remember-me">
                    <input type="checkbox" id="rememberMe" checked>
                    <label for="rememberMe">记住密码</label>
                </div>
                <button onclick="handleLogin()" class="submit-btn">登录</button>
            </div>

            <!-- 注册表单 -->
            <div id="registerForm" style="display: none;">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="registerUsername" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="registerPassword" placeholder="请输入密码">
                </div>
                <div class="form-group">
                    <label>确认密码</label>
                    <input type="password" id="registerConfirmPassword" placeholder="请再次输入密码">
                </div>
                <button onclick="handleRegister()" class="submit-btn">注册</button>
            </div>
        </div>
    </div>
    `;
}

// 导出样式
function getNavStyles() {
    return `
    .nav-container {
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
    }

    .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .nav-logo {
        font-size: 24px;
        font-weight: bold;
        color: #4a90e2;
        text-decoration: none;
    }

    .nav-right {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .login-btn, .logout-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }

    .login-btn {
        background: #4a90e2;
        color: white;
    }

    .logout-btn {
        background: #f5f5f5;
        color: #666;
    }

    #username {
        color: #333;
        font-weight: 500;
    }

    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 1001;
    }

    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 10px;
        width: 90%;
        max-width: 400px;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .close {
        font-size: 24px;
        color: #666;
        cursor: pointer;
    }

    .tab-container {
        display: flex;
        gap: 20px;
    }

    .tab {
        padding: 8px 16px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 16px;
        color: #666;
    }

    .tab.active {
        color: #4a90e2;
        border-bottom: 2px solid #4a90e2;
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        color: #666;
    }

    .form-group input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        box-sizing: border-box;
    }

    .remember-me {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        color: #666;
    }

    .remember-me input {
        margin-right: 8px;
    }

    .submit-btn {
        width: 100%;
        padding: 10px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
    }

    .submit-btn:hover {
        background: #357abd;
    }
    `;
}

// 初始化导航栏
function initNav() {
    // 添加样式
    const style = document.createElement('style');
    style.textContent = getNavStyles();
    document.head.appendChild(style);

    // 添加导航栏
    const navElement = document.createElement('div');
    navElement.innerHTML = getNavHTML();
    document.body.insertBefore(navElement, document.body.firstChild);

    // 检查登录状态
    checkLoginStatus();

    // 创建返回按钮
    const backButton = document.createElement('button');
    backButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
    `;
    backButton.textContent = '返回';
    backButton.onclick = () => {
        window.location.href = '/static/games.html';
    };
    backButton.onmouseover = () => {
        backButton.style.background = 'rgba(255, 255, 255, 0.3)';
    };
    backButton.onmouseout = () => {
        backButton.style.background = 'rgba(255, 255, 255, 0.2)';
    };
    document.body.appendChild(backButton);
}

// 导出初始化函数
window.initNav = initNav; 