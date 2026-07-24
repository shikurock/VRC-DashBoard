# -*- coding: utf-8 -*-
"""Local VRChat API proxy for VRC Dash.

Run this file, then open http://127.0.0.1:8766/ in a browser.
VRChat credentials and API cookies live only in process memory.
"""

from __future__ import annotations

import base64
import hashlib
import http.cookiejar
import json
import mimetypes
import os
import secrets
import threading
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urlencode, unquote, urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener


HOST = "127.0.0.1"
PORT = int(os.environ.get("VRC_DASH_PORT", "8766"))
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = Path(__file__).with_name("api_store.json")
VRCHAT_API_BASE_URL = os.environ.get(
    "VRCHAT_API_BASE_URL", "https://api.vrchat.cloud/api/1"
).rstrip("/")
VRCHAT_USER_AGENT = os.environ.get(
    "VRC_DASH_USER_AGENT", "VRCDash/1.0.0 (local dashboard)"
)
SESSION_COOKIE_NAME = "vrcdash_sid"
SESSION_MAX_AGE_SECONDS = 12 * 60 * 60
JSON_BODY_LIMIT = 32 * 1024
IMAGE_BODY_LIMIT = 12 * 1024 * 1024

SESSIONS: dict[str, dict] = {}
SESSION_LOCK = threading.RLock()
STORE_LOCK = threading.RLock()

DEFAULT_PROFILE = {
    "displayName": "Guest User",
    "bio": "",
    "status": "offline",
    "currentAvatar": "-",
}


class DashboardError(Exception):
    """An error that can be returned safely to the local browser."""

    def __init__(self, status: int, message: str, details=None) -> None:
        super().__init__(message)
        self.status = int(status)
        self.details = details


