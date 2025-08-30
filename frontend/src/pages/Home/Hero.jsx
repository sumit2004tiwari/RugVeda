import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import photo from "/photo.avif";
import photo2 from "/photo2.avif";
import photo3 from "/photo3.avif";

const Hero = () => {
  return (
    <div style={{ marginTop: "10px" }}>
      {/* 👇 Inline CSS override */}
      <style>
        {`
          .carousel .legend {
            background: gray !important;
            color: white !important;
            font-size: 22px;
            font-weight: bold;
            gap: 10px;
            width : 100%;
          }
          .carousel .control-arrow {
            background: gray !important;
            border-radius: 50%;
            width: 40px !important;
            height: 40px !important;
            opacity: 0.8;
          }
            .carousel .control-arrow {
              background: gray !important;
              border-radius: 50%;
              width: 40px !important;
              height: 40px !important;
              opacity: 0.8;
              top: 50% !important;         
              transform: translateY(-50%); 
          }

          .carousel .control-prev::before,
          .carousel .control-next::before {
            font-size: 16px !important;
            color: white;
          }
            .carousel .control-prev {
            left: 20px !important;   /* 👈 Left arrow thoda andar */
          }

           .carousel .control-next {
             right: 20px !important;  /* 👈 Right arrow thoda andar */
           }

        `}
      </style>

      <Carousel
        autoPlay
        infiniteLoop
        showThumbs={false}
        showStatus={false}
        interval={4000}
        transitionTime={800}
        emulateTouch
        stopOnHover
      >
        <div style={{ height: "700px" }}>
          <img
            src={photo}
            alt="Carpet 1"
            style={{ height: "100%", width: "100%", objectFit: "cover" }}
          />
          <p className="legend">Luxury Carpets</p>
        </div>
        <div style={{ height: "700px" }}>
          <img
            src={photo2}
            alt="Carpet 2"
            style={{ height: "100%", width: "100%", objectFit: "cover" }}
          />
          <p className="legend">Handmade Rugs</p>
        </div>
        <div style={{ height: "700px" }}>
          <img
            src={photo3}
            alt="Carpet 3"
            style={{ height: "100%", width: "100%", objectFit: "cover" }}
          />
          <p className="legend">Rugs for Every Room</p>
        </div>
      </Carousel>
    </div>
  );
};

export default Hero;
