const socket = io();
const danmuList = document.getElementById('danmu-list');
const notification = document.getElementById('notification');
const inputContainer = document.getElementById('input-container');
const mainContainer = document.getElementById('main-container');
const statusDiv = document.getElementById('status');
const wordStatsChart = document.getElementById('word-stats-chart');
const iframeBtn = document.getElementById('iframe-btn');
const iframeModal = document.getElementById('iframe-modal');
const iframeUrl = document.getElementById('iframe-url');
const liveIframe = document.getElementById('live-iframe');
const closeBtn = document.querySelector('.close-btn');

let chart = null;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// 弹幕管理
let danmuItems = [];
let visibleItems = [];
const ITEM_HEIGHT = 50; // 每个弹幕项的高度
const BUFFER_SIZE = 20; // 缓冲区大小

// 处理新弹幕
socket.on('danmu', (danmu) => {
    // 创建弹幕元素
    const danmuElement = document.createElement('div');
    danmuElement.className = 'danmu-item';
    danmuElement.style.color = danmu.color;
    
    // 添加时间戳
    const timeElement = document.createElement('span');
    timeElement.className = 'danmu-time';
    timeElement.textContent = danmu.time;
    
    // 添加内容
    const contentElement = document.createElement('span');
    contentElement.className = 'danmu-content';
    contentElement.textContent = danmu.text;
    
    // 组合元素
    danmuElement.appendChild(timeElement);
    danmuElement.appendChild(contentElement);
    
    // 添加到弹幕列表
    danmuList.appendChild(danmuElement);
    
    // 显示通知
    showNotification(danmu.text);
    
    // 如果弹幕数量超过100条，删除最旧的
    if (danmuList.children.length > 100) {
        danmuList.removeChild(danmuList.firstChild);
    }
    
    // 使用 requestAnimationFrame 优化滚动性能
    requestAnimationFrame(() => {
        danmuList.scrollTop = danmuList.scrollHeight;
    });
});

// 更新可见项
function updateVisibleItems() {
    const containerHeight = danmuList.clientHeight;
    const scrollTop = danmuList.scrollTop;
    
    // 计算可见范围
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE,
        danmuItems.length
    );
    
    // 更新可见项的位置
    for (let i = 0; i < danmuItems.length; i++) {
        const item = danmuItems[i];
        if (i >= startIndex && i < endIndex) {
            item.element.style.display = 'flex';
            item.element.style.top = `${i * ITEM_HEIGHT}px`;
        } else {
            item.element.style.display = 'none';
        }
    }
    
    // 设置容器高度
    danmuList.style.height = `${danmuItems.length * ITEM_HEIGHT}px`;
}

// 监听滚动事件
danmuList.addEventListener('scroll', () => {
    requestAnimationFrame(updateVisibleItems);
});

// 处理词频统计更新
socket.on('word_stats_update', (data) => {
    updateChart(data.words, data.counts);
});

// 更新图表
function updateChart(words, counts) {
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(wordStatsChart, {
        type: 'bar',
        data: {
            labels: words,
            datasets: [{
                label: '词频统计',
                data: counts,
                backgroundColor: 'rgba(0, 161, 214, 0.5)',
                borderColor: 'rgba(0, 161, 214, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 处理错误信息
socket.on('error', (data) => {
    statusDiv.textContent = data.message;
    statusDiv.style.color = '#ff6b6b';
});

// 处理状态信息
socket.on('status', (data) => {
    statusDiv.textContent = data.message;
    statusDiv.style.color = '#00a1d6';
});

// 显示通知
function showNotification(text) {
    notification.textContent = text;
    notification.classList.add('show');
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 开始弹幕
function startDanmu() {
    const roomId = document.getElementById('room-id').value.trim();
    if (!roomId) {
        statusDiv.textContent = '请输入直播间ID';
        statusDiv.style.color = '#ff6b6b';
        return;
    }

    // 发送请求到服务器
    fetch('/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room_id: roomId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 隐藏输入界面，显示主界面
            inputContainer.style.display = 'none';
            mainContainer.style.display = 'flex';
            
            statusDiv.textContent = data.message;
            statusDiv.style.color = '#00a1d6';
        } else {
            statusDiv.textContent = data.message;
            statusDiv.style.color = '#ff6b6b';
        }
    })
    .catch(error => {
        statusDiv.textContent = '连接失败，请重试';
        statusDiv.style.color = '#ff6b6b';
    });
}

// 按回车键也可以触发开始
document.getElementById('room-id').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        startDanmu();
    }
});

// iframe相关功能
iframeBtn.addEventListener('click', () => {
    iframeModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    iframeModal.style.display = 'none';
    // 清空iframe地址
    iframeUrl.value = '';
    // 清空iframe内容
    liveIframe.src = '';
});

function showIframe() {
    const url = iframeUrl.value.trim();
    if (!url) {
        showNotification('请输入有效的iframe地址');
        return;
    }

    try {
        // 检查URL是否有效
        new URL(url);
        liveIframe.src = url;
        showNotification('已加载iframe内容');
    } catch (e) {
        showNotification('请输入有效的URL地址');
    }
}

// 按回车键也可以触发iframe加载
iframeUrl.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        showIframe();
    }
});

// 拖动功能
const modalHeader = document.querySelector('.modal-header');

modalHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === modalHeader) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, iframeModal);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
} 