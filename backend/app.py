from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Todo App Flask Backend is running!"

if __name__ == "__main__":
    app.run(debug=True)