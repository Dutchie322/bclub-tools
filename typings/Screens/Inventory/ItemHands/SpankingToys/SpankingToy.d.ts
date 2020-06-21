declare function InventoryItemHandsSpankingToysLoad(): void;
declare function InventoryItemHandsSpankingToysDraw(): void;
declare function InventoryItemHandsSpankingToysClick(): void;
declare function InventorySpankingToySetType(NewType: any): void;
declare function InventorySpankingToysGetType(C: any): any;
declare function InventorySpankingToysGetDescription(C: any): any;
declare function InventorySpankingToysGetActivity(C: any): any;
declare function InventorySpankingToysActivityAllowed(C: any): boolean;
declare const SpankingInventory: ({
    Name: string;
    Bonus: {
        Type: string;
        Factor: number;
    }[];
    ExpressionTrigger: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
} | {
    Name: string;
    ExpressionTrigger: {
        Group: string;
        Name: string;
        Timer: number;
    }[];
    Bonus?: undefined;
})[];
declare var SpankingInventoryOffset: number;
declare var SpankingNextButton: boolean;
declare var SpankingPlayerInventory: any;
