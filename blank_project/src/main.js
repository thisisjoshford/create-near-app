import "regenerator-runtime/runtime";

import * as nearlib from "near-api-js"
import getConfig from "./config"

const nearConfig = getConfig(process.env.NODE_ENV || "development");

const submitButton = document.querySelector('form button');

let currentGreeting, accountId;

// Initializing contract
async function InitContract() {
  // Initializing connection to the NEAR testnet.
  const near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new nearlib.WalletConnection(near);

  // Getting the Account ID. If unauthorized yet, it's just empty string.
  accountId = window.walletConnection.getAccountId();

  // Initializing our contract APIs by contract name and configuration.
  window.contract = await near.loadContract(nearConfig.contractName, { // eslint-disable-line require-atomic-updates
    // NOTE: This configuration only needed while NEAR is still in development
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['getGreeting'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['setGreeting'],
    // Sender is the account ID to initialize transactions.
    sender: accountId,
  });
}

document.querySelector('form').onsubmit = async (event) => {
  event.preventDefault();

  // get elements from the form using their id attribute
  const { fieldset, greeting } = event.target.elements;

  // disable the form while the value gets updated on-chain
  fieldset.disabled = true

  // make an update call to the smart contract
  await window.contract.setGreeting({
    // pass the value that the user entered in the greeting field
    message: greeting.value
  });

  // update the greeting in the UI
  await fetchGreeting();

  // re-enable the form
  fieldset.disabled = false;
  submitButton.disabled = true;
}

document.querySelector('input#greeting').oninput = (event) => {
  if (event.target.value !== currentGreeting) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

document.querySelector('#sign-out-button').onclick = () => {
  walletConnection.signOut();
  // Forcing redirect.
  window.location.replace(window.location.origin + window.location.pathname);
};

document.querySelector('#sign-in-button').onclick = () => {
  window.walletConnection.requestSignIn(
    // The contract name that would be authorized to be called by the user's account.
    nearConfig.contractName,
    // This is the app name. It can be anything.
    'Welcome to NEAR'
  );
};

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-out-flow').style.display = 'block';
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-in-flow').style.display = 'block';

  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = accountId;
  });

  fetchGreeting();
}

async function fetchGreeting() {
  currentGreeting = await window.contract.getGreeting({ accountId });
  document.querySelectorAll('[data-behavior=greeting]').forEach(el => {
    // set divs, spans, etc
    el.innerText = currentGreeting;

    // set input elements
    el.value = currentGreeting;
  });
}

// Loads nearlib and this contract into window scope.
window.nearInitPromise = InitContract()
  .then(() => {
    if (!window.walletConnection.isSignedIn()) {
      signedOutFlow();
    } else {
      signedInFlow();
    }
  })
  .catch(console.error);
