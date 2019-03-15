var websocket;
var websocketready = false;
var resources;

function onOpen(event) {
    console.log('CONNECTED');
    websocketready = true;
}

function onMessage(event) {
    var command = event.data.substr(0,event.data.indexOf(' '));
    switch (command) {
        case "resources":
            resources = JSON.parse(event.data.substr(event.data.indexOf(' ')+1));
            var tablebody = "";
            Object.keys(resources).forEach(function(key) {
                tablebody += ("<tr onClick='loadPage(\"resource "+key+"\")'>"+
                                "<td>"+key+"</td>"+
                                "<td>"+resources[key].author+"</td>"+
                                "<td>"+resources[key].version+"</td>"+
                                "<td>"+resources[key].type+"</td>"+
                                "<td>"+(resources[key].isRunning?"running":"stopped")+"</td>"+
                            "</tr>");
            });
            $( "#resources_body" ).html(tablebody);
            $( "#resources" ).DataTable();
            break;
        default:
            break;
    }
}

function onError(event) {
    console.log('ERROR: ' + event.data);
}

function onClose(event) {
    console.log('DISCONNECTED');
}

function loadPage(page) {
    $( "#title" ).html("Loading");
    $( "#subtitle" ).html("Please wait");
    $( "#content" ).html("");
    var decoded_page = page.split(" "); 
    switch (decoded_page[0]) {
        case "resources":
            $( "#content" ).load( "pages/resources.html" , function() {
                $( "#title" ).html("Resources");
                $( "#subtitle" ).html("Manage your scripts");
                websocket.send("get_resources");
            });
            break;
        case "resource":
            $( "#content" ).load( "pages/resource.html" , function() {
                delete decoded_page[0];
                var resource_name = decoded_page.join(" ").substring(1);
                $( "#title" ).html(resource_name);
                $( "#subtitle" ).html(resources[resource_name].description);
                $( "#resource_author").html(resources[resource_name].author);
                $( "#resource_version").html(resources[resource_name].version);
                $( "#resource_type").html(resources[resource_name].type);
                $( "#resource_status").html((resources[resource_name].isRunning?"running":"stopped"));
                if(resources[resource_name].isRunning) {
                    $( "#resource_start" ).prop( "disabled", true );
                    $( "#resource_restart" ).attr( "onClick", "restartResource('"+resource_name+"')" );
                    $( "#resource_stop" ).attr( "onClick", "stopResource('"+resource_name+"')" );
                }
                else {
                    $( "#resource_start" ).attr( "onClick", "startResource('"+resource_name+"')" );
                    $( "#resource_restart" ).attr( "onClick", "restartResource('"+resource_name+"')" );
                    $( "#resource_stop" ).prop( "disabled", true );
                }
            });
            break;
        default:
            break;
    }
}

function loadInitialPage() {
    if(websocketready) {
        loadPage("resources");
    }
    else {
        setTimeout(loadInitialPage,250);        
    }
}

function startResource(name) {
    websocket.send("resource_start "+ name);
    loadPage("resources");
}

function restartResource(name) {
    websocket.send("resource_restart "+ name);
    loadPage("resources");
}

function stopResource(name) {
    websocket.send("resource_stop "+ name);
    loadPage("resources");
}

$(function() {
    websocket = new WebSocket("wss://"+window.location.href.split("/")[2]);
    websocket.onopen = onOpen;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
    websocket.onclose = onClose;
    loadInitialPage();
});