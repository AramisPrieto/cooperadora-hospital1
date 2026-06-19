import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import NewsForm from './NewsForm';

describe('NewsForm - UI Skills Standard', () => {
  it('debería renderizarse correctamente', () => {
    render(
      <BrowserRouter>
        <NewsForm onSaved={() => {}} onCancel={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Nueva Noticia/i)).toBeInTheDocument();
  });

  it('debería cumplir con reglas WCAG', async () => {
    const { container } = render(
      <BrowserRouter>
        <NewsForm onSaved={() => {}} onCancel={() => {}} />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
