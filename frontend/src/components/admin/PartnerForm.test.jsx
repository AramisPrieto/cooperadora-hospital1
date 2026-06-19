import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import PartnerForm from './PartnerForm';

const mockPartner = {
  nombre: 'Juan',
  apellido: 'Perez',
  direccion: 'Calle 123',
  localidad: 'Necochea',
  nacionalidad: 'Argentina',
  telefono: '12345678',
  fecha_nacimiento: '1990-01-01',
  genero: 'masculino',
  metodo_pago: 'efectivo',
  fecha_ultimo_pago: '2026-01-01',
  observaciones: ''
};

describe('PartnerForm - UI Skills Standard', () => {
  it('debería renderizarse correctamente y poblar los campos', () => {
    render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Perez')).toBeInTheDocument();
  });

  it('debería cumplir con reglas WCAG', async () => {
    const { container } = render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
