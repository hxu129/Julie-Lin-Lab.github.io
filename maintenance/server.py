#!/usr/bin/env python3
"""Private Tailscale-backed member editor; public records remain plain JavaScript."""

import argparse
from contextlib import contextmanager
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import tempfile
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit
import uuid


ROLES = {
    "Postdoctoral Fellow": "博士后",
    "PhD Student": "博士研究生",
    "MPhil Student": "研究型硕士生",
    "Research Assistant": "研究助理",
    "Undergraduate Researcher": "本科生研究员",
    "Research Intern": "科研实习生",
    "Technical & Administrative Assistant": "技术与行政助理",
}
GROUPS = {"interns", "assistants", "undergraduates", "graduates", "postdocs"}
TEXT_LIMITS = {
    "name": 120, "nameZh": 120, "role": 80, "roleZh": 80,
    "email": 254, "bio": 20000, "bioZh": 20000, "educationZh": 10000,
    "image": 300, "objectPosition": 40, "startMonth": 7, "endMonth": 7,
    "position": 1500, "positionZh": 1500, "nextPosition": 1500,
    "nextPositionZh": 1500, "profile": 300, "profileZh": 300,
    "status": 20, "alumniGroup": 30,
}
EDITABLE = set(TEXT_LIMITS) | {"education", "links"}
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
MONTH = re.compile(r"(?:19|20|21)\d\d-(?:0[1-9]|1[0-2])\Z")
MONTH_NAMES = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


