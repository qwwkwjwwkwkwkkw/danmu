from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import requests
import json
import time
import threading
import io
import sys
import re
import jieba
from collections import Counter
import os

# 设置控制台编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='threading')

class BilibiliDanmu:
    def __init__(self, room_id):
        self.room_id = room_id
        self.running = False
        self.last_danmu = None
        self.danmu_texts = []  # 存储弹幕文本
        self.url = 'https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory'
        self.headers = {
            'Host': 'api.live.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0',
        }
        self.data = {
            'roomid': str(room_id),
            'csrf_token': '',
            'csrf': '',
            'visit_id': '',
        }

    def get_danmu(self):
        try:
            response = requests.post(url=self.url, headers=self.headers, data=self.data)
            response.raise_for_status()
            html = response.json()
            
            for content in html['data']['room']:
                nickname = content['nickname']
                text = content['text']
                timeline = content['timeline']
                
                current_danmu = f"{timeline} {nickname}: {text}"
                if current_danmu == self.last_danmu:
                    continue
                self.last_danmu = current_danmu
                
                # 存储弹幕文本
                self.danmu_texts.append(text)
                
                msg = {
                    'text': f'{nickname}: {text}',
                    'time': timeline,
                    'color': '#333333'
                }
                socketio.emit('danmu', msg)
                print(current_danmu)
                
                # 每收集到50条弹幕就更新一次词频统计
                if len(self.danmu_texts) >= 50:
                    self.generate_word_stats()
                    self.danmu_texts = []  # 清空已处理的弹幕
        except Exception as e:
            print(f"获取弹幕错误: {e}")

    def generate_word_stats(self):
        try:
            # 合并所有弹幕文本
            text = ' '.join(self.danmu_texts)
            
            # 使用jieba分词
            words = jieba.cut(text)
            
            # 过滤停用词和单个字符
            stop_words = {'的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
            words = [word for word in words if len(word) > 1 and word not in stop_words]
            
            # 统计词频
            word_counts = Counter(words)
            
            # 获取前20个高频词
            top_words = word_counts.most_common(20)
            
            # 发送词频统计到前端
            socketio.emit('word_stats_update', {
                'words': [word for word, _ in top_words],
                'counts': [count for _, count in top_words]
            })
        except Exception as e:
            print(f"生成词频统计错误: {e}")

    def start(self):
        self.running = True
        while self.running:
            self.get_danmu()
            time.sleep(0.5)

    def stop(self):
        self.running = False

# 创建弹幕实例
danmu_client = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start_danmu():
    global danmu_client
    
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        
        if not room_id:
            return jsonify({'success': False, 'message': '请输入直播间ID'})
            
        # 如果已有弹幕客户端在运行，先停止它
        if danmu_client:
            danmu_client.stop()
            
        # 创建新的弹幕客户端
        danmu_client = BilibiliDanmu(room_id)
        
        # 启动弹幕线程
        danmu_thread = threading.Thread(target=danmu_client.start)
        danmu_thread.daemon = True
        danmu_thread.start()
        
        return jsonify({
            'success': True, 
            'message': f'已连接到直播间 {room_id}'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'连接失败: {str(e)}'})

if __name__ == '__main__':
    socketio.run(app, debug=True) 
