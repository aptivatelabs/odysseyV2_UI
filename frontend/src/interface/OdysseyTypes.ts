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
