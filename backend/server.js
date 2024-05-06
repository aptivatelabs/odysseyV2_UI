// server.js or app.js
const { Ed25519PrivateKey, Account, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

const { OdysseyClient } = require('aptivate-odyssey-sdk');
//const { OdysseyClient } = require('../odyssey-sdk/dist/odysseyClient');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors()); // Enable CORS for all routes

const odysseyClient = new OdysseyClient();

// Read the config.json file
const configData = fs.readFileSync('./config.json', 'utf-8');
let config = JSON.parse(configData);

const { network, collection, resource_account, storage, private_key, random_trait } = config;
const { collection_name, description, asset_dir } = collection;

// Get the keyfilePath from the storage object
const keyfilePath = storage.arweave.keyfilePath;
     
app.get('/api/get-odyssey', async (req, res) => {
    try {
        const aptos = getNetwork(network);

        const odysseyResource = await odysseyClient.getOdyssey(aptos, resource_account);

       
        if (odysseyResource) {
        res.json({ odyssey: odysseyResource });
        } else {
        res.json({ odyssey: null });
        }

    } catch (error) {
        console.error('Error reading odyssey:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/get-stage', async (req, res) => {
    try {
        const aptos = getNetwork(network);

        const odysseyStage = await odysseyClient.getStage(aptos, resource_account);

        if (odysseyStage) {
            res.json({ stage: odysseyStage });
        } else {
            res.json({ stage: null });
        }

    } catch (error) {
        console.error('Error reading stage:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/allowlist-balance/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const aptos = getNetwork(network);
        const userBalance = await odysseyClient.getAllowListBalance(aptos, resource_account, address);
        
        if (userBalance) {
        res.json({ balance: userBalance });
        } else {
        res.json({ balance: 0 });
        }

    } catch (error) {
        res.json({ balance: 0 });
    }
});

app.get('/api/publiclist-balance/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const aptos = getNetwork(network);
        const userBalance = await odysseyClient.getPublicListBalance(aptos, resource_account, address);
        
        if (userBalance) {
        res.json({ balance: userBalance });
        } else {
        res.json({ balance: 0 });
        }

    } catch (error) {
        res.json({ balance: 0 });
    }
});

app.get('/api/get-mint-txn/:address/:mintQty', async (req, res) => {
    const { address, mintQty } = req.params;
    try {
        const payloads = await odysseyClient.getMintToPayloads(
            address,
            resource_account,
            mintQty,
            network
        );
        if (payloads) {
            res.json({ payloads: payloads });
        } else {
            res.json({ payloads: "" });
        }
    } catch (error) {
        console.error('Error geting mint txn::', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/update-metadata-image/:tokenNo/:tokenAddress', async (req, res) => {
    const { tokenNo, tokenAddress } = req.params;
    try {
        const aptos = getNetwork(network);
        const creator_account = getAccount(private_key);
        const txn = await odysseyClient.updateMetaDataImage(
            aptos,
            resource_account,
            creator_account,
            tokenNo,
            tokenAddress,
            asset_dir,
            keyfilePath,
            random_trait,
            collection_name,
            description
        );

        if (txn) {
            res.json({ simpleTxn: txn });
        } else {
            res.json({ simpleTxn: "" });
        }

    } catch (error) {
        console.error('Error updating NFT: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/get-network', async (req, res) => {
    try {
        res.json({ network: network });

    } catch (error) {
        console.error('Error retrieving network: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function getNetwork(network) {
    let selectedNetwork = Network.DEVNET;
    const lowercaseNetwork = network.toLowerCase();
    switch (lowercaseNetwork) {
      case "testnet":
        selectedNetwork = Network.TESTNET;
        break;
      case "mainnet":
        selectedNetwork = Network.MAINNET;
        break;
    case "random":
        selectedNetwork = Network.RANDOMNET;
        break;
    }
    const APTOS_NETWORK = selectedNetwork;
    const aptosConfig = new AptosConfig({ network: APTOS_NETWORK });
    const aptos = new Aptos(aptosConfig);
  
    return aptos;
  }
  
  function getAccount(privateKey) {
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(privateKey),
      legacy: true, // or false, depending on your needs
    });
    return account;
  }

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
