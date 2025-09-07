import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
} from "@mui/material";

const CustomCard = ({
  image,
  title,
  description,
  price,
  offer,
  buttonText,
  origin,
  material,
}) => {
  return (
    <Card
      sx={{
        width: 330,
        height: 440,
        borderRadius: "4px",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#e0e0e0",
        opacity: 0.5, // default opacity (kam visible)
        transition: "all 0.3s ease",
        "&:hover": {
          opacity: 1, // hover pe full visible
          borderColor: "#1e569bff", // blue border on hover
          boxShadow: "0px 6px 20px rgba(0,0,0,0.2)",
          transform: "translateY(-4px)",
        },
      }}
    >
      {/* Image Section */}
      <CardMedia
        component="img"
        image={image}
        alt={title}
        sx={{
          width: 330,
          height: 220,
          objectFit: "cover",
        }}
      />

      {/* Content Section */}
      <CardContent sx={{ px: 2 }}>
        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "22px",
            lineHeight: "100%",
            mb: 1,
            color: "#333",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            lineHeight: "100%",
            color: "#555",
            mb: 2,
          }}
        >
          {description}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "100%",
            color: "#333",
            mb: 1,
          }}
        >
          {offer}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "100%",
            color: "#333",
            mb: 1,
          }}
        >
          {price}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "100%",
            color: "#333",
            mb: 1,
          }}
        >
          {origin}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "100%",
            color: "#333",
            mb: 1,
          }}
        >
          {material}
        </Typography>

        {/* Button */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            borderRadius: "4px",
            backgroundColor: "#0A3B78",
            "&:hover": {
              backgroundColor: "#082c5a",
            },
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomCard;
