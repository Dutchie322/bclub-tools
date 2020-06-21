declare function InventoryItemLegsHempRopeLoad(): void;
declare function InventoryItemLegsHempRopeDraw(): void;
declare function InventoryItemLegsHempRopeClick(): void;
declare function InventoryItemLegsHempRopeSetPose(NewType: any): void;
declare const HempRopeLegsOptions: ({
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        SetPose: string[];
        Difficulty: number;
        Block?: undefined;
    };
} | {
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        SetPose: string[];
        Block: string[];
        Difficulty: number;
    };
})[];
declare var HempRopeLegsOptionOffset: number;
