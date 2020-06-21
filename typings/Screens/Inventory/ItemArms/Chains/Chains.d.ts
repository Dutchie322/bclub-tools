declare function InventoryItemArmsChainsLoad(): void;
declare function InventoryItemArmsChainsDraw(): void;
declare function InventoryItemArmsChainsClick(): void;
declare function InventoryItemArmsChainsSetPose(NewType: any): void;
declare const ChainsArmsOptions: ({
    Name: string;
    RequiredBondageLevel: any;
    Property: {
        Type: any;
        Effect: string[];
        SetPose: string[];
        Difficulty: number;
        OverridePriority?: undefined;
        Block?: undefined;
    };
    ArmsOnly: boolean;
    Expression?: undefined;
    HiddenItem?: undefined;
} | {
    Name: string;
    RequiredBondageLevel: any;
    Property: {
        Type: string;
        Effect: string[];
        SetPose: string[];
        Difficulty: number;
        OverridePriority: number;
        Block?: undefined;
    };
    Expression: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    ArmsOnly: boolean;
    HiddenItem?: undefined;
} | {
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        Effect: string[];
        SetPose: string[];
        Difficulty: number;
        OverridePriority?: undefined;
        Block?: undefined;
    };
    Expression: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    ArmsOnly: boolean;
    HiddenItem?: undefined;
} | {
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        Effect: string[];
        Block: string[];
        SetPose: string[];
        Difficulty: number;
        OverridePriority?: undefined;
    };
    Expression: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    ArmsOnly: boolean;
    HiddenItem?: undefined;
} | {
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        Effect: string[];
        Block: string[];
        SetPose: string[];
        Difficulty: number;
        OverridePriority?: undefined;
    };
    Expression: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    ArmsOnly: boolean;
    HiddenItem: string;
})[];
declare var ChainsArmsOptionOffset: number;
