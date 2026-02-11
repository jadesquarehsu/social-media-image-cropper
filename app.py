import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/verify", methods=["POST"])
def verify_password():
    data = request.get_json() or {}
    submitted = data.get("password", "")
    # Check ACCESS_PASSWORD first (Zeabur default), fall back to PASSWORD
    correct = os.environ.get("ACCESS_PASSWORD") or os.environ.get("PASSWORD", "")

    if not correct:
        # No password set — allow access automatically
        return jsonify({"ok": True})

    if submitted == correct:
        return jsonify({"ok": True})

    return jsonify({"ok": False}), 401

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)
