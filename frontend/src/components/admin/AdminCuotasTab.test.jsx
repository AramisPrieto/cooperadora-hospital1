import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdminCuotasTab } from './AdminCuotasTab';

const mockCuotas = [
  {
    id: 1,
    monto: '2000.00',
    estado: 'aprobado',
    metodo_pago: 'transferencia',
    fecha_pago: '2026-03-01T10:00:00.000Z',
    perfilSocio: { nombre: 'Ana', apellido: 'Suarez', dni: '12345678' }
  },
  {
    id: 2,
    monto: '2000.00',
    estado: 'rechazado',
    metodo_pago: 'debito',
    fecha_pago: '2026-03-02T10:00:00.000Z',
    perfilSocio: { nombre: 'Roberto', apellido: 'Diaz', dni: '87654321' }
  },
  {
    id: 3,
    monto: '2000.00',
    estado: 'pendiente',
    metodo_pago: 'transferencia',
    fecha_pago: '2026-03-03T10:00:00.000Z',
    perfilSocio: { nombre: 'Lucia', apellido: 'Mendez', dni: '11223344' }
  }
];

describe('AdminCuotasTab - Vistas por estado', () => {
  it('debería renderizar las pestañas con sus conteos correspondientes', () => {
    render(<AdminCuotasTab cuotas={mockCuotas} />);
    expect(screen.getByRole('button', { name: /^todas/i })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /^aprobadas/i })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^desaprobadas/i })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^pendientes/i })).toHaveTextContent('1');
  });

  it('debería filtrar exclusivamente cuotas aprobadas al seleccionar la pestaña Aprobadas', () => {
    render(<AdminCuotasTab cuotas={mockCuotas} />);
    fireEvent.click(screen.getByRole('button', { name: /^aprobadas/i }));
    expect(screen.getAllByText(/Ana Suarez/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Roberto Diaz/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lucia Mendez/i)).not.toBeInTheDocument();
  });

  it('debería filtrar exclusivamente cuotas desaprobadas al seleccionar la pestaña Desaprobadas', () => {
    render(<AdminCuotasTab cuotas={mockCuotas} />);
    fireEvent.click(screen.getByRole('button', { name: /^desaprobadas/i }));
    expect(screen.getAllByText(/Roberto Diaz/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ana Suarez/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lucia Mendez/i)).not.toBeInTheDocument();
  });
});
