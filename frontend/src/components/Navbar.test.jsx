import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar';
import api from '../api/axios';

// Mock de Lenis
vi.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: vi.fn(),
  }),
}));

// Mock de axios
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Navbar - UI Skills Standard', () => {
  it('debería renderizarse correctamente y mostrar enlaces de navegación', async () => {
    api.get.mockRejectedValueOnce(new Error('No autenticado'));
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Cooperadora')).toBeInTheDocument();
    
    // Debería tener los enlaces principales
    const campanasLinks = screen.getAllByText('Campañas');
    expect(campanasLinks.length).toBeGreaterThan(0);
  });

  it('debería cumplir con las reglas de accesibilidad WCAG', async () => {
    api.get.mockRejectedValueOnce(new Error('No autenticado'));
    
    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // Wait for useEffect
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('debería limpiar localStorage si el fetchSession falla', async () => {
    localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', rol: 'admin' }));
    localStorage.setItem('token', 'fake-token');

    api.get.mockRejectedValueOnce(new Error('No autenticado'));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('debería llamar a la API de logout y limpiar localStorage al hacer clic en Salir', async () => {
    localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', rol: 'admin' }));
    localStorage.setItem('token', 'fake-token');

    api.get.mockResolvedValueOnce({
      data: {
        user: { email: 'test@example.com', rol: 'admin' }
      }
    });

    api.post.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the user profile to be rendered
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText(/Salir/i);
    logoutBtn.click();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
