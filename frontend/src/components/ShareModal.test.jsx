import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShareModal from './ShareModal';

describe('ShareModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    url: 'https://cooperadora-hospital.org/campanas/1',
    title: 'Monitores para Terapia',
    summary: 'Ayudanos a equipar la terapia intensiva del Hospital.',
    imageUrl: 'https://via.placeholder.com/300',
    shareMessage: '¡Colaborá con esta campaña!'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('debería renderizar la información de la campaña correctamente en la plantilla', () => {
    render(<ShareModal {...defaultProps} />);

    expect(screen.getByText('Compartir publicación')).toBeInTheDocument();
    expect(screen.getByText('Monitores para Terapia')).toBeInTheDocument();
    expect(screen.getByText('Ayudanos a equipar la terapia intensiva del Hospital.')).toBeInTheDocument();
    expect(screen.getByAltText('Monitores para Terapia')).toBeInTheDocument();
  });

  it('debería ejecutar onClose al presionar el botón de cerrar', async () => {
    render(<ShareModal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Cerrar ventana');
    await userEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('debería ejecutar el copiado de enlace y cambiar el texto del botón al hacer clic en copiar', async () => {
    render(<ShareModal {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copiar/i });
    expect(copyButton).toBeInTheDocument();

    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.url);
    expect(screen.getByText('Copiado')).toBeInTheDocument();
  });

  it('debería cumplir con las reglas de accesibilidad WCAG', async () => {
    const { container } = render(<ShareModal {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
