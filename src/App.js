import React, { useState } from "react";

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
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/email.svg";
      case "instagram":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/instagram.svg";
      case "facebook":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/facebook.svg";
      case "oneroute":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute.svg";
      case "sms":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/sms.svg";
      case "twitter":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/twitter.svg";
      case "whatsapp":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/whatsapp.svg";
      default:
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
                <img
                  src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute.svg"
                  alt=""
                />
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
                  <span>{name}</span>
                </a>
              ))}
            </div>

            <div className="footer">
              <img
                src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute.svg"
                alt=""
              />{" "}
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
      <div className="trigger_container">
        <div className={`tooltip ${isWidgetOpen ? "none" : ""}`}>
          {tooltip}
          <span></span>
        </div>
        <div
          className="trigger_btn"
          style={{ backgroundColor: hexcolor || "#000" }}
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        >
          {isWidgetOpen ? (
            <img
              src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/close.svg"
              alt=""
            />
          ) : (
            <img
              src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute-w.svg"
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
