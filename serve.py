"""Minimal static file server with HTTP Range support (for video seeking)."""
import http.server
import os
import re
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        # disable browser caching so dev edits show up immediately
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        if not os.path.isfile(path):
            return super().send_head()

        rng = self.headers.get("Range")
        try:
            size = os.path.getsize(path)
        except OSError:
            return super().send_head()

        ctype = self.guess_type(path)

        if not rng:
            try:
                f = open(path, "rb")
            except OSError:
                self.send_error(404, "File not found")
                return None
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return f

        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        if not m:
            self.send_error(416, "Invalid Range")
            return None
        start_s, end_s = m.group(1), m.group(2)
        if start_s == "" and end_s == "":
            self.send_error(416, "Invalid Range")
            return None
        if start_s == "":
            length = int(end_s)
            start = max(size - length, 0)
            end = size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
        if start >= size or end >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        f.seek(start)
        length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        # SimpleHTTPRequestHandler.copyfile() copies to the end; we need a slice
        self._range_remaining = length
        return _RangeFile(f, length)


class _RangeFile:
    def __init__(self, fp, remaining):
        self._fp = fp
        self._remaining = remaining

    def read(self, n=-1):
        if self._remaining <= 0:
            return b""
        if n is None or n < 0 or n > self._remaining:
            n = self._remaining
        data = self._fp.read(n)
        self._remaining -= len(data)
        return data

    def close(self):
        self._fp.close()


def run(port):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), RangeHandler) as httpd:
        print(f"Serving {ROOT} on http://localhost:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 5273)
