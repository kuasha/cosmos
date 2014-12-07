/**
 * Created by maruf maniruzzaman on 7/5/14.
 */


function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function getUserName(default_user){
    var userCookie = getCookie("user");
    if(userCookie){
        userCookie = userCookie.replace(/\"/g, "")
        var decoded = JSON.parse(window.atob(userCookie));
        return decoded["username"] || default_user;
    }

    return default_user;
}

function loggedIn(){
    var userCookie = getCookie("usersecret");
    if(userCookie){
        return true;
    }
    return false;
}