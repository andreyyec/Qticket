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
                    'type': 'POST',
                    'dataSrc': (json) => {
                        let return_data = json.data;
                        
                        for (let i in return_data) {
                            let rDate = new Date(return_data[i].date)
                            return_data[i].date = `${rDate.getDate()}/${rDate.getMonth()+1}/${rDate.getFullYear()}`;
                        }

                        return return_data;
                    },
                },
                'aoColumnDefs': [
                    { 'bVisible': false, 'aTargets': [0] }
                ],
                'columns': [
                    { 'data': '_id' },
                    { 'data': 'odooOrderRef' },
                    { 'data': 'client' },
                    { 'data': 'date' },
                    { 'data': 'ticketNumber' },
                ],
                'order': [[2,'desc']]
            });
            tableManager.attachListeners();
        }
    };

    tableManager.init();
});