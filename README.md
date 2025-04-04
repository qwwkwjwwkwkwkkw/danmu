# Bilibili 弹幕实时统计系统

这是一个基于 Flask 和 Socket.IO 的 Bilibili 直播间弹幕实时统计系统。系统可以实时获取指定直播间的弹幕，并进行词频统计和可视化展示。

## 功能特点

- 实时获取 Bilibili 直播间弹幕
- 弹幕实时显示和滚动
- 词频统计和可视化展示
- 支持自定义 iframe 嵌入
- 响应式界面设计

## 环境要求

- Python 3.8+
- pip 包管理器

## 安装步骤

1. 克隆项目到本地：
```bash
git clone https://github.com/yourusername/bilibili-danmu-stats.git
cd bilibili-danmu-stats
```

2. 创建并激活虚拟环境（推荐）：
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. 安装依赖包：
```bash
pip install -r requirements.txt
```

## 项目结构

```
bilibili-danmu-stats/
├── app.py              # 主程序文件
├── requirements.txt    # 依赖包列表
├── static/            # 静态文件目录
│   ├── style.css      # 样式文件
│   └── script.js      # JavaScript 文件
└── templates/         # 模板文件目录
    └── index.html     # 主页面模板
```

## 使用方法

1. 启动服务器：
```bash
python app.py
```

2. 打开浏览器访问：
```
http://localhost:5000
```

3. 在输入框中输入 Bilibili 直播间 ID（例如：21396545）

4. 点击"开始弹幕"按钮开始获取弹幕

## 功能说明

### 弹幕显示
- 实时显示直播间弹幕
- 自动滚动到最新弹幕
- 最多显示 100 条弹幕
- 弹幕包含时间戳和内容

### 词频统计
- 实时统计弹幕词频
- 使用柱状图展示词频数据
- 自动更新统计结果

### iframe 功能
- 支持自定义 iframe 嵌入
- 可拖动调整位置
- 可调整大小

## 配置说明

### 修改直播间 ID
在 `app.py` 文件中找到以下代码，修改 `room_id` 的值：
```python
self.room_id = 21396545  # 修改为你的直播间 ID
```

### 修改统计参数
在 `app.py` 文件中可以修改以下参数：
- `DANMU_COUNT_THRESHOLD`：触发词频统计的弹幕数量阈值
- `MAX_DANMU_COUNT`：最大显示的弹幕数量

## 注意事项

1. 确保网络连接正常
2. 直播间 ID 必须有效
3. 建议使用 Chrome 或 Firefox 浏览器
4. 首次运行可能需要等待一段时间获取弹幕

## 常见问题

1. 弹幕不显示
   - 检查直播间 ID 是否正确
   - 确认直播间是否正在直播
   - 检查网络连接

2. 统计图表不更新
   - 确保弹幕数量达到阈值
   - 检查浏览器控制台是否有错误

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: your-email@example.com 