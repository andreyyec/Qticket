const   constants = require('../config/constants'),
		Tools = require(constants.paths.models + 'ToolsManager'),
        dbStates = {0:'draft', 1:'saved', 2:'done', 3:'closed', 4:'canceled'};

class Order {

	// {Constructor}

    constructor(db, sck, odooOrderRef, client, ticketNumber, lastUpdate) {
        this._db = db;
		this._sck = sck;
		this._createdOn = new Date();
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

    // {Public Methods}

    getId() {
    	return this._odooOrderRef;
    }

    getState() {
    	return this._state;
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

    async updateState(state, user) {
    	let conf = this._setState(state, user);

    	if (conf) {
    		return await this._saveToDB();
    	} else {
    		Tools.logApplicationError('Order was already on state: ' + this.getState());
    		return false;
    	}
    }

    async pullback(user) {
    	return await this._updateState(1, user);
    }

    async close(user) {
    	return await this._updateState(3, user);
    }

    async cancel(user) {
    	return await this._updateState(4, user);
    }

    // {Private Methods}

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

    _getLogsDiff(state, userInfo, changesObj, justState = false) {
		let nLog = this._getLogEntry(userInfo.id, userInfo.username);

		if (!justState) {
			for(let prod of changesObj.removed) {
    			nLog = this._pushLogLine(nLog, this._getLogLine('item', 'removed', prod.id, prod.name));
	    	}

	    	for(let prod of changesObj.updated) {
	    		nLog = this._pushLogLine(nLog, this._getLogLine('item', 'updated', prod.id, prod.name, prod.qty, prod.price));
	    	}

	    	for(let prod of changesObj.added) {
	    		nLog = this._pushLogLine(nLog, this._getLogLine('item', 'added', prod.id, prod.name,  prod.qty, prod.price));
	    	}
		}

    	if (state !== this.getState()) {
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

    _getDBObj() {
		return {
		    odooOrderRef: this._odooOrderRef,
		    orderState: this._state,
			ticketNumber: this._ticket,
			createdOn: this._createdOn,
		    client: this._client,
		    productRows: this._productRows,
		    activityLog: this._activityLog
		}
    }

    _setState(state, user) {
    	if (this._state !== state) {
    		this._pushLogEntry(this._getLogsDiff(state, user, {}, true));
    		this._state = state;
    		return true;
    	} else {
    		return false;
    	}
    }

    _pushLogLine(logEntry, logline) {
    	logEntry.changeLogs.unshift(logline);
    	return logEntry;
    }

    _pushLogEntry(logEntry) {
    	this._activityLog.unshift(logEntry);
    }

    async _updateState(state, user) {
    	let conf = this._setState(state, user);

    	if (conf) {
    		return await this._saveToDB();
    	} else {
    		Tools.logApplicationError('Order was already on state: ' + this.getState());
    		return false;
    	}
    }

	async _loadFromDB(orderId) {
		try {
			let orderData = await this._db.getOrderByOdooRef(orderId);

			if (orderData !== false) {
				this._state = orderData.orderState;
				this._productRows = orderData.productRows;
				this._activityLog = orderData.activityLog;
			}
		} catch (err) {
			console.log('Error while getting data from DB');
			console.log(err);
		}
    }

    async _saveToDB() {
		try{
			let res =  await this._db.saveOrder(this._getDBObj());

    		if (res) {
				return true;
			} else {
				return false;
			}
    	} catch(err) {
    		Tools.logDbError(err, 'updating the order State, Unable to save on DB.');
    		return false;
		}
    }
}

module.exports = Order;