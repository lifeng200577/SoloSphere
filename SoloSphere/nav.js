function initNav() {
    // 创建导航栏
    const nav = document.createElement('nav');
    nav.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
    `;

    // 创建logo
    const logo = document.createElement('a');
    logo.href = '/';
    logo.textContent = 'SoloSphere';
    logo.style.cssText = `
        color: white;
        text-decoration: none;
        font-size: 1.5em;
        font-weight: bold;
    `;

    // 创建导航链接
    const links = document.createElement('div');
    links.style.cssText = `
        display: flex;
        gap: 30px;
    `;

    // 获取当前页面的路径
    const currentPath = window.location.pathname;
    const isInStaticFolder = currentPath.startsWith('/static/');
    const prefix = isInStaticFolder ? '../' : '';

    const navItems = [
        { text: '博客', url: prefix + 'blog.html' },
        { text: '音乐', url: prefix + 'music.html' },
        { text: '生活', url: prefix + 'life.html' }
    ];

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.text;
        link.style.cssText = `
            color: white;
            text-decoration: none;
            font-size: 1.1em;
            transition: opacity 0.3s;
        `;
        link.onmouseover = () => link.style.opacity = '0.7';
        link.onmouseout = () => link.style.opacity = '1';
        links.appendChild(link);
    });

    // 添加用户菜单
    const userMenu = document.createElement('div');
    userMenu.style.cssText = `
        position: relative;
        cursor: pointer;
    `;

    const userIcon = document.createElement('span');
    userIcon.textContent = '👤';
    userIcon.style.fontSize = '1.5em';

    userMenu.appendChild(userIcon);

    // 将所有元素添加到导航栏
    nav.appendChild(logo);
    nav.appendChild(links);
    nav.appendChild(userMenu);

    // 将导航栏添加到页面
    document.body.insertBefore(nav, document.body.firstChild);

    // 添加响应式菜单
    const menuButton = document.createElement('button');
    menuButton.innerHTML = '☰';
    menuButton.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5em;
        cursor: pointer;
        padding: 0;
    `;

    // 响应式设计
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    function handleScreenChange(e) {
        if (e.matches) {
            links.style.display = 'none';
            menuButton.style.display = 'block';
            nav.insertBefore(menuButton, links);
        } else {
            links.style.display = 'flex';
            menuButton.style.display = 'none';
        }
    }

    mediaQuery.addListener(handleScreenChange);
    handleScreenChange(mediaQuery);

    // 菜单按钮点击事件
    let isMenuOpen = false;
    menuButton.onclick = () => {
        isMenuOpen = !isMenuOpen;
        links.style.display = isMenuOpen ? 'flex' : 'none';
        if (isMenuOpen) {
            links.style.cssText = `
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 20px;
                gap: 20px;
            `;
        }
    };
} 