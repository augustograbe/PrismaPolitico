import { useState } from 'react';
import Frame from './Frame';
import Checkbox from './Checkbox';
import RangeSlider from './RangeSlider';
import Button from './Button';
import { COLORS, SPACING } from '../constants/theme';

/**
 * ListFiltersPanel - Painel de filtros para a página Lista
 * Props:
 * - onApply: callback (filters)
 * - isMinimized / onToggleMinimize
 */
export default function ListFiltersPanel({ onApply, isMinimized, onToggleMinimize }) {
    const [onlyActive, setOnlyActive] = useState(true);
    const [presence, setPresence] = useState({ min: 0, max: 100 });

    const filterIcon = (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={COLORS.orange} strokeWidth="1.5">
            <path d="M1 2h14L9.5 8.5V13L6.5 14.5V8.5L1 2z" />
        </svg>
    );

    const handleApply = () => {
        if (onApply) {
            onApply({ onlyActive, presence });
        }
    };

    return (
        <Frame
            width="250px"
            height="auto"
            position={{ position: 'relative' }}
            style={{ flex: isMinimized ? '0 0 auto' : '0 1 auto', minHeight: 0 }}
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                    {filterIcon} Filtros
                </span>
            }
            showMinimize={true}
            isMinimized={isMinimized}
            onToggleMinimize={onToggleMinimize}
        >
            <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
                <Checkbox
                    label="Apenas em exercício"
                    checked={onlyActive}
                    onChange={setOnlyActive}
                />

                <RangeSlider
                    label="Presença"
                    min={0}
                    max={100}
                    valueMin={presence.min}
                    valueMax={presence.max}
                    onChange={setPresence}
                />
            </div>

            <div style={{ padding: SPACING.lg, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="outline"
                    icon={filterIcon}
                    onClick={handleApply}
                >
                    Aplicar
                </Button>
            </div>
        </Frame>
    );
}
