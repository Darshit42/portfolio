import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type Props = Omit<ThreeElements["mesh"], "args"> & {
  args: [number, number, number];
  radius?: number;
  smoothness?: number;
};

/**
 * A box with gently beveled edges — the low-poly read stays, but the hard
 * corners soften (PRD "a bit smoother, just a little"). `radius` must stay
 * below half the smallest dimension, so use this for chunky volumes (building
 * bodies, crates, barrels), not thin panels.
 */
export function RBox({ radius = 0.18, smoothness = 3, ...props }: Props) {
  return <RoundedBox radius={radius} smoothness={smoothness} steps={1} {...props} />;
}
