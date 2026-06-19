import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import Footer from './Footer';

// Mock de Lenis
vi.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: vi.fn(),
  }),
}));

describe('Footer - UI Skills Standard', () => {
  it('debería renderizarse correctamente', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText(/Cooperadora Hospital Necochea/i)).toBeInTheDocument();
    expect(screen.getByText(/Personería Jurídica/i)).toBeInTheDocument();
  });

  it('debería cumplir con las reglas de accesibilidad WCAG', async () => {
    const { container } = render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
