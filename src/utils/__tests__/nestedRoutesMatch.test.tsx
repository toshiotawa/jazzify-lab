import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

const InnerRoutesAbsolute: React.FC = () => (
  <Routes>
    <Route path="/main/dashboard" element={<div>DASH_ABS</div>} />
    <Route path="*" element={<div>FALLBACK_ABS</div>} />
  </Routes>
);

const InnerRoutesRelative: React.FC = () => (
  <Routes>
    <Route path="dashboard" element={<div>DASH_REL</div>} />
    <Route path="*" element={<div>FALLBACK_REL</div>} />
  </Routes>
);

describe('nested Routes under /main/*', () => {
  it('matches relative dashboard path under splat parent', () => {
    render(
      <MemoryRouter initialEntries={['/main/dashboard']}>
        <Routes>
          <Route path="/main/*" element={<InnerRoutesRelative />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('DASH_REL')).toBeTruthy();
  });

  it('does not match absolute /main/dashboard under splat parent (RR v7)', () => {
    render(
      <MemoryRouter initialEntries={['/main/dashboard']}>
        <Routes>
          <Route path="/main/*" element={<InnerRoutesAbsolute />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('FALLBACK_ABS')).toBeTruthy();
  });
});
