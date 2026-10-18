"""Disposable learning API. Not a production server or a shared database design."""
import json
import os
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MESSAGE = os.environ["APP_MESSAGE"]  # Deliberately required for the recovery exercise.
DATA = Path(os.environ.get("DATA_DIR", "/tmp/universe-data"))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / "products.db"
with sqlite3.connect(DB) as connection:
    connection.execute("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT)")
    connection.execute("INSERT OR IGNORE INTO products VALUES (?, ?)", (1, "learning product"))


def response_for(path):
    if path == "/health":
        return 200, "application/json", json.dumps({"status": "ok", "message": MESSAGE}).encode()
    if path == "/products":
        with sqlite3.connect(DB) as connection:
            rows = connection.execute("SELECT id, name FROM products ORDER BY id").fetchall()
        return 200, "application/json", json.dumps([{"id": row[0], "name": row[1]} for row in rows]).encode()
    if path == "/metrics":
        return 200, "text/plain; version=0.0.4", b"# HELP universe_app_info Learning app availability marker.\n# TYPE universe_app_info gauge\nuniverse_app_info 1\n"
    return 404, "application/json", b'{"error":"not found"}'


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status, content_type, body = response_for(self.path.split("?", 1)[0])
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    address = os.environ.get("BIND_ADDR", "0.0.0.0")
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer((address, port), Handler)
    print(f"LISTENING {address}:{server.server_address[1]}", flush=True)
    server.serve_forever()
