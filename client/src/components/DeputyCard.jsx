import Frame from './Frame';
import Button from './Button';
import { COLORS, SPACING, FONTS } from '../constants/theme';

/**
 * DeputyCard - Card de deputado com barra colorida, foto circular, informações e botões
 * Props:
 * - deputy: objeto { nome, partido, estado, nodeColor, ... }
 * - visible: se o card deve ser exibido
 * - onClose: callback ao fechar
 * - onPin: callback ao fixar
 * - onProfile: callback ao clicar em perfil
 */
export default function DeputyCard({
    deputy = null,
    visible = true,
    onClose,
    onPin,
    onProfile,
}) {
    if (!visible || !deputy) return null;

    const headerColor = deputy.nodeColor || COLORS.deputyHeaderGreen;

    const topOffset = `calc(52px + ${SPACING.frameGap} + ${SPACING.frameGap})`;

    const headerInfoStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `${SPACING.lg} ${SPACING.lg} ${SPACING.md}`,
    };

    const photoStyle = {
        width: '60px',
        height: '60px',
        borderRadius: SPACING.radiusRound,
        border: `3px solid ${headerColor}`,
        backgroundColor: COLORS.borderLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    };

    const photoPlaceholderStyle = {
        fontSize: FONTS.sizeSm,
        color: COLORS.textLight,
        textAlign: 'center',
    };

    const infoStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
    };

    const nameStyle = {
        fontSize: FONTS.sizeLg,
        fontWeight: FONTS.weightSemibold,
        color: COLORS.textDark,
    };

    const detailStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontSize: FONTS.sizeSm,
        color: COLORS.textMedium,
    };

    const badgeStyle = {
        backgroundColor: headerColor,
        color: COLORS.partyBadgeText,
        padding: `1px ${SPACING.sm}`,
        borderRadius: SPACING.radiusSm,
        fontSize: FONTS.sizeXs,
        fontWeight: FONTS.weightSemibold,
    };

    const buttonsStyle = {
        display: 'flex',
        gap: SPACING.md,
        padding: `${SPACING.md} ${SPACING.lg} ${SPACING.lg}`,
        marginTop: 'auto',
    };

    const pinIcon = (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1v4M4 5h6l-1 4H5L4 5zM5 9l-1 4M9 9l1 4" />
        </svg>
    );

    const profileIcon = (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="5" r="3" />
            <path d="M2 13c0-3 2.5-5 5-5s5 2 5 5" />
        </svg>
    );

    return (
        <Frame
            width="220px"
            height="auto"
            position={{
                top: topOffset,
                left: SPACING.frameGap,
            }}
            showClose={true}
            headerColor={headerColor}
            onClose={onClose}
            title=""
        >
            <div style={headerInfoStyle}>
                {deputy.url_foto || deputy.urlFoto ? (
                    <img src={deputy.url_foto || deputy.urlFoto} alt={deputy.nome} style={photoStyle} />
                ) : (
                    <div style={photoStyle}>
                        <span style={photoPlaceholderStyle}>Foto</span>
                    </div>
                )}
                <div style={infoStyle}>
                    <span style={nameStyle}>{deputy.nome}</span>
                    <div style={detailStyle}>
                        <span style={badgeStyle}>{deputy.sigla_partido || deputy.partido}</span>
                        <span>•</span>
                        <span>{deputy.sigla_uf || deputy.estado}</span>
                    </div>
                </div>
            </div>

            <div style={buttonsStyle}>
                <Button variant="outline" icon={pinIcon} onClick={onPin} style={{ flex: 1, fontSize: FONTS.sizeSm, padding: `${SPACING.sm} ${SPACING.md}` }}>
                    Fixar
                </Button>
                <Button variant="outline" icon={profileIcon} onClick={onProfile} style={{ flex: 1, fontSize: FONTS.sizeSm, padding: `${SPACING.sm} ${SPACING.md}` }}>
                    Perfil
                </Button>
            </div>
        </Frame>
    );
}
