import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('debería filtrar números y caracteres inválidos en el campo nombre', () => {
    render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    const nombreInput = screen.getByLabelText(/nombre \*/i);
    fireEvent.change(nombreInput, { target: { value: 'Juan123 Carlos!@#' } });
    expect(nombreInput.value).toBe('Juan Carlos');
  });

  it('debería filtrar letras y caracteres inválidos en el campo teléfono', () => {
    render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    const telInput = screen.getByLabelText(/teléfono \*/i);
    fireEvent.change(telInput, { target: { value: '+54 (2262) 15-abc4567!' } });
    expect(telInput.value).toBe('+54 (2262) 15-4567');
  });

  it('debería sanitizar etiquetas HTML en observaciones', () => {
    render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    const obsInput = screen.getByLabelText(/observaciones/i);
    fireEvent.change(obsInput, { target: { value: 'Texto normal <script>alert("xss")</script> de prueba' } });
    expect(obsInput.value).toBe('Texto normal alert("xss") de prueba');
  });

  it('debería cumplir con reglas WCAG', async () => {
    const { container } = render(<PartnerForm partner={mockPartner} onSave={() => {}} onCancel={() => {}} submitting={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
