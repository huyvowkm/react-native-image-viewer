/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback } from "react";
import { Dimensions } from "../@types";

/**
 * Web implementation of zoom functionality.
 * Uses Ctrl+click instead of double-tap for better web UX.
 */
function useDoubleTapToZoom(
  scrollViewRef: React.RefObject<any>,
  scaled: boolean,
  screen: Dimensions
) {
  const handleZoomClick = useCallback(
    (event: any) => {
      // Check for Ctrl+click (or Cmd+click on Mac)
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        
        // Return zoom information for parent to handle
        return {
          shouldZoom: !scaled,
          scale: !scaled ? 2 : 1,
          // Include click coordinates for zoom positioning
          clickX: event.nativeEvent?.locationX || event.clientX,
          clickY: event.nativeEvent?.locationY || event.clientY,
        };
      }
      
      return null;
    },
    [scaled, screen]
  );

  return handleZoomClick;
}


export default useDoubleTapToZoom;
