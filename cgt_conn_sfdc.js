

async function initiateSSOFlow() {
//-- Costanti & Variabili --//
    const commUrl = 'https://cgtspa--devmerge.sandbox.my.site.com/CGTPortaleRegistrazioneClienti';
    const authorizeURI = '/services/oauth2/authorize';
    const clientId = '3MVG9bmlmX4LX1ZvlQPwDwh5N1fOBV4wLtXixm2uPy7urVdUASmTjYk.YlQ65RUOIlT8k8OVhqIRROaa2B9yf';
    localStorage.setItem("clientId", clientId);
    localStorage.setItem("sorgente", "sitoCGT");
    localStorage.setItem("commUrl", commUrl);
    const redirectURI = 'https://cridolby.github.io/prima/'
    const responsType = 'code';
    const ssoProvider = 'AzureADB2CTest';

//-- PCKE Generator --//

    const codeVerifier = generateRandomString();
    localStorage.setItem("pkce_code_verifier", codeVerifier);
    console.log('codeVerifier: '+codeVerifier );
        // Hash and base64-urlencode the secret to use as the challenge
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    console.log('codeChallenge: '+codeChallenge );

//-- Costruzione redirect --//
    redirectURL = commUrl + authorizeURI +
     '?client_id=' + clientId + 
     '&prompt=login%20consent' +
     '&redirect_uri=' + redirectURI + 
     '&response_type=' + responsType +
     '&sso_provider=' + ssoProvider + 
     '&code_challenge=' + encodeURIComponent(codeChallenge) + 
     '&code_verifier=' + encodeURIComponent(codeVerifier);

//-- Redirect the Browser --//
    window.location = redirectURL;
}

function tokenExchange(response, codeVerifier, clientId, authorizeType, uniqueVisitorId) {
    console.log('codeVerifier: ' +codeVerifier);
    console.log('clientId: ' +clientId);
    console.log('authorizeType: ' +authorizeType);
    // Get Values from Code Response
    code = response.code;
    console.log('code: ' + code);
    stateIdentifier = response.state;
    console.log('stateIdentifier: ' + stateIdentifier);
    baseURL = response.sfdc_community_url;
    console.log('baseURL: ' + baseURL);
    state = null;
    const tokenURI = '/services/oauth2/token';
    const callbackURL = 'https://cridolby.github.io/prima/';
    const commUrl = 'https://cgtspa--devmerge.sandbox.my.site.com/CGTPortaleRegistrazioneClienti';
    // validate state if it was present
    if (stateIdentifier != null) {
        state = getState(stateIdentifier, true);
        if (state == null) {
            onError("A state param was sent back but no state was found");
            return;
        }
    }

// Create Client
    client = new XMLHttpRequest();
    client.open("POST", commUrl + tokenURI, true);
    client.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    //client.setRequestHeader('Access-Control-Allow-Origin', 'https://cridolby.github.io');
    client.setRequestHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    client.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
// Build Request Body
    requestBody = "code=" + code + "&grant_type=authorization_code&client_id=" + clientId + "&redirect_uri=" + callbackURL;
// Add PKCE
    requestBody = requestBody + "&code_verifier=" + codeVerifier;
    console.log('requestBody: ' +requestBody);
// Send Request
    client.send(requestBody);
    client.onreadystatechange = function() {
        if(this.readyState == 4) {
            if (this.status == 200) {
        //Access Tokens have been returned
                console.log("Code and Credntial Flow, token response: ");
                console.log(JSON.parse(client.response));
                responseArr = JSON.parse(client.response)
                console.log("Access Token: ");
                console.log(responseArr.access_token);
                localStorage.setItem("accToken", responseArr.access_token);
                getUserInfo(responseArr.access_token, commUrl);
            } else {
                client.onError = function(){
                  error(client, {});
                }
            }
        }
    }
}

function getUserInfo(accessToken, expDomain) {
    userInfoURI = '/services/oauth2/userinfo';
    client = new XMLHttpRequest();
    client.open("GET", expDomain + userInfoURI, true);
    client.setRequestHeader("Content-Type", "application/json");
    client.setRequestHeader("Authorization", 'Bearer ' + accessToken);
    client.send();
    client.onreadystatechange = function() {
        if(this.readyState == 4) {
            if (this.status == 200) {
            //User Info response
            console.log(client.response);
            userArr = JSON.parse(client.response)
            document.getElementById("loginOk").innerText = userArr.name;
            document.getElementById("buttonLogin").classList = "hidden";
            document.getElementById("userOk").classList = "";
            localStorage.setItem("user", userArr);
            } else {
                console.log(client.response)
                //onError("An Error Occured during Forgot Password Step: " +
                //forgotPasswordProcessStep, client.response);
            }
        }
    }
}

function logoutUser() {
    redirectURL = 'https://cgtb2cstaging.b2clogin.com/cgtb2cstaging.onmicrosoft.com/b2c_1a_sfidentity_signup_signin_v1/oauth2/v2.0/logout?post_logout_redirect_uri=https://cridolby.github.io/prima';
    revokeTokenURI = '/services/oauth2/revoke';
    accessToken = localStorage.getItem("accToken");
    expDomain =  localStorage.getItem("commUrl");
    client = new XMLHttpRequest();
    client.open("POST", expDomain + revokeTokenURI, true);
    client.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    requestBody = "token=" + accessToken;
    client.send(requestBody);
    client.onreadystatechange = function() {
        if(this.readyState == 4) {
            if (this.status == 200) {
                console.log("FASE DI LOGOUT!!!!!!!!");
                console.log(client.response);
                localStorage.clear();
                sessionStorage.clear()
                window.location = redirectURL;
            } else {
                console.log(client.response)
                window.location = redirectURL;
                //onError("An Error Occured during Forgot Password Step: " +
                //forgotPasswordProcessStep, client.response);
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

