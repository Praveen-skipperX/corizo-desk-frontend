import { Component } from 'react';
import { Button } from './button';

export default class PageErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div role="alert" className="mx-auto max-w-lg space-y-3 p-6">
        <h1 className="text-lg font-semibold">This page could not be displayed</h1>
        <p className="text-sm text-muted-foreground">Reload the page to try again.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    );
    return this.props.children;
  }
}