class VRChatClient:
    """Small stdlib-only client for the endpoints used by this dashboard."""

    def __init__(
        self,
        base_url: str | None = None,
        user_agent: str = VRCHAT_USER_AGENT,
        sleep=time.sleep,
    ) -> None:
        self.base_url = (base_url or VRCHAT_API_BASE_URL).rstrip("/")
        self.user_agent = user_agent
        self.sleep = sleep
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookie_jar))
        self.cache: dict[str, tuple[float, object]] = {}
        self.lock = threading.RLock()

    def request(
        self,
        api_path: str,
        *,
        method: str = "GET",
        body: dict | None = None,
        authorization: str = "",
        cache_ttl: int = 0,
        retries: int = 2,
    ):
        cache_key = f"{method}:{api_path}"
        cached = self.cache.get(cache_key)
        if method == "GET" and cached and cached[0] > time.time():
            return cached[1]

        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if authorization:
            headers["Authorization"] = authorization

        request_body = None
        if body is not None:
            request_body = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        with self.lock:
            for attempt in range(retries + 1):
                request = Request(
                    f"{self.base_url}{api_path}",
                    data=request_body,
                    headers=headers,
                    method=method,
                )
                try:
                    with self.opener.open(request, timeout=20) as response:
                        raw_body = response.read()
                        payload = decode_response(raw_body, response.headers.get("Content-Type", ""))
                        if method == "GET" and cache_ttl > 0:
                            self.cache[cache_key] = (time.time() + cache_ttl, payload)
                        return payload
                except HTTPError as error:
                    raw_body = error.read()
                    payload = decode_response(raw_body, error.headers.get("Content-Type", ""))
                    if error.code == HTTPStatus.TOO_MANY_REQUESTS and method == "GET" and attempt < retries:
                        retry_after = error.headers.get("Retry-After", "")
                        delay = float(retry_after) if retry_after.replace(".", "", 1).isdigit() else 2**attempt
                        self.sleep(min(max(delay, 0.25), 10))
                        continue
                    raise DashboardError(error.code, api_error_message(payload, error.code), payload) from None
                except URLError as error:
                    raise DashboardError(
                        HTTPStatus.BAD_GATEWAY,
                        f"VRChat APIに接続できません: {error.reason}",
                    ) from None

        raise DashboardError(HTTPStatus.BAD_GATEWAY, "VRChat APIから応答がありません。")

    def login(self, username: str, password: str) -> dict:
        encoded = f"{quote(username, safe='')}:{quote(password, safe='')}"
        token = base64.b64encode(encoded.encode("utf-8")).decode("ascii")
        user = self.request(
            "/auth/user",
            authorization=f"Basic {token}",
            retries=0,
        )
        methods = user.get("requiresTwoFactorAuth", []) if isinstance(user, dict) else []
        if isinstance(methods, list) and methods:
            return {
                "authenticated": False,
                "requiresTwoFactor": True,
                "methods": methods,
            }
        if not isinstance(user, dict) or not user.get("id"):
            raise DashboardError(HTTPStatus.UNAUTHORIZED, "VRChatの認証を確認できませんでした。")
        return {"authenticated": True, "user": user, "methods": []}

    def verify_two_factor(self, method_name: str, code: str) -> dict:
        normalized = method_name.strip().lower()
        endpoints = {
            "totp": "/auth/twofactorauth/totp/verify",
            "email": "/auth/twofactorauth/emailotp/verify",
            "emailotp": "/auth/twofactorauth/emailotp/verify",
            "otp": "/auth/twofactorauth/otp/verify",
            "recovery": "/auth/twofactorauth/otp/verify",
            "recoverycode": "/auth/twofactorauth/otp/verify",
        }
        endpoint = endpoints.get(normalized)
        if not endpoint:
            raise DashboardError(HTTPStatus.BAD_REQUEST, "対応していない2段階認証方式です。")

        result = self.request(endpoint, method="POST", body={"code": code}, retries=0)
        if not isinstance(result, dict) or not result.get("verified"):
            raise DashboardError(HTTPStatus.UNAUTHORIZED, "認証コードを確認できませんでした。")
        return self.get_current_user()

    def get_current_user(self) -> dict:
        return self.request("/auth/user", cache_ttl=20, retries=1)

    def get_friends(self, offline: bool) -> list[dict]:
        params = urlencode({"n": 100, "offset": 0, "offline": str(offline).lower()})
        result = self.request(f"/auth/user/friends?{params}", cache_ttl=30)
        return result if isinstance(result, list) else []

    def get_avatars(self) -> list[dict]:
        params = urlencode(
            {
                "user": "me",
                "releaseStatus": "all",
                "n": 10,
                "sort": "_updated_at",
                "order": "descending",
            }
        )
        result = self.request(f"/avatars?{params}", cache_ttl=60)
        return result if isinstance(result, list) else []

    def search_worlds(self, keyword: str) -> list[dict]:
        params = {
            "n": 12,
            "sort": "relevance" if keyword else "popularity",
            "order": "descending",
            "releaseStatus": "public",
        }
        if keyword:
            params["search"] = keyword
        result = self.request(f"/worlds?{urlencode(params)}", cache_ttl=60)
        return result if isinstance(result, list) else []

    def fetch_image(self, image_url: str) -> tuple[bytes, str]:
        if not is_allowed_vrchat_image_url(image_url):
            raise DashboardError(HTTPStatus.BAD_REQUEST, "画像URLが許可されていません。")

        request = Request(image_url, headers={"User-Agent": self.user_agent, "Accept": "image/*"})
        try:
            with self.lock, self.opener.open(request, timeout=20) as response:
                final_url = response.geturl()
                if not is_allowed_vrchat_image_url(final_url):
                    raise DashboardError(HTTPStatus.BAD_REQUEST, "画像の転送先が許可されていません。")
                content_type = response.headers.get_content_type()
                if not content_type.startswith("image/"):
                    raise DashboardError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "画像以外は表示できません。")
                content_length = int(response.headers.get("Content-Length", "0") or 0)
                if content_length > IMAGE_BODY_LIMIT:
                    raise DashboardError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "画像サイズが大きすぎます。")
                image_bytes = response.read(IMAGE_BODY_LIMIT + 1)
                if len(image_bytes) > IMAGE_BODY_LIMIT:
                    raise DashboardError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "画像サイズが大きすぎます。")
                return image_bytes, content_type
        except DashboardError:
            raise
        except HTTPError as error:
            raise DashboardError(error.code, "VRChat画像を取得できませんでした。") from None
        except URLError as error:
            raise DashboardError(
                HTTPStatus.BAD_GATEWAY,
                f"VRChat画像に接続できません: {error.reason}",
            ) from None

    def logout(self) -> None:
        try:
            self.request("/logout", method="PUT", retries=0)
        finally:
            self.cookie_jar.clear()
            self.cache.clear()


