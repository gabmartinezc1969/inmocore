// Shared pressed-state feedback for Pressable components. A lot of tappable
// rows/buttons across the app had no visual response to a finger going
// down (no opacity dip, no highlight) — the state only ever changed once
// the tap's onPress effect landed, which reads as unresponsive on a real
// device. MenuRow/Button already did this per-instance; this makes it a
// one-liner everywhere else so it stays consistent.
export const pressedStyle = (pressed: boolean, opacity = 0.65) => ({ opacity: pressed ? opacity : 1 });
