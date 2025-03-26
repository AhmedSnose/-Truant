import React, { FC } from "react";
import { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

const CustomBackdrop: FC<BottomSheetBackdropProps> = (props) => {
  return (
    <BottomSheetBackdrop
      {...props}
      // The sheet is invisible when index is -1,
      // so we only want the backdrop to appear from index 0 and up.
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      // Decide how tapping the backdrop should behave:
      // pressBehavior="close" will close the sheet on backdrop press,
      // or "none" to disable closing on backdrop press.
      pressBehavior="none"
      opacity={0.5}
    />
  );
};

export default CustomBackdrop;
