// ═══════════════════════════════════════════════════════
//  FieldPitchDiagram.js
//  Read-only top-down cricket field — responsive Phase 1 visuals.
// ═══════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, useWindowDimensions } from 'react-native';
import Svg, {
  Circle, Ellipse, Line, Rect, G, Defs, RadialGradient, Stop, ClipPath,
} from 'react-native-svg';
import { COLOURS, FONTS } from '../constants/theme';
import {
  DIAGRAM_VIEW_SIZE,
  FIELD_OVAL,
  PITCH_RECT,
  ROLE_MARKERS,
  WICKET_ENDS,
} from '../engine/fieldDiagramLayout';
import {
  buildResponsiveFieldDiagramDots,
  getResponsiveFieldLayout,
  inferFieldSetting,
  isTabletLayout,
} from '../engine/responsiveFieldLayout';
import { evaluatePressureContextFromMatch } from '../engine/pressureEngine';
import { FieldVisualFlash } from './FieldVisualFlash';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PITCH_TAN = '#B89A68';
const CREASE_LINE = 'rgba(255,255,255,0.7)';
const BOUNDARY_EDGE = 'rgba(169,138,36,0.55)';
const GRASS_INNER = '#2F7135';
const GRASS_MID = '#3F8F43';
const GRASS_OUTER = '#56A85A';
const INNER_RING = 'rgba(255,255,255,0.08)';
const FIELD_DOT_R = 2.85;
const ROLE_STROKE = 'rgba(26,26,26,0.65)';
const FIELD_ANIM_MS = 280;

