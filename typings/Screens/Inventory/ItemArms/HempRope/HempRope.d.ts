declare function InventoryItemArmsHempRopeLoad(): void;
declare function InventoryItemArmsHempRopeDraw(): void;
declare function InventoryItemArmsHempRopeClick(): void;
declare function InventoryItemArmsHempRopeSetPose(NewType: any): void;
declare const HempRopeArmsOptions: ({
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
declare var HempRopeArmsOptionOffset: number;
