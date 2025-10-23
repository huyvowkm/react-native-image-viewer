/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useRef, useState, useEffect } from "react";

import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import useImageDimensions from "../../hooks/useImageDimensions";
import { getImageStyles, getImageTransform } from "../../utils";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

// Use window dimensions for web to account for mobile browser UI (address bar, toolbar)
const getViewportDimensions = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : Dimensions.get("screen").width,
  height: typeof window !== 'undefined' ? window.innerHeight : Dimensions.get("screen").height,
});

// Detect if device is mobile based on touch support and screen size
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window && window.innerWidth < 1024;
};

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
}: Props) => {
  const containerRef = useRef<View>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState(getViewportDimensions());
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const imageDimensions = useImageDimensions(imageSrc);
  
  // Touch/gesture state
  const [currentScale, setCurrentScale] = useState(1);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastDistance = useRef(0);
  const initialTouches = useRef<{ x: number; y: number; distance?: number } | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null);
  const lastClickTime = useRef(0);
  const isSwiping = useRef(false);
  const isPinching = useRef(false);
  const hasMovedSignificantly = useRef(false);
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null);
  
  // Update viewport dimensions on resize (handles mobile browser UI changes)
  useEffect(() => {
    const handleResize = () => {
      setViewportDimensions(getViewportDimensions());
      setIsMobile(isMobileDevice());
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // Also listen to orientationchange for mobile devices
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, []);
  
  const [translate, scale] = getImageTransform(imageDimensions, viewportDimensions);
  const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY({ x: 0, y: 0 });
  
  // Calculate distance between two touch points
  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Handle touch start for pinch zoom and swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTime.current = Date.now();
    hasMovedSignificantly.current = false;
    swipeDirection.current = null;
    
    if (e.touches.length === 2) {
      // Pinch to zoom
      isPinching.current = true;
      isSwiping.current = false;
      const distance = getDistance(e.touches);
      lastDistance.current = distance;
      initialTouches.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance,
      };
    } else if (e.touches.length === 1) {
      // Single touch - record position
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isPinching.current = false;
    }
  };
  
  // Handle touch move for pinch zoom and swipe
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length === 2) {
      // Only stop propagation for pinch gestures
      e.preventDefault();
      e.stopPropagation();
      hasMovedSignificantly.current = true;
      const distance = getDistance(e.touches);
      
      if (lastDistance.current > 0) {
        const scaleChange = distance / lastDistance.current;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, currentScale * scaleChange));
        setCurrentScale(newScale);
      }
      
      lastDistance.current = distance;
    } else if (e.touches.length === 1 && !isPinching.current) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      const deltaX = e.touches[0].clientX - touchStartX.current;
      
      // Determine swipe direction on first significant movement
      if (!swipeDirection.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        // Determine which direction has more movement
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          // Horizontal swipe is dominant - let it pass through completely
          swipeDirection.current = 'horizontal';
        } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical swipe is dominant - handle it
          swipeDirection.current = 'vertical';
        }
      }
      
      // Only intercept vertical swipes when not zoomed
      if (swipeDirection.current === 'vertical' && currentScale <= MIN_SCALE && swipeToCloseEnabled) {
        e.preventDefault();
        e.stopPropagation();
        hasMovedSignificantly.current = true;
        isSwiping.current = true;
        setCurrentTranslateY(deltaY);
      }
      // For horizontal swipes or undetermined, do nothing - let parent handle it
    }
  };
  
  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current;
    
    if (isPinching.current) {
      isPinching.current = false;
      lastDistance.current = 0;
      initialTouches.current = null;
      // Don't stop propagation on touch end for better compatibility
      return;
    }
    
    // If this was a horizontal swipe, don't interfere at all
    if (swipeDirection.current === 'horizontal') {
      hasMovedSignificantly.current = false;
      swipeDirection.current = null;
      return;
    }
    
    // Check if this was a tap (not a swipe)
    if (!hasMovedSignificantly.current && touchDuration < 300) {
      // Get tap position
      const tapX = e.changedTouches[0]?.clientX || touchStartX.current;
      const tapY = e.changedTouches[0]?.clientY || touchStartY.current;
      
      // Check for double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      
      if (timeSinceLastTap < 400 && lastTapTime.current > 0 && doubleTapToZoomEnabled) {
        // Double tap detected - stop propagation to prevent image change
        e.preventDefault();
        e.stopPropagation();
        
        if (currentScale > MIN_SCALE) {
          // Zoom out to normal
          setCurrentScale(MIN_SCALE);
          setTranslateX(0);
          setTranslateY(0);
        } else {
          // Zoom in to 2x at the tap position
          setCurrentScale(2);
          
          // Calculate focal point offset
          if (imageDimensions) {
            const imageRect = e.currentTarget.getBoundingClientRect();
            const focusX = (tapX - imageRect.left - imageRect.width / 2) * -1;
            const focusY = (tapY - imageRect.top - imageRect.height / 2) * -1;
            setTranslateX(focusX);
            setTranslateY(focusY);
          }
        }
        lastTapTime.current = 0; // Reset to prevent triple-tap
        lastTapPosition.current = null;
      } else {
        // First tap - just record it, don't stop propagation
        lastTapTime.current = now;
        lastTapPosition.current = { x: tapX, y: tapY };
      }
      
      // Reset swipe position
      setCurrentTranslateY(0);
      isSwiping.current = false;
    } else if (swipeDirection.current === 'vertical' && currentScale <= MIN_SCALE) {
      // This was a vertical swipe
      if (Math.abs(currentTranslateY) > SWIPE_CLOSE_OFFSET && swipeToCloseEnabled) {
        onRequestClose();
      } else {
        // Reset position
        setCurrentTranslateY(0);
      }
      isSwiping.current = false;
    }
    
    hasMovedSignificantly.current = false;
    swipeDirection.current = null;
  };
  
  // Notify parent about zoom state changes
  useEffect(() => {
    onZoom(currentScale > MIN_SCALE);
  }, [currentScale, onZoom]);
  
  // Handle double click for desktop browsers
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!doubleTapToZoomEnabled) return;
    
    if (currentScale > MIN_SCALE) {
      // Zoom out to normal
      setCurrentScale(MIN_SCALE);
      setTranslateX(0);
      setTranslateY(0);
    } else {
      // Zoom in to 2x at the click position
      setCurrentScale(2);
      
      // Calculate focal point offset
      if (imageDimensions) {
        const imageRect = e.currentTarget.getBoundingClientRect();
        const focusX = (e.clientX - imageRect.left - imageRect.width / 2) * -1;
        const focusY = (e.clientY - imageRect.top - imageRect.height / 2) * -1;
        setTranslateX(focusX);
        setTranslateY(focusY);
      }
    }
  }, [currentScale, doubleTapToZoomEnabled, imageDimensions]);
  
  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  });

  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  
  // Apply web zoom scaling and swipe transforms
  const imageStylesWithOpacity = { 
    ...imagesStyles, 
    opacity: Math.abs(currentTranslateY) > SWIPE_CLOSE_OFFSET ? 0.5 : 1,
    height: imageDimensions?.height,
    transform: [
      ...(imagesStyles.transform || []),
      { scale: currentScale },
      { translateX: translateX },
      { translateY: translateY + currentTranslateY },
    ],
  };

  const styles = StyleSheet.create({
    listItem: {
      width: viewportDimensions.width,
      height: viewportDimensions.height,
    },
    imageScrollContainer: {
      height: viewportDimensions.height,
      width: viewportDimensions.width,
      alignItems: "center",
      justifyContent: "center",
    },
    imageWrapper: {
      width: '100%',
      height: '100%',
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View 
      ref={containerRef}
      style={[styles.listItem, containerStyle, styles.imageScrollContainer]}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {(!loaded || !imageDimensions) && <ImageLoading />}
      <Animated.Image
        source={imageSrc}
        style={[imageStylesWithOpacity]}
        onLoad={() => setLoaded(true)}
        onDoubleClick={handleDoubleClick}
      />
    </View>
  );
};


export default React.memo(ImageItem);