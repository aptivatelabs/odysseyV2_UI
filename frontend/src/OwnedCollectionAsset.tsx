// SomeComponent.tsx or another TypeScript file
import { useEffect, useState } from "react";
import { TokenMetadata } from './interface/TokenMetadata';  // Adjust the import path as needed
import { Aptos } from "@aptos-labs/ts-sdk";
import { Tag } from "antd";

interface Props {
    accountAddress: string;
    collectionAddress: string;
    aptos: Aptos;
}

const OwnedAssetsComponent: React.FC<Props> = ({ accountAddress, collectionAddress, aptos }) => {
    const [ownedAssets, setOwnedAssets] = useState<TokenMetadata[]>([]);

    const fetchMetadata = async (uri: string) => {
        const response = await fetch(uri);
        const metadata = await response.json();
        return metadata;
    };

    const fetchOwnedAssets = async () => {
      try {
          const ownedDigitalAssets = await aptos.getAccountOwnedTokensFromCollectionAddress({
              accountAddress: accountAddress,
              collectionAddress: collectionAddress
          });
  
          const assetsWithMetadata = await Promise.all(ownedDigitalAssets.map(async (asset: any) => {
              let metadata = {
                  name: 'Default Name',
                  image: 'Default Image URL',
                  description: 'Default Description',
                  attributes: []
              };
  
              if (asset.current_token_data.token_uri) {
                  const fetchedMetadata = await fetchMetadata(asset.current_token_data.token_uri);
                  // Assuming the fetched metadata is properly structured; validate or use fallbacks as necessary
                  metadata = {
                      name: fetchedMetadata.name || metadata.name,
                      image: fetchedMetadata.image || metadata.image,
                      description: fetchedMetadata.description || metadata.description,
                      attributes: fetchedMetadata.attributes || metadata.attributes
                  };
              }
  
              return {
                  token_data_id: asset.current_token_data.token_data_id,
                  token_name: asset.current_token_data.token_name,
                  token_uri: asset.current_token_data.token_uri,
                  metadata: metadata
              };
          }));
  
          setOwnedAssets(assetsWithMetadata);
      } catch (error) {
          console.error('Failed to fetch owned assets:', error);
      }
  };
  

    useEffect(() => {
        fetchOwnedAssets();
        const interval = setInterval(fetchOwnedAssets, 10000); // Polling every 10 seconds

        return () => clearInterval(interval); // Cleanup function to clear the interval
    }, [accountAddress, collectionAddress]);

    return (
        <div>
            {ownedAssets.map((asset, index) => (
                <div key={index}>
                    <h3>{asset.token_name}</h3>
                    <p>ID: {asset.token_data_id}</p>
                    {asset.metadata.image && <img src={asset.metadata.image} alt="image" height="150px" />}
                    <br />
                    <br />
                    <a href={asset.token_uri}>View JSON</a>
                    <br />
                    <br />
                    {asset.metadata.attributes?.map((attr, idx) => (
                        <Tag style={{margin:"5px"}} key={idx}>{attr.trait_type}: {attr.value}</Tag>
                    ))}
                    <br /><br />
                </div>
            ))}
        </div>
        
    );
};

export default OwnedAssetsComponent;
