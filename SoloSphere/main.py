from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import os
import json
from datetime import datetime
import random
import string
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import threading
import time
import asyncio
import websockets
from dotenv import load_dotenv
import webbrowser
import sys

# 加载环境变量
load_dotenv()

# Flask应用配置
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = os.getenv('FLASK_SECRET_KEY', ''.join(random.choices(string.ascii_letters + string.digits, k=32)))
CORS(app, supports_credentials=True)

# 数据存储路径
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 数据文件路径
BLOG_FILE = os.path.join(DATA_DIR, 'blog_posts.json')
MUSIC_FILE = os.path.join(DATA_DIR, 'music_list.json')
LIFE_FILE = os.path.join(DATA_DIR, 'life_posts.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
VERIFY_CODES_FILE = os.path.join(DATA_DIR, 'verify_codes.json')

# 初始化数据文件
def init_data_file(file_path, initial_data=[]):
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(initial_data, f, ensure_ascii=False, indent=2)

# 初始化所有数据文件
for file in [BLOG_FILE, MUSIC_FILE, LIFE_FILE, USERS_FILE, VERIFY_CODES_FILE]:
    init_data_file(file)

# 邮件配置
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.qq.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')

# WebSocket游戏服务器部分
rooms = {}

class GameRoom:
    def __init__(self, host_ws):
        self.host = host_ws
        self.players = {host_ws: {"name": "玩家1", "is_host": True, "score": 0, "position": [], "direction": "right"}}
        self.game_started = False
        self.food_position = {"x": 10, "y": 10}

    def add_player(self, ws):
        player_number = len(self.players) + 1
        self.players[ws] = {
            "name": f"玩家{player_number}",
            "is_host": False,
            "score": 0,
            "position": [],
            "direction": "right"
        }

    def remove_player(self, ws):
        if ws in self.players:
            del self.players[ws]
            if ws == self.host and self.players:
                self.host = next(iter(self.players))
                self.players[self.host]["is_host"] = True

    def get_room_state(self):
        return {
            "players": {
                "player_" + str(i): {
                    "name": player["name"],
                    "is_host": player["is_host"],
                    "score": player["score"],
                    "position": player["position"],
                    "direction": player["direction"]
                }
                for i, player in enumerate(self.players.values(), 1)
            },
            "game_started": self.game_started,
            "food_position": self.food_position
        }

    def update_food_position(self):
        self.food_position = {
            "x": random.randint(0, 39),
            "y": random.randint(0, 39)
        }

async def handle_websocket(websocket, path):
    try:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            response = {"type": data["type"]}

            if data["type"] == "create_room":
                room_code = generate_room_code()
                rooms[room_code] = GameRoom(websocket)
                response.update({
                    "room_code": room_code,
                    "success": True,
                    "state": rooms[room_code].get_room_state()
                })
                await websocket.send(json.dumps(response))

            elif data["type"] == "join_room":
                room_code = data["room_code"]
                if room_code in rooms:
                    room = rooms[room_code]
                    room.add_player(websocket)
                    response.update({
                        "success": True,
                        "state": room.get_room_state()
                    })
                    for player_ws in room.players:
                        await player_ws.send(json.dumps({
                            "type": "room_update",
                            "state": room.get_room_state()
                        }))
                else:
                    response.update({
                        "success": False,
                        "error": "房间不存在"
                    })
                    await websocket.send(json.dumps(response))

            elif data["type"] == "start_game":
                room_code = data["room_code"]
                if room_code in rooms:
                    room = rooms[room_code]
                    if websocket == room.host:
                        room.game_started = True
                        for i, player in enumerate(room.players.values()):
                            player["position"] = [{"x": 20 + i * 2, "y": 20}]
                        response.update({
                            "success": True,
                            "state": room.get_room_state()
                        })
                        for player_ws in room.players:
                            await player_ws.send(json.dumps({
                                "type": "game_started",
                                "state": room.get_room_state()
                            }))
                    else:
                        response.update({
                            "success": False,
                            "error": "只有房主可以开始游戏"
                        })
                        await websocket.send(json.dumps(response))

            elif data["type"] == "update_position":
                room_code = data["room_code"]
                if room_code in rooms:
                    room = rooms[room_code]
                    if websocket in room.players:
                        room.players[websocket]["position"] = data["position"]
                        room.players[websocket]["direction"] = data["direction"]
                        if "score" in data:
                            room.players[websocket]["score"] = data["score"]
                        for player_ws in room.players:
                            await player_ws.send(json.dumps({
                                "type": "state_update",
                                "state": room.get_room_state()
                            }))

    except websockets.exceptions.ConnectionClosed:
        for room_code, room in list(rooms.items()):
            if websocket in room.players:
                room.remove_player(websocket)
                if not room.players:
                    del rooms[room_code]
                else:
                    for player_ws in room.players:
                        try:
                            await player_ws.send(json.dumps({
                                "type": "room_update",
                                "state": room.get_room_state()
                            }))
                        except:
                            pass
                break

def generate_room_code():
    while True:
        code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
        if code not in rooms:
            return code

# Flask路由和API
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return app.send_static_file(path)

# 用户认证相关API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    for user in users:
        if user['username'] == username:
            return jsonify({'success': False, 'message': '用户名已存在'})
    
    new_user = {
        'id': str(len(users) + 1),
        'username': username,
        'password': hashlib.sha256(password.encode()).hexdigest(),
        'created_at': datetime.now().isoformat()
    }
    
    users.append(new_user)
    
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    
    return jsonify({'success': True, 'message': '注册成功'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    for user in users:
        if user['username'] == username:
            if user['password'] == hashlib.sha256(password.encode()).hexdigest():
                session['user_id'] = user['id']
                session['username'] = user['username']
                
                return jsonify({
                    'success': True,
                    'message': '登录成功',
                    'user': {
                        'id': user['id'],
                        'username': user['username']
                    }
                })
            else:
                return jsonify({'success': False, 'message': '密码错误'})
    
    return jsonify({'success': False, 'message': '用户不存在'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '已退出登录'})

# 博客相关API
@app.route('/api/blog/posts', methods=['GET'])
def get_blog_posts():
    with open(BLOG_FILE, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    return jsonify(posts)

@app.route('/api/blog/posts', methods=['POST'])
def create_blog_post():
    post = request.json
    post['id'] = datetime.now().strftime('%Y%m%d%H%M%S')
    post['created_at'] = datetime.now().isoformat()
    
    with open(BLOG_FILE, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    posts.append(post)
    
    with open(BLOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    
    return jsonify(post)

# 音乐相关API
@app.route('/api/music/list', methods=['GET'])
def get_music_list():
    with open(MUSIC_FILE, 'r', encoding='utf-8') as f:
        music_list = json.load(f)
    return jsonify(music_list)

@app.route('/api/music/add', methods=['POST'])
def add_music():
    music = request.json
    music['id'] = datetime.now().strftime('%Y%m%d%H%M%S')
    
    with open(MUSIC_FILE, 'r', encoding='utf-8') as f:
        music_list = json.load(f)
    
    music_list.append(music)
    
    with open(MUSIC_FILE, 'w', encoding='utf-8') as f:
        json.dump(music_list, f, ensure_ascii=False, indent=2)
    
    return jsonify(music)

# 生活记录相关API
@app.route('/api/life/posts', methods=['GET'])
def get_life_posts():
    with open(LIFE_FILE, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    return jsonify(posts)

@app.route('/api/life/posts', methods=['POST'])
def create_life_post():
    post = request.json
    post['id'] = datetime.now().strftime('%Y%m%d%H%M%S')
    post['created_at'] = datetime.now().isoformat()
    
    with open(LIFE_FILE, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    posts.append(post)
    
    with open(LIFE_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    
    return jsonify(post)

def start_websocket_server():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(handle_websocket, 'localhost', 8765)
    loop.run_until_complete(start_server)
    print("WebSocket服务器已启动，监听端口8765...")
    loop.run_forever()

def start_flask_server():
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    print("正在启动服务器...")
    
    # 启动WebSocket服务器（在新线程中）
    websocket_thread = threading.Thread(target=start_websocket_server, daemon=True)
    websocket_thread.start()
    print("WebSocket服务器正在启动...")
    
    # 等待WebSocket服务器启动
    time.sleep(1)
    
    # 自动打开浏览器
    webbrowser.open('http://localhost:5000')
    
    print("\n服务器已启动！")
    print("Flask服务器运行在: http://localhost:5000")
    print("WebSocket服务器运行在: ws://localhost:8765")
    print("\n按Ctrl+C停止服务器...")
    
    # 启动Flask服务器（在主线程中）
    start_flask_server() 