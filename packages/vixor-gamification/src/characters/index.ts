export type { CharacterId, CharacterRole, CharacterSurface, CharacterDefinition } from "./types";

export {
  CHARACTER_REGISTRY,
  ACTIVE_CHARACTER_IDS,
  getCharacter,
  isActiveCharacter,
  isAllowedSurface,
  getAllActiveCharacters,
} from "./registry";
