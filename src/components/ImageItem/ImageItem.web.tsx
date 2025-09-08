/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useRef, useState } from "react";

import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
} from "react-native";

import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import useImageDimensions from "../../hooks/useImageDimensions";
import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom.web";
import { getImageStyles, getImageTransform } from "../../utils";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (scaled: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  containerStyle?: ViewStyle;
  style?: ViewStyle;
};


const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  containerStyle,
  style,
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  const handleZoomClick = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);
  
  // Handle Ctrl+click zoom
  const onImagePress = useCallback((event: any) => {
    if (doubleTapToZoomEnabled) {
      const zoomResult = handleZoomClick(event);
      if (zoomResult) {
        const newScaled = zoomResult.shouldZoom;
        setScaled(newScaled);
        onZoom(newScaled);
        return; // Don't continue with normal click handling
      }
    }
    // Normal click behavior here if needed
  }, [handleZoomClick, doubleTapToZoomEnabled, onZoom]);

  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;
  
  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  });

  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  
  // Apply web zoom scaling
  const webZoomScale = scaled ? 2 : 1;
  const imageStylesWithOpacity = { 
    ...imagesStyles, 
    opacity: imageOpacity,
    transform: [
      ...(imagesStyles.transform || []),
      { scale: webZoomScale }
    ]
  };

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0;
      const scaled = nativeEvent?.zoomScale > 1;

      onZoom(scaled);
      setScaled(scaled);

      if (
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        onRequestClose();
      }
    },
    [scaled]
  );

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if (nativeEvent?.zoomScale > 1) {
      return;
    }

    scrollValueY.setValue(offsetY);
  };

  const onLongPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress]
  );

  return (
    <View style={[containerStyle]}>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.listItem, style]}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
      >
        {(!loaded || !imageDimensions) && <ImageLoading />}
        <Pressable
          onPress={onImagePress}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <Animated.Image
            source={imageSrc}
            style={[imageStylesWithOpacity]}
            onLoad={() => setLoaded(true)}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
});

export default React.memo(ImageItem);
