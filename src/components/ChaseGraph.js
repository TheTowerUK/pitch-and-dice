// ═══════════════════════════════════════════════════════
//  ChaseGraph.js — cumulative runs vs ball (broadcast-style)
// ═══════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Polyline,
  Line,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const DEFAULT_WIDTH = Math.min(Dimensions.get('window').width - SPACE.lg * 2, 360);
const CHART_HEIGHT = 168;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 22;
const PAD_B = 28;

/**
 * @param {Array<{ ball: number, runs: number, wickets: number }>|null|undefined} series1
 * @param {Array<{ ball: number, runs: number, wickets: number }>|null|undefined} series2
 * @param {number|null|undefined} target — chase target (runs to win), shown as horizontal guide
 * @param {number} maxBalls — innings length cap (format overs * 6)
 * @param {string} label1
 * @param {string} label2
 */
export const ChaseGraph = ({
  series1 = [],
  series2 = [],
  target = null,
  maxBalls = 120,
  label1 = '1st innings',
  label2 = '2nd innings',
  emptyHint = null,
}) => {
  const width = DEFAULT_WIDTH;
  const plotW = width - PAD_L - PAD_R;
  const plotH = CHART_HEIGHT - PAD_T - PAD_B;

  const { paths, wicketDots, targetY } = useMemo(() => {
    const s1 = Array.isArray(series1) ? series1 : [];
    const s2 = Array.isArray(series2) ? series2 : [];
    const maxRun = Math.max(
      1,
      target || 0,
      ...s1.map((p) => p.runs),
      ...s2.map((p) => p.runs),
    );
    const yCap = maxRun * 1.08;

    const xOf = (ball) => {
      const b = Math.max(0, Math.min(maxBalls, ball));
      return PAD_L + (b / maxBalls) * plotW;
    };
    const yOf = (runs) => PAD_T + plotH - (runs / yCap) * plotH;

    const linePoints = (arr) =>
      arr.length === 0
        ? ''
        : arr.map((p) => `${xOf(p.ball)},${yOf(p.runs)}`).join(' ');

    const wkts = [];
    const collectWickets = (arr) => {
      let prevW = 0;
      arr.forEach((p) => {
        if (p.wickets > prevW) {
          wkts.push({ cx: xOf(p.ball), cy: yOf(p.runs) });
        }
        prevW = p.wickets;
      });
    };
    collectWickets(s1);
    collectWickets(s2);

    const ty =
      target != null && target > 0 ? yOf(target) : null;

    return {
      paths: {
        p1: linePoints(s1),
        p2: linePoints(s2),
      },
      wicketDots: wkts,
      targetY: ty,
    };
  }, [series1, series2, target, maxBalls]);

  const s1 = Array.isArray(series1) ? series1 : [];
  const s2 = Array.isArray(series2) ? series2 : [];
  const hasData = s1.length > 0 || s2.length > 0;

  if (!hasData) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>CHASE GRAPH</Text>
        <Text style={styles.empty}>
          {emptyHint || 'Ball-by-ball chart appears after the first scoring deliveries.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>CHASE GRAPH</Text>
      <Text style={styles.sub}>Cumulative runs by ball</Text>

      <Svg width={width} height={CHART_HEIGHT}>
        <Line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={PAD_L + plotW}
          y2={PAD_T + plotH}
          stroke={COLOURS.dot}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        <Line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={PAD_T + plotH}
          stroke={COLOURS.dot}
          strokeOpacity={0.35}
          strokeWidth={1}
        />

        {targetY != null && (
          <G>
            <Line
              x1={PAD_L}
              y1={targetY}
              x2={PAD_L + plotW}
              y2={targetY}
              stroke={COLOURS.gold}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <SvgText
              x={PAD_L + plotW - 4}
              y={targetY - 4}
              fill={COLOURS.gold}
              fontSize={9}
              fontFamily={FONTS.mono}
              textAnchor="end"
            >
              TARGET {target}
            </SvgText>
          </G>
        )}

        {paths.p1.length > 0 && (
          <Polyline
            points={paths.p1}
            fill="none"
            stroke={COLOURS.runs1}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {paths.p2.length > 0 && (
          <Polyline
            points={paths.p2}
            fill="none"
            stroke={COLOURS.runs2}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {wicketDots.map((w, i) => (
          <Circle
            key={`w-${i}`}
            cx={w.cx}
            cy={w.cy}
            r={3}
            fill={COLOURS.wicket}
            stroke={COLOURS.ink}
            strokeWidth={1}
          />
        ))}

        <SvgText
          x={PAD_L + plotW}
          y={CHART_HEIGHT - 6}
          fill={COLOURS.dot}
          fontSize={9}
          fontFamily={FONTS.mono}
          textAnchor="end"
        >
          Ball →
        </SvgText>
        <SvgText
          x={4}
          y={PAD_T + 10}
          fill={COLOURS.dot}
          fontSize={9}
          fontFamily={FONTS.mono}
          textAnchor="start"
        >
          Runs
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: COLOURS.runs1 }]} />
          <Text style={styles.legendText} numberOfLines={1}>{label1}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: COLOURS.runs2 }]} />
          <Text style={styles.legendText} numberOfLines={1}>{label2}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.wicketKey, { backgroundColor: COLOURS.wicket }]} />
          <Text style={styles.legendText}>Wicket</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACE.lg,
    paddingBottom: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.gold,
    letterSpacing: 3,
    marginBottom: 2,
  },
  sub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLOURS.dot,
    letterSpacing: 1,
    marginBottom: SPACE.sm,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.md,
    marginTop: SPACE.sm,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginRight: SPACE.md },
  swatch: { width: 12, height: 3, marginRight: 6, borderRadius: 1, opacity: 0.72 },
  wicketKey: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLOURS.cream,
  },
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLOURS.dot,
    opacity: 0.68,
    maxWidth: 120,
  },
});
