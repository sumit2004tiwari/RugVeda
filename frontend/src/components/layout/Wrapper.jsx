import React from "react";
import { Box } from "@mui/material";

const Wrapper = ({ children }) => {
  return (
    <Box
      sx={{
        p: "3px",
        minHeight: "full",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
};

export default Wrapper;
