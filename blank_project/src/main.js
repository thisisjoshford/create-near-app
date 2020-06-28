import "regenerator-runtime/runtime";

import * as nearlib from "near-api-js"
import getConfig from "./config"

let nearConfig = getConfig(process.env.NODE_ENV || "development");
window.nearConfig = nearConfig;
const nearGreetings = ['Hello', 'Aloha', 'Bonjour'];
let nearGreetingIndex = 0;

// Initializing contract
async function InitContract() {
  console.log('nearConfig', nearConfig);

  // Initializing connection to the NEAR testnet.
  window.near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletAccount = new nearlib.WalletAccount(window.near);

  // Getting the Account ID. If unauthorized yet, it's just empty string.
  window.accountId = window.walletAccount.getAccountId();

  // Initializing our contract APIs by contract name and configuration.
  window.contract = await near.loadContract(nearConfig.contractName, { // eslint-disable-line require-atomic-updates
    // NOTE: This configuration only needed while NEAR is still in development
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['welcome'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['setGreeting'],
    // Sender is the account ID to initialize transactions.
    sender: window.accountId,
  });
}

// Using initialized contract
async function doWork() {
  // Based on whether you've authorized, checking which flow we should go.
  if (!window.walletAccount.isSignedIn()) {
    signedOutFlow();
  } else {
    signedInFlow();
  }
}

// Function that initializes the signIn button using WalletAccount
function signedOutFlow() {
  // Displaying the signed out flow container.
  document.getElementById('signed-out-flow').style.display = null;
  // Adding an event to a sing-in button.
  document.getElementById('sign-in-button').addEventListener('click', () => {
    window.walletAccount.requestSignIn(
      // The contract name that would be authorized to be called by the user's account.
      window.nearConfig.contractName,
      // This is the app name. It can be anything.
      'Welcome to NEAR'
    );
  });
}

// Main function for the signed-in flow (already authorized by the wallet).
function signedInFlow() {
  // Displaying the signed in flow container.
  document.getElementById('signed-in-flow').style.display = null;

  welcome();

  // Adding an event to a sign-out button.
  document.getElementById('sign-out-button').addEventListener('click', () => {
    walletAccount.signOut();
    // Forcing redirect.
    window.location.replace(window.location.origin + window.location.pathname);
  });

  // Adding an event to change greeting button.
  document.getElementById('change-greeting').addEventListener('click', () => {
    setGreeting();
  });

  const iframe = document.querySelector('iframe')
  iframe.src = 'https://explorer.testnet.near.org/accounts/' + window.contract.contractId
}

async function setGreeting() {
    nearGreetingIndex = (nearGreetingIndex + 1) % nearGreetings.length;
    await window.contract.setGreeting({message: nearGreetings[nearGreetingIndex]});
    welcome();
}

async function welcome() {
  const response = await window.contract.welcome({account_id:window.accountId});
  document.getElementById('speech').innerText = response.text;
}

// Loads nearlib and this contract into window scope.
window.nearInitPromise = InitContract()
  .then(doWork)
  .catch(console.error);
