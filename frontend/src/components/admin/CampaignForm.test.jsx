import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import CampaignForm from './CampaignForm';

describe('CampaignForm - UI Skills Standard', () => {
  it('debería renderizarse correctamente', () => {
    render(
      <BrowserRouter>
        <CampaignForm onSaved={() => {}} onCancel={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Nueva Campaña/i)).toBeInTheDocument();
  });

  it('debería cumplir con reglas WCAG', async () => {
    const { container } = render(
      <BrowserRouter>
        <CampaignForm onSaved={() => {}} onCancel={() => {}} />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
