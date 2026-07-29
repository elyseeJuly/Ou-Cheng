// @vitest-environment happy-dom
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import Create from './pages/Create';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = undefined;
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Create Page Mount Smoke Test', () => {
  it('renders the Create page', async () => {
    // Stub fetch since Create page fetches cipai.json
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify([])))
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      root = createRoot(container);
      root.render(
        <Router>
          <Create />
        </Router>
      );
    });

    // Verify it mounted successfully
    expect(container.innerHTML).toBeTruthy();
  });
});
