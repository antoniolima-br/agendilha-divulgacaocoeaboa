import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InstitutionalCredits } from './InstitutionalCredits';

describe('institutional credits', () => {
  it('distinguishes the ecosystem owner from the technology agency', () => {
    render(<InstitutionalCredits />);
    expect(screen.getByText('Coé a Boa? — empresa proprietária do ecossistema e do aplicativo.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Limax Sistemas' })).toHaveAttribute('href', 'https://limaxsistemas.online/');
    expect(screen.getByText(/Lima X Soluções/)).toBeVisible();
  });
});