def decode_response(raw_body: bytes, content_type: str):
    if not raw_body:
        return {}
    text = raw_body.decode("utf-8", errors="replace")
    if "json" in content_type.lower():
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"message": text}
    return text


def api_error_message(payload, status: int) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict) and error.get("message"):
            return str(error["message"])
        if payload.get("message"):
            return str(payload["message"])
    if status == HTTPStatus.UNAUTHORIZED:
        return "ユーザー名、パスワード、または認証状態を確認してください。"
    if status == HTTPStatus.TOO_MANY_REQUESTS:
        return "VRChat APIの利用上限に達しました。少し待ってから再試行してください。"
    return f"VRChat APIでエラーが発生しました ({status})。"


def normalize_status(value: str) -> str:
    status = str(value or "").strip().lower()
    if status in {"active", "online"}:
        return "online"
    if status in {"join me", "ask me", "busy", "offline"}:
        return status
    return "offline" if not status else status


def friend_presence(friend: dict) -> str:
    status = normalize_status(friend.get("status", ""))
    location = str(friend.get("location", "")).lower()
    if status == "offline" or location == "offline":
        return "offline"
    if status in {"join me", "ask me", "busy"}:
        return "busy"
    return "online"


def normalize_friend(friend: dict) -> dict:
    return {
        "id": friend.get("id", ""),
        "displayName": friend.get("displayName", "Unknown User"),
        "status": normalize_status(friend.get("status", "")),
        "statusDescription": friend.get("statusDescription", ""),
        "location": friend.get("location", ""),
        "lastLogin": friend.get("last_login", ""),
        "userIcon": friend.get("userIcon", ""),
        "currentAvatarThumbnailImageUrl": friend.get("currentAvatarThumbnailImageUrl", ""),
        "presence": friend_presence(friend),
    }


def normalize_avatar(avatar: dict) -> dict:
    return {
        "id": avatar.get("id", ""),
        "name": avatar.get("name", "Avatar"),
        "description": avatar.get("description", ""),
        "thumbnailImageUrl": avatar.get("thumbnailImageUrl", "") or avatar.get("imageUrl", ""),
        "imageUrl": avatar.get("imageUrl", ""),
        "releaseStatus": avatar.get("releaseStatus", ""),
        "authorName": avatar.get("authorName", ""),
        "updatedAt": avatar.get("updated_at", ""),
    }


def normalize_user(user: dict, avatars: list[dict] | None = None) -> dict:
    current_avatar_id = user.get("currentAvatar", "")
    current_avatar_name = current_avatar_id or "-"
    for avatar in avatars or []:
        if avatar.get("id") == current_avatar_id:
            current_avatar_name = avatar.get("name", current_avatar_id)
            break
    return {
        "id": user.get("id", ""),
        "displayName": user.get("displayName", "-"),
        "bio": user.get("bio", ""),
        "status": normalize_status(user.get("status", "")),
        "statusDescription": user.get("statusDescription", ""),
        "currentAvatar": current_avatar_name,
        "currentAvatarId": current_avatar_id,
        "currentAvatarImageUrl": user.get("currentAvatarImageUrl", "")
        or user.get("currentAvatarThumbnailImageUrl", "")
        or user.get("userIcon", ""),
        "dateJoined": user.get("date_joined", ""),
        "lastLogin": user.get("last_login", ""),
    }


