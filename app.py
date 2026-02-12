import os
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")



@app.route("/lucky/")
def lucky():
    return send_from_directory('lucky-draw', 'index.html')

@app.route("/lucky/<path:name>")
def lucky_static(name):
    return send_from_directory('lucky-draw', name)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)
