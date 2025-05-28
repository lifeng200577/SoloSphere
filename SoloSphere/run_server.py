import http.server
import socketserver
import webbrowser
import os
import socket
import sys
import time

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('', port))
            return False
        except socket.error:
            return True

def find_available_port(start_port=8000, max_attempts=10):
    port = start_port
    while port < start_port + max_attempts:
        if not is_port_in_use(port):
            return port
        port += 1
    return None

def run_server():
    # 设置HTTP服务器
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            # 如果访问根路径，重定向到主页
            if self.path == '/':
                self.path = '/index.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        def log_message(self, format, *args):
            # 重写日志方法，添加时间戳
            sys.stderr.write("%s - %s\n" % (
                time.strftime('[%Y-%m-%d %H:%M:%S]'),
                format%args
            ))

    # 查找可用端口
    port = find_available_port()
    if port is None:
        print("错误：无法找到可用端口")
        return

    try:
        # 启动服务器
        with socketserver.TCPServer(("", port), CustomHandler) as httpd:
            print(f"服务器启动在 http://localhost:{port}")
            webbrowser.open(f'http://localhost:{port}')
            print("按 Ctrl+C 停止服务器")
            httpd.serve_forever()
    except OSError as e:
        print(f"错误：无法启动服务器 - {e}")
    except Exception as e:
        print(f"错误：{e}")

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"\n发生错误：{e}")
        print("服务器异常停止") 