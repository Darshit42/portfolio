import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Called when the subtree throws — used to fall back to Recruiter Mode. */
  onError: () => void;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors in the 3D world (e.g. WebGL context loss) and
 * triggers a graceful fallback so the site never white-screens (PRD §5, §10).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Devhalla world crashed, falling back:", error, info.componentStack);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
