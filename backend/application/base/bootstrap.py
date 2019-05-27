import redis

from flask import Flask
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import create_database, database_exists

from application.database import SQL
from application.database import REDIS
from application.web_socket import IOHandler


class Bootstrap:

    def __init__(self):
        self._load_app_instance()
        self._load_socket_instance()
        self._init_databases()
        self._init_handlers()

    def _load_app_instance(self):
        self._app = Flask(
            __name__,
            instance_relative_config=True
        )
        self._app.config.from_envvar('APP_SETTINGS')

    def _load_socket_instance(self):
        self._io_socket = SocketIO(self._app)

    def _init_databases(self):
        self._init_sql()
        self._init_redis()

    def _init_redis(self):
        self._redis = redis.from_url(self._app.config["REDIS_DATABASE_URI"])

    def _init_sql(self):
        self._sql = SQLAlchemy(self._app)

        if not database_exists(self._app.config["SQLALCHEMY_DATABASE_URI"]):
            create_database(self._app.config["SQLALCHEMY_DATABASE_URI"])

        self._sql.init_app(self._app)

        self._sql.drop_all()
        self._sql.create_all()

    def _init_handlers(self):
        self._sql_model = SQL(self._sql)
        self._redis_model = REDIS(self._redis)
        self._io = IOHandler(self._io_socket, self._sql_model, self._redis_model)

    def register_blueprint(self, blueprint, url_prefix=None, static_folder="/static"):
        self._app.register_blueprint(blueprint, url_prefix=url_prefix, static_folder=static_folder)

    def run(self):
        self._io_socket.run(
            self._app,
            port=8000,
            debug=True
        )
