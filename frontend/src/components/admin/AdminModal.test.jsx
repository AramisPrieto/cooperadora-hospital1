import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import AdminModal from './AdminModal';

describe('AdminModal Component', () => {
  it('no debería renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <AdminModal isOpen={false} onClose={() => {}}>
        <p>Contenido Oculto</p>
      </AdminModal>
    );
    expect(screen.queryByText('Contenido Oculto')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar el contenido cuando isOpen es true', () => {
    render(
      <AdminModal isOpen={true} onClose={() => {}} title="Título Modal">
        <p>Contenido Visible</p>
      </AdminModal>
    );
    expect(screen.getByText('Contenido Visible')).toBeInTheDocument();
    expect(screen.getByText('Título Modal')).toBeInTheDocument();
  });

  it('debería llamar a onClose al presionar la tecla Escape', () => {
    const handleClose = vi.fn();
    render(
      <AdminModal isOpen={true} onClose={handleClose}>
        <p>Modal Activo</p>
      </AdminModal>
    );
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('debería cumplir con reglas WCAG de accesibilidad', async () => {
    const { container } = render(
      <AdminModal isOpen={true} onClose={() => {}} title="Accesible Modal">
        <div>
          <label htmlFor="test-input">Nombre</label>
          <input id="test-input" type="text" />
        </div>
      </AdminModal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
