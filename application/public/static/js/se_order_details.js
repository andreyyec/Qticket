$(function () {
    const   socket = Qticket.getIOInstance('orders'),
            pullBackBtn = $('.pull-back');
    
    //===> Socket Manager
    const socketManager = {
        pullBackOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('pullBackOrder', orderId, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        socketConnect: () => {
            socket.on('connect', () => {
                console.log('Web Socket connection established');
            });
        },
        // => Init
        init: () => {
            socketManager.socketConnect();
        }
    },
    //===> Detail Screen Manager
    uiManager = {
        attachListeners: () => {
            pullBackBtn.on('click', (e) => {
                let pbPromise = socketManager.pullBackOrder({orderId:$(e.target).data('id'), user:{id:Qticket.session.uid, username:Qticket.session.username}});

                pbPromise.then((confirmation) => {
                    if (confirmation) {
                        location.reload();
                    } else {
                        window.Qticket.throwAlert('Unable to change Order State');
                    }
                });
            });
        },
        init: () => {
            uiManager.attachListeners();
        }
    };

    uiManager.init();
    socketManager.init();
});