from flask import Flask
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import create_database, database_exists


class Bootstrap:

    def __init__(self):
        self._init_app()
        self._init_db()
        self._init_socket()

    def _init_app(self):
        self.app = Flask(
            __name__,
            instance_relative_config=True
        )
        self.app.config.from_envvar('APP_SETTINGS')

    def _init_db(self):
        self.db = SQLAlchemy(self.app)

        if not database_exists(self.app.config["SQLALCHEMY_DATABASE_URI"]):
            create_database(self.app.config["SQLALCHEMY_DATABASE_URI"])

        self.db.init_app(self.app)

        self.db.drop_all()
        self.db.create_all()

    def _init_socket(self):
        self.io = SocketIO(self.app)

    def register_blueprint(self, blueprint, url_prefix=None, static_folder="/static"):
        self.app.register_blueprint(blueprint, url_prefix=url_prefix, static_folder=static_folder)

    def get_app(self):
        return self.app

    def get_db(self):
        return self.db

    def get_io_socket(self):
        return self.io
