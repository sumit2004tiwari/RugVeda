import React from "react";
import { Grid } from "@mui/material";
import CustomCard from "../../components/ui/CustomCard";

const CardDemo = () => {
  const data = [
    {
      image: "https://source.unsplash.com/random/300x200/?carpet",
      title: "Persian Handmade Carpet",
      description: "Size: 8x10 ft | Wool & Silk | 250 KPSI",
      buttonText: "View Details",
    },
    {
      image: "https://source.unsplash.com/random/300x200/?rug",
      title: "Turkish Machine-made Rug",
      description: "Size: 6x9 ft | Cotton Blend | 120 KPSI",
      buttonText: "View Details",
    },
  ];

  return (
    <>
    <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
    <Grid container spacing={3}>
      {data.map((item, idx) => (
        <Grid item key={idx}>
          <CustomCard {...item} />
        </Grid>
      ))}
    </Grid>
    </div>
    </>
  );
};

export default CardDemo;