def normalize_world(world: dict) -> dict:
    raw_tags = world.get("tags", []) if isinstance(world.get("tags"), list) else []
    tags = []
    for tag in raw_tags:
        clean_tag = str(tag).replace("author_tag_", "").replace("system_", "")
        if clean_tag and clean_tag not in tags:
            tags.append(clean_tag)

    search_text = " ".join(
        [str(world.get("name", "")), str(world.get("description", "")), *tags]
    ).lower()
    visits = safe_int(world.get("visits"))
    occupants = safe_int(world.get("occupants"))
    categories = []
    if visits >= 30000:
        categories.append("popular")
    if occupants >= 8:
        categories.append("active")
    if any(word in search_text for word in ("photo", "avatar", "studio", "mirror")):
        categories.append("photo")
    if any(word in search_text for word in ("talk", "chill", "friends", "public")):
        categories.append("talk")
    if "japan" in search_text or "japanese" in search_text or "jp" in tags or "日本" in search_text:
        categories.append("jp")

    return {
        "id": world.get("id", ""),
        "name": world.get("name", "No Name"),
        "authorName": world.get("authorName", "Unknown"),
        "description": world.get("description", ""),
        "capacity": safe_int(world.get("capacity")),
        "occupants": occupants,
        "visits": visits,
        "favorites": safe_int(world.get("favorites")),
        "tags": tags[:8],
        "categories": categories,
        "theme": "default",
        "thumbnailLabel": world.get("name", "World"),
        "thumbnailImageUrl": world.get("thumbnailImageUrl", "") or world.get("imageUrl", ""),
    }


def safe_int(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def build_dashboard(session: dict) -> dict:
    client: VRChatClient = session["client"]
    user = client.get_current_user()
    online_friends = client.get_friends(False)
    offline_friends = client.get_friends(True)
    raw_avatars = client.get_avatars()

    unique_friends = {}
    for friend in [*offline_friends, *online_friends]:
        if friend.get("id"):
            unique_friends[friend["id"]] = friend
    friends = [normalize_friend(friend) for friend in unique_friends.values()]
    status_order = {"online": 0, "busy": 1, "offline": 2}
    friends.sort(key=lambda item: (status_order.get(item["presence"], 3), item["displayName"].casefold()))

    counts = {"online": 0, "busy": 0, "offline": 0}
    for friend in friends:
        counts[friend["presence"]] += 1

    session["user"] = user
    avatars = [normalize_avatar(avatar) for avatar in raw_avatars[:10]]
    dashboard_user = normalize_user(user, raw_avatars)
    session["dashboardUser"] = dashboard_user
    return {
        "user": dashboard_user,
        "friends": friends,
        "friendCounts": counts,
        "avatars": avatars,
        "friendResultsMayBeTruncated": len(online_friends) == 100 or len(offline_friends) == 100,
    }


def default_store() -> dict:
    return {
        "auth": {
            "provider": "VRChat",
            "linkedUserId": "",
            "linkedUsername": "",
            "linkedDisplayName": "",
            "lastLinkedAt": "",
        },
        "profile": DEFAULT_PROFILE.copy(),
        "profilesByUser": {},
        "favoriteAvatarIds": [],
        "favoriteAvatarIdsByUser": {},
        "contacts": [],
    }


def load_store() -> dict:
    if not DATA_FILE.exists():
        return default_store()
    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            stored = json.load(file)
    except (OSError, json.JSONDecodeError):
        return default_store()
    data = default_store()
    data.update(stored)
    return data


def save_store(data: dict) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def binding_key_for_session(session: dict | None) -> str:
    user = (session or {}).get("user") or {}
    user_id = str(user.get("id", ""))
    if not user_id:
        return "guest"
    digest = hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:16]
    return f"vrchat_{digest}"


def public_session_status(session: dict | None) -> dict:
    user = (session or {}).get("user") or {}
    awaiting = bool((session or {}).get("awaitingTwoFactor"))
    authenticated = bool(user.get("id"))
    display_name = user.get("displayName", "")
    return {
        "provider": "VRChat",
        "credentialSource": "memory",
        "authenticated": authenticated,
        "requiresTwoFactor": awaiting,
        "methods": (session or {}).get("methods", []),
        "isConfigured": authenticated or awaiting,
        "isLinked": authenticated,
        "requiresSetup": not authenticated and not awaiting,
        "displayName": display_name,
        "userId": user.get("id", ""),
        "bindingKey": binding_key_for_session(session),
        "bindings": {
            "dashboard": "/api/dashboard",
            "profile": "/api/profile",
            "worlds": "/api/worlds",
            "avatarFavorites": "/api/avatar-favorites",
            "contact": "/api/contact",
        },
    }


