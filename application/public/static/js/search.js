$(function () {
    const empty = '',
        refInp = $('#reference'),
        clientInp = $('#client'),
        dateInp = $('#date'),
        allCheckBox = $('#all-registries'),
        resetFiltersBtn = $('#reset-filters'),
        ordersTable = $('#ordersTable');

    let dataTableInstance, orderRef = empty, client = empty, ordDate = empty, all = empty;
    
    const tableManager = {
        loadDataTable: () => {
            dataTableInstance = ordersTable.DataTable({
                ajax: {
                    url: '/rest/orders/get',
                    type: 'POST',
                    data: (d) => {
                        d.orderRef = orderRef;
                        d.client = client;
                        d.date = ordDate;
                        d.all = all;
                    },
                    dataSrc: (json) => {
                        let return_data = json.data;
                        
                        for (let i in return_data) {
                            let rDate = new Date(return_data[i].date)
                            return_data[i].date = `${rDate.getDate()}/${rDate.getMonth()+1}/${rDate.getFullYear()}`;
                        }

                        return return_data;
                    },
                },
                aoColumnDefs: [
                    {bVisible: false, aTargets: [0]}
                ],
                columns: [
                    { data: '_id' },
                    { data: 'odooOrderRef' },
                    { data: 'client' },
                    { data: 'date' },
                    { data: 'ticketNumber' },
                ],
                order: [[2,'desc']]
            });
        },
        dataTableReload: (data) => {
            dataTableInstance.ajax.reload();
        },
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
            tableManager.loadDataTable();
            tableManager.attachListeners();
        }
    },
    filtersManager = {
        updateDataTable: () => {
            tableManager.dataTableReload();
        },
        resetFilters: () => {
            refInp.val(empty);
            clientInp.val(empty);
            dateInp.val(empty);
            orderRef = empty, 
            client = empty, 
            ordDate = empty, 
            all = empty;
            allCheckBox.prop('checked', false);
            filtersManager.updateDataTable();
        },
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

            refInp.on('keyup', (e)=>{
                orderRef = $(e.target).val();
                filtersManager.updateDataTable();
            });

            clientInp.on('keyup', (e) => {
                client = $(e.target).val();
                filtersManager.updateDataTable();
            });

            dateInp.on('change', (e) => {
                ordDate = $(e.target).val();
                filtersManager.updateDataTable();
            });

            allCheckBox.on('change', filtersManager.updateDataTable());

            resetFiltersBtn.on('click', filtersManager.resetFilters);
        },
        init: () => {
            filtersManager.attachListeners();
        }
    };

    window.getVal = () => {
        console.log(ordDate);
    }

    tableManager.init();
    filtersManager.init();
});