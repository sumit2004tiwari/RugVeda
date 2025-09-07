import React from "react";
import { Box, Typography } from "@mui/material";

const CategoryCard = ({ image, title }) => {
  return (
    <Box
      sx={{
        width: 448,
        height: 280,
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        "&:hover img": {
          transform: "scale(1.05)",
        },
      }}
    >
      {/* Image */}
      <Box
        component="img"
        src={image}
        alt={title}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "0.4s ease",
        }}
      />

      {/* Title Overlay */}
      <Typography
        variant="h6"
        sx={{
          fontFamily: "Montserrat",
          fontWeight: 500,
          fontSize: "20px",
          position: "absolute",
          bottom: 16,
          left: 16,
          color: "white",
          textShadow: "0px 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default CategoryCard;
