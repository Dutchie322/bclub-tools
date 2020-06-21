/**
* Add a new item by group & name to character inventory
* @param {Character} C - The character that gets the new item added to her inventory
* @param {String} NewItemName - The name of the new item to add
* @param {String} NewItemGroup - The group name of the new item to add
* @param {Boolean} Push - Set to TRUE to push to the server
*/
declare function InventoryAdd(C: any[], NewItemName: string, NewItemGroup: string, Push: boolean): void;
/**
* Deletes an item from the character inventory
* @param {Character} C - The character on which we should remove the item
* @param {String} DelItemName - The name of the item to delete
* @param {String} DelItemGroup - The group name of the item to delete
* @param {Boolean} Push - Set to TRUE to push to the server
*/
declare function InventoryDelete(C: any[], DelItemName: string, DelItemGroup: string, Push: boolean): void;
/**
* Loads the current inventory for a character, can be loaded from an object of Name/Group or a compressed array using LZString
* @param {Character} C - The character on which we should load the inventory
* @param {Array} Inventory - An array of Name / Group of items to load
*/
declare function InventoryLoad(C: any[], Inventory: any[]): void;
/**
* Checks if the character has the inventory available
* @param {Character} C - The character on which we should remove the item
* @param {String} InventoryName - The name of the item to validate
* @param {String} InventoryGroup - The group name of the item to validate
*/
declare function InventoryAvailable(C: any[], InventoryName: string, InventoryGroup: string): boolean;
/**
* Returns an error message if a prerequisite clashes with the character items and clothes
* @param {Character} C - The character on which we check for prerequisites
* @param {String} Prerequisite - The name of the prerequisite
* @returns {String} - The error tag, can be converted to an error message
*/
declare function InventoryPrerequisiteMessage(C: any[], Prerequisite: string): string;
/**
* Returns TRUE if we can add the item, no other items must block that prerequisite
* @param {Character} C - The character on which we check for prerequisites
* @param {(Array|String)} Prerequisite - An array of prerequisites or a string for a single prerequisite
* @param {Boolean} SetDialog - If TRUE, set the screen dialog message at the same time
* @returns {Boolean} - TRUE if the item can be added to the character
*/
declare function InventoryAllow(C: any[], Prerequisite: (Array | string), SetDialog: boolean): boolean;
/**
* Gets the current item / cloth worn a specific area (AssetGroup)
* @param {Character} C - The character on which we must check the appearance
* @param {String} AssetGroup - The name of the asset group to scan
* @returns {AppearanceItem} - Returns the appearance which is the item / cloth asset, color and properties
*/
declare function InventoryGet(C: any[], AssetGroup: string): any;
/**
* Makes the character wear an item on a body area
* @param {Character} C - The character that must wear the item
* @param {String} AssetName - The name of the asset to wear
* @param {String} AssetGroup - The name of the asset group to wear
* @param {String} ItemColor - The hex color of the item, can be undefined or "Default"
* @param {Int} Difficulty - The difficulty level to escape from the item
*/
declare function InventoryWear(C: any[], AssetName: string, AssetGroup: string, ItemColor: string, Difficulty: any): void;
/**
* Sets the difficulty to remove an item for a body area
* @param {Character} C - The character that is wearing the item
* @param {String} AssetGroup - The name of the asset group
* @param {Int} Difficulty - The new difficulty level to escape from the item
*/
declare function InventorySetDifficulty(C: any[], AssetGroup: string, Difficulty: any): void;
/**
* Returns TRUE if there's already a locked item at a given body area
* @param {Character} C - The character that is wearing the item
* @param {String} AssetGroup - The name of the asset group (body area)
* @param {Boolean} CheckProperties - Set to TRUE to check for additionnal properties
* @returns {Boolean} - TRUE if the item is locked
*/
declare function InventoryLocked(C: any[], AssetGroup: string, CheckProperties: boolean): boolean;
/**
* Makes the character wear a random item from a body area, the character doesn't need to own the item
* @param {Character} C - The character that must wear the item
* @param {String} GroupName - The name of the asset group (body area)
* @param {Int} Difficulty - The difficulty level to escape from the item
*/
declare function InventoryWearRandom(C: any[], GroupName: string, Difficulty: any): void;
/**
* Removes a specific item from a character body area
* @param {Character} C - The character on which we must remove the item
* @param {String} AssetGroup - The name of the asset group (body area)
*/
declare function InventoryRemove(C: any[], AssetGroup: string): void;
/**
* Returns TRUE if the body area (Asset Group) for a character is blocked and cannot be used
* @param {Character} C - The character on which we validate the group
* @param {String} GroupName - The name of the asset group (body area)
* @returns {Boolean} - TRUE if the group is blocked
*/
declare function InventoryGroupIsBlocked(C: any[], GroupName: string): boolean;
/**
* Returns TRUE if an item has a specific effect
* @param {AppearanceItem} Item - The item from appearance that must be validated
* @param {String} Effect - The name of the effect to validate, can be undefined to check for any effect
* @param {Boolean} CheckProperties - Set to TRUE to check for item extra properties
* @returns {Boolean} - TRUE if the effect is on the item
*/
declare function InventoryItemHasEffect(Item: any, Effect: string, CheckProperties: boolean): boolean;
/**
* Check if we must trigger an expression for the character after an item is used/applied
* @param {Character} C - The character that we must validate
* @param {AppearanceItem} Item - The item from appearance that we must validate
*/
declare function InventoryExpressionTrigger(C: any[], Item: any): void;
/**
* Returns the padlock item that locks another item
* @param {AppearanceItem} Item - The item from appearance that must be scanned
* @returns {Asset} - The asset of the padlock item or NULL if none
*/
declare function InventoryGetLock(Item: any): any[];
/**
* Returns TRUE if the item has an OwnerOnly flag, such as the owner padlock
* @param {AppearanceItem} Item - The item from appearance that must be scanned
* @returns {Boolean} - TRUE if owner only
*/
declare function InventoryOwnerOnlyItem(Item: any): boolean;
/**
* Returns TRUE if the item has a LoverOnly flag, such as the lover padlock
* @param {AppearanceItem} Item - The item from appearance that must be scanned
* @returns {Boolean} - TRUE if lover only
*/
declare function InventoryLoverOnlyItem(Item: any): boolean;
/**
* Returns TRUE if the character is wearing at least one restraint that's locked with an extra lock
* @param {Character} C - The character to scan
* @returns {Boolean} - TRUE if one restraint with an extra lock is found
*/
declare function InventoryCharacterHasLockedRestraint(C: any[]): boolean;
/**
* Returns TRUE if the character is wearing at least one item that's a restraint with a OwnerOnly flag, such as the owner padlock
* @param {Character} C - The character to scan
* @returns {Boolean} - TRUE if one owner only restraint is found
*/
declare function InventoryCharacterHasOwnerOnlyRestraint(C: any[]): boolean;
/**
* Returns TRUE if at least one item on the character can be locked
* @param {Character} C - The character to scan
* @returns {Boolean} - TRUE if at least one item can be locked
*/
declare function InventoryHasLockableItems(C: any[]): boolean;
/**
* Applies a lock to an appearance item of a character
* @param {Character} C - The character on which the lock must be applied
* @param {AppearanceItem} Item - The item from appearance to lock
* @param {(Asset|String)} Lock - The asset of the lock or the name of the lock asset
* @param {Int} MemberNumber - The member number to put on the lock
*/
declare function InventoryLock(C: any[], Item: any, Lock: (any[] | string), MemberNumber: any): void;
/**
* Unlocks an item and removes all related properties
* @param {Character} C - The character on which the item must be unlocked
* @param {AppearanceItem} Item - The item from appearance to unlock
*/
declare function InventoryUnlock(C: any[], Item: any): void;
/**
* Applies a random lock on an item
* @param {Character} C - The character on which the item must be locked
* @param {AppearanceItem} Item - The item from appearance to lock
* @param {Boolean} FromOwner - Set to TRUE if the source is the owner, to apply owner locks
*/
declare function InventoryLockRandom(C: any[], Item: any, FromOwner: boolean): void;
/**
* Applies random locks on each character items that can be locked
* @param {Character} C - The character on which the items must be locked
* @param {Boolean} FromOwner - Set to TRUE if the source is the owner, to apply owner locks
*/
declare function InventoryFullLockRandom(C: any[], FromOwner: boolean): void;
/**
* Removes all common keys from the player inventory
*/
declare function InventoryConfiscateKey(): void;
/**
* Removes the remotes of the vibrators from the player inventory
*/
declare function InventoryConfiscateRemote(): void;
/**
* Returns TRUE if the item is worn by the character
* @param {Character} C - The character to scan
* @param {String} AssetName - The asset / item name to scan
* @param {String} AssetGroup - The asset group name to scan
* @returns {Boolean} - TRUE if item is worn
*/
declare function InventoryIsWorn(C: any[], AssetName: string, AssetGroup: string): boolean;
/**
* Returns TRUE if a specific item / asset is blocked by the character item permissions
* @param {Character} C - The character on which we check the permissions
* @param {String} AssetName - The asset / item name to scan
* @param {String} AssetGroup - The asset group name to scan
* @returns {Boolean} - TRUE if asset / item is blocked
*/
declare function InventoryIsPermissionBlocked(C: any[], AssetName: string, AssetGroup: string): boolean;
/**
 * Returns TRUE if a specific item / asset is limited by the character item permissions
 * @param {Character} C - The character on which we check the permissions
 * @param {String} AssetName - The asset / item name to scan
 * @param {String} AssetGroup - The asset group name to scan
 * @returns {Boolean} - TRUE if asset / item is limited
 */
declare function InventoryIsPermissionLimited(C: any[], AssetName: string, AssetGroup: string): boolean;
/**
 * Returns TRUE if the item is not limited, if the player is an owner or a lover of the character, or on their whitelist
 * @param {Character} C - The character on which we check the limited permissions for the item
 * @param {Item} Item - The item being interacted with
 * @returns {Boolean} - TRUE if item is allowed
 */
declare function InventoryCheckLimitedPermission(C: any[], Item: any): boolean;
/**
 * Returns TRUE if the item is a key, having the effect of unlocking other items
 * @param {Item} Item - The item to validate
 * @returns {Boolean} - TRUE if item is a key
 */
declare function InventoryIsKey(Item: any): boolean;