def current_profile(data: dict, session: dict) -> dict:
    binding_key = binding_key_for_session(session)
    base_profile = session.get("dashboardUser") or normalize_user(session.get("user", {}))
    profile = {
        **DEFAULT_PROFILE,
        **{key: base_profile.get(key, value) for key, value in DEFAULT_PROFILE.items()},
        **data.get("profilesByUser", {}).get(binding_key, {}),
    }
    profile["linkedVrchat"] = public_session_status(session)
    return profile


def save_current_profile(data: dict, session: dict, payload: dict) -> dict:
    allowed_fields = {"displayName", "bio", "status", "currentAvatar"}
    updates = {
        key: str(value).strip()
        for key, value in payload.items()
        if key in allowed_fields and isinstance(value, (str, int, float))
    }
    binding_key = binding_key_for_session(session)
    profiles_by_user = data.setdefault("profilesByUser", {})
    next_profile = {**current_profile(data, session), **updates}
    next_profile.pop("linkedVrchat", None)
    profiles_by_user[binding_key] = next_profile
    data["profilesByUser"] = profiles_by_user
    return {**next_profile, "linkedVrchat": public_session_status(session)}


def current_favorite_avatar_ids(data: dict, session: dict) -> list:
    binding_key = binding_key_for_session(session)
    by_user = data.setdefault("favoriteAvatarIdsByUser", {})
    return by_user.get(binding_key, [])


def save_current_favorite_avatar_ids(data: dict, session: dict, favorite_ids: list) -> list:
    binding_key = binding_key_for_session(session)
    safe_ids = [str(item) for item in favorite_ids if isinstance(item, str)][:100]
    by_user = data.setdefault("favoriteAvatarIdsByUser", {})
    by_user[binding_key] = safe_ids
    data["favoriteAvatarIdsByUser"] = by_user
    return safe_ids


def create_contact_receipt(payload: dict, session: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "ticketId": f"VRC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "receivedAt": now,
        "title": str(payload.get("title", ""))[:120],
        "category": str(payload.get("category", ""))[:40],
        "priority": str(payload.get("priority", ""))[:40],
        "name": str(payload.get("name") or "No name")[:80],
        "replyMethod": str(payload.get("replyMethod", ""))[:40],
        "message": str(payload.get("message", ""))[:4000],
        "statusMessage": "Python APIで受け付けました。",
        "linkedVrchat": public_session_status(session),
    }


def is_allowed_vrchat_image_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except (TypeError, ValueError):
        return False
    hostname = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and (
        hostname == "api.vrchat.cloud" or hostname.endswith(".vrchat.cloud")
    )


def create_session(client: VRChatClient, login_result: dict) -> tuple[str, dict]:
    session_id = secrets.token_urlsafe(32)
    session = {
        "client": client,
        "user": login_result.get("user"),
        "awaitingTwoFactor": bool(login_result.get("requiresTwoFactor")),
        "methods": login_result.get("methods", []),
        "lastSeen": time.time(),
    }
    with SESSION_LOCK:
        SESSIONS[session_id] = session
    return session_id, session


def remove_session(session_id: str) -> dict | None:
    with SESSION_LOCK:
        return SESSIONS.pop(session_id, None)


class VrcDashHandler(BaseHTTPRequestHandler):
    """Serve the existing dashboard and same-origin JSON API."""

    def do_GET(self) -> None:
        self.dispatch(self.handle_get)

    def do_POST(self) -> None:
        self.dispatch(self.handle_post)

    def dispatch(self, handler) -> None:
        try:
            handler()
        except DashboardError as error:
            self.send_json({"error": str(error)}, status=error.status)
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception as error:
            print(f"[API] internal error: {type(error).__name__}: {error}")
            if not self.wfile.closed:
                self.send_json(
                    {"error": "ローカルAPIでエラーが発生しました。"},
                    status=HTTPStatus.INTERNAL_SERVER_ERROR,
                )

    def handle_get(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/api/auth/status":
            _, session = self.get_session()
            self.send_json(public_session_status(session))
            return

        if parsed.path == "/api/dashboard":
            _, session = self.require_session()
            self.send_json(build_dashboard(session))
            return

        if parsed.path == "/api/profile":
            _, session = self.require_session()
            with STORE_LOCK:
                self.send_json(current_profile(load_store(), session))
            return

        if parsed.path == "/api/worlds":
            _, session = self.require_session()
            keyword = parse_qs(parsed.query).get("keyword", [""])[0].strip()
            if len(keyword) > 80:
                raise DashboardError(HTTPStatus.BAD_REQUEST, "検索文字は80文字以内にしてください。")
            worlds = session["client"].search_worlds(keyword)
            self.send_json(
                {
                    "results": [normalize_world(world) for world in worlds],
                    "linkedVrchat": public_session_status(session),
                }
            )
            return

        if parsed.path == "/api/avatar-favorites":
            _, session = self.require_session()
            with STORE_LOCK:
                data = load_store()
                favorite_ids = current_favorite_avatar_ids(data, session)
            self.send_json(
                {
                    "favoriteAvatarIds": favorite_ids,
                    "linkedVrchat": public_session_status(session),
                }
            )
            return

        if parsed.path == "/api/image":
            _, session = self.require_session()
            image_url = parse_qs(parsed.query).get("url", [""])[0]
            image_bytes, content_type = session["client"].fetch_image(image_url)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(image_bytes)))
            self.send_header("Cache-Control", "private, max-age=300")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(image_bytes)
            return

        self.send_static_file(parsed.path)

    def handle_post(self) -> None:
        self.assert_same_origin()
        parsed = urlparse(self.path)
        payload = self.read_json_body()

        if parsed.path == "/api/auth/login":
            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", ""))
            if not username or not password:
                raise DashboardError(HTTPStatus.BAD_REQUEST, "ユーザー名とパスワードを入力してください。")
            if len(username) > 254 or len(password) > 512:
                raise DashboardError(HTTPStatus.BAD_REQUEST, "ログイン情報が長すぎます。")

            previous_id, _ = self.get_session()
            if previous_id:
                remove_session(previous_id)
            client = VRChatClient()
            login_result = client.login(username, password)
            session_id, session = create_session(client, login_result)
            response = {
                **public_session_status(session),
                "authenticated": bool(login_result.get("authenticated")),
                "requiresTwoFactor": bool(login_result.get("requiresTwoFactor")),
                "methods": login_result.get("methods", []),
            }
            if session.get("user"):
                response["user"] = normalize_user(session["user"])
            self.send_json(response, headers={"Set-Cookie": self.session_cookie(session_id)})
            return

        if parsed.path == "/api/auth/2fa":
            _, session = self.require_session(authenticated=False)
            if not session.get("awaitingTwoFactor"):
                raise DashboardError(HTTPStatus.CONFLICT, "2段階認証は要求されていません。")
            code = str(payload.get("code", "")).strip()
            method_name = str(payload.get("type", "totp"))
            if not code:
                raise DashboardError(HTTPStatus.BAD_REQUEST, "認証コードを入力してください。")
            user = session["client"].verify_two_factor(method_name, code)
            session["user"] = user
            session["awaitingTwoFactor"] = False
            session["methods"] = []
            self.send_json(
                {
                    **public_session_status(session),
                    "authenticated": True,
                    "user": normalize_user(user),
                }
            )
            return

        if parsed.path == "/api/auth/logout":
            session_id, session = self.get_session()
            if session_id:
                remove_session(session_id)
            if session:
                try:
                    session["client"].logout()
                except DashboardError:
                    pass
            self.send_json(
                {"authenticated": False},
                headers={"Set-Cookie": self.expired_session_cookie()},
            )
            return

        if parsed.path == "/api/profile":
            _, session = self.require_session()
            with STORE_LOCK:
                data = load_store()
                saved_profile = save_current_profile(data, session, payload)
                save_store(data)
            self.send_json(saved_profile)
            return

        if parsed.path == "/api/contact":
            _, session = self.require_session()
            receipt = create_contact_receipt(payload, session)
            with STORE_LOCK:
                data = load_store()
                data.setdefault("contacts", []).append(receipt)
                save_store(data)
            self.send_json(receipt, status=HTTPStatus.CREATED)
            return

        if parsed.path == "/api/avatar-favorites":
            _, session = self.require_session()
            favorite_ids = payload.get("favoriteAvatarIds", [])
            with STORE_LOCK:
                data = load_store()
                saved = save_current_favorite_avatar_ids(
                    data,
                    session,
                    favorite_ids if isinstance(favorite_ids, list) else [],
                )
                save_store(data)
            self.send_json(
                {
                    "favoriteAvatarIds": saved,
                    "linkedVrchat": public_session_status(session),
                }
            )
            return

        raise DashboardError(HTTPStatus.NOT_FOUND, "API endpoint not found.")

    def get_session(self) -> tuple[str, dict | None]:
        raw_cookie = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        try:
            cookie.load(raw_cookie)
        except Exception:
            return "", None
        session_id = cookie.get(SESSION_COOKIE_NAME).value if cookie.get(SESSION_COOKIE_NAME) else ""
        if not session_id:
            return "", None

        now = time.time()
        with SESSION_LOCK:
            expired_ids = [
                key
                for key, value in SESSIONS.items()
                if now - value.get("lastSeen", 0) > SESSION_MAX_AGE_SECONDS
            ]
            for key in expired_ids:
                SESSIONS.pop(key, None)
            session = SESSIONS.get(session_id)
            if session:
                session["lastSeen"] = now
        return session_id, session

    def require_session(self, authenticated: bool = True) -> tuple[str, dict]:
        session_id, session = self.get_session()
        if not session or (authenticated and not session.get("user", {}).get("id")):
            raise DashboardError(HTTPStatus.UNAUTHORIZED, "ログインが必要です。")
        return session_id, session

    def assert_same_origin(self) -> None:
        origin = self.headers.get("Origin", "")
        host = self.headers.get("Host", "")
        if origin and urlparse(origin).netloc != host:
            raise DashboardError(HTTPStatus.FORBIDDEN, "別のサイトからの操作は許可されていません。")

    def read_json_body(self) -> dict:
        length = safe_int(self.headers.get("Content-Length", "0"))
        if length > JSON_BODY_LIMIT:
            raise DashboardError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "送信データが大きすぎます。")
        if length <= 0:
            return {}
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise DashboardError(HTTPStatus.BAD_REQUEST, "JSON形式が正しくありません。") from None
        return payload if isinstance(payload, dict) else {}

    def send_json(
        self,
        payload: dict,
        status: int = HTTPStatus.OK,
        headers: dict | None = None,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def send_static_file(self, request_path: str) -> None:
        safe_path = unquote(request_path).lstrip("/") or "idex.html"
        file_path = (PROJECT_ROOT / safe_path).resolve()
        try:
            file_path.relative_to(PROJECT_ROOT.resolve())
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; connect-src 'self'; base-uri 'none'; "
            "frame-ancestors 'none'; form-action 'self'",
        )
        self.end_headers()
        self.wfile.write(body)

    @staticmethod
    def session_cookie(session_id: str) -> str:
        return f"{SESSION_COOKIE_NAME}={session_id}; Path=/; HttpOnly; SameSite=Strict"

    @staticmethod
    def expired_session_cookie() -> str:
        return f"{SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"

    def log_message(self, format: str, *args) -> None:
        print(f"[API] {self.address_string()} - {format % args}")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), VrcDashHandler)
    print(f"VRC Dash: http://{HOST}:{PORT}/")
    print("認証情報とVRChat Cookieはメモリ内だけで保持します。")
    print("Stop: Ctrl + C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nVRC Dash stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