class APIError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def validate_record(patch, base=None):
    if not isinstance(patch, dict):
        raise APIError(422, "Member record must be an object.")
    if set(patch) - EDITABLE:
        raise APIError(422, "Unknown or read-only member fields.")
    value = {key: "" for key in TEXT_LIMITS}
    value.update(status="current", alumniGroup="assistants", objectPosition="50% 50%", education=[], links=[])
    if base:
        value.update({key: item for key, item in base.items() if key in EDITABLE})
    value.update(patch)
    for key, limit in TEXT_LIMITS.items():
        item = value[key]
        if not isinstance(item, str) or len(item) > limit or any(ord(c) < 32 and c not in "\n\r\t" for c in item):
            raise APIError(422, "Invalid field: " + key)
        value[key] = item.strip()
    if "role" in patch and "roleZh" not in patch:
        value["roleZh"] = ROLES.get(value["role"], "")
    if not value["name"]:
        raise APIError(422, "Name is required.")
    if value["role"] not in ROLES:
        raise APIError(422, "Choose a supported role.")
    if not value["roleZh"]:
        value["roleZh"] = ROLES[value["role"]]
    if value["status"] not in {"current", "alumni"} or value["alumniGroup"] not in GROUPS:
        raise APIError(422, "Invalid member status or alumni group.")
    for key in ("startMonth", "endMonth"):
        if value[key] and not MONTH.fullmatch(value[key]):
            raise APIError(422, "Dates must use YYYY-MM.")
    if value["startMonth"] and value["endMonth"] and value["endMonth"] < value["startMonth"]:
        raise APIError(422, "End month cannot precede start month.")
    if value["status"] == "alumni" and not value["endMonth"]:
        raise APIError(422, "An alumni record needs an end month.")
    if value["email"] and not re.fullmatch(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", value["email"]):
        raise APIError(422, "Invalid email address.")
    if value["image"]:
        image = value["image"]
        if not re.fullmatch(r"images/[A-Za-z0-9_./-]+", image) or any(part in {"", ".", ".."} for part in image.split("/")):
            raise APIError(422, "Portrait must use a safe local image path.")
        if Path(image).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            raise APIError(422, "Unsupported portrait format.")
    if not re.fullmatch(r"(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%", value["objectPosition"]):
        raise APIError(422, "Invalid portrait position.")
    for key in ("profile", "profileZh"):
        if value[key] and not re.fullmatch(r"[A-Za-z0-9_-]+\.html(?:\?[A-Za-z0-9_=&%.-]+)?", value[key]):
            raise APIError(422, "Invalid local profile link.")
    education = value["education"]
    if not isinstance(education, list) or len(education) > 30 or any(not isinstance(item, str) or len(item) > 1500 for item in education):
        raise APIError(422, "Education must be a short list of text entries.")
    value["education"] = [item.strip() for item in education if item.strip()]
    links = value["links"]
    if not isinstance(links, list) or len(links) > 10:
        raise APIError(422, "Too many academic links.")
    for link in links:
        if not isinstance(link, dict) or set(link) != {"label", "href"}:
            raise APIError(422, "Academic links need a label and URL.")
        if not isinstance(link["label"], str) or len(link["label"]) > 120 or not isinstance(link["href"], str) or len(link["href"]) > 2000:
            raise APIError(422, "Invalid academic link.")
        try:
            parsed = urlsplit(link["href"])
        except ValueError:
            raise APIError(422, "Invalid academic URL.") from None
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            raise APIError(422, "Academic links must use HTTP or HTTPS.")
        if any(ord(c) < 32 for c in link["href"]):
            raise APIError(422, "Invalid academic URL.")
    return value


def month_label(value, chinese=False):
    if not value:
        return ""
    year, month = value.split("-")
    return f"{year}年{int(month)}月" if chinese else f"{MONTH_NAMES[int(month) - 1]} {year}"


def public_arrays(members, collaborators):
    current, alumni = [], []
    for original in members:
        person = {key: value for key, value in original.items() if key != "version"}
        if person["status"] == "current":
            current.append(person)
            continue
        person["group"] = person["alumniGroup"]
        for chinese, field in ((False, "period"), (True, "periodZh")):
            start = month_label(person["startMonth"], chinese)
            end = month_label(person["endMonth"], chinese)
            person[field] = f"{start} – {end}" if start else end
        if (person["bio"] or person["bioZh"] or person["image"]) and not person["profile"]:
            person["profile"] = "profile.html?member=" + person["id"]
            person["profileZh"] = person["profile"] + "&lang=zh"
        alumni.append(person)
    return (current, alumni, collaborators)


class Store:
    def __init__(self, data_dir, site_root, seed):
        self.data_dir = Path(data_dir).resolve()
        self.site_root = Path(site_root).resolve()
        if self.data_dir == self.site_root or self.data_dir.is_relative_to(self.site_root):
            raise ValueError("The private data directory must be outside the site root.")
        self.data_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(self.data_dir, 0o700)
        self.database = self.data_dir / "members.sqlite3"
        self.portraits = self.data_dir / "portraits"
        self.portraits.mkdir(exist_ok=True, mode=0o700)
        self.public_path = self.site_root / "js" / "people-data.js"
        self.lock = threading.RLock()
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, record TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS tokens (member_id TEXT PRIMARY KEY REFERENCES members(id), hash TEXT NOT NULL UNIQUE);
                CREATE TABLE IF NOT EXISTS audit (sequence INTEGER PRIMARY KEY, at TEXT NOT NULL, actor TEXT NOT NULL, member_id TEXT NOT NULL, before_record TEXT, after_record TEXT NOT NULL);
            """)
            initialized = db.execute("SELECT 1 FROM metadata WHERE key='initialized'").fetchone()
            if not initialized:
                payload = json.loads(Path(seed).read_text(encoding="utf-8"))
                if not isinstance(payload.get("members"), list) or not isinstance(payload.get("collaborators"), list):
                    raise ValueError("Invalid seed structure.")
                for member in payload["members"]:
                    member = dict(member)
                    member_id = member.pop("id")
                    version = member.pop("version", 1)
                    if not isinstance(member_id, str) or not SLUG.fullmatch(member_id):
                        raise ValueError("Invalid seed member ID.")
                    record = validate_record(member)
                    record.update(id=member_id, version=version)
                    db.execute("INSERT INTO members VALUES (?,?)", (member_id, json.dumps(record, ensure_ascii=False)))
                db.execute("INSERT INTO metadata VALUES ('collaborators',?)", (json.dumps(payload["collaborators"], ensure_ascii=False),))
                db.execute("INSERT INTO metadata VALUES ('initialized','1')")
        os.chmod(self.database, 0o600)
        with self.lock, self.connect() as db:
            self.publish(db)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=10)
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, member_id, db=None):
        if db is None:
            with self.connect() as connection:
                return self.get(member_id, connection)
        row = db.execute("SELECT record FROM members WHERE id=?", (member_id,)).fetchone()
        if not row:
            raise APIError(404, "Member not found.")
        return json.loads(row[0])

    def export(self, db=None):
        if db is None:
            with self.connect() as connection:
                return self.export(connection)
        return {
            "members": [json.loads(row[0]) for row in db.execute("SELECT record FROM members ORDER BY rowid")],
            "collaborators": json.loads(db.execute("SELECT value FROM metadata WHERE key='collaborators'").fetchone()[0]),
        }

    def publish(self, db):
        payload = self.export(db)
        for member in payload["members"]:
            image = member["image"]
            if re.fullmatch(r"images/web/people/upload-[0-9a-f]{32}\.(?:jpg|png|webp)", image):
                destination = self.site_root / image
                original = self.portraits / Path(image).name
                if not destination.exists() and original.is_file():
                    self.atomic_write(destination, original.read_bytes(), 0o644)
        arrays = public_arrays(payload["members"], payload["collaborators"])
        names = ("LIN_LAB_PEOPLE", "LIN_LAB_ALUMNI", "LIN_LAB_COLLABORATORS")
        chunks = ["// Generated from the member editor. Update records through the maintenance service.\n"]
        for name, values in zip(names, arrays):
            encoded = json.dumps(values, ensure_ascii=False, indent=2).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
            chunks.append(f"window.{name} = {encoded};\n")
        self.atomic_write(self.public_path, "\n".join(chunks).encode("utf-8"), 0o644)

    @staticmethod
    def atomic_write(path, data, mode):
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temp_name = tempfile.mkstemp(prefix=".member-write-", dir=path.parent)
        try:
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(temp_name, mode)
            os.replace(temp_name, path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

    def change(self, actor, member_id, patch, version=None, create=False):
        with self.lock, self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            before = None
            if create:
                if db.execute("SELECT 1 FROM members WHERE id=?", (member_id,)).fetchone():
                    raise APIError(409, "That member ID already exists.")
            else:
                before = self.get(member_id, db)
                if type(version) is not int or before["version"] != version:
                    raise APIError(409, "This profile changed. Reload before saving again.")
            after = validate_record(patch, before)
            after.update(id=member_id, version=1 if before is None else before["version"] + 1)
            db.execute("INSERT INTO members VALUES (?,?) ON CONFLICT(id) DO UPDATE SET record=excluded.record", (member_id, json.dumps(after, ensure_ascii=False)))
            db.execute("INSERT INTO audit(at,actor,member_id,before_record,after_record) VALUES (?,?,?,?,?)", (
                datetime.now(timezone.utc).isoformat(), actor, member_id,
                json.dumps(before, ensure_ascii=False) if before else None, json.dumps(after, ensure_ascii=False)))
            previous_public = self.public_path.read_bytes() if self.public_path.exists() else None
            published = False
            try:
                self.publish(db)
                published = True
                db.commit()
            except Exception:
                db.rollback()
                if published and previous_public is not None:
                    self.atomic_write(self.public_path, previous_public, 0o644)
                raise
            return after

    def token_member(self, token):
        if len(token) > 128:
            raise APIError(401, "Invalid edit link.")
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self.connect() as db:
            row = db.execute("SELECT member_id FROM tokens WHERE hash=?", (digest,)).fetchone()
        if not row:
            raise APIError(401, "The edit link is invalid or has been replaced.")
        return row[0]

    def issue_token(self, member_id):
        with self.lock, self.connect() as db:
            self.get(member_id, db)
            token = secrets.token_urlsafe(32)
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            db.execute("INSERT INTO tokens VALUES (?,?) ON CONFLICT(member_id) DO UPDATE SET hash=excluded.hash", (member_id, digest))
            return token

    def save_photo(self, body, extension):
        filename = "upload-" + uuid.uuid4().hex + "." + extension
        relative = "images/web/people/" + filename
        with self.lock:
            self.atomic_write(self.portraits / filename, body, 0o600)
            self.atomic_write(self.site_root / relative, body, 0o644)
        return relative


class MemberServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, store, origin, admin_logins, assets=None):
        if not ipaddress.ip_address(address[0]).is_loopback:
            raise ValueError("Bind only to a loopback address behind Tailscale Serve.")
        parsed = urlsplit(origin)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.path not in {"", "/"} or parsed.query or parsed.fragment or parsed.username:
            raise ValueError("Origin must be a plain HTTP(S) origin.")
        self.store = store
        self.origin = origin.rstrip("/")
        self.admin_logins = frozenset(admin_logins)
        if not self.admin_logins:
            raise ValueError("At least one administrator login is required.")
        self.assets = Path(assets or Path(__file__).parent)
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    server_version = "LinLab"

    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, format_string, *args):
        # Never log Authorization, URL fragments, query strings, or request bodies.
        status = args[1] if len(args) > 1 else "-"
        print(f"{self.command} {urlsplit(self.path).path} {status}", flush=True)

    def send_data(self, status, data, content_type="application/json; charset=utf-8"):
        body = json_bytes(data) if content_type.startswith("application/json") else data
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)

    def identity(self):
        login = self.headers.get("Tailscale-User-Login", "").strip()
        if not login or len(login) > 254:
            raise APIError(401, "Connect through Tailscale to use the member editor.")
        auth = self.headers.get("Authorization", "")
        if auth:
            if not auth.startswith("Bearer "):
                raise APIError(401, "Invalid authorization.")
            return login, False, self.server.store.token_member(auth[7:])
        return login, login in self.server.admin_logins, None

    def require_scope(self, admin, scoped_id, member_id=None):
        if not admin and (member_id is None or scoped_id != member_id):
            raise APIError(403, "Use your personal edit link to update this profile.")

    def mutation_headers(self):
        if self.headers.get("Origin") != self.server.origin or self.headers.get("X-Lin-Lab-Request") != "1":
            raise APIError(403, "Open the editor at its configured address before saving.")

    def read_body(self, maximum=262144):
        raw_length = self.headers.get("Content-Length", "")
        if not re.fullmatch(r"\d+", raw_length):
            raise APIError(400, "A Content-Length header is required.")
        length = int(raw_length)
        if length > maximum:
            raise APIError(413, "The upload or request is too large.")
        body = self.rfile.read(length)
        if len(body) != length:
            raise APIError(400, "Incomplete request body.")
        return body

    def read_json(self):
        if self.headers.get("Content-Type", "").split(";", 1)[0].strip() != "application/json":
            raise APIError(400, "Use an application/json request.")
        try:
            return json.loads(self.read_body().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise APIError(400, "Invalid JSON request.") from None

    def do_GET(self):
        self.dispatch()

    def do_POST(self):
        self.dispatch()

    def do_PUT(self):
        self.dispatch()

    def do_OPTIONS(self):
        self.send_data(403, {"error": "Cross-origin requests are not supported."})

    def dispatch(self):
        try:
            self.route()
        except APIError as error:
            self.send_data(error.status, {"error": error.message})
        except (OSError, sqlite3.Error):
            self.send_data(503, {"error": "The member store is unavailable. Please try again."})

    def route(self):
        path = unquote(urlsplit(self.path).path)
        if self.command == "GET" and path in {"/", "/editor.html", "/editor.css", "/editor.js"}:
            filename = "editor.html" if path == "/" else path[1:]
            file_path = self.server.assets / filename
            if not file_path.is_file():
                raise APIError(404, "Editor asset not found.")
            content_type = {".html": "text/html", ".css": "text/css", ".js": "text/javascript"}[file_path.suffix]
            self.send_data(200, file_path.read_bytes(), content_type + "; charset=utf-8")
            return
        if path == "/api/health" and self.command == "GET":
            self.send_data(200, {"ok": True})
            return
        if not path.startswith("/api/"):
            raise APIError(404, "Not found.")
        login, admin, scoped_id = self.identity()
        if self.command != "GET":
            self.mutation_headers()
        if path == "/api/session" and self.command == "GET":
            self.send_data(200, {"admin": admin, "memberId": scoped_id, "login": login})
            return
        if path == "/api/export" and self.command == "GET":
            self.require_scope(admin, scoped_id)
            self.send_data(200, self.server.store.export())
            return
        if path == "/api/members":
            self.require_scope(admin, scoped_id)
            if self.command == "GET":
                self.send_data(200, {"members": self.server.store.export()["members"]})
                return
            if self.command == "POST":
                record = self.read_json()
                if not isinstance(record, dict):
                    raise APIError(422, "Member record must be an object.")
                record = dict(record)
                member_id = record.pop("id", None)
                if member_id is None:
                    name = record.get("name", "")
                    if not isinstance(name, str):
                        raise APIError(422, "Name must be text.")
                    member_id = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "member-" + uuid.uuid4().hex[:12]
                if not isinstance(member_id, str) or len(member_id) > 100 or not SLUG.fullmatch(member_id):
                    raise APIError(422, "Use a short member ID containing lowercase letters, numbers, and hyphens.")
                self.send_data(201, self.server.store.change(login, member_id, record, create=True))
                return
        match = re.fullmatch(r"/api/members/([a-z0-9]+(?:-[a-z0-9]+)*)(?:/(edit-link|photo))?", path)
        if not match:
            raise APIError(404, "Not found.")
        member_id, action = match.groups()
        self.require_scope(admin, scoped_id, member_id)
        self.server.store.get(member_id)
        if action == "edit-link" and self.command == "POST":
            self.require_scope(admin, scoped_id)
            self.read_json()
            token = self.server.store.issue_token(member_id)
            self.send_data(200, {"url": self.server.origin + "/#edit=" + token})
            return
        if action == "photo" and self.command == "POST":
            self.photo()
            return
        if action is not None:
            raise APIError(405, "Method not supported.")
        if self.command == "GET":
            self.send_data(200, self.server.store.get(member_id))
            return
        if self.command == "PUT":
            payload = self.read_json()
            if not isinstance(payload, dict) or set(payload) != {"version", "record"}:
                raise APIError(422, "Save a record with its current version.")
            self.send_data(200, self.server.store.change(login, member_id, payload["record"], payload["version"]))
            return
        raise APIError(405, "Method not supported.")

    def photo(self):
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0]
        formats = {"image/jpeg": ("jpg", lambda body: body.startswith(b"\xff\xd8\xff")),
                   "image/png": ("png", lambda body: body.startswith(b"\x89PNG\r\n\x1a\n") and body[12:16] == b"IHDR"),
                   "image/webp": ("webp", lambda body: body.startswith(b"RIFF") and body[8:12] == b"WEBP")}
        if content_type not in formats:
            raise APIError(422, "Upload a JPEG, PNG, or WebP portrait.")
        body = self.read_body(5 * 1024 * 1024)
        extension, check = formats[content_type]
        if len(body) < 24 or not check(body):
            raise APIError(422, "The image does not match its file type.")
        relative = self.server.store.save_photo(body, extension)
        self.send_data(200, {"image": relative})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8768)
    parser.add_argument("--site-root", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--seed", type=Path, required=True)
    parser.add_argument("--admin-login", action="append", required=True)
    parser.add_argument("--origin", required=True)
    args = parser.parse_args()
    os.umask(0o077)
    store = Store(args.data_dir, args.site_root, args.seed)
    server = MemberServer((args.host, args.port), store, args.origin, args.admin_login)
    print(f"Member maintenance listening on {args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
