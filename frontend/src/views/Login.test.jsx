import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
  }
}));

describe('Login View - UI Skills Standard', () => {
  it('debería renderizarse correctamente en modo login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('debería renderizarse correctamente en modo registro', () => {
    render(
      <MemoryRouter initialEntries={['/login?mode=register']}>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
  });

  it('debería cumplir con reglas WCAG', async () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