const MowStripes = () => (
  <G opacity={0.21}>
    {Array.from({ length: 18 }, (_, i) => (
      <Rect
        key={`mow-${i}`}
        x={i * 6}
        y={0}
        width={3}
        height={100}
        fill={i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
      />
    ))}
  </G>
);

const Stumps = ({ cx, cy }) => (
  <G>
    <Line x1={cx - 2.2} y1={cy - 2.5} x2={cx - 2.2} y2={cy + 2.5} stroke="rgba(245,240,232,0.75)" strokeWidth={0.55} />
    <Line x1={cx} y1={cy - 2.8} x2={cx} y2={cy + 2.8} stroke="rgba(245,240,232,0.9)" strokeWidth={0.6} />
    <Line x1={cx + 2.2} y1={cy - 2.5} x2={cx + 2.2} y2={cy + 2.5} stroke="rgba(245,240,232,0.75)" strokeWidth={0.55} />
  </G>
);

const useFieldDotAnimations = (fieldDots) => {
  const animsRef = useRef(new Map());

  fieldDots.forEach((dot) => {
    const key = `${dot.zone}-${dot.slotIndex}`;
    if (!animsRef.current.has(key)) {
      animsRef.current.set(key, {
        cx: new Animated.Value(dot.x),
        cy: new Animated.Value(dot.y),
        opacity: new Animated.Value(dot.visible ? 1 : 0),
      });
    }
  });

  useEffect(() => {
    fieldDots.forEach((dot) => {
      const key = `${dot.zone}-${dot.slotIndex}`;
      const anim = animsRef.current.get(key);
      if (!anim) return;
      Animated.parallel([
        Animated.timing(anim.cx, { toValue: dot.x, duration: FIELD_ANIM_MS, useNativeDriver: false }),
        Animated.timing(anim.cy, { toValue: dot.y, duration: FIELD_ANIM_MS, useNativeDriver: false }),
        Animated.timing(anim.opacity, {
          toValue: dot.visible ? 1 : 0,
          duration: FIELD_ANIM_MS - 40,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [fieldDots]);

  return animsRef;
};

const useRoleAnimations = (roleMarkers) => {
  const keeperCx = useRef(new Animated.Value(roleMarkers.keeper.x)).current;
  const keeperCy = useRef(new Animated.Value(roleMarkers.keeper.y)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(keeperCx, { toValue: roleMarkers.keeper.x, duration: FIELD_ANIM_MS, useNativeDriver: false }),
      Animated.timing(keeperCy, { toValue: roleMarkers.keeper.y, duration: FIELD_ANIM_MS, useNativeDriver: false }),
    ]).start();
  }, [roleMarkers.keeper.x, roleMarkers.keeper.y, keeperCx, keeperCy]);

  return { keeperCx, keeperCy };
};

/**
 * Build a presentation-only visual event for the field diagram.
 * @param {object|null} outcome — last delivery outcome
 * @param {string|number} deliveryId — stable per-ball id (e.g. `${innings}-${balls}`)
 */
export const buildFieldVisualEvent = (outcome, deliveryId) => {
  if (!outcome || deliveryId == null) return null;
  const runs = outcome.runs ?? 0;
  // Runs only — avoids flashing on saved fours (type may stay 'four' but runs become 2).
  if (runs === 6) {
    return { type: 'boundary', value: 6, id: String(deliveryId) };
  }
  if (runs === 4) {
    return { type: 'boundary', value: 4, id: String(deliveryId) };
  }
  return null;
};

export const FieldPitchDiagram = ({
  field,
  fill = false,
  showRoles = true,
  showTitle = false,
  visualEvent = null,
  bowlingType = null,
  gamePhase = null,
  pressureState: pressureStateProp = null,
  fieldSetting: fieldSettingProp = null,
  style,
}) => {
  const { width, height } = useWindowDimensions();

  const layout = useMemo(() => getResponsiveFieldLayout({
    width,
    height,
    platform: Platform.OS,
    fieldSetting: fieldSettingProp || inferFieldSetting(field),
    bowlingType,
    pressureState: pressureStateProp,
    field,
    gamePhase,
  }), [width, height, fieldSettingProp, field, bowlingType, pressureStateProp, gamePhase]);

  const fieldDots = useMemo(
    () => buildResponsiveFieldDiagramDots(field, layout),
    [field, layout],
  );

  const dotAnimsRef = useFieldDotAnimations(fieldDots);
  const { keeperCx, keeperCy } = useRoleAnimations(layout.roleMarkers);

  const settingLabel = layout.fieldSetting?.toUpperCase() || 'BALANCED';
  const isTablet = isTabletLayout(width, height);

  return (
    <View style={[styles.wrap, fill && styles.wrapFill, style]} accessibilityLabel="Field placement map">
      {showTitle && (
        <View style={[styles.labelRow, isTablet && styles.labelRowTablet]}>
          <Text style={[styles.labelPrefix, isTablet && styles.labelTextTablet]}>FIELD</Text>
          <Text style={[styles.labelSep, isTablet && styles.labelTextTablet]}>•</Text>
          <Text style={[styles.labelSetting, isTablet && styles.labelTextTablet]}>{settingLabel}</Text>
        </View>
      )}
      <View style={styles.svgSlot}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${DIAGRAM_VIEW_SIZE} ${DIAGRAM_VIEW_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <RadialGradient
              id="grassGrad"
              gradientUnits="userSpaceOnUse"
              cx={FIELD_OVAL.cx}
              cy={FIELD_OVAL.cy}
              rx={FIELD_OVAL.rx}
              ry={FIELD_OVAL.ry}
              fx={FIELD_OVAL.cx}
              fy={FIELD_OVAL.cy}
            >
              <Stop offset="0" stopColor={GRASS_INNER} />
              <Stop offset="0.55" stopColor={GRASS_MID} />
              <Stop offset="1" stopColor={GRASS_OUTER} />
            </RadialGradient>
            <ClipPath id="ovalClip">
              <Ellipse
                cx={FIELD_OVAL.cx}
                cy={FIELD_OVAL.cy}
                rx={FIELD_OVAL.rx}
                ry={FIELD_OVAL.ry}
              />
            </ClipPath>
          </Defs>

          <Ellipse
            cx={FIELD_OVAL.cx}
            cy={FIELD_OVAL.cy}
            rx={FIELD_OVAL.rx}
            ry={FIELD_OVAL.ry}
            fill="url(#grassGrad)"
            stroke={BOUNDARY_EDGE}
            strokeWidth={0.65}
          />

          <G clipPath="url(#ovalClip)">
            <MowStripes />
          </G>

          <Circle
            cx={50}
            cy={50}
            r={28}
            fill="none"
            stroke={INNER_RING}
            strokeWidth={0.45}
            strokeDasharray="2 2"
          />

          <Rect
            x={PITCH_RECT.x}
            y={PITCH_RECT.y}
            width={PITCH_RECT.width}
            height={PITCH_RECT.height}
            rx={0.6}
            fill={PITCH_TAN}
          />

          <Line
            x1={PITCH_RECT.x - 2}
            y1={PITCH_RECT.y + 2}
            x2={PITCH_RECT.x + PITCH_RECT.width + 2}
            y2={PITCH_RECT.y + 2}
            stroke={CREASE_LINE}
            strokeWidth={0.55}
          />
          <Line
            x1={PITCH_RECT.x - 2}
            y1={PITCH_RECT.y + PITCH_RECT.height - 2}
            x2={PITCH_RECT.x + PITCH_RECT.width + 2}
            y2={PITCH_RECT.y + PITCH_RECT.height - 2}
            stroke={CREASE_LINE}
            strokeWidth={0.55}
          />

          <Stumps cx={WICKET_ENDS.striker.x} cy={WICKET_ENDS.striker.y} />
          <Stumps cx={WICKET_ENDS.bowler.x} cy={WICKET_ENDS.bowler.y} />

          <G clipPath="url(#ovalClip)">
            {fieldDots.map((dot) => {
              const key = `${dot.zone}-${dot.slotIndex}`;
              const anim = dotAnimsRef.current.get(key);
              if (!anim) return null;
              return (
                <AnimatedCircle
                  key={key}
                  cx={anim.cx}
                  cy={anim.cy}
                  r={FIELD_DOT_R}
                  fill="rgba(245,240,232,0.95)"
                  stroke={COLOURS.slateMid}
                  strokeWidth={0.45}
                  opacity={anim.opacity}
                />
              );
            })}
          </G>

          {showRoles && (
            <G>
              <Circle
                cx={layout.roleMarkers.batter.x}
                cy={layout.roleMarkers.batter.y}
                r={ROLE_MARKERS.batter.r}
                fill={COLOURS.runs2}
                stroke={ROLE_STROKE}
                strokeWidth={0.45}
              />
              <AnimatedCircle
                cx={keeperCx}
                cy={keeperCy}
                r={ROLE_MARKERS.keeper.r}
                fill={COLOURS.gold}
                stroke={ROLE_STROKE}
                strokeWidth={0.45}
              />
              <Circle
                cx={layout.roleMarkers.bowler.x}
                cy={layout.roleMarkers.bowler.y}
                r={ROLE_MARKERS.bowler.r}
                fill={COLOURS.boundary}
                stroke={ROLE_STROKE}
                strokeWidth={0.45}
              />
            </G>
          )}
        </Svg>
        <FieldVisualFlash visualEvent={visualEvent} />
      </View>
    </View>
  );
};

/** Safe pressure read for field visuals only (innings-2 chase). */
export const getFieldVisualPressureState = (matchState) => {
  if (!matchState || matchState.innings !== 2 || !matchState.target) return null;
  try {
    return evaluatePressureContextFromMatch(matchState).pressureState ?? null;
  } catch {
    return null;
  }
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  wrapFill: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  labelRow: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingBottom: 2,
  },
  labelRowTablet: {
    height: 24,
    paddingBottom: 3,
  },
  labelPrefix: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLOURS.dot,
    letterSpacing: 1.4,
  },
  labelSep: {
    marginHorizontal: 5,
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: 'rgba(245,240,232,0.5)',
    letterSpacing: 1,
  },
  labelSetting: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLOURS.cream,
    letterSpacing: 2,
  },
  labelTextTablet: {
    fontSize: 9,
  },
  svgSlot: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
});
