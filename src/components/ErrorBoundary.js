// ─────────────────────────────────────────
//  ErrorBoundary.js
//  Catches render errors and logs which
//  component caused the crash.
//  Temporary diagnostic tool.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log the exact component stack so we know which component crashed
    console.error('=== CRASH CAUGHT BY ERROR BOUNDARY ===');
    console.error('Name:', this.props.name || 'unknown');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', info.componentStack);
    console.error('=======================================');
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>RENDER ERROR</Text>
          <Text style={styles.section}>Component: {this.props.name || 'unknown'}</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <Text style={styles.hint}>Check Metro console for full stack trace</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null, info: null })}
          >
            <Text style={styles.btnText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOURS.red,
    margin:          SPACE.md,
    padding:         SPACE.lg,
    borderRadius:    4,
  },
  title: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    color:         COLOURS.white,
    letterSpacing: 3,
    marginBottom:  SPACE.sm,
  },
  section: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.white,
    marginBottom: SPACE.xs,
    opacity:      0.8,
  },
  message: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.white,
    marginBottom: SPACE.md,
  },
  hint: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.white,
    opacity:      0.6,
    marginBottom: SPACE.md,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding:         SPACE.sm,
    borderRadius:    3,
    alignItems:      'center',
  },
  btnText: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.white,
    letterSpacing: 2,
  },
});
