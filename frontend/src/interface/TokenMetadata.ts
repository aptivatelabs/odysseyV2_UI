// TokenMetadata.ts

export interface TokenAttribute {
    trait_type: string;
    value: string;
}

export interface TokenMetadata {
    token_data_id: string;
    token_name: string;
    token_uri: string;
    metadata: {
        name: string;
        image: string;
        description: string;
        attributes: TokenAttribute[];
    }
}
