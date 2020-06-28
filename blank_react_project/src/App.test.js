import "regenerator-runtime/runtime";
import React from 'react';
import renderer from 'react-test-renderer';
import App from './App';

beforeAll(async function () {
    // NOTE: nearlib and nearConfig are made available by near-shell/test_environment
    console.log('nearConfig', nearConfig);
    const near = await nearlib.connect(nearConfig);
    window.accountId = nearConfig.contractName;
    window.contract = await near.loadContract(nearConfig.contractName, {
        viewMethods: ['getGreeting'],
        changeMethods: [],
        sender: accountId
    });

    // Fake instance of WalletConnection
    // Feel free to modify for specific tests
    window.walletConnection = {
      requestSignIn() {
      },
      signOut() {
      },
      isSignedIn() {
        return true;
      },
      getAccountId() {
        return accountId;
      }
    }
});

it('renders without crashing', () => {
  const app = renderer.create(<App />);
  let tree = app.toJSON();
  expect(tree).toMatchSnapshot();
});
