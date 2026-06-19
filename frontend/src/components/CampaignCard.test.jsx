import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import CampaignCard from './CampaignCard';

const mockCampaign = {
  id: 1,
  titulo: 'Monitores para Terapia Intensiva',
  monto_objetivo: 5000000,
  monto_actual: 2500000,
  fecha_limite: '2026-12-31',
  detalles: {
    equipamiento_imagen: 'https://via.placeholder.com/300'
  }
};

describe('CampaignCard - UI Skills Standard', () => {
  it('debería renderizarse correctamente y mostrar información clave', () => {
    render(<CampaignCard campaign={mockCampaign} onClickDetail={() => {}} />);
    expect(screen.getByText('Monitores para Terapia Intensiva')).toBeInTheDocument();
    expect(screen.getByText('Terapia Intensiva')).toBeInTheDocument();
  });

  it('debería ejecutar onClickDetail al hacer clic en la tarjeta', async () => {
    const handleClick = vi.fn();
    render(<CampaignCard campaign={mockCampaign} onClickDetail={handleClick} />);
    
    // El elemento principal tiene el onClick
    const card = screen.getByText('Monitores para Terapia Intensiva').closest('.group');
    await userEvent.click(card);
    expect(handleClick).toHaveBeenCalledWith(1);
  });

  it('debería cumplir con las reglas de accesibilidad WCAG', async () => {
    const { container } = render(<CampaignCard campaign={mockCampaign} onClickDetail={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
