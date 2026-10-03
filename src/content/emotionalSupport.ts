import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

type IonName = ComponentProps<typeof Ionicons>["name"];

export const COMFORT_TITLE = "You're not alone";

export const COMFORT_LINES: { icon: IonName; text: string }[] = [
  { icon: "heart-outline", text: "This happens to many people. It is not your fault." },
  { icon: "time-outline", text: "There is no rush. We'll go one step at a time." },
  { icon: "shield-checkmark-outline", text: "Your money and your case are safe with us." },
];

export const BREATHING_STEPS = ["Breathe in for 4", "Hold for 4", "Breathe out for 4"] as const;

export const COMFORT_REACH_OUT: { icon: IonName; title: string; detail: string }[] = [
  { icon: "person-outline", title: "Talk to a person", detail: "Someone from Aya calls you back in your language." },
  { icon: "people-outline", title: "Call someone you trust", detail: "A family member or friend can stay with you." },
  { icon: "call-outline", title: "MTN customer care", detail: "Dial 100. It's free." },
];

export const COMFORT_SPOKEN =
  "You're not alone. This happens to many people, and it is not your fault. There is no rush. Let's take a slow breath together. Breathe in for 4, hold for 4, and breathe out for 4.";
