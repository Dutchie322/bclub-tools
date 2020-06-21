declare function InventoryItemFeetHempRopeLoad(): void;
declare function InventoryItemFeetHempRopeDraw(): void;
declare function InventoryItemFeetHempRopeClick(): void;
declare function InventoryItemFeetHempRopeSetPose(NewType: any): void;
declare const HempRopeFeetOptions: ({
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        SetPose: string[];
        Difficulty: number;
    };
    FeetGround: boolean;
    Expression?: undefined;
    Suspension?: undefined;
} | {
    Name: string;
    RequiredBondageLevel: number;
    Property: {
        Type: string;
        SetPose: string[];
        Difficulty: number;
    };
    Expression: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    FeetGround: boolean;
    Suspension: boolean;
})[];
declare var HempRopeFeetOptionOffset: number;
