import Frame from './Frame';
import Dropdown from './Dropdown';
import { COLORS, SPACING } from '../constants/theme';

/**
 * RankingPanel - Painel de ordenação da lista (sempre visível, sem minimizar)
 * Props:
 * - sortBy: valor atual da ordenação
 * - onSortChange: callback (event)
 */
export default function RankingPanel({ sortBy = 'nome_asc', onSortChange }) {

    const rankingIcon = (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={COLORS.orange} strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 13V7" />
            <path d="M8 13V3" />
            <path d="M12 13V9" />
        </svg>
    );

    const sortOptions = [
        { value: 'nome_asc', label: 'Nome (A–Z)' },
        { value: 'nome_desc', label: 'Nome (Z–A)' },
        { value: 'partido_asc', label: 'Partido (A–Z)' },
        { value: 'estado_asc', label: 'Estado (A–Z)' },
        { value: 'presenca_desc', label: 'Presença (↓ maior)' },
        { value: 'presenca_asc', label: 'Presença (↑ menor)' },
    ];

    return (
        <Frame
            width="250px"
            height="auto"
            position={{ position: 'relative' }}
            style={{ flex: '0 0 auto' }}
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                    {rankingIcon} Ranking
                </span>
            }
        >
            <div style={{ padding: `0 ${SPACING.lg} ${SPACING.lg}` }}>
                <Dropdown
                    label="Ordenar por"
                    options={sortOptions}
                    value={sortBy}
                    onChange={onSortChange}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.sm }}
                />
            </div>
        </Frame>
    );
}
