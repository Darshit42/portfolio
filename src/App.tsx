import { Suspense, lazy, useEffect } from "react";
import { useGameStore } from "./store/useGameStore";
import { detectWebGL } from "./game/webgl";
import { WORLD_NAME } from "./data/config";
import TitleScreen from "./ui/TitleScreen";
import RecruiterMode from "./ui/RecruiterMode";
import { ErrorBoundary } from "./ui/ErrorBoundary";

// The 3D world (Three.js) is the heavy chunk — lazy-load it so the title screen
// and Recruiter Mode paint instantly and stay light.
const GameRoot = lazy(() => import("./game/GameRoot"));

export default function App() {
  const mode = useGameStore((s) => s.mode);
  const setWebglFailed = useGameStore((s) => s.setWebglFailed);

  // Detect WebGL once; on failure, route straight to Recruiter Mode.
  useEffect(() => {
    if (!detectWebGL()) setWebglFailed();
  }, [setWebglFailed]);

  if (mode === "title") return <TitleScreen />;
  if (mode === "recruiter") return <RecruiterMode />;

  // Any world-family mode: mount the 3D world, with Recruiter Mode as the
  // crash/WebGL-loss fallback so we never white-screen.
  return (
    <ErrorBoundary onError={setWebglFailed} fallback={<RecruiterMode />}>
      <Suspense fallback={<LoadingRealm />}>
        <GameRoot />
      </Suspense>
    </ErrorBoundary>
  );
}

function LoadingRealm() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-realm-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-edge border-t-realm-gold" />
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-realm-muted">
        Forging {WORLD_NAME}…
      </p>
    </div>
  );
}
