import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";
import type { FlowId } from "./flows";
import type { ScreenId } from "../navigation/types";

type IonName = ComponentProps<typeof Ionicons>["name"];

export type ServiceWash = "purple" | "blue" | "green" | "yellow";

export type ServiceItem = {
  icon: IonName;
  label: string;
  /** Short visible caption under the tile */
  hint: string;
  /** Outcome announced after the label when VoiceOver/TalkBack hints are on */
  actionHint: string;
  /** Soft wash used on tiles / featured chips */
  wash: ServiceWash;
} & (
  | { flow: FlowId; screen?: undefined }
  | { screen: ScreenId; flow?: undefined }
  | { flow?: undefined; screen?: undefined }
);

export const SERVICES: ServiceItem[] = [
  {
    icon: "paper-plane",
    label: "Send Money",
    hint: "Say who and how much",
    actionHint: "Starts a voice transfer",
    wash: "purple",
    flow: "transfer",
  },
  {
    icon: "storefront-outline",
    label: "Receive Payment",
    hint: "QR and loudspeaker",
    actionHint: "Opens shop payments with speaker alerts",
    wash: "blue",
    screen: "merchant-receive",
  },
  {
    icon: "phone-portrait",
    label: "Buy Airtime",
    hint: "Say amount to top up",
    actionHint: "Starts a voice airtime top-up",
    wash: "green",
    flow: "airtime",
  },
  {
    icon: "wallet-outline",
    label: "Check balance",
    hint: "Ask Aya out loud",
    actionHint: "Starts a voice balance check",
    wash: "yellow",
    flow: "balance",
  },
  {
    icon: "wifi",
    label: "Data Bundle",
    hint: "Coming soon",
    actionHint: "This service is not available yet",
    wash: "blue",
  },
  {
    icon: "flash",
    label: "Electricity",
    hint: "Coming soon",
    actionHint: "This service is not available yet",
    wash: "yellow",
  },
];
