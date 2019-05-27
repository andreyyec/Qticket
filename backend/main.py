#!/usr/bin/env python3

# == Base bootstrapping Handler == #
from application.base.bootstrap import Bootstrap

from application.web_socket.socket import IOHandler


# == Application Blueprints Import section == #
from application.blueprints.example_app import module as example_app_blueprint

bootstrap = Bootstrap()
io = IOHandler()

# Blueprints module loader
bootstrap.register_blueprint(example_app_blueprint, url_prefix="/test")

app = bootstrap.get_app()
db = bootstrap.get_db()
socket_io = bootstrap.get_io_socket()

io.init_io(socket_io)

if __name__ == "__main__":
    socket_io.run(
        app,
        port=8000,
        debug=True
    )
