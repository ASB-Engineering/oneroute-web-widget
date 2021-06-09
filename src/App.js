import React, { useState } from "react";

import Email from "./assets/email.svg";
import Instagram from "./assets/instagram.svg";
import Oneroute from "./assets/oneroute.svg";
import Sms from "./assets/sms.svg";
import Twitter from "./assets/twitter.svg";
import Whatsapp from "./assets/whatsapp.svg";
import OnerouteW from "./assets/oneroute-w.svg";
import Close from "./assets/close.svg";

import "./App.css";

function App({ domElement }) {
  var hexcolor = domElement.getAttribute("data-color");
  var logo = domElement.getAttribute("data-logo");
  var headtext = domElement.getAttribute("data-headtext");
  var subtext = domElement.getAttribute("data-subtext");
  var tooltip = domElement.getAttribute("data-tooltip");
  var channels = domElement.getAttribute("data-channels");
  channels = JSON.parse(channels);

  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const getChannelIcon = (channel) => {
    switch (channel.toLowerCase()) {
      case "email":
        return Email;
      case "instagram":
        return Instagram;
      case "oneroute":
        return Oneroute;
      case "sms":
        return Sms;
      case "twitter":
        return Twitter;
      case "whatsapp":
        return Whatsapp;
      case "default":
        return;
    }
  };

  const determineColorFromBg = () => {
    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === "#") {
      hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (hexcolor.length === 3) {
      hexcolor = hexcolor
        .split("")
        .map(function (hex) {
          return hex + hex;
        })
        .join("");
    }

    // Convert to RGB value
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    var yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Check contrast
    return yiq >= 128 ? "#000000" : "#FFFFFF";
  };

  return (
    <>
      {isWidgetOpen && (
        <div className={`widget_container ${isWidgetOpen ? "" : "none"}`}>
          <div
            className="top_section"
            style={{ backgroundColor: hexcolor, color: determineColorFromBg() }}
          >
            <img src={logo} alt="" />
            <h3>{headtext}</h3>
            <h4>{subtext}</h4>
          </div>
          <div className="bottom_section">
            <div className="channels">
              <div className="item">
                <img src={Oneroute} alt="" />
                <span>OneRoute Webchat (coming soon)</span>
              </div>
              {channels?.map(({ name, to }, i) => (
                <a
                  key={i}
                  href={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="item"
                >
                  <img src={getChannelIcon(name)} alt="" />
                  <span>Open {name}</span>
                </a>
              ))}
            </div>

            <div className="footer">
              <img src={Oneroute} alt="" />{" "}
              <span>
                Powered by{" "}
                <a
                  href="https://oneroute.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OneRoute
                </a>
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className="trigger_container"
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
      >
        <div className={`tooltip ${isWidgetOpen ? "none" : ""}`}>
          {tooltip}
          <span></span>
        </div>
        <div
          className="trigger_btn"
          style={{ backgroundColor: hexcolor || "#000" }}
        >
          {isWidgetOpen ? (
            <img src={Close} alt="" />
          ) : (
            <img
              src={OnerouteW}
              className={!isWidgetOpen ? "closed" : ""}
              alt=""
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
