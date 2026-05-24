// ─────────────────────────────────────────
//  FieldVisualFlash.js
//  Presentation-only field visual events (compact pitch).
//  Extensible: boundary today; catch / stumping / run-out later.
// ─────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { COLOURS } from '../constants/theme';
import { FIELD_OVAL, DIAGRAM_VIEW_SIZE } from '../engine/fieldDiagramLayout';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

/** Matches FOUR headline colour (`getOutcomeColour` / `COLOURS.boundary`). */
const FOUR_STROKE = COLOURS.boundary;

/** Outer-oval pulse profiles (viewBox stroke opacity). */
const BOUNDARY_PROFILES = {
  4: {
    stroke: FOUR_STROKE,
    strokeWidth: 2.85,
    rx: FIELD_OVAL.rx + 1.2,
    ry: FIELD_OVAL.ry + 1.2,
    peak: 0.48,
    pulseMs: 500,
  },
  6: {
    stroke: COLOURS.red,
    strokeWidth: 3.25,
    rx: FIELD_OVAL.rx + 2.2,
    ry: FIELD_OVAL.ry + 2.2,
    peak: 0.64,
    pulseMs: 500,
  },
};

const PULSE_COUNT = 3;
const PULSE_GAP_MS = 28;

const fadePulse = (opacity, peak, pulseMs) => {
  const rise = Math.round(pulseMs * 0.32);
  const fall = pulseMs - rise;
  return Animated.sequence([
    Animated.timing(opacity, {
      toValue: peak,
      duration: rise,
      useNativeDriver: false,
    }),
    Animated.timing(opacity, {
      toValue: 0,
      duration: fall,
      useNativeDriver: false,
    }),
  ]);
};

/** Repeat pulse within totalMs (e.g. 300ms four, 400ms six). */
const buildMultiPulse = (opacity, peak, totalMs) => {
  const gapBudget = PULSE_GAP_MS * (PULSE_COUNT - 1);
  const pulseMs = Math.max(48, Math.round((totalMs - gapBudget) / PULSE_COUNT));
  const steps = [];
  for (let i = 0; i < PULSE_COUNT; i += 1) {
    steps.push(fadePulse(opacity, peak, pulseMs));
    if (i < PULSE_COUNT - 1) {
      steps.push(Animated.delay(PULSE_GAP_MS));
    }
  }
  return Animated.sequence(steps);
};

/** Stays mounted so delivery-id dedupe survives non-boundary balls. */
const BoundaryOvalFlash = ({ value, eventId }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const skipFirstRef = useRef(true);
  const lastIdRef = useRef(null);

  useEffect(() => {
    if (eventId == null || (value !== 4 && value !== 6)) return;

    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      lastIdRef.current = eventId;
      return;
    }
    if (lastIdRef.current === eventId) return;
    lastIdRef.current = eventId;

    const profile = BOUNDARY_PROFILES[value];
    if (!profile) return;

    opacity.stopAnimation();
    opacity.setValue(0);

    buildMultiPulse(opacity, profile.peak, profile.pulseMs).start();
  }, [eventId, value, opacity]);

  const profile = value === 4 || value === 6 ? BOUNDARY_PROFILES[value] : BOUNDARY_PROFILES[4];

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${DIAGRAM_VIEW_SIZE} ${DIAGRAM_VIEW_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      style={styles.layer}
      pointerEvents="none"
    >
      <AnimatedEllipse
        cx={FIELD_OVAL.cx}
        cy={FIELD_OVAL.cy}
        rx={profile.rx}
        ry={profile.ry}
        fill="none"
        stroke={profile.stroke}
        strokeWidth={profile.strokeWidth}
        opacity={opacity}
      />
    </Svg>
  );
};

/**
 * @param {{ type: string, value?: number, id?: string } | null} visualEvent
 */
export const FieldVisualFlash = ({ visualEvent }) => {
  const isBoundary =
    visualEvent?.type === 'boundary'
    && (visualEvent.value === 4 || visualEvent.value === 6);

  switch (visualEvent?.type) {
    case 'boundary':
      return (
        <BoundaryOvalFlash
          value={isBoundary ? visualEvent.value : null}
          eventId={isBoundary ? visualEvent.id : null}
        />
      );
    // Future: 'catch' | 'stumping' | 'saved_four' | 'run_out'
    default:
      return <BoundaryOvalFlash value={null} eventId={null} />;
  }
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    elevation: 6,
  },
});
