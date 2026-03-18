import { useState } from 'react';
import Frame from './Frame';
import Dropdown from './Dropdown';
import Checkbox from './Checkbox';
import RangeSlider from './RangeSlider';
import Button from './Button';
import { COLORS, SPACING } from '../constants/theme';

/**
 * FiltersPanel - Painel de filtros no canto superior direito
 * Props:
 * - onApply: callback (filters) ao clicar em Aplicar
 */
export default function FiltersPanel({ onApply }) {
    const [separateBy, setSeparateBy] = useState('partido');
    const [onlyActive, setOnlyActive] = useState(true);
    const [highlightPinned, setHighlightPinned] = useState(true);
    const [presence, setPresence] = useState({ min: 0, max: 100 });
    const [voteSimilarity, setVoteSimilarity] = useState({ min: 80, max: 100 });

    const separateOptions = [
        { value: 'partido', label: 'Partido' },
        { value: 'estado', label: 'Estado' },
        { value: 'sexo', label: 'Sexo' },
    ];

    const filterIcon = (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={COLORS.orange} strokeWidth="1.5">
            <path d="M1 2h14L9.5 8.5V13L6.5 14.5V8.5L1 2z" />
        </svg>
    );

    const topOffset = `calc(52px + ${SPACING.frameGap} + ${SPACING.frameGap})`;

    const contentStyle = {
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                separateBy,
                onlyActive,
                highlightPinned,
                presence,
                voteSimilarity,
            });
        }
    };

    return (
        <Frame
            width="250px"
            height="auto"
            position={{
                top: topOffset,
                right: SPACING.frameGap,
            }}
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                    {filterIcon} Filtros
                </span>
            }
            showMinimize={true}
        >
            <div style={contentStyle}>
                <Dropdown
                    label="Separar por"
                    options={separateOptions}
                    value={separateBy}
                    onChange={(e) => setSeparateBy(e.target.value)}
                />

                <Checkbox
                    label="Apenas em exercício"
                    checked={onlyActive}
                    onChange={setOnlyActive}
                />

                <Checkbox
                    label="Destacar Fixados"
                    checked={highlightPinned}
                    onChange={setHighlightPinned}
                />

                <RangeSlider
                    label="Presença"
                    min={0}
                    max={100}
                    valueMin={presence.min}
                    valueMax={presence.max}
                    onChange={setPresence}
                />

                <RangeSlider
                    label="Similaridade dos votos"
                    min={80}
                    max={100}
                    valueMin={voteSimilarity.min}
                    valueMax={voteSimilarity.max}
                    onChange={setVoteSimilarity}
                />

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: SPACING.sm }}>
                    <Button
                        variant="outline"
                        icon={filterIcon}
                        onClick={handleApply}
                    >
                        Aplicar
                    </Button>
                </div>
            </div>
        </Frame>
    );
}
