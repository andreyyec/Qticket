const   constants = require('../config/constants'),
		tools = require(constants.paths.models + 'ToolsManager'),
        dbStates = {0:'draft', 1:'saved', 2:'done', 3:'closed', 4:'canceled'};

class Order {

    constructor(db, sck, odooOrderRef, client, ticketNumber, lastUpdate) {
        this._db = db;
        this._sck = sck;
        this._odooOrderRef = odooOrderRef;
        this._client = client;
        this._ticket = ticketNumber;
        this._lastUpdate = lastUpdate;
        this._state = 0;
        this._productRows = [];
        this._logs = [];
        this._blocked = false;
        this._activityLog = [];
        this._loadFromDB(this._odooOrderRef);
    }

    getId() {
    	return this._odooOrderRef;
    }

    getSocketId() {
    	if (!this.isAvailable()) {
    		return this._blocked.socket.id;
    	} else {
    		return false;
    	}
    }

    getLastUpdate() {
    	return this._lastUpdate;
    }

    getOrderState(translation) {
    	return (translation)? this._State : this._state;
    }

    _getOrderChangesObj(nProdRows) {
    	let updateObjProdRows = nProdRows,
    		currentProdRows = this._productRows,
    		changesObj = {added:[], updated:[], removed:[]},
    		toRemoveO = [], toRemoveN = [];

		for(let oRow in currentProdRows) {
			for(let nRow in updateObjProdRows) {
				if (updateObjProdRows[nRow].id === currentProdRows[oRow].id) {
					toRemoveO.push(oRow);
					toRemoveN.push(nRow);
					if (parseFloat(updateObjProdRows[nRow].price) !== parseFloat(currentProdRows[oRow].price) || parseFloat(updateObjProdRows[nRow].qty) !== parseFloat(currentProdRows[oRow].qty)) {
						changesObj['updated'].push(updateObjProdRows[nRow]);
					}
				}
			}
		}

    	//Sort Indexes
    	toRemoveO.sort((a, b) => {return b-a});
    	toRemoveN.sort((a, b) => {return b-a});

    	//Remove Duplicated Rows
    	for(let indO of toRemoveO) {
    		currentProdRows.splice(indO, 1);
    	}

    	for(let indN of toRemoveN) {
    		updateObjProdRows.splice(indN, 1);
    	}

    	//Added Rows
    	for(let row of updateObjProdRows) {
    		changesObj['added'].push(row);
    	}

    	//Deleted Rows
    	for (let row of currentProdRows) {
    		changesObj['removed'].push(row);
    	}

    	return changesObj;
    }

    _getLogsDiff(state, userInfo, changesObj) {
		let nLog = this._getLogEntry(userInfo.id, userInfo.username);

    	for(let prod of changesObj.removed) {
    		nLog = this._pushLogLine(nLog, this._getLogLine('item', 'removed', prod.id, prod.name));
    	}

    	for(let prod of changesObj.updated) {
    		nLog = this._pushLogLine(nLog, this._getLogLine('item', 'updated', prod.id, prod.name, prod.qty, prod.price));
    	}

    	for(let prod of changesObj.added) {
    		nLog = this._pushLogLine(nLog, this._getLogLine('item', 'added', prod.id, prod.name,  prod.qty, prod.price));
    	}

    	if (state !== this._state) {
    		nLog = this._pushLogLine(nLog, this._getLogLine('state', 'changed', state, dbStates[state]));
    	}

    	return nLog;
    }

    _getLogEntry(userId, username) {
    	return {
    		user: {
    			uid: userId,
    			username: username
    		},
    		date: new Date(),
    		changeLogs: []
    	}
    }

    _getLogLine(type, action, productId = 0, name = '', qty = 0, price = 0) {
    	return {
            atype: type,
            id: productId,
            product: name,
            action: action,
            qty: parseFloat(qty),
            price: parseFloat(price)
        }
    }

    getDashBInf() {
    	return {
    		id: this._odooOrderRef,
    		client: this._client,
    		ticket: this._ticket,
    	}
    }

    getWSocketInf() {
    	return {
    		id: this._odooOrderRef,
    		client: this._client,
    		ticket: this._ticket,
    		state: dbStates[this._state],
    		blocked: (this.isAvailable()) ? false : this._blocked.user,
    		productRows: (this._productRows.length > 0) ? this._productRows : undefined
    	}
    }

    _getDBObj() {
		return {
		    odooOrderRef: this._odooOrderRef,
		    orderState: this._state,
		    ticketNumber: this._ticket,
		    client: this._client,
		    productRows: this._productRows,
		    activityLog: this._activityLog
		}
    }

    _pushLogLine(logEntry, logline) {
    	logEntry.changeLogs.unshift(logline);
    	return logEntry;
    }

    _pushLogEntry(logEntry) {
    	this._activityLog.unshift(logEntry);
    }

    isAvailable() {
    	return (this._blocked === false) ? true : false;
    }

    block(socket, user) {
    	if (this.isAvailable()) {
    		this._blocked = {socket: socket, user: user};
    		return true;	
    	} else {
    		console.log('Order was already blocked');
    		return false;
    	}
    }

    unblock(user, force = false) {
    	if (this._blocked && this._blocked.user.id === user.id) {
    		this._blocked = false;
    		return true;
    	} else if(force) {
    		this._blocked = false;
    		//this._blocked.socket.emit();
    		return true;
    	} else {
    		console.log('Unblock Forbidden');
    		return false;
    	}
    }

    odooUpdate(updateObj){
    	this._client = updateObj.client;
    	this._ticket = updateObj.ticket;
    	this._lastUpdate = updateObj.last_update;

    	if (this._state > 0) {
    		this._saveToDB();
    	}
    }

    async update(updateObj) {
    	let updateObjTpl;

    	if (this._state < 2) {
    		updateObjTpl = JSON.parse(JSON.stringify(updateObj));
    		this._pushLogEntry(this._getLogsDiff(updateObjTpl.state, updateObjTpl.blocked, this._getOrderChangesObj(updateObjTpl.productRows)));
    		this._productRows = updateObj.productRows;
    		this._state = updateObj.state;

    		let wasSaved = await this._saveToDB();

    		if (wasSaved) {
    			return true;
    		}
    	} else {
    		console.log('Unable to update Order due to status');
    	}
    	return false;
    }

    async close() {

    }

	async _loadFromDB(orderId) {
		try {
			let orderData = await this._db.getOrderByOdooRef(orderId);

			if (orderData !== false) {
				this._state = orderData.orderState;
				this._productRows = orderData.productRows;
				this._activityLog = orderData.activityLog;
			}
			
		} catch (e) {
			console.log('Error while getting data from DB');
			console.log(e);
		}
    }

    async _saveToDB() {
    	let res =  await this._db.saveOrder(this._getDBObj());
		return res;
    }
}

module.exports = Order;