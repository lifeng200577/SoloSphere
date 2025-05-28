from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='.')
CORS(app)

# 数据存储路径
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 博客文章数据文件
BLOG_FILE = os.path.join(DATA_DIR, 'blog_posts.json')
# 音乐列表数据文件
MUSIC_FILE = os.path.join(DATA_DIR, 'music_list.json')
# 生活记录数据文件
LIFE_FILE = os.path.join(DATA_DIR, 'life_posts.json')

# 初始化数据文件
def init_data_file(file_path, initial_data=[]):
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(initial_data, f, ensure_ascii=False, indent=2)

# 初始化所有数据文件
init_data_file(BLOG_FILE)
init_data_file(MUSIC_FILE)
init_data_file(LIFE_FILE)

# 静态文件路由
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)