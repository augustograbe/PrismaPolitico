import Frame from '../Frame';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
// Frame import path is correct - Frame is in components/ and this is in components/layout/

/**
 * InfoFrame - Frame "O que estou vendo?" no canto inferior esquerdo
 */
export default function InfoFrame() {
    const contentStyle = {
        padding: `${SPACING.sm} ${SPACING.md}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
    };

    const iconStyle = {
        width: '22px',
        height: '22px',
        borderRadius: SPACING.radiusRound,
        border: `2px solid ${COLORS.textMedium}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };

    const textStyle = {
        fontSize: FONTS.sizeMd,
        color: COLORS.textDark,
        fontWeight: FONTS.weightMedium,
    };

    return (
        <Frame
            width="auto"
            height="auto"
            position={{
                bottom: SPACING.frameGap,
                left: SPACING.frameGap,
            }}
        >
            <div style={contentStyle}>
                <div style={iconStyle}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <text x="5" y="8" textAnchor="middle" fontSize="9" fontWeight="bold" fill={COLORS.textMedium}>?</text>
                    </svg>
                </div>
                <span style={textStyle}>O que estou vendo?</span>
            </div>
        </Frame>
    );
}
