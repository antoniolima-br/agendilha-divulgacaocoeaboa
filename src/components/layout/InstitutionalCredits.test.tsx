import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InstitutionalCredits } from './InstitutionalCredits';

describe('institutional credits', () => {
  it('shows a single creator credit with the branded X', () => {
    render(<InstitutionalCredits />);
    expect(screen.getByRole('link', { name: 'LimaX Soluções' })).toHaveAttribute('href', 'https://limaxsistemas.online/');
    expect(screen.getByText('X')).toHaveClass('limax-brand-x');
    expect(screen.getByText(/Criado por/)).toHaveTextContent('Criado por LimaX Soluções');
    expect(screen.queryByText(/empresa proprietária|Tecnologia/)).not.toBeInTheDocument();
  });
});