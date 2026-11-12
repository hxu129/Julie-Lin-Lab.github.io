"""Behavior tests for private member editing, using temporary data only."""

import http.client
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest

from server import MemberServer, Store


ORIGIN = "https://lab.example:9443"
ADMIN = "owner@example.com"


class MemberServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.site = self.root / "public"
        self.site.mkdir()
        self.assets = self.root / "assets"
        self.assets.mkdir()
        (self.assets / "editor.html").write_text("<h1>Member editor</h1>")
        (self.assets / "server.py").write_text("private source")
        self.seed = self.root / "seed.json"
        self.seed.write_text(json.dumps({"members": [
            {"id": "alice", "name": "Alice", "nameZh": "甲", "role": "PhD Student", "startMonth": "2024-09", "image": "images/web/people/alice.webp"},
            {"id": "bob", "name": "Bob", "role": "Research Intern", "status": "alumni", "startMonth": "2023-06", "endMonth": "2023-08", "alumniGroup": "interns"},
        ], "collaborators": [{"name": "Collaborator", "group": "external"}]}))
        self.store = Store(self.root / "private", self.site, self.seed)
        self.server = MemberServer(("127.0.0.1", 0), self.store, ORIGIN, [ADMIN], self.assets)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, method, path, payload=None, login=ADMIN, token=None, origin=ORIGIN, request_header=True, raw=None, content_type="application/json"):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        headers = {}
        if login is not None:
            headers["Tailscale-User-Login"] = login
        if token:
            headers["Authorization"] = "Bearer " + token
        if method != "GET":
            if origin:
                headers["Origin"] = origin
            if request_header:
                headers["X-Lin-Lab-Request"] = "1"
            headers["Content-Type"] = content_type
        body = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else b"")
        connection.request(method, path, body, headers)
        response = connection.getresponse()
        data = response.read()
        result = json.loads(data) if response.getheader("Content-Type", "").startswith("application/json") else data
        status, response_headers = response.status, dict(response.getheaders())
        connection.close()
        return status, result, response_headers

    def token(self, member="alice"):
        status, response, _ = self.request("POST", f"/api/members/{member}/edit-link", {})
        self.assertEqual(status, 200)
        return response["url"].split("#edit=", 1)[1]

    def test_identity_and_scope_and_rotation(self):
        self.assertEqual(self.request("GET", "/api/health", login=None)[0], 200)
        self.assertEqual(self.request("GET", "/api/members", login=None)[0], 401)
        self.assertEqual(self.request("GET", "/api/members", login="guest@example.com")[0], 403)
        token = self.token()
        self.assertEqual(self.request("GET", "/api/members/alice", login=None, token=token)[0], 401)
        session = self.request("GET", "/api/session", login=ADMIN, token=token)[1]
        self.assertFalse(session["admin"])
        self.assertEqual(session["memberId"], "alice")
        self.assertEqual(self.request("GET", "/api/members/alice", login="guest@example.com", token=token)[0], 200)
        for method, path, payload in [
            ("GET", "/api/members", None),
            ("GET", "/api/export", None),
            ("GET", "/api/members/bob", None),
            ("PUT", "/api/members/bob", {"version": 1, "record": {"name": "Changed"}}),
            ("POST", "/api/members/alice/edit-link", {}),
            ("POST", "/api/members", {"name": "Eve", "role": "PhD Student"}),
        ]:
            self.assertEqual(self.request(method, path, payload, token=token)[0], 403, path)
        new_token = self.token()
        self.assertNotEqual(token, new_token)
        self.assertEqual(self.request("GET", "/api/members/alice", token=token)[0], 401)
        self.assertEqual(self.request("GET", "/api/members/alice", token=new_token)[0], 200)

    def test_csrf_and_malformed_requests(self):
        body = {"version": 1, "record": {"name": "Alice Updated"}}
        for origin, request_header in [(None, True), ("https://attacker.example", True), (ORIGIN, False)]:
            self.assertEqual(self.request("PUT", "/api/members/alice", body, origin=origin, request_header=request_header)[0], 403)
        self.assertEqual(self.request("PUT", "/api/members/alice", raw=b"{")[0], 400)
        self.assertEqual(self.request("PUT", "/api/members/alice", body, content_type="text/plain")[0], 400)
        self.assertEqual(self.request("PUT", "/api/members/alice", raw=b"x" * 262145)[0], 413)
        self.assertEqual(self.request("OPTIONS", "/api/members/alice")[0], 403)
        self.assertEqual(self.store.get("alice")["version"], 1)

    def test_validation_no_arbitrary_or_privileged_fields(self):
        invalid = [
            {"startMonth": "2025-13"}, {"startMonth": "2025-1"},
            {"startMonth": "2026-01", "endMonth": "2025-12"},
            {"status": "alumni", "endMonth": ""}, {"role": "Administrator"},
            {"role": []}, {"role": {}},
            {"id": "bob"}, {"version": 0}, {"token": "injected"},
            {"image": "images/../private/member.db"}, {"image": "https://evil.example/x.png"},
            {"image": "images/x.svg"}, {"name": ""}, {"email": "not-an-email"},
            {"links": [{"label": "Homepage", "href": "javascript:alert(1)"}]},
            {"links": [{"label": "Homepage", "href": "https://[bad"}]},
            {"objectPosition": "0%;background:red"},
        ]
        for patch in invalid:
            with self.subTest(patch=patch):
                self.assertEqual(self.request("PUT", "/api/members/alice", {"version": 1, "record": patch})[0], 422)
        self.assertEqual(self.store.get("alice")["version"], 1)

    def test_update_persistence_export_publication_and_conflict(self):
        token = self.token()
        updated = {"name": "Alice <Updated>", "role": "Postdoctoral Fellow", "bio": "Hello </script>\u2028Middle\u2029End", "endMonth": "2026-10", "status": "alumni", "alumniGroup": "postdocs"}
        status, record, headers = self.request("PUT", "/api/members/alice", {"version": 1, "record": updated}, login="alice@example.com", token=token)
        self.assertEqual(status, 200)
        self.assertEqual(record["version"], 2)
        self.assertEqual(record["roleZh"], "博士后")
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(self.request("PUT", "/api/members/alice", {"version": 1, "record": {"name": "stale"}})[0], 409)
        export = self.request("GET", "/api/export")[1]
        self.assertEqual(export["members"][0], record)
        self.assertNotIn("hash", json.dumps(export))
        published = self.store.public_path.read_text()
        self.assertIn("window.LIN_LAB_PEOPLE = []", published)
        self.assertIn('"period": "Sep 2024 – Oct 2026"', published)
        self.assertIn('"periodZh": "2024年9月 – 2026年10月"', published)
        self.assertIn('"profile": "profile.html?member=alice"', published)
        self.assertIn("Collaborator", published)
        self.assertNotIn("</script>", published)
        self.assertIn("\\u003c", published)
        self.assertIn("\\u2028", published)
        self.assertIn("\\u2029", published)
        self.seed.write_text("invalid and changed seed")
        reopened = Store(self.root / "private", self.site, self.seed)
        self.assertEqual(reopened.get("alice"), record)
        self.assertEqual(reopened.token_member(token), "alice")
        with sqlite3.connect(reopened.database) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM audit").fetchone()[0], 1)
        self.assertEqual(reopened.data_dir.stat().st_mode & 0o777, 0o700)
        self.assertEqual(reopened.database.stat().st_mode & 0o777, 0o600)

    def test_create_and_resource_isolation(self):
        status, record, _ = self.request("POST", "/api/members", {"name": "New Person", "role": "Research Intern"})
        self.assertEqual(status, 201)
        self.assertEqual(record["id"], "new-person")
        self.assertEqual(record["startMonth"], "")
        self.assertEqual(self.request("POST", "/api/members", {"name": "New Person", "role": "Research Intern"})[0], 409)
        self.assertEqual(self.request("GET", "/api/members/missing")[0], 404)
        self.assertEqual(self.request("GET", "/", login=None)[0], 200)
        for path in ("/server.py", "/../server.py", "/%2e%2e/server.py", "/members.sqlite3", "/seed.json", "/images/web/people/alice.webp"):
            self.assertEqual(self.request("GET", path)[0], 404, path)
        with self.assertRaises(ValueError):
            Store(self.site / "private", self.site, self.seed)
        with self.assertRaises(ValueError):
            MemberServer(("0.0.0.0", 0), self.store, ORIGIN, [ADMIN], self.assets)

    def test_photo_is_scoped_and_not_saved_until_explicit_update(self):
        token = self.token()
        png = b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\x0dIHDR" + b"\x00\x00\x00\x01" * 2 + b"padding"
        self.assertEqual(self.request("POST", "/api/members/bob/photo", token=token, raw=png, content_type="image/png")[0], 403)
        self.assertEqual(self.request("POST", "/api/members/alice/photo", token=token, raw=b"<html>not an image</html>", content_type="image/png")[0], 422)
        status, response, _ = self.request("POST", "/api/members/alice/photo", token=token, raw=png, content_type="image/png")
        self.assertEqual(status, 200)
        self.assertEqual((self.site / response["image"]).read_bytes(), png)
        self.assertEqual(self.store.get("alice")["image"], "images/web/people/alice.webp")
        self.assertEqual(self.store.get("alice")["version"], 1)
        status, member, _ = self.request("PUT", "/api/members/alice", {"version": 1, "record": {"image": response["image"]}}, token=token)
        self.assertEqual(status, 200)
        next_release = self.root / "next-release"
        next_release.mkdir()
        restarted = Store(self.root / "private", next_release, self.seed)
        self.assertEqual(restarted.get("alice"), member)
        self.assertEqual((next_release / response["image"]).read_bytes(), png)
        self.assertEqual((restarted.portraits / Path(response["image"]).name).read_bytes(), png)


if __name__ == "__main__":
    unittest.main()
