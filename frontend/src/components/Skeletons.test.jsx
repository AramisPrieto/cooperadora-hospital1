import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import {
  NewsSkeleton,
  CampaignSkeleton,
  CampaignSearchSkeleton,
  NewsSearchSkeleton,
} from './Skeletons';

describe('Skeletons - UI Skills Standard', () => {
  describe('NewsSkeleton', () => {
    it('debería renderizarse correctamente y cumplir con reglas WCAG', async () => {
      const { container } = render(<NewsSkeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CampaignSkeleton', () => {
    it('debería renderizarse correctamente y cumplir con reglas WCAG', async () => {
      const { container } = render(<CampaignSkeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CampaignSearchSkeleton', () => {
    it('debería renderizarse correctamente y cumplir con reglas WCAG', async () => {
      const { container } = render(<CampaignSearchSkeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('NewsSearchSkeleton', () => {
    it('debería renderizarse correctamente y cumplir con reglas WCAG', async () => {
      const { container } = render(<NewsSearchSkeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
