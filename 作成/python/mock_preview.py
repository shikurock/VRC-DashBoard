# -*- coding: utf-8 -*-
"""Launch a mock-backed dashboard for local visual checks only."""

from __future__ import annotations

import os
import threading
from http.server import ThreadingHTTPServer

import data
from test_data import MockVRChatHandler


def main() -> None:
    mock_server = ThreadingHTTPServer(("127.0.0.1", 0), MockVRChatHandler)
    threading.Thread(target=mock_server.serve_forever, daemon=True).start()
    data.VRCHAT_API_BASE_URL = (
        f"http://127.0.0.1:{mock_server.server_address[1]}/api/1"
    )

    port = int(os.environ.get("VRC_DASH_MOCK_PORT", "8766"))
    app_server = ThreadingHTTPServer(("127.0.0.1", port), data.VrcDashHandler)
    print(f"Mock VRC Dash: http://127.0.0.1:{port}/")
    try:
        app_server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        app_server.server_close()
        mock_server.shutdown()
        mock_server.server_close()


if __name__ == "__main__":
    main()
