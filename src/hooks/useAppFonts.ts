import { useFonts } from "expo-font";
import { fontAssets } from "../theme";

export function useAppFonts() {
  return useFonts(fontAssets);
}
