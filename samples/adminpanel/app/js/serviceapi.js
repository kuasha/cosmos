/**
 * Created by Maruf Maniruzzaman (marufm@cosmosframework.com) on 6/14/14.
 */

function processError(jqXHR, textStatus, errorThrown){
    jQuery("#status").html("<h3>Error</h3><div>"+errorThrown+"</div>");
}

function processSuccess(data){
    var data2 = JSON.parse(data);
    jQuery("#result").val(JSON.stringify(data2,undefined, 2));
}

function getServiceUrl(service) {
    var root = document.URL;
    if(service[0] == '/'){
        service = service.substring(1);
    }
    return root+service;
}

function do_operation(url, method, data, callback, error_callback){
    jQuery("#result").val("");
    jQuery("#status").html("");
    console.log(method+ ": "+url)
    $.ajax({
        url: url,
        type: method,
        data:data,
        success: callback,
        error: error_callback
    });
}

function insertService(){
    var name = jQuery("#name").val();
    var data = jQuery("#data").val();

    var url =  getServiceUrl(name);
    do_operation(url, 'POST', data, processSuccess, processError);
}

function deleteItem(){
    var name = jQuery("#name").val();
    var data = jQuery("#data").val();

    var url =  getServiceUrl(name);

    do_operation(url, 'DELETE', data, processSuccess, processError);
}

function loadItem(){
    var name = jQuery("#name").val();
    var data = jQuery("#data").val();
    var columns = jQuery("#columns").val();
    var filter = jQuery("#filter").val();

    var url =  getServiceUrl(name);
    if(columns){
        url = url+"?";
        url =url+ "columns="+columns;
    }
    if(filter){
        if(!columns) {
            url = url + "?";
        }
        else{
            url=url+"&";
        }
        url = url+"filter="+filter
    }

    do_operation(url, 'GET', data, processSuccess ,processError);
}

function updateItem(){
    var name = jQuery("#name").val();
    var data = jQuery("#data").val();

    var url =  getServiceUrl(name);

    do_operation(url, 'PUT', data, processSuccess, processError);
}

function subscribe (monitor_endpoint, object_name, callback) {
    //TODO: Unify the observer to listen to many objects at a time using different callback
    //var monitor_endpoint = "ws://localhost:8080/changemonitor"
    var websocket = new WebSocket(monitor_endpoint);
    var fn = callback;
    websocket.onopen = function () {
        console.log("Socket opened");
        websocket.send(JSON.stringify({"type": "monitor_ns", "ns": object_name}))
    }

    websocket.onmessage = function (evt) {
        console.log("On message: " + evt.data);
        if (fn) {
            fn(evt.data);
            /*
             //In callback you may do something like (also consider the evt.data if you are monitoring multiple objects.:
             $http.get('/service/'+object_name+'/').success(function(data) {
             $scope.data = data;
             });
             */
        }

    }

    websocket.onclose = function () {
        console.log("On closed");
    }
}