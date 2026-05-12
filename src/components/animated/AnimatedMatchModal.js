import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SPACE } from '../../constants/theme';

export const AnimatedMatchModal = ({
  visible,
  children,
  overlayStyle,
  cardStyle,
}) => (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={cardStyle}>
          {children}
        </View>
      </View>
    </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xl,
  },
});
