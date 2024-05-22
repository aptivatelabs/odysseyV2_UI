// OdysseyTypes.ts
export interface FeeValue {
    amount: string;
    category: string;
    destination: string;
}

export interface FeeStage {
    key: string;
    value: FeeValue[];
}

export interface OdysseyResource {
    collection: {
        inner: string;
    };
    collection_size: string;
    cover: string;
    description: string;
    fees: {
        data: FeeStage[];
    };
    minted: string;
    paused: boolean;
}

export interface Stage {
    key: string;
    value: {
      start_time: number;
      end_time: number;
    };
}
  
export interface FeesData {
    key: string;
    value: {
      amount: string; // Note: amount is still considered as string
    }[];
}
  
export interface Fees {
    key: string;
    amount: string; // Note: amount is still considered as string
}