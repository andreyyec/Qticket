const   constants = require('../config/constants'),
		tools = require(constants.paths.models + 'ToolsManager'),
        dbStates = {0:'Draft', 1:'Saved', 2:'Done', 3:'Closed'};

class Order {

    constructor(db, sck, odooOrderRef, client, ticketNumber, lastUpdate) {
        this._db = db;
        this._sck = sck;
        this._odooOrderRef = odooOrderRef;
        this._client = client;
        this._ticketNumber = ticketNumber;
        this._lastUpdate = lastUpdate;
        this._state = 0;
        this._productRows = [];
        this._logs = [];
        this._loadFromDB(this._odooOrderRef);
    }

    getId() {
    	return this._odooOrderRef;
    }

    getLastUpdate() {
    	return this._lastUpdate;
    }

    getOrderState(translation) {
    	return (translation)? this._State : this._state;
    }

    getDashBInf() {
    	return {
    		id: this._odooOrderRef,
    		client: this._client,
    		ticket: this._ticketNumber,
    	}
    }

    getSocketInf() {
    	return {
    		id: this._odooOrderRef,
    		client: this._client,
    		ticket: this._ticketNumber,
    		productRows: this._productRows
    	}
    }

    isDBStored() {
    	return (this._activityLog) ? true : false;
    }

    isAvailable() {
    	return (this._blocked)? false : true;
    }

    block(socketID) {
    	if (this.isAvailable()) {
    		this._blocked = {id: socketID};	
    	} else {
    		console.log('Order was already blocked');
    	}
    }

    unblock(socketID, force = false) {
    	if (socketID === this._blocked.id) {
    		this._blocked = undefined;
    	} else if(force) {
    		this._blocked = undefined;
    	} else {
    		console.log('Unblock Forbidden');
    	}
    }

    updateOrder(updateObj) {
    	if (this._state !== dbStates[2] && this._state !== dbStates[3]) {

    	} else {
    		console.log('Unable to update Order due to status');
    	}
    }

    _getLogsDiff(updateObj) {

    }

    _getLogEntry(user) {

    }

    _getLogLine(logInfo) {

    }

    _pushLogLine(logEntry, logline) {

    }

    _pushLogEntry(logEntry) {

    }

	async _loadFromDB(orderId) {
		try {
			let orderData = await this._db.getOrderById(orderId);

			if(orderData) {
				this.state = orderData.orderState;
				this._productRows = orderData.productRows;
				this._activityLog = orderData.activityLog;
				console.log(orderData);
			}
			
		} catch (e) {
			console.log('Error while getting data from DB');
			console.log(e);
		}
    }

    async _saveToDB() {

    }
}

module.exports = Order;