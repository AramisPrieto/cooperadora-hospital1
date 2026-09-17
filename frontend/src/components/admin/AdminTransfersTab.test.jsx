import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdminTransfersTab } from './AdminTransfersTab';

const mockTransfers = [
  {
    id: 1,
    monto: '5000.00',
    estado: 'aprobada',
    numero_comprobante: 'TXN-101',
    createdAt: '2026-03-01T10:00:00.000Z',
    campana: { titulo: 'Equipamiento Neonatal' },
    usuario: { email: 'juan@test.com', perfilSocio: { nombre: 'Juan', apellido: 'Perez', dni: '12345678' } }
  },
  {
    id: 2,
    monto: '8000.00',
    estado: 'rechazada',
    numero_comprobante: 'TXN-102',
    createdAt: '2026-03-02T10:00:00.000Z',
    campana: { titulo: 'Sala de Guardia' },
    usuario: { email: 'maria@test.com', perfilSocio: { nombre: 'Maria', apellido: 'Gomez', dni: '87654321' } }
  },
  {
    id: 3,
    monto: '12000.00',
    estado: 'pendiente',
    numero_comprobante: 'TXN-103',
    createdAt: '2026-03-03T10:00:00.000Z',
    campana: { titulo: 'Resonador' },
    usuario: { email: 'carlos@test.com', perfilSocio: { nombre: 'Carlos', apellido: 'Lopez', dni: '11223344' } }
  }
];

describe('AdminTransfersTab - Vistas por estado', () => {
  it('debería renderizar las pestañas con sus conteos correspondientes', () => {
    render(<AdminTransfersTab transfers={mockTransfers} />);
    expect(screen.getByRole('button', { name: /^todas/i })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /^aprobadas/i })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^desaprobadas/i })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^pendientes/i })).toHaveTextContent('1');
  });

  it('debería filtrar exclusivamente transferencias aprobadas al seleccionar la pestaña Aprobadas', () => {
    render(<AdminTransfersTab transfers={mockTransfers} />);
    fireEvent.click(screen.getByRole('button', { name: /^aprobadas/i }));
    expect(screen.getAllByText(/Juan Perez/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Maria Gomez/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Carlos Lopez/i)).not.toBeInTheDocument();
  });

  it('debería filtrar exclusivamente transferencias desaprobadas al seleccionar la pestaña Desaprobadas', () => {
    render(<AdminTransfersTab transfers={mockTransfers} />);
    fireEvent.click(screen.getByRole('button', { name: /^desaprobadas/i }));
    expect(screen.getAllByText(/Maria Gomez/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Juan Perez/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Carlos Lopez/i)).not.toBeInTheDocument();
  });
});
