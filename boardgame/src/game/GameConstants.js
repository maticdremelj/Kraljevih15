// src/gameConstants.js

// Board dimensions
export const BOARD_ROWS = 11;
export const BOARD_COLS = 7;
export const COLUMN_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Initial King positions
export const KING_START_COL = 'D';
export const PLAYER_A_KING_ROW = 1;
export const PLAYER_B_KING_ROW = 11;

// Initial non-King placement order relative to King
export const NON_KING_PLACEMENT_ORDER = ['E', 'C', 'F', 'B', 'G', 'A'];

// Base Figure definitions
export const FIGURES_DATA = {
  King: { hp: 15, dmg: 2, range: Infinity, actions: [
    { name: "Do 2 Damage", cost: 3, type: "damage", value: 2, targetType: "any" },
    { name: "Give 1 AC to Troop", cost: 3, type: "giveAC", value: 1, targetType: "ally" },
    { name: "Move 1 Tile", cost: 3, type: "move", value: 1 },
    { name: "Grant 3 Temp HP", cost: 3, type: "tempHP", value: 3, duration: "1 round", targetType: "ally" },
    { name: "Use Defeated Troop's Actions", cost: 3, type: "useDefeatedActions", targetType: "ally" }
  ]},
  Healer: { hp: 9, dmg: 1, range: 4, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Move & Ally Move", cost: 2, type: "moveAlly", value: 1, targetType: "ally" },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Heal Self/Ally 2 HP", cost: 1, type: "heal", value: 2, targetType: "selfOrAlly" },
    { name: "Heal Ally 4 HP", cost: 3, type: "heal", value: 4, targetType: "ally" }
  ]},
  Knight: { hp: 11, dmg: 3, range: 1, actions: [
    { name: "Move up to 2 Tiles", cost: 1, type: "move", value: 2 },
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Attack (2)", cost: 1, type: "attack" }, // Second attack action
    { name: "Move, Attack, & Move Attacked", cost: 2, type: "moveAttackMoveAttacked" }
  ]},
  Wizard: { hp: 8, dmg: 4, range: 4, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 2, type: "attack" },
    { name: "Splash Attack", cost: 2, type: "splashAttack", dmgModifier: -2 },
    { name: "Mark Enemy", cost: 3, type: "markEnemy", duration: "1 round", targetType: "enemy" },
    { name: "Heal Self/Ally 1 HP", cost: 1, type: "heal", value: 1, targetType: "selfAndAlly" }
  ]},
  Ranger: { hp: 8, dmg: 2, range: 5, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Increase Range", cost: 1, type: "increaseRange", value: 1, duration: "1 turn" },
    { name: "Increase DMG", cost: 1, type: "increaseDMG", value: 1, duration: "1 turn" },
    { name: "Heal Self 2 HP", cost: 1, type: "heal", value: 2, special: "rangerLoS" }
  ]},
  Tank: { hp: 13, dmg: 2, range: 1, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Attack (2)", cost: 1, type: "attack" },
    { name: "Attack (3)", cost: 1, type: "attack" },
    { name: "Occupy Two Tiles", cost: 1, type: "occupyTwoTiles", duration: "until next turn" },
    { name: "Shield Allies", cost: 3, type: "shield", value: 3, duration: "until next turn", targetType: "adjacentAllies" }
  ]},
  Barbarian: { hp: 12, dmg: 5, range: 1, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 2, type: "attack" },
    { name: "Weak Attack", cost: 1, type: "attack", value: 2 },
    { name: "Gain 1 AC", cost: { hp: 1 }, type: "gainAC", value: 1 },
    { name: "Gain 2 DMG", cost: { hp: 2 }, type: "gainDMG", value: 2 }
  ]},
  Druid: { hp: 8, dmg: 2, range: 5, specialRule: "meleeUnder", actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Ascend on New Plane", cost: 1, type: "ascend", duration: "1 turn" },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Heal Self/Ally 2 HP", cost: 2, type: "heal", value: 2, targetType: "selfAndAlly" }
  ]},
  Hunter: { hp: 11, dmg: 3, range: 3, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Stun Attack", cost: 2, type: "stun", duration: "1 round", targetType: "enemy" },
    { name: "Move Enemy", cost: 2, type: "moveEnemy", value: 1, targetType: "enemy" },
    { name: "Adjacent Tile DMG", cost: 1, type: "adjacentTileDMG", value: 1, duration: "1 turn" }
  ]},
  Goblin: { hp: 7, dmg: 1, range: 1, specialRule: "noKingResurrect,respawnKingMove", actions: [
    { name: "Move up to 2 Tiles (1)", cost: 1, type: "move", value: 2 },
    { name: "Move up to 2 Tiles (2)", cost: 1, type: "move", value: 2 },
    { name: "Attack (0 AC)", cost: 0, type: "attack" },
    { name: "Attack (1 AC, 1)", cost: 1, type: "attack" },
    { name: "Attack (1 AC, 2)", cost: 1, type: "attack" },
    { name: "Attack (1 AC, 3)", cost: 1, type: "attack" }
  ]},
  Cannon: { hp: 15, dmg: 2, range: 2, specialRule: "cannotBeHealed", actions: [
    { name: "Move 1 Tile", cost: 2, type: "move", value: 1 },
    { name: "Move 2 Tiles", cost: 3, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Attack (2)", cost: 1, type: "attack" },
    { name: "Increase DMG if Stationary", cost: 1, type: "increaseDMGStationary", value: 3, duration: "1 turn" },
    { name: "Increase Self Range", cost: 1, type: "increaseRange", value: 1, duration: "1 turn" }
  ]},
  Trainer: { hp: 7, dmg: 2, range: 2, actions: [
    { name: "Move up to 2 Tiles (1)", cost: 1, type: "move", value: 2 },
    { name: "Move up to 2 Tiles (2)", cost: 1, type: "move", value: 2 },
    { name: "Increase Ally Range", cost: 2, type: "increaseAllyRange", value: 1, duration: "1 round", targetType: "ally" },
    { name: "Boost Ally Movement", cost: 2, type: "boostAllyMovement", value: 1, duration: "1 round", targetType: "ally" },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Increase Self DMG", cost: 2, type: "increaseSelfDMG", value: 3, duration: "1 turn" },
    { name: "Give 2 Temp HP to Ally", cost: 1, type: "tempHP", value: 2, duration: "1 round", targetType: "ally" }
  ]},
  Assassin: { hp: 9, dmg: 1, range: 1, actions: [
    { name: "Move up to 2 Tiles", cost: 1, type: "move", value: 2 },
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles (2)", cost: 2, type: "move", value: 2 },
    { name: "Poison Attack (1)", cost: 1, type: "poisonAttack" },
    { name: "Poison Attack (2)", cost: 1, type: "poisonAttack" },
    { name: "Poison Enhancer: No Healing", cost: 1, type: "poisonEnhancerNoHealing" },
    { name: "Poison Enhancer: Ignores Shield/Temp HP", cost: 1, type: "poisonEnhancerIgnoreShield" }
  ]},
  General: { hp: 9, dmg: 1, range: 4, actions: [
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles", cost: 2, type: "move", value: 2 },
    { name: "Move & Ally Move", cost: 2, type: "moveAlly", value: 1, targetType: "ally" },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Heal Self/Ally 2 HP", cost: 1, type: "heal", value: 2, targetType: "selfOrAlly" },
    { name: "Heal Ally 4 HP", cost: 3, type: "heal", value: 4, targetType: "ally" },
    { name: "Increase Ally DMG", cost: 2, type: "increaseAllyDMG", value: 1, duration: "1 round", targetType: "ally" }
  ]},
  Rocketeer: { hp: 11, dmg: 3, range: 1, actions: [
    { name: "Move up to 2 Tiles", cost: 1, type: "move", value: 2 },
    { name: "Move 1 Tile", cost: 1, type: "move", value: 1 },
    { name: "Move up to 2 Tiles (2)", cost: 2, type: "move", value: 2 },
    { name: "Attack", cost: 1, type: "attack" },
    { name: "Attack (2)", cost: 1, type: "attack" },
    { name: "Move, Attack, & Move Attacked", cost: 2, type: "moveAttackMoveAttacked" }
  ]}
};

// Game Phases
export const GAME_PHASES = {
  PRE_GAME_LOBBY: 'PRE_GAME_LOBBY', // Players join, game ID is shared
  FIGURE_SELECTION: 'FIGURE_SELECTION', // Players draft and place non-King figures
  MAIN_GAME: 'MAIN_GAME',         // Core game loop
  GAME_OVER: 'GAME_OVER',         // Game ended
};

// Turn Types within MAIN_GAME phase
export const TURN_TYPES = {
  KING_TURN: 'KING_TURN',
  FIGURE_TURN: 'FIGURE_TURN',
};

// Player identifiers
export const PLAYER_A = 'playerA'; // Host
export const PLAYER_B = 'playerB'; // Joiner