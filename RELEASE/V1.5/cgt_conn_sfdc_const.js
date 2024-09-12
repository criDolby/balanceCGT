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
                    cgt_conn_sfdc_const
                    versione 1.5
                    11/09/2024
**********************************************************************************************/

const commUrl = 'https://cgtspa--uat.sandbox.my.site.com/CGTPortaleRegistrazioneClienti'; // Service Provider
const redirectURI = 'https://sitoEsempio.it/'; // Redirect Sito/Portale/Eventi
const azureLogoutURI = 'https://cgtb2cstaging.b2clogin.com/cgtb2cstaging.onmicrosoft.com/b2c_1a_sfidentity_signup_signin_v1/oauth2/v2.0/logout'; // Endpoint Logout Azure
const clientId = '3MVG9bmlmX4LX1ZuAYAJHiS3dpHiJeBZ6NnK6mLmJiUy_SqlDcK34vfbGcrj0.6yJVoqNfjugFgmnRvfh.OII';	// Client ID Connected App
const ssoProvider = 'AzureADB2CTest'; //Auth Provider 
const sorgente = 'portaleCGT'; // scegliere tra portaleCGT, sitoCGT, eventiCGT

