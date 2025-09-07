import React from "react";
import { Grid } from "@mui/material";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import CustomCard from "../../components/ui/CustomCard";

const CardDemo = () => {
  const data = [
    {
      image: "https://source.unsplash.com/random/300x200/?carpet",
      title: "Persian Handmade Carpet",
      description: "Size: 8x10 ft | Wool & Silk | 250 KPSI",
      price: "$1200",
      origin: "Jaipur, India",
      material: "Wool & Silk",
      offer: "10% OFF",
      buttonText: "View Details",
    },
    {
      image: "https://source.unsplash.com/random/300x200/?rug",
      title: "Turkish Machine-made Rug",
      description: "Size: 6x9 ft | Cotton Blend | 120 KPSI",
      price: "$1200",
      origin: "Istanbul, Turkey",
      material: "Cotton Blend",
      offer: "10% OFF",
      buttonText: "View Details",
    },
     {
      image: "https://source.unsplash.com/random/300x200/?carpet",
      title: "Persian Handmade Carpet",
      description: "Size: 8x10 ft | Wool & Silk | 250 KPSI",
      price: "$1200",
      origin: "Jaipur, India",
      material: "Wool & Silk",
      offer: "10% OFF",
      buttonText: "View Details",
    },
    {
      image: "https://source.unsplash.com/random/300x200/?rug",
      title: "Turkish Machine-made Rug",
      description: "Size: 6x9 ft | Cotton Blend | 120 KPSI",
      price: "$1200",
      origin: "Istanbul, Turkey",
      material: "Cotton Blend",
      offer: "10% OFF",
      buttonText: "View Details",
    },
     {
      image: "https://source.unsplash.com/random/300x200/?carpet",
      title: "Persian Handmade Carpet",
      description: "Size: 8x10 ft | Wool & Silk | 250 KPSI",
      price: "$1200",
      origin: "Jaipur, India",
      material: "Wool & Silk",
      offer: "10% OFF",
      buttonText: "View Details",
    },
    {
      image: "https://source.unsplash.com/random/300x200/?rug",
      title: "Turkish Machine-made Rug",
      description: "Size: 6x9 ft | Cotton Blend | 120 KPSI",
      price: "$1200",
      origin: "Istanbul, Turkey",
      material: "Cotton Blend",
      offer: "10% OFF",
      buttonText: "View Details",
    },
  ];

  return (
    <>
      <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 3, // equal space between cards
        mt: 4,
      }}
    >
      {data.map((item, idx) => (
        <Box key={idx} sx={{ flex: "0 0 330px" }}>
          <CustomCard {...item} />
        </Box>
      ))}
    </Box>
    </>
  );
};

export default CardDemo;
// End of recent edits  