import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ShoppingCart,
  FavoriteBorder,
  AccountCircle,
  Search,
  ExpandMore,
} from "@mui/icons-material";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ background: "#ffffff", boxShadow: "sx" }}>
      <Toolbar
        sx={{
          width: "full",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Side - Logo */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            color: "#000000",
          }}
        >
          SahiSutra
        </Typography>

        {/* Middle Links */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <Button
            sx={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              color: "#4A4A4A",
              textTransform: "none",
            }}
          >
            Home
          </Button>

          {/* Shop with Dropdown */}
          <Box
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose} // 👈 wrap both Button + Menu in one Box
          >
            <Button
              endIcon={<ExpandMore />}
              sx={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 500,
                fontSize: "15px",
                color: "#4A4A4A",
                textTransform: "none",
              }}
            >
              Shop / Collections
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              slotProps={{
                paper: {
                  sx: {
                    width: 165,
                    paddingY: 1,
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  },
                },
              }}
            >
              <MenuItem onClick={handleClose}>Rugs</MenuItem>
              <MenuItem onClick={handleClose}>Carpets</MenuItem>
              <MenuItem onClick={handleClose}>Handmade</MenuItem>
              <MenuItem onClick={handleClose}>Luxury</MenuItem>
              <MenuItem onClick={handleClose}>By Room</MenuItem>
            </Menu>
          </Box>

          <Button
            sx={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              color: "#4A4A4A",
              textTransform: "none",
            }}
          >
            About Us
          </Button>
          <Button
            sx={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              color: "#4A4A4A",
              textTransform: "none",
            }}
          >
            Craftsmanship
          </Button>
          <Button
            sx={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              color: "#4A4A4A",
              textTransform: "none",
            }}
          >
            Get in Touch
          </Button>
        </Box>

        {/* Right Side - Icons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton>
            <Search sx={{ color: "#4A4A4A" }} />
          </IconButton>
          <IconButton>
            <FavoriteBorder sx={{ color: "#4A4A4A" }} />
          </IconButton>
          <IconButton>
            <Badge badgeContent={2} color="error">
              <ShoppingCart sx={{ color: "#4A4A4A" }} />
            </Badge>
          </IconButton>
          <IconButton>
            <AccountCircle sx={{ color: "#4A4A4A" }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
