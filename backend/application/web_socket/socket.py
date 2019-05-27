from flask_socketio import emit


class IOHandler:

    def __init__(self, io_socket, sql, redis):
        self._db = None
        self._sql_handler = sql
        self._redis_handler = redis
        self._init_events(io_socket)

    def _init_events(self, socket):
        @socket.on('my event')
        def handle_my_custom_event(json, methods=['GET', 'POST']):
            print('received my event: ' + str(json))
            emit('my response', json, callback=self._message_received)

    def _message_received(self):
        print('message was received!!!')
