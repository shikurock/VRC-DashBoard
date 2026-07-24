# -*- coding: utf-8 -*-

from __future__ import annotations

import http.client
import json
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data  # noqa: E402


MOCK_USER = {
    "id": "usr_mock_me",
    "displayName": "API Test User",
    "status": "active",
    "statusDescription": "Testing",
    "bio": "Mock profile",
    "currentAvatar": "avtr_mock",
    "currentAvatarImageUrl": "https://api.vrchat.cloud/api/1/file/mock/file",
}


class MockVRChatHandler(BaseHTTPRequestHandler):
    request_log = []

    def do_GET(self):
        parsed = urlparse(self.path)
        self.request_log.append(("GET", parsed.path, parsed.query, dict(self.headers)))

        if parsed.path == "/api/1/auth/user":
            if self.headers.get("Authorization"):
                self.send_json(
                    {"requiresTwoFactorAuth": ["totp"]},
                    headers={"Set-Cookie": "auth=mock-auth; Path=/"},
                )
                return
            if "twoFactorAuth=mock-2fa" in self.headers.get("Cookie", ""):
                self.send_json(MOCK_USER)
                return
            self.send_json({"error": {"message": "Unauthorized"}}, status=401)
            return

        if parsed.path == "/api/1/auth/user/friends":
            offline = parse_qs(parsed.query).get("offline", ["false"])[0] == "true"
            if offline:
                self.send_json([
                    {
                        "id": "usr_offline",
                        "displayName": "Offline Friend",
                        "status": "offline",
                        "location": "offline",
                    }
                ])
            else:
                self.send_json([
                    {
                        "id": "usr_online",
                        "displayName": "Online Friend",
                        "status": "active",
                        "location": "wrld_mock:1",
                    },
                    {
                        "id": "usr_busy",
                        "displayName": "Busy Friend",
                        "status": "ask me",
                        "location": "private",
                    },
                ])
            return

        if parsed.path == "/api/1/avatars":
            self.send_json([
                {
                    "id": "avtr_mock",
                    "name": "Mock Avatar",
                    "releaseStatus": "private",
                    "thumbnailImageUrl": "https://api.vrchat.cloud/api/1/file/mock/file",
                }
            ])
            return

        if parsed.path == "/api/1/worlds":
            query = parse_qs(parsed.query)
            if query.get("search") != ["Japan Shrine"]:
                self.send_json({"error": {"message": "Search was not forwarded"}}, status=400)
                return
            self.send_json([
                {
                    "id": "wrld_mock",
                    "name": "Japan Shrine",
                    "authorName": "Mock Author",
                    "description": "Mock world",
                    "capacity": 40,
                    "occupants": 12,
                    "visits": 50000,
                    "tags": ["author_tag_jp", "author_tag_talk"],
                }
            ])
            return

        self.send_json({"error": {"message": "Not found"}}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        self.request_log.append(("POST", parsed.path, "", dict(self.headers)))

        if parsed.path == "/api/1/auth/twofactorauth/totp/verify":
            if payload.get("code") != "123456" or "auth=mock-auth" not in self.headers.get("Cookie", ""):
                self.send_json({"verified": False}, status=401)
                return
            self.send_json(
                {"verified": True},
                headers={"Set-Cookie": "twoFactorAuth=mock-2fa; Path=/"},
            )
            return

        self.send_json({"error": {"message": "Not found"}}, status=404)

    def do_PUT(self):
        if urlparse(self.path).path == "/api/1/logout":
            self.send_json({"success": True})
            return
        self.send_json({"error": {"message": "Not found"}}, status=404)

    def send_json(self, payload, status=200, headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


class VrcDashApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_server = ThreadingHTTPServer(("127.0.0.1", 0), MockVRChatHandler)
        cls.mock_thread = threading.Thread(target=cls.mock_server.serve_forever, daemon=True)
        cls.mock_thread.start()
        mock_port = cls.mock_server.server_address[1]
        cls.previous_base_url = data.VRCHAT_API_BASE_URL
        data.VRCHAT_API_BASE_URL = f"http://127.0.0.1:{mock_port}/api/1"

        data.SESSIONS.clear()
        cls.app_server = ThreadingHTTPServer(("127.0.0.1", 0), data.VrcDashHandler)
        cls.app_thread = threading.Thread(target=cls.app_server.serve_forever, daemon=True)
        cls.app_thread.start()
        cls.app_port = cls.app_server.server_address[1]
        cls.origin = f"http://127.0.0.1:{cls.app_port}"

    @classmethod
    def tearDownClass(cls):
        cls.app_server.shutdown()
        cls.app_server.server_close()
        cls.mock_server.shutdown()
        cls.mock_server.server_close()
        data.VRCHAT_API_BASE_URL = cls.previous_base_url
        data.SESSIONS.clear()

    def request(self, path, method="GET", payload=None, cookie="", origin=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.app_port, timeout=5)
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if cookie:
            headers["Cookie"] = cookie
        if origin is not None:
            headers["Origin"] = origin
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        raw_body = response.read()
        result = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        set_cookie = response.getheader("Set-Cookie", "")
        connection.close()
        return response.status, result, set_cookie

    def test_complete_login_dashboard_search_and_logout_flow(self):
        status, initial, _ = self.request("/api/auth/status")
        self.assertEqual(status, 200)
        self.assertFalse(initial["authenticated"])

        status, login, set_cookie = self.request(
            "/api/auth/login",
            method="POST",
            payload={"username": "test user@example.com", "password": "p@ss word"},
            origin=self.origin,
        )
        self.assertEqual(status, 200)
        self.assertTrue(login["requiresTwoFactor"])
        browser_cookie = set_cookie.split(";", 1)[0]
        self.assertTrue(browser_cookie.startswith("vrcdash_sid="))

        status, verified, _ = self.request(
            "/api/auth/2fa",
            method="POST",
            payload={"type": "totp", "code": "123456"},
            cookie=browser_cookie,
            origin=self.origin,
        )
        self.assertEqual(status, 200)
        self.assertTrue(verified["authenticated"])

        status, dashboard, _ = self.request("/api/dashboard", cookie=browser_cookie)
        self.assertEqual(status, 200)
        self.assertEqual(dashboard["user"]["displayName"], "API Test User")
        self.assertEqual(dashboard["user"]["currentAvatar"], "Mock Avatar")
        self.assertEqual(dashboard["friendCounts"], {"online": 1, "busy": 1, "offline": 1})
        self.assertEqual(len(dashboard["avatars"]), 1)

        status, worlds, _ = self.request(
            "/api/worlds?keyword=Japan%20Shrine", cookie=browser_cookie
        )
        self.assertEqual(status, 200)
        self.assertEqual(worlds["results"][0]["id"], "wrld_mock")
        self.assertIn("jp", worlds["results"][0]["categories"])

        status, _, _ = self.request(
            "/api/auth/logout",
            method="POST",
            payload={},
            cookie=browser_cookie,
            origin="https://example.com",
        )
        self.assertEqual(status, 403)

        status, logout, expired_cookie = self.request(
            "/api/auth/logout",
            method="POST",
            payload={},
            cookie=browser_cookie,
            origin=self.origin,
        )
        self.assertEqual(status, 200)
        self.assertFalse(logout["authenticated"])
        self.assertIn("Max-Age=0", expired_cookie)

    def test_image_url_allowlist(self):
        self.assertTrue(data.is_allowed_vrchat_image_url("https://api.vrchat.cloud/api/1/file/a"))
        self.assertTrue(data.is_allowed_vrchat_image_url("https://files.vrchat.cloud/a.webp"))
        self.assertFalse(data.is_allowed_vrchat_image_url("http://api.vrchat.cloud/a"))
        self.assertFalse(data.is_allowed_vrchat_image_url("https://vrchat.cloud.example.com/a"))


if __name__ == "__main__":
    unittest.main()
