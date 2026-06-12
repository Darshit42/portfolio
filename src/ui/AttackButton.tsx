import type { PointerEvent as RPointerEvent } from "react";
import { doAttack } from "../game/combat";
import { useGameStore } from "../store/useGameStore";
import { SwordIcon } from "./icons";

/** Touch attack button (combat). Mirrors the Space-bar swing. */
export default function AttackButton() {
  const press = (e: RPointerEvent) => {
    e.preventDefault();
    if (useGameStore.getState().mode === "playing") doAttack();
  };

  return (
    <button
      onPointerDown={press}
      aria-label="Attack"
      className="absolute bottom-10 right-8 z-20 flex h-20 w-20 items-center justify-center rounded-full border-2 border-realm-ember/70 bg-realm-ember/20 text-realm-ember backdrop-blur transition active:scale-95"
    >
      <SwordIcon width={30} height={30} />
    </button>
  );
}
