import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ComprobanteModal from './ComprobanteModal.jsx';

describe('ComprobanteModal', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost:5173/fake-blob-id');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('no renderiza nada si url es null o indefinida', () => {
    const { container } = render(<ComprobanteModal url={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza una imagen cuando el archivo no es un PDF', () => {
    render(
      <ComprobanteModal
        url="https://ejemplo.com/comprobante.png"
        title="Comprobante PNG"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Comprobante PNG')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://ejemplo.com/comprobante.png');
    expect(screen.getByText('Abrir en nueva pestaña')).toHaveAttribute(
      'href',
      'https://ejemplo.com/comprobante.png'
    );
  });

  it('renderiza un iframe con Blob URL cuando el comprobante es un PDF', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake pdf content'], { type: 'application/pdf' })
    });

    render(
      <ComprobanteModal
        url="https://cooperadora-backend.onrender.com/uploads/comprobantes/recibo.pdf"
        title="Comprobante PDF"
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      const iframe = screen.getByTitle('Comprobante PDF');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'blob:http://localhost:5173/fake-blob-id');
    });

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('muestra estado alternativo con enlace si falla la carga del PDF', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <ComprobanteModal
        url="https://cooperadora-backend.onrender.com/uploads/comprobantes/recibo.pdf"
        title="Comprobante Fallido"
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Vista previa no disponible directamente')).toBeInTheDocument();
    });

    expect(screen.getByText('Abrir comprobante en nueva pestaña')).toHaveAttribute(
      'href',
      'https://cooperadora-backend.onrender.com/uploads/comprobantes/recibo.pdf'
    );
  });

  it('muestra estado alternativo amigable si falla la carga de la imagen', () => {
    render(
      <ComprobanteModal
        url="https://cooperadora-backend.onrender.com/uploads/comprobantes/foto.jpg"
        numeroComprobante="TRF-987654"
        title="Comprobante"
        onClose={() => {}}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(screen.getByText('Vista previa no disponible directamente')).toBeInTheDocument();
    expect(screen.getAllByText(/TRF-987654/).length).toBeGreaterThanOrEqual(1);
  });

  it('llama a onClose al hacer clic en el botón de cerrar y con la tecla Escape', () => {
    const handleClose = vi.fn();
    render(
      <ComprobanteModal
        url="https://ejemplo.com/comprobante.jpg"
        title="Comprobante"
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTitle('Cerrar');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
