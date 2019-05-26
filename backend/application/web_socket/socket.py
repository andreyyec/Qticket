from flask_socketio import emit


class IOHandler:

    def __init__(self):
        pass

    def init_io(self, socket_io):
        @socket_io.on('my event')
        def handle_my_custom_event(json, methods=['GET', 'POST']):
            print('received my event: ' + str(json))
            emit('my response', json, callback=self._message_received)

    def _message_received(self):
        print('message was received!!!')
