import { useState } from 'react';
import { COLORS, SPACING, FONTS } from '../constants/theme';

/**
 * PanelSection - Seção colapsável para uso dentro de painéis (ex: FiltersPanel)
 * Props:
 * - icon: ReactNode (ícone SVG à esquerda do título)
 * - title: string (título da seção)
 * - defaultExpanded: boolean (default: false)
 * - children: conteúdo exibido quando expandido
 */
export default function PanelSection({
    icon,
    title,
    defaultExpanded = false,
    children,
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggle = () => setExpanded((prev) => !prev);

    const sectionStyle = {
        borderTop: `1px solid ${COLORS.borderLight}`,
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACING.md} ${SPACING.lg}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.15s',
    };

    const leftStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
    };

    const titleStyle = {
        fontSize: FONTS.sizeMd,
        fontWeight: FONTS.weightMedium,
        color: COLORS.textDark,
    };

    const iconContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textMedium,
        flexShrink: 0,
    };

    const chevronStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textMedium,
        transition: 'transform 0.25s ease',
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
    };

    const contentStyle = {
        overflow: 'hidden',
        maxHeight: expanded ? '500px' : '0px',
        opacity: expanded ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.25s ease',
        padding: expanded ? `0 ${SPACING.lg} ${SPACING.md} ${SPACING.lg}` : `0 ${SPACING.lg}`,
    };

    // Chevron arrow (>) que gira para baixo (v) quando expandido
    const chevronArrow = (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2L8.5 6L4.5 10" />
        </svg>
    );

    return (
        <div style={sectionStyle}>
            <div
                style={headerStyle}
                onClick={toggle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    }
                }}
            >
                <div style={leftStyle}>
                    {icon && <span style={iconContainerStyle}>{icon}</span>}
                    <span style={titleStyle}>{title}</span>
                </div>
                <span style={chevronStyle}>{chevronArrow}</span>
            </div>
            <div style={contentStyle}>
                {children}
            </div>
        </div>
    );
}
