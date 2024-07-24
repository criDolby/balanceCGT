/**************************************************************************************                                                                             
                                                                             
                                                                                                                                                       
           _                                                    __    _      
          | |                                                  / _|  | |     
  ___ __ _| |_             ___ ___  _ __  _ __             ___| |_ __| | ___ 
 / __/ _` | __|           / __/ _ \| '_ \| '_ \           / __|  _/ _` |/ __|
| (_| (_| | |_           | (_| (_) | | | | | | |          \__ \ || (_| | (__ 
 \___\__, |\__|           \___\___/|_| |_|_| |_|          |___/_| \__,_|\___|
      __/ |      ______                           ______                     
     |___/      |______|                         |______|                    


                    Created By Balance Spa
                    cgt_conn_sfdc_s
                    versione 1.2
                    21/06/2024
**********************************************************************************************/

async function initiateSSOFlow() {

//-- PCKE Generator --//

    let codeVerifier = generateRandomString();
     //document.cookie = "codeVerifier=" + sorgente + ";domain=.my.site.com;path=/;Secure;SameSite=None";
    localStorage.setItem("pkce_code_verifier", codeVerifier);
        // Hash and base64-urlencode the secret to use as the challenge
    let codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    let authorizeURI = '/services/oauth2/authorize';
    let responsType = 'code';

//-- Costruzione redirect --//
    let redirectURL = commUrl + authorizeURI +
     '?client_id=' + clientId + 
     '&prompt=login%20consent' +
     '&redirect_uri=' + redirectURI + 
     '&response_type=' + responsType +
     '&sso_provider=' + ssoProvider + 
     '&code_challenge=' + encodeURIComponent(codeChallenge) + 
     '&code_verifier=' + encodeURIComponent(codeVerifier);
//-- Redirect the Browser --//
//console.log(redirectURL);
    window.location = redirectURL;
}

function tokenExchange(response, codeVerifier) {
    // Get Values from Code Response
    let code = response.code;
    let tokenURI = '/services/oauth2/token';

// Create Client
    client = new XMLHttpRequest();
    client.open("POST", commUrl + tokenURI, true);
    client.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    client.setRequestHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    client.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
// Build Request Body
    requestBody = "code=" + code + "&grant_type=authorization_code&client_id=" + clientId + "&redirect_uri=" + redirectURI ; 
// Add PKCE
    requestBody = requestBody + "&code_verifier=" + codeVerifier;
// Send Request
    client.send(requestBody);
    client.onreadystatechange = function() {
        if(this.readyState == 4) {
            if (this.status == 200) {
        //Access Tokens have been returned
                let responseArr = JSON.parse(client.response)
                // Creo il cookie
                setCookie("SFToken", responseArr.access_token , 4);
                //document.cookie = "SFTokenTest=" +responseArr.access_token +"; path=/; Secure; domain=cgtspa--devmerge.sandbox.my.site.com";
                //document.cookie = "SFToken=" +responseArr.access_token +"; path=/; Secure";
                getUserInfo(responseArr.access_token, commUrl);
            } else {
                    client.onError = function(){
                    error(client, {});
                }
            }
        }
    }
}

function getUserInfo(accessToken) {
    return new Promise(function (resolve, reject) {

        userInfoURI = '/services/oauth2/userinfo';
        complProfilo = '/s/completamentoprofilo';
        let userArr = '';
        client = new XMLHttpRequest();
        client.open("GET", commUrl + userInfoURI, true);
        client.setRequestHeader("Content-Type", "application/json");
        client.setRequestHeader("Authorization", 'Bearer ' + accessToken);
        client.send();
        client.onreadystatechange = function() {
            if(this.readyState == 4) {
                if (this.status == 200) {
                    userArr = JSON.parse(client.response)
                    console.log(userArr);
                    if(
                        (userArr.custom_attributes.flag_sito == 'false' && ( sorgente == 'sitoCGT' || sorgente == 'eventiCGT')) ||
                        (userArr.custom_attributes.flag_portale == 'false' && sorgente == 'portaleCGT') 
                    ){
                        window.location = commUrl + complProfilo +'?sorgente=' +sorgente + '&redirectURL=' +redirectURI ;
                    }else{
                      resolve( userArr );
                    } 
                } else {
                    reject(
                        client.onError = function(){
                            error(client, {})
                        }
                    );
                }
            }
        }
    })
}

function logoutUser() {
    let redirectLogoutURL = azureLogoutURI + '?post_logout_redirect_uri=' + commUrl + '/s/logout?redirectURL=' +redirectURI;
    let revokeTokenURI = '/services/oauth2/revoke';

    let accessToken = getCookie("SFToken");
    client = new XMLHttpRequest();
    client.open("POST", commUrl + revokeTokenURI, true);
    client.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    requestBody = "token=" + accessToken;
    client.send(requestBody);
    client.onreadystatechange = async function() {
        if(this.readyState == 4) {
            if (this.status == 200) {
                localStorage.clear();
                sessionStorage.clear();
                
                let fullDomain = document.location;
                let mainDomain = fullDomain.includes('cgt') ? ';domain=.cgt.it' : '';
                document.cookie = "SFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC" +mainDomain +";Secure;path=/";
                
                window.location.replace(redirectLogoutURL);
            } else {
                window.location = redirectLogoutURL;
            }
        }
    }
}

    
function parseQueryString(string) {
    if(string == "") { return {}; }
    var segments = string.split("&").map(s => s.split("=") );
    var queryString = {};
    segments.forEach(s => queryString[s[0]] = s[1]);
    return queryString;
}

function generateRandomString() {
    var array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

// Calculate the SHA256 hash of the input text. 
// Returns a promise that resolves to an ArrayBuffer
function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

// Base64-urlencodes the input string
function base64urlencode(str) {
    // Convert the ArrayBuffer to string using Uint8 array to conver to what btoa accepts.
    // btoa accepts chars only within ascii 0-255 and base64 encodes them.
    // Then convert the base64 encoded to base64url encoded
    //   (replace + with -, replace / with _, trim trailing =)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function pkceChallengeFromVerifier(v) {
    hashed = await sha256(v);
    return base64urlencode(hashed);
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, hours) {
    const d = new Date();
    d.setTime(d.getTime() + (hours*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    
    let fullDomain = document.location;
    let mainDomain = fullDomain.includes('cgt') ? ';domain=.cgt.it' : '';
    
    document.cookie = cname + "=" + cvalue + ";" + expires + mainDomain + ";path=/";
    
   // document.cookie = cname + "=" + cvalue + ";" + expires + ";Secure" + ";path=/";
    
}
