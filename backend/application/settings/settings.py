from application.settings import constants as const
from application.settings import credentials as cred

DEBUG = True
SQLALCHEMY_TRACK_MODIFICATIONS = False

SQLALCHEMY_DATABASE_URI = "postgresql://%s:%s@%s:%s/%s" % (
            cred.DB_USER,
            cred.DB_PASSWORD,
            const.DB_HOST,
            const.DB_PORT,
            const.DB_NAME
        )
