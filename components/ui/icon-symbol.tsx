// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "person.2.fill": "group",
  "shuffle": "shuffle",
  "clock.fill": "history",
  "trophy.fill": "emoji-events",
  "plus": "add",
  "minus": "remove",
  "pencil": "edit",
  "trash": "delete",
  "xmark": "close",
  "checkmark": "check",
  "magnifyingglass": "search",
  "arrow.left": "arrow-back",
  "star.fill": "star",
  "sportscourt.fill": "sports-soccer",
  "person.fill": "person",
  "calendar": "calendar-today",
  "chart.bar.fill": "bar-chart",
  "arrow.counterclockwise": "undo",
  "flag.fill": "flag",
  "timer": "timer",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "ellipsis": "more-horiz",
  "info.circle": "info",
  "arrow.right.square": "logout",
  "gear": "settings",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
