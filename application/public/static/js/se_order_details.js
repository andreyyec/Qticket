$(function () {
    const   socket = Qticket.getIOInstance('orders'),
            actionButtons = $('.action-buttons'),
            pullBackBtn = $('.do-pull-back'),
            cancelBtn = $('.do-cancel'),
            closeBtn = $('.do-close');
    
    //===> Socket Manager
    const socketManager = {
        pullBackOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('pullBackOrder', orderId, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        cancelOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('cancelOrder', orderId, (confirmation) => {
                    resolve(confirmation);
                });
            });
        },
        closeOrder: (orderId) => {
            return new Promise((resolve, reject) => {
                socket.emit('closeOrder', orderId, (confirmation) => {
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

            cancelBtn.on('click', (e) => {
                let cancelPromise = socketManager.cancelOrder({orderId:$(e.target).data('id'), user:{id:Qticket.session.uid, username:Qticket.session.username}});

                cancelPromise.then((confirmation) => {
                    if (confirmation) {
                        location.reload();
                    } else {
                        window.Qticket.throwAlert('Unable to change Order State');
                    }
                });
            });

            closeBtn.on('click', (e) => {
                let closePromise = socketManager.closeOrder({orderId:$(e.target).data('id'), user:{id:Qticket.session.uid, username:Qticket.session.username}});

                closePromise.then((confirmation) => {
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