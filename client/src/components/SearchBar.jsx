import { COLORS, SPACING, FONTS } from '../constants/theme';

/**
 * SearchBar - Barra de pesquisa
 * Props:
 * - placeholder: texto placeholder
 * - value: valor controlado
 * - onChange: callback de mudança
 * - style: estilos adicionais
 */
export default function SearchBar({
    placeholder = 'Pesquisar...',
    value,
    onChange,
    style = {},
}) {
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: SPACING.radiusMd,
        padding: `${SPACING.sm} ${SPACING.md}`,
        gap: SPACING.sm,
        width: '100%',
        ...style,
    };

    const inputStyle = {
        border: 'none',
        outline: 'none',
        flex: 1,
        fontSize: FONTS.sizeMd,
        fontFamily: FONTS.family,
        color: COLORS.textDark,
        backgroundColor: 'transparent',
    };

    return (
        <div style={containerStyle}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={inputStyle}
            />
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke={COLORS.textLight}
                strokeWidth="2"
            >
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11L15 15" />
            </svg>
        </div>
    );
}
