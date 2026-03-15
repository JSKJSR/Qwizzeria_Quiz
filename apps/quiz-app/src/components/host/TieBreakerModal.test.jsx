import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TieBreakerModal from './TieBreakerModal';

describe('TieBreakerModal', () => {
  it('renders both team names', () => {
    render(<TieBreakerModal team1Name="Alpha" team2Name="Beta" onSelectWinner={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Tie Breaker')).toBeInTheDocument();
  });

  it('calls onSelectWinner(0) when first team clicked', () => {
    const onSelect = vi.fn();
    render(<TieBreakerModal team1Name="Alpha" team2Name="Beta" onSelectWinner={onSelect} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onSelectWinner(1) when second team clicked', () => {
    const onSelect = vi.fn();
    render(<TieBreakerModal team1Name="Alpha" team2Name="Beta" onSelectWinner={onSelect} />);
    fireEvent.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
