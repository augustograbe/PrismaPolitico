import Button from './Button';
import { COLORS, SPACING, FONTS, SHADOWS } from '../constants/theme';

/**
 * DeputyCard - Card de deputado com barra colorida, foto circular sobreposta, informações e botões
 * Props:
 * - deputy: objeto { nome, partido, estado, nodeColor, conexoes, presenca, maxConexoes, ... }
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
    const photoUrl = deputy.url_foto || deputy.urlFoto;
    const presenca = deputy.presenca !== undefined ? Number(deputy.presenca) : null;
    const conexoes = deputy.conexoes !== undefined ? deputy.conexoes : 0;
    const maxConexoes = deputy.maxConexoes || Math.max(conexoes, 1);

    const topOffset = `calc(52px + ${SPACING.frameGap} + ${SPACING.frameGap})`;

    const PHOTO_SIZE = 90;
    const HEADER_HEIGHT = 36;
    const PHOTO_OVERLAP = 28;

    // Outer wrapper — has NO overflow:hidden so photo can stick out
    const outerStyle = {
        position: 'fixed',
        top: topOffset,
        left: SPACING.frameGap,
        width: '280px',
        zIndex: 10,
    };

    // Card body — white box with rounded corners and shadow
    const cardStyle = {
        backgroundColor: COLORS.frameBg,
        borderRadius: SPACING.radiusLg,
        boxShadow: SHADOWS.frame,
        overflow: 'hidden',
    };

    // Colored header bar
    const headerBarStyle = {
        height: `${HEADER_HEIGHT}px`,
        backgroundColor: headerColor,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: SPACING.md,
    };

    // Close button
    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: SPACING.xs,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textWhite,
        borderRadius: SPACING.radiusSm,
    };

    // Photo circle — positioned relative to the outer wrapper, overlapping the header
    const photoWrapperStyle = {
        position: 'absolute',
        top: `${HEADER_HEIGHT - PHOTO_OVERLAP}px`,
        left: SPACING.lg,
        width: `${PHOTO_SIZE}px`,
        height: `${PHOTO_SIZE}px`,
        borderRadius: '50%',
        border: `3px solid ${headerColor}`,
        backgroundColor: COLORS.borderLight,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    };

    const photoImgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top',
    };

    const photoPlaceholderStyle = {
        fontSize: FONTS.sizeMd,
        color: COLORS.textLight,
        textAlign: 'center',
    };

    // Body area below header — needs padding-top to make room for the photo
    const bodyPaddingTop = PHOTO_SIZE - PHOTO_OVERLAP + 8;

    const bodyStyle = {
        paddingTop: `${bodyPaddingTop}px`,
        paddingLeft: SPACING.lg,
        paddingRight: SPACING.lg,
        paddingBottom: SPACING.md,
    };

    // Name and party info — next to the photo
    const infoBlockStyle = {
        marginLeft: `${PHOTO_SIZE + 12}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        minHeight: `${PHOTO_SIZE - PHOTO_OVERLAP - 4}px`,
        justifyContent: 'center',
        marginTop: `-${bodyPaddingTop - 8}px`,
    };

    const nameStyle = {
        fontSize: FONTS.sizeLg,
        fontWeight: FONTS.weightSemibold,
        color: COLORS.textDark,
        lineHeight: 1.2,
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

    // Stats section
    const statsStyle = {
        padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.md}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
    };

    const statRowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
    };

    const statLabelStyle = {
        fontSize: FONTS.sizeSm,
        color: COLORS.textDark,
        fontWeight: FONTS.weightMedium,
        whiteSpace: 'nowrap',
    };

    // Progress bar background
    const progressTrackStyle = {
        flex: 1,
        height: '14px',
        backgroundColor: COLORS.sliderTrack,
        borderRadius: '7px',
        overflow: 'hidden',
    };

    // Progress bar fill
    const progressFillStyle = (percent, color) => ({
        height: '100%',
        width: `${Math.min(100, Math.max(0, percent))}%`,
        backgroundColor: color,
        borderRadius: '7px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'width 0.4s ease',
        flexShrink: 0,
    });

    const progressTextStyle = {
        fontSize: '10px',
        fontWeight: FONTS.weightSemibold,
        color: COLORS.white,
        lineHeight: 1,
    };

    // Buttons
    const buttonsStyle = {
        display: 'flex',
        gap: SPACING.md,
        padding: `${SPACING.xs} ${SPACING.lg} ${SPACING.lg}`,
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

    const conexoesPercent = maxConexoes > 0 ? (conexoes / maxConexoes) * 100 : 0;

    return (
        <div style={outerStyle}>
            {/* Photo — sits ABOVE the card, overlapping the header */}
            <div style={photoWrapperStyle}>
                {photoUrl ? (
                    <img src={photoUrl} alt={deputy.nome} style={photoImgStyle} />
                ) : (
                    <span style={photoPlaceholderStyle}>Foto</span>
                )}
            </div>

            {/* Card body */}
            <div style={cardStyle}>
                {/* Colored header bar */}
                <div style={headerBarStyle}>
                    <button
                        onClick={onClose}
                        style={closeButtonStyle}
                        title="Fechar"
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.15)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 1L11 11M11 1L1 11" />
                        </svg>
                    </button>
                </div>

                {/* Body with name/info */}
                <div style={bodyStyle}>
                    <div style={infoBlockStyle}>
                        <span style={nameStyle}>{deputy.nome}</span>
                        <div style={detailStyle}>
                            <span style={badgeStyle}>{deputy.sigla_partido || deputy.partido}</span>
                            <span>•</span>
                            <span>{deputy.sigla_uf || deputy.estado}</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={statsStyle}>
                    {/* Conexões — label + bar inline */}
                    <div style={statRowStyle}>
                        <span style={statLabelStyle}>{conexoes} conexões</span>
                        <div style={progressTrackStyle}>
                            <div style={progressFillStyle(conexoesPercent, COLORS.orange)} />
                        </div>
                    </div>

                    {/* Presença */}
                    {presenca !== null && (
                        <div style={statRowStyle}>
                            <span style={statLabelStyle}>Presença:</span>
                            <div style={{ ...progressTrackStyle, display: 'flex', alignItems: 'center' }}>
                                <div style={progressFillStyle(presenca, COLORS.orange)}>
                                    {presenca >= 20 && (
                                        <span style={progressTextStyle}>{presenca}%</span>
                                    )}
                                </div>
                                {presenca < 20 && (
                                    <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: FONTS.weightSemibold, 
                                        color: COLORS.textMedium,
                                        marginLeft: '6px'
                                    }}>
                                        {presenca}%
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div style={buttonsStyle}>
                    <Button variant="outline" icon={pinIcon} onClick={onPin} style={{ flex: 1, fontSize: FONTS.sizeSm, padding: `${SPACING.sm} ${SPACING.md}` }}>
                        Fixar
                    </Button>
                    <Button variant="outline" icon={profileIcon} onClick={onProfile} style={{ flex: 1, fontSize: FONTS.sizeSm, padding: `${SPACING.sm} ${SPACING.md}` }}>
                        Perfil
                    </Button>
                </div>
            </div>
        </div>
    );
}
