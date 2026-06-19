import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ScrollToTop from './ScrollToTop';

// Mock de Lenis
const mockScrollTo = vi.fn();
vi.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: mockScrollTo,
  }),
}));

describe('ScrollToTop - UI Skills Standard', () => {
  it('debería ejecutar scrollTo al renderizarse', () => {
    render(
      <BrowserRouter>
        <ScrollToTop />
      </BrowserRouter>
    );
    expect(mockScrollTo).toHaveBeenCalledWith(0, { immediate: true });
  });
});
