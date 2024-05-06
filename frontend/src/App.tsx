import { useEffect, useState } from "react";
import { Layout, Row, Col, Button, Spin, Input } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import OwnedCollectionAsset from './OwnedCollectionAsset';
import { OdysseyResource } from './interface/OdysseyTypes'; 

interface Stage {
  key: string;
  value: {
    start_time: number;
    end_time: number;
  };
}

interface FeesData {
  key: string;
  value: {
    amount: string; // Note: amount is still considered as string
  }[];
}

interface Fees {
  key: string;
  amount: string; // Note: amount is still considered as string
}

const isCurrentTimeWithinRange = (startTime: number, endTime: number) => {
  const now = Date.now() / 1000;  // Get current time in seconds since the epoch
  return now >= startTime && now <= endTime;
};


function App() {
  const [odyssey, setOdyssey] = useState<OdysseyResource | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [odysseyStatus, setOdysseyStatus] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [allowlistBalance, setAllowlistBalance] = useState(0);
  const [publiclistBalance, setPubliclistBalance] = useState(0);
  const [loading, setLoading] = useState(false); // State for loading
  const {account, signAndSubmitTransaction } = useWallet();
  const [mintQty, setMintQty] = useState(1);
  const [stages, setStages] = useState<Stage[]>([]);
  const [fees, setFees] = useState<Fees[]>([]);
 
  const aptos = getNetwork();

  const baseUrl = process.env.REACT_APP_API_BASE_URL; // Get base URL from environment variable

  if (!baseUrl) {
    throw new Error('REACT_APP_API_BASE_URL is not defined in .env file');
  }
  
  const fetchOdyssey = async () => {

    try {
      const response = await fetch(`${baseUrl}/api/get-odyssey`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
     
      setOdyssey(data.odyssey);

      const sum_fees: Fees[] = data.odyssey.fees.data.map((item: FeesData) => {
        // Summing up the amount values within the value array
        const totalAmount = item.value.reduce((acc, fee) => acc + parseInt(fee.amount), 0);
        return { key: item.key, amount: totalAmount };
      });

      setFees(sum_fees);

      const collectionData = await aptos.getCollectionDataByCollectionId({
        collectionId: data.odyssey.collection.inner
      });

      setCollectionName(collectionData.collection_name);

      setCoverImageIconTitle(data.odyssey.cover, collectionData.collection_name);
      //displaySystemStatus(data.odyssey);
    } catch (e: any) {
      console.error("Error getting odyssey:", e.message);
    }
  };

  const fetchStage = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/get-stage`);
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json();
      
      const response2 = await fetch(`${baseUrl}/api/allowlist-balance/${account?.address}`);
      const data2 = await response2.json();
      setAllowlistBalance(data2.balance);

      const response3 = await fetch(`${baseUrl}/api/publiclist-balance/${account?.address}`);
      const data3 = await response3.json();
      setPubliclistBalance(data3.balance);

      setStages(data.stage.mint_stages.data); // Store the stages array in state

    } catch (e: any) {
      console.error("Error getting odyssey:", e.message);
    }
  };

  const setCoverImageIconTitle = async (coverUrl: string, collectionName: string) => {
    try {
      const response = await fetch(coverUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch cover image");
      }
      const data = await response.json();
      const imageUrl = data.image;
  
      changeFaviconAndTitle(imageUrl, collectionName);
  
      setCoverImage(imageUrl);
    } catch (error: any) {
      console.error("Error fetching cover image:", error.message);
    }
  };

  // Change Favicon and Title
  const changeFaviconAndTitle = async (imageUrl: string, newTitle: string) => {
    try {
        const dataURL = await getPNGDataURL(imageUrl);

        // Change Favicon
        const oldFavicon = document.querySelector('link[rel="icon"]');
        if (oldFavicon) {
            oldFavicon.setAttribute('href', dataURL);
        } else {
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = dataURL;
            document.head.appendChild(favicon);
        }

        // Change Title
        document.title = newTitle;

    } catch (error) {
        console.error('Error changing favicon and title:', error);
    }
  };

  // Function to convert PNG image to Data URL
  const getPNGDataURL = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataURL = reader.result as string;
            resolve(dataURL);
        };
        reader.readAsDataURL(blob);
    });
  };

  
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOdyssey();
      fetchStage();
    }, 1000); // Polling every 1000ms (1 second)
  
    return () => clearInterval(interval); // Cleanup function to clear the interval

  }, [account?.address]);


  const updateTokenMetadataImage = async (index: string, token: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/update-metadata-image/${index}/${token}`
      );

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Updated token metadata:', data);

    } catch (error: any) {
        console.error('Error updating token metadata:', error.message);
    }
};

  const handleMint = async () => {
    if (!odyssey || loading) return; // Check if odyssey is null or if already loading, return
  
    try {
      
      setLoading(true); // Set loading to true when minting starts

      const response = await fetch(`${baseUrl}/api/get-mint-txn/${account?.address}/${mintQty}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
        
      const data = await response.json();
 
      //aptos.transaction.batch.forSingleAccount({ sender: account, data: data.payloads });
      //Sign and submit transaction to chain
      const response2 = await signAndSubmitTransaction(data.payloads);

      //Wait for transaction
      const mintedTransactions = await aptos.waitForTransaction({ transactionHash: response2.hash });

      //console.log(mintedTransactions);
      
      // Function to filter and find all 'Mint' events
      const findAllMintedTokens = async (transactions: any) => {
        const changes = transactions.changes || [];
        const mintedToken = [];
        for (const change of changes) {
          
          if(change.data){
              if (change.data.type === "0x4::token::TokenIdentifiers") {
                console.log(change);
                const tokenAddress = change.address;
                const tokenIndex = change.data.data.index.value;
                await updateTokenMetadataImage(tokenIndex, tokenAddress);
                mintedToken.push(change);
              }
          }
        }
        return mintedToken;
      };

      const tokens = await findAllMintedTokens(mintedTransactions);

      setLoading(false);
  
    } catch (error) {
      console.error('Minting error:', error);
      setLoading(false); // Set loading to false if there is an error
    }
  };

  
  // Function to format Unix timestamp to local time
  const formatUnixTimestamp = (timestamp: number) => {

    const date = new Date(timestamp * 1000); // Convert to milliseconds

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    
    const formattedDate = new Intl.DateTimeFormat("en-SG", options).format(date);
    return formattedDate;

  };

  function getNetwork() {
    let network="devnet";
    if (process.env.REACT_APP_APTOS_NETWORK !== undefined){
      network = process.env.REACT_APP_APTOS_NETWORK;
    }
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

  const formatAPT = (apt: number) => {
    return apt / 100000000;
  };

  return (
    <>
      <Layout>
        <Row align="middle">
          <Col span={10} offset={2}>
            {odyssey ? (
              <>
                <h1></h1>
              </>
            ) : (
              <p>Loading odyssey data...</p>
            )}
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>

      <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
        <Col span={6} offset={5}>
        {coverImage && (
          <img src={coverImage} alt="Odyssey Cover" style={{ maxWidth: "90%" }} />
        )}
        </Col>
        <Col span={9} offset={0}>
          {odyssey ? (
            <>
              <h2>{collectionName}</h2>
              <p>{odyssey.description}</p>
              <p>Max Supply: {odyssey.collection_size} </p>
              <p>Total Minted: {odyssey.minted}</p>
              
              {stages.map((stage, index) => {
                  // Find the corresponding fee for this stage
                  const fee = fees.find(fee => fee.key === stage.key);
                  const isActive = isCurrentTimeWithinRange(stage.value.start_time, stage.value.end_time);


                  return (
                      <div key={index} style={{padding: '10px', backgroundColor: isActive ? 'lightblue' : 'transparent'}}>
                          <strong>{stage.key}</strong>
                          <br /><br />
                          Start Time: {formatUnixTimestamp(stage.value.start_time)}
                          <br /><br />
                          End Time: {formatUnixTimestamp(stage.value.end_time)}
                          <br /><br />
                          {/* Display the fee if found */}
                          {fee && (
                              <div>
                                  Fee: {formatAPT(parseInt(fee.amount))} APT
                                  <br /><br />
                                  {stage.key === 'Presale mint stage' ? ` Allowlist balance: ${allowlistBalance}` : `Publiclist balance: ${publiclistBalance}`}
                              </div>
                          )}
                          <br />
                          
                      </div>
                  );
              })}

              <Input 
                type="number" 
                value={mintQty} 
                style={{ width: "100px" }}
                onChange={(e) => setMintQty(parseInt(e.target.value))} 
                min={1} 
                id="mintQty" 
              />&nbsp;
  
              <Button onClick={handleMint} style={{ marginTop: "10px" }} disabled={false}>
                {loading ? <Spin /> : "Mint"}
              </Button>
            
            </>
          ) : (
            <p></p>
          )}
          <p className="odysseyStatus">{odysseyStatus}</p>
        </Col>
      </Row>
      <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
        
        <Col span={15} offset={5}>
          {odyssey ? (
            <>
              <h2>Your digital assets: </h2>
              {account ? (
              <OwnedCollectionAsset accountAddress={account.address} collectionAddress={odyssey.collection.inner} aptos={aptos}/>
            ) : (
              <p></p>
            )}
            </>
          ) : (
            <p></p>
          )}
          
        </Col>
      </Row>
    </>
  );
}

export default App;
