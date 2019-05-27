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

REDIS_DATABASE_URI = "redis://%s@%s:%s/%s" % (
            cred.REDIS_PASSWORD,
            const.REDIS_HOST,
            const.REDIS_PORT,
            const.REDIS_DB_NUMBER
        )
