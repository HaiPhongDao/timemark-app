import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    
    # Try PORT, if busy try next ports
    port = PORT
    server = None
    for attempt in range(10):
        try:
            server = socketserver.TCPServer(("", port), Handler)
            break
        except OSError:
            port += 1

    if not server:
        print(f"Không thể mở cổng từ {PORT} đến {PORT + 10}")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 60)
    print(f"  TIMEMARK PHOTO STAMPER WEB APP")
    print("=" * 60)
    print(f"  Server dang chay tai: {url}")
    print("  Trinh duyet se tu dong mo ung dung...")
    print("  Nhan Ctrl + C de dung server khi khong dung nua.")
    print("=" * 60)

    try:
        webbrowser.open(url)
    except Exception as e:
        print("Vui long mo trinh duyet va truy cap:", url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung server. Tam biet!")
        server.server_close()

if __name__ == "__main__":
    run()
