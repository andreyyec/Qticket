from flask import Blueprint, render_template

module = Blueprint('test_app', __name__, template_folder="templates", static_folder='static')


@module.route("/")
def test_home():
    return render_template("index.html")
