/**
 * Loads the item extension properties
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type
 * @param {string} Options[].Name - The name of the type - used for the preview icon and the translation key in the CSV
 * @param {number} [Options[].BondageLevel] - The required bondage skill level for this type (optional)
 * @param {number} [Options[].SelfBondageLevel] - The required self-bondage skill level for this type when using it on yourself (optional)
 * @param {Object} [Options[].Property] - The Property object to be applied when this type is used
 * @param {string} DialogKey - The dialog key for the message to display prompting the player to select an extended type
 */
declare function ExtendedItemLoad(Options: {
    Name: string;
    BondageLevel: number;
    SelfBondageLevel: number;
    Property: any;
}, DialogKey: string): void;
/**
 * Draws the extended item type selection screen
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {string} DialogPrefix - The prefix to the dialog keys for the display strings describing each extended type. The full dialog key
 *     will be <Prefix><Option.Name>
 */
declare function ExtendedItemDraw(Options: any[], DialogPrefix: string): void;
/**
 * Handles clicks on the extended item type selection screen
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 */
declare function ExtendedItemClick(Options: any[]): void;
/**
 * Handler function for setting the type of an extended item
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {Object} Option - The selected type definition (as defined in ExtendedItemLoad)
 */
declare function ExtendedItemSetType(Options: any[], Option: any): void;
/**
 * Draws the extended item type selection screen when there are only two options
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {string} DialogPrefix - The prefix to the dialog keys for the display strings describing each extended type. The full dialog key
 *     will be <Prefix><Option.Name>
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 */
declare function ExtendedItemDrawTwo(Options: any[], DialogPrefix: string, IsSelfBondage: boolean): void;
/**
 * Draws the extended item type selection screen when there are more than two options. Options will be paginated if necessary, with four
 * options drawn per page in a 2x2 grid
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {string} DialogPrefix - The prefix to the dialog keys for the display strings describing each extended type. The full dialog key
 *     will be <Prefix><Option.Name>
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 */
declare function ExtendedItemDrawGrid(Options: any[], DialogPrefix: string, IsSelfBondage: boolean): void;
/**
 * Handles clicks on the extended item type selection screen when there are only two options
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 */
declare function ExtendedItemClickTwo(Options: any[], IsSelfBondage: boolean): void;
/**
 * Handles clicks on the extended item type selection screen when there are more than two options
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 */
declare function ExtendedItemClickGrid(Options: any[], IsSelfBondage: boolean): void;
/**
 * Handler function called when an option on the type selection screen is clicked
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 * @param {Object} Option - The selected type definition (as defined in ExtendedItemLoad)
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 */
declare function ExtendedItemHandleOptionClick(Options: any[], Option: any, IsSelfBondage: boolean): void;
/**
 * Checks whether the player meets the requirements for an extended type option. This will check against their Bondage skill if applying
 * the item to another character, or their Self Bondage skill if applying the item to themselves.
 *
 * @param {Object} Option - The selected type definition (as defined in ExtendedItemLoad)
 * @param {boolean} IsSelfBondage - Whether or not the player is applying the item to themselves
 * @return {string|null} null if the player meets the option requirements. Otherwise a string message informing them of the requirements
 *     they do not meet
 */
declare function ExtendedItemRequirementCheckMessage(Option: any, IsSelfBondage: boolean): string | null;
/**
 * Simple getter for the function prefix used for the currently focused extended item - used for calling standard extended item functions
 * (e.g. if the currently focused it is the hemp rope arm restraint, this will return "InventoryItemArmsHempRope", allowing functions like
 * InventoryItemArmsHempRopeLoad to be called)
 *
 * @return {string} The extended item function prefix for the currently focused item
 */
declare function ExtendedItemFunctionPrefix(): string;
/**
 * Simple getter for the key of the currently focused extended item in the ExtendedItemOffsets lookup
 *
 * @return {string} The offset lookup key for the currently focused extended item
 */
declare function ExtendedItemOffsetKey(): string;
/**
 * @return {number} The pagination offset for the currently focused extended item
 */
declare function ExtendedItemGetOffset(): number;
/**
 * Sets the pagination offset for the currently focused extended item
 *
 * @param {number} Offset - The new offset to set
 */
declare function ExtendedItemSetOffset(Offset: number): void;
/**
 * Switches the pagination offset to the next page for the currently focused extended item. If the new offset is greater than the number of
 * available options, the offset will be reset to zero, wrapping back to the first page.
 *
 * @param {Object[]} Options - An Array of type definitions for each allowed extended type (as defined in ExtendedItemLoad)
 */
declare function ExtendedItemNextPage(Options: any[]): void;
/**
 * Utility file for handling extended items
 *
 * Item option format:
 *
 * Option.Name:				The name of the type - used for the preview icon and the translation key in the CSV
 * Option.BondageLevel:		The required bondage skill level for this type (optional)
 * Option.SelfBondageLevel:	The required self-bondage skill level for this type when using it on yourself (optional)
 * Option.Property:			The Property object to be applied when this option is used
 *
 */
/**
 * A lookup for the current pagination offset for all extended item options. Offsets are only recorded if the extended item requires
 * pagination
 *
 * Example format:
 * {
 *     "ItemArms/HempRope": 4,
 *     "ItemArms/Web": 0
 * }
 *
 * @type {Object.<string, number>}
 */
declare var ExtendedItemOffsets: {
    [x: string]: number;
};
