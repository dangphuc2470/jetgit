export const GRAPH_COLORS = [
  '#a6823c', // Android Studio gold/ocher
  '#399478', // Android Studio teal
  '#4a67a8', // Android Studio indigo/blue
  '#4e8e52', // Android Studio green
  '#7d57a6', // Android Studio purple
  '#b36939', // Android Studio amber/brown
  '#327e99', // Android Studio cerulean/cyan
  '#9c4949', // Android Studio muted red
  '#857930', // Android Studio olive
  '#4f728c', // Android Studio slate
];

export function branchColor(index: number): string {
  return GRAPH_COLORS[index % GRAPH_COLORS.length];
}
