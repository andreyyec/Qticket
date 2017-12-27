$(function () {
    
    let ordersTable = $('#ordersTable'),
    	ordersTableBody = ordersTable.find('tbody'),

    tableManager = {
    	attachListeners: () => {
    		ordersTable.on('click', 'tr', function () {
    			let target = $(this);

        		if (target.hasClass('selected')) {
            		target.removeClass('selected');
        		} else {
            		ordersTable.find('tr.selected').removeClass('selected');
            		target.addClass('selected');
        		}
        	});
    	},
    	init: () => {
    		ordersTable.DataTable({
		        'ajax': {
		            'url': '/rest/orders/get',
		            'type': 'POST'
		        },
		        "aoColumnDefs": [
		        	{ "bVisible": false, "aTargets": [0] }
	        	],
		        "columns": [
		            { "data": "_id" },
		            { "data": "odooOrderRef" },
		            { "data": "client" },
		            { "data": "date" },
		            { "data": "ticketNumber" },
		        ]
		    });
    		tableManager.attachListeners();
    	}
    };

    window.test = () => {
    	$.ajax({
		  method: 'POST',
		  url: '/rest/orders/get',
		  data: { name: "John", location: "Boston" }
		}).done(function(data) {
			console.log(data);
		    alert( "success" );
		}).fail(function(err) {
			console.log(err);
		    alert( "error" );
	  	});
    };

    tableManager.init();
});