import { View, useWindowDimensions } from "react-native";
import { spacing, useColors, usePaletteStyles, type Palette } from "../../theme";

type PinDotsProps = {
  length: number;
  filled: number;
  error?: boolean;
};

const MAX_CELL_WIDTH = 56;
const ABSOLUTE_MIN_CELL_WIDTH = 24;

export default function PinDots({ length, filled, error = false }: PinDotsProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const styles = usePaletteStyles(createStyles);

  // Fewer, bigger boxes (4-digit PIN) can afford a roomier gap than a longer
  // OTP row — shrink the gap first so the boxes themselves stay as large as
  // possible while still guaranteeing the whole row fits on screen.
  const gap = length > 4 ? spacing.sm : spacing.md;
  const available = screenWidth - spacing.screenX * 2 - gap * (length - 1);
  const cellWidth = Math.min(
    MAX_CELL_WIDTH,
    Math.max(ABSOLUTE_MIN_CELL_WIDTH, Math.floor(available / length))
  );
  const cellHeight = Math.round(cellWidth * 1.15);
  const cellRadius = Math.round(cellWidth * 0.25);

  return (
    <View
      style={[styles.row, { gap }]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              { width: cellWidth, height: cellHeight, borderRadius: cellRadius },
              isFilled && { backgroundColor: error ? colors.danger : colors.purple },
              !isFilled && { borderColor: error ? colors.danger : colors.border },
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    row: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
    },
    cell: {
      borderWidth: 3,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
  };
}
