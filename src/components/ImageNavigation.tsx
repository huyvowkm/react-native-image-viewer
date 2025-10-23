/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { View, Pressable, StyleSheet, Platform, Text } from "react-native";

type Props = {
  imageIndex: number;
  imagesCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window && window.innerWidth < 1024;
};

const ImageNavigation = ({ imageIndex, imagesCount, onPrevious, onNext }: Props) => {
  // Only show navigation buttons on desktop (non-mobile) devices
  const isDesktop = Platform.OS === 'web' && !isMobileDevice();
  
  if (!isDesktop || imagesCount <= 1) {
    return null;
  }

  const showPrevious = imageIndex > 0;
  const showNext = imageIndex < imagesCount - 1;

  return (
    <>
      {showPrevious && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonLeft,
            pressed && styles.buttonPressed,
          ]}
          onPress={onPrevious}
        >
          <Text style={styles.chevronText}>‹</Text>
        </Pressable>
      )}
      {showNext && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonRight,
            pressed && styles.buttonPressed,
          ]}
          onPress={onNext}
        >
          <Text style={styles.chevronText}>›</Text>
        </Pressable>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute' as any,
    top: '50%',
    marginTop: -30, // Half of height to center vertically
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    cursor: 'pointer' as any,
    zIndex: 2,
    display: 'flex' as any,
  },
  buttonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    transform: [{ scale: 0.95 }] as any,
  },
  buttonLeft: {
    left: 20,
  },
  buttonRight: {
    right: 20,
  },
  chevronText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: 'bold' as any,
    lineHeight: 44,
    textAlign: 'center' as any,
    userSelect: 'none' as any,
    includeFontPadding: false,
    marginTop: 0,
    marginBottom: 0,
  },
});

export default ImageNavigation;
