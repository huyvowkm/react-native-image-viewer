import React from "react";
import { View, Image, StyleSheet } from "react-native";
import type { ImageSourcePropType, ViewStyle, ImageStyle } from "react-native";

interface Props {
  imageSrc: ImageSourcePropType;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  onRequestClose?: () => void;
  onLongPress?: (image: ImageSourcePropType) => void;
  delayLongPress?: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  onZoom?: (isScaled: boolean) => void;
}

const ImageItem: React.FC<Props> = ({
  imageSrc,
  style,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image source={imageSrc} style={[styles.image, style]} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImageItem;
