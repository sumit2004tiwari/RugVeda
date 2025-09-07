import React from "react";
import { Box, Typography, Grid, Pagination } from "@mui/material";
import CategoryCard from "../../components/ui/CategoryCard";

const categories = [
  {
    title: "New York",
    image: "https://source.unsplash.com/random/448x280/?newyork",
  },
  {
    title: "Washington",
    image: "https://source.unsplash.com/random/448x280/?washington",
  },
  {
    title: "Chicago",
    image: "https://source.unsplash.com/random/448x280/?chicago",
  },
  {
    title: "New Jersey",
    image: "https://source.unsplash.com/random/448x280/?newjersey",
  },
  {
    title: "Los Angeles",
    image: "https://source.unsplash.com/random/448x280/?losangeles",
  },
  {
    title: "San Francisco",
    image: "https://source.unsplash.com/random/448x280/?sanfrancisco",
  },
];

const Category = () => {
  return (
    <Box sx={{ bgcolor: "#F9F9F9", py: 6 }}>
      {/* Heading */}
      <Typography
        sx={{
          fontFamily: "Montserrat",
          fontWeight: 500,
          fontSize: "28px",
          textAlign: "center",
        }}
      >
        Search By State
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontFamily: "Montserrat",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "160%",
          textAlign: "center",
          color: "text.secondary",
          mb: 4,
        }}
      >
        Find Properties by State to Buy or Lease
      </Typography>

      {/* Cards Grid */}
      <Grid
        container
        spacing={3}
        justifyContent="center"
        sx={{ px: { xs: 2, md: 8 } }}
      >
        {categories.map((item, idx) => (
          <Grid item key={idx} xs={12} sm={6} md={4}>
            <CategoryCard {...item} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination count={8} color="primary" />
      </Box>
    </Box>
  );
};

export default Category;
