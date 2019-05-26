#!/usr/bin/env bash
export APP_SETTINGS=$(pwd)/application/settings/settings.py
export FLASK_APP=application
export FLASK_ENV=development
export FLASK_RUN_PORT=8000
python3 main.py