import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import FileUpload from './FileUpload';

describe('FileUpload - UI Skills Standard', () => {
  it('debería renderizarse en estado vacío por defecto', () => {
    render(<FileUpload onChange={() => {}} label="Sube tu archivo" />);
    expect(screen.getByText('Sube tu archivo')).toBeInTheDocument();
    expect(screen.getByText('Arrastrá o hacé click')).toBeInTheDocument();
  });

  it('debería mostrar la vista previa si se pasa un value', () => {
    render(<FileUpload onChange={() => {}} value="https://via.placeholder.com/150" />);
    const img = screen.getByAltText('Preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://via.placeholder.com/150');
  });

  it('debería cumplir con las reglas de accesibilidad WCAG', async () => {
    const { container } = render(<FileUpload onChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
