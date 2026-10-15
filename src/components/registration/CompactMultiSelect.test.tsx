import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompactMultiSelect } from './CompactMultiSelect';

function Preferences() {
  const [values, setValues] = useState<string[]>([]);
  return <><CompactMultiSelect id="choices" label="Preferências" values={values} onChange={setValues} placeholder="Escolher" exclusiveValue="all" groups={[{ label: 'Opções', options: [
    { value: 'all', label: 'Todas as Regiões' },
    { value: 'neighborhood:Olaria', label: 'Olaria' },
    { value: 'Samba', label: 'Samba' },
  ] }]} /><output aria-label="Preferências atuais">{JSON.stringify(values)}</output></>;
}

describe('immediate preference selection', () => {
  it('keeps consecutive selections and removes a choice without closing or blurring', () => {
    render(<Preferences />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Preferências' }));
    fireEvent.click(screen.getByRole('option', { name: 'Olaria' }));
    expect(screen.getByLabelText('Preferências atuais')).toHaveTextContent('["neighborhood:Olaria"]');
    fireEvent.click(screen.getByRole('option', { name: 'Samba' }));
    expect(screen.getByLabelText('Preferências atuais')).toHaveTextContent('["neighborhood:Olaria","Samba"]');
    fireEvent.click(screen.getByRole('option', { name: 'Olaria' }));
    expect(screen.getByLabelText('Preferências atuais')).toHaveTextContent('["Samba"]');
  });

  it('replaces individual choices with all regions and restores specific targeting on the next choice', () => {
    render(<Preferences />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Preferências' }));
    fireEvent.click(screen.getByRole('option', { name: 'Olaria' }));
    fireEvent.click(screen.getByRole('option', { name: 'Todas as Regiões' }));
    expect(screen.getByLabelText('Preferências atuais')).toHaveTextContent('["all"]');
    fireEvent.click(screen.getByRole('option', { name: 'Olaria' }));
    expect(screen.getByLabelText('Preferências atuais')).toHaveTextContent('["neighborhood:Olaria"]');
  });
});