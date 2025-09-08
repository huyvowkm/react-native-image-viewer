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
  const [loaded, setLoaded] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  
  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);

  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );

  return (
    <View style={[containerStyle]}>
      {(!loaded || !imageDimensions) && <ImageLoading />}
      <Animated.Image
        source={imageSrc}
        style={[imagesStyles]}
        onLoad={() => setLoaded(true)}
      />
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
