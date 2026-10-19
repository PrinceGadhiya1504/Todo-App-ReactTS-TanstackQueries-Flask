import os
import uuid

from flask import Flask, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

items = [
    {
        "id": 1,
        "name": "Build a React Todo App",
        "description": "Create a Todo application using React and Tailwind CSS. Add features to create, edit, delete, and mark tasks as completed.",
        "status": "pending",
        "image": None,
    },
    {
        "id": 2,
        "name": "Develop REST APIs with FastAPI",
        "description": "Build REST API endpoints to create, retrieve, update, and delete Todo items. Implement request validation and connect the API with the React frontend.",
        "status": "completed",
        "image": None,
    },
    {
        "id": 3,
        "name": "Update GitHub Project Portfolio",
        "description": "Upload the completed Todo project to GitHub.",
        "status": "pending",
        "image": None,
    },
]

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


def save_uploaded_image(uploaded_file):
    if not uploaded_file or not uploaded_file.filename:
        return None

    original_name = secure_filename(uploaded_file.filename)

    if not original_name or not allowed_file(original_name):
        raise ValueError("Only JPG, JPEG and PNG images are allowed")

    # Check the actual uploaded size
    uploaded_file.seek(0, os.SEEK_END)
    file_size = uploaded_file.tell()
    uploaded_file.seek(0)

    if file_size > 5 * 1024 * 1024:
        raise ValueError("Image size must be 5 MB or less")

    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{extension}"

    uploaded_file.save(
        os.path.join(app.config["UPLOAD_FOLDER"], stored_name)
    )

    return stored_name


def delete_image(image_name):
    if not image_name:
        return

    image_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        image_name,
    )

    if os.path.isfile(image_path):
        os.remove(image_path)


@app.errorhandler(413)
def file_too_large(error):
    return {"error": "Image size must be 5 MB or less"}, 413


@app.route("/")
def home():
    return "Todo App Flask Backend is running!"


@app.route("/items", methods=["GET"])
def get_items():
    return items, 200


@app.route("/items", methods=["POST"])
def create_item():
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    status = request.form.get("status", "pending")

    if not name:
        return {"error": "Task name is required"}, 400

    if status not in ["pending", "completed"]:
        return {"error": "Invalid status"}, 400

    uploaded_image = request.files.get("image")

    try:
        image_name = save_uploaded_image(uploaded_image)
    except ValueError as error:
        return {"error": str(error)}, 400

    new_item = {
        "id": max((item["id"] for item in items), default=0) + 1,
        "name": name,
        "description": description,
        "status": status,
        "image": image_name,
    }

    items.append(new_item)

    return {
        "message": "Todo created successfully",
        "item": new_item,
    }, 201


@app.route("/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    item = next(
        (todo for todo in items if todo["id"] == item_id),
        None,
    )

    if item is None:
        return {"error": "Todo not found"}, 404

    data = request.get_json(silent=True) or request.form

    name = data.get("name", item["name"]).strip()
    description = data.get(
        "description", item.get("description", "")
    ).strip()
    status = data.get("status", item["status"])

    if not name:
        return {"error": "Task name is required"}, 400

    if status not in ["pending", "completed"]:
        return {"error": "Invalid status"}, 400

    uploaded_image = request.files.get("image")
    new_image_name = None

    try:
        if uploaded_image and uploaded_image.filename:
            new_image_name = save_uploaded_image(uploaded_image)
    except ValueError as error:
        return {"error": str(error)}, 400

    item["name"] = name
    item["description"] = description
    item["status"] = status

    if new_image_name:
        old_image_name = item.get("image")
        item["image"] = new_image_name

        try:
            delete_image(old_image_name)
        except OSError:
            app.logger.exception("Could not delete old image")

    return {
        "message": "Todo updated successfully",
        "item": item,
    }, 200


@app.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    item = next(
        (todo for todo in items if todo["id"] == item_id),
        None,
    )

    if item is None:
        return {"error": "Todo not found"}, 404

    items.remove(item)

    try:
        delete_image(item.get("image"))
    except OSError:
        app.logger.exception("Could not delete todo image")

    return {"message": "Todo deleted successfully"}, 200


@app.route("/uploads/<path:filename>", methods=["GET"])
def get_uploaded_image(filename):
    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename,
    )


if __name__ == "__main__":
    app.run(debug=True)