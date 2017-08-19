$(function () {
    var scope,
    body = $('body'),
    updateFareBtn = body.find('.fare-update'),
    updateFareField = body.find('.fare-input'),
    updateModal = body.find('#updateModal'),
    deleteModal = body.find('#deleteModal'),
    deleteModalUserTag = deleteModal.find('.username'),
    usersManager = {
        processUserData: function(data) {
            $.each(data, function( index, object ) {
                data[index].actions = '<button type="button" data-id="'+object._id+'" class="btn btn-sm btn-primary update-user">Update</button> <button type="button" data-id="'+object._id+'" class="btn btn-sm btn-danger delete-user">Delete</button>';
            });
            return data;
        },
        requestUsers: function() {
            $.get( "/rest/getusers", function( json ) {
                var users = scope.processUserData(json.data);

                $('#userstable').DataTable( {
                    data: users,
                    columns: [
                        {data: 'name'},
                        {data: 'username'},
                        {data: 'state'},
                        {data: 'actions'}
                    ]
                });
            });
        },
        deleteUser: function() {
            $.ajax({
                type: 'POST',
                url: '/rest/deleteuser',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({fare: nfare}),
                success: function(data){
                    alert(data.msj);
                }
            });
        },
    	attachListeners: function() {
            updateFareBtn.on('click', function() {
                let nfare = updateFareField.val();
                if($.isNumeric(nfare)) {
                    $.ajax({
                        type: 'POST',
                        url: '/rest/updatefare',
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify({fare: nfare}),
                        success: function(data){
                            alert(data.msj);
                        }
                    });
                } else {
                    alert('Invalid Fare value');
                }
            });

            body.on('click', '.update-user',function(e) {
                updateModal.modal('show');
            });
            
            body.on('click', '.delete-user',function(e) {
                let test = $(e.target).parent().closest('tr').find('td:nth-child(2)').text();
                deleteModalUserTag.html(test); 
                deleteModal.modal('show');
            });
    	},
    	init: function() {
    		scope = this;
            scope.requestUsers();
			scope.attachListeners();
    	}
    }
    usersManager.init();
});
