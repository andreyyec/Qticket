#!/usr/bin/env python3

# == Base bootstrapping Handler == #
from application.base.bootstrap import Bootstrap

# == Application Blueprints Import section == #
from application.blueprints.example_app import module as example_app_blueprint

bootstrap = Bootstrap()

# Init Flask global app
bootstrap.register_blueprint(example_app_blueprint, url_prefix="/test")

if __name__ == "__main__":
    bootstrap.run()

