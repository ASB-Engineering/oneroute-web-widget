import React, { useState, useEffect, useRef } from "react";

import useChat from "./useChat";

import { getRequest, postRequest } from "./api/index";
import { formatTime, getRequestError } from "./api/functions";

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
  const [isWidgetTooltipOpen, setIsWidgetTooltipOpen] = useState(true);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isSignUpFormOpen, setIsSignUpFormOpen] = useState(true);
  const [conversationData, setConversationData] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const liveChatCredentials = channels?.find(
    (x) => x?.name?.toLowerCase() === "livechat"
  );

  const conversation_id = localStorage.getItem("conversation_id") || null;

  const { messages } = useChat(conversation_id); // Creates a websocket and manages messaging

  console.log(messages, "message");

  useEffect(() => {
    if (conversation_id) {
      setIsSignUpFormOpen(false);
      getConversation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isWidgetOpen) {
      setIsWidgetTooltipOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetOpen]);

  const getChannelIcon = (channel) => {
    switch (channel.toLowerCase()) {
      case "livechat":
        return "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute.svg";
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e?.target?.name]: e?.target?.value,
    });

    if (errorMsg) setErrorMsg(null);
  };

  const handleMessageChange = (e) => {
    setFormData({
      ...formData,
      message: {
        ...formData?.message,
        text: e?.target?.value,
      },
    });

    if (errorMsg) setErrorMsg(null);
  };

  const AlwaysScrollToBottom = () => {
    const elementRef = useRef();
    useEffect(() => elementRef.current.scrollIntoView({ behavior: "smooth" }));
    return <div ref={elementRef} />;
  };

  const getConversation = async (load) => {
    load && setIsLoading(true);
    try {
      const res = await getRequest({
        url: `/conversations/${conversation_id}`,
      });

      const success = res?.data?.success;
      if (success === true) {
        const convo = res?.data?.data;
        setFormData({
          email: convo?.customer?.email,
          name: convo?.customer?.name,
        });
        const data = [...convo?.Messages].reverse() || [];
        setConversationData(data);
        load && setIsLoading(false);
        load && setIsSubmitting(null);
      }
    } catch (err) {
      load && setIsLoading(false);
      setIsSignUpFormOpen(true);
      const errorMessage = getRequestError(err);
      setErrorMsg(errorMessage);
    }
  };

  const startConversation = async (e) => {
    e.preventDefault();

    if (formData?.message?.text?.length > 0) {
      setIsSubmitting(true);
      try {
        const res = await postRequest({
          url: `/conversations/incoming-messages/widget/${liveChatCredentials?.to}`,
          data: {
            email: formData?.email,
            name: formData?.name,
            message: formData?.message,
          },
        });

        const success = res?.data?.success;
        if (success === true) {
          setFormData({
            ...formData,
            message: "",
          });
          localStorage.setItem(
            "conversation_id",
            res?.data?.data?.conversation_id
          );
          setConversationData([...conversationData, res?.data?.data]);
          setIsSubmitting(false);
          setIsSignUpFormOpen(false);
        }
      } catch (err) {
        setIsSubmitting(false);
        const errorMessage = getRequestError(err);
        setErrorMsg(errorMessage);
      }
    }
  };

  const openFileUploader = () => {
    document.getElementById("selectImage").click();
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    const { files } = e?.target;
    const fileToUpload = files[0];

    if (fileToUpload) {
      setIsLoading(true);

      var fileData = new FormData();
      fileData.append("media", fileToUpload);
      let payload = {};
      payload = fileData;

      try {
        const res = await postRequest({
          url: "/utils/upload",
          data: payload,
        });
        if (res?.status === 200) {
          setFormData({
            ...formData,
            message: {
              ...formData?.message,
              attachment: {
                url: res?.data?.data,
                type: "IMAGE",
              },
            },
          });
          setIsLoading(false);
        }
      } catch (error) {
        const errorMessage = getRequestError(error);
        setErrorMsg(errorMessage);
        setIsLoading(false);
      }
    }
  };

  const replyConversation = async () => {
    if (formData?.message?.text?.length > 0) {
      setConversationData([
        ...conversationData,
        {
          id: "new",
          imageUrl: formData?.message?.attachment?.url,
          content: formData?.message?.text,
          createdAt: new Date(),
        },
      ]);
      setIsSubmitting(true);

      try {
        const res = await postRequest({
          url: `/conversations/incoming-messages/widget/${liveChatCredentials?.to}`,
          data: {
            email: formData?.email,
            name: formData?.name,
            message: formData?.message,
          },
        });

        const success = res?.data?.success;
        if (success === true) {
          setFormData({
            ...formData,
            message: { text: "" },
          });
          setIsSubmitting(false);
          getConversation(false);
        }
      } catch (err) {
        const filteredMessage = conversationData.filter((x) => x?.id !== "new");
        setConversationData(filteredMessage);
        setIsSubmitting(null);
        const errorMessage = getRequestError(err);
        setErrorMsg(errorMessage);
      }
    }
  };

  return (
    <>
      {isWidgetOpen && (
        <div className={`widget_container ${isWidgetOpen ? "" : "none"}`}>
          {isLiveChatOpen ? (
            <>
              <div
                className="chat_header"
                style={{
                  backgroundColor: hexcolor,
                  color: determineColorFromBg(),
                }}
              >
                <div
                  className="chevron"
                  onClick={() => setIsLiveChatOpen(false)}
                >
                  <img
                    src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/chevron.svg"
                    alt=""
                  />
                </div>
                <img className="logo" src={logo} alt="" />
                <p>{liveChatCredentials?.identifier}</p>
              </div>
              {errorMsg && <p className="error_message">{errorMsg}</p>}
              <div className="chat_container">
                {isSignUpFormOpen ? (
                  <form className="chat_signup_form">
                    <div className="form_group">
                      <input
                        name="name"
                        placeholder="Your name"
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                    <div className="form_group">
                      <input
                        name="email"
                        type="email"
                        placeholder="Your email"
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                    <div className="form_group">
                      <textarea
                        name="text"
                        placeholder="Type message here..."
                        onChange={handleMessageChange}
                        className="input"
                      />
                    </div>
                    <button
                      onClick={startConversation}
                      disabled={
                        !formData?.name ||
                        !formData?.email ||
                        !formData?.message?.text ||
                        isSubmitting
                      }
                    >
                      Start Conversation
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="chat_messages">
                      {conversationData?.map((msg, i) => (
                        <div
                          key={i}
                          className={`message ${
                            msg?.sender?.authUser === true ? "agent" : ""
                          }`}
                        >
                          {msg?.sender?.authUser === true && (
                            <img className="agent_img" src={logo} alt="" />
                          )}
                          <div className="content">
                            {msg?.imageUrl && (
                              <img src={msg?.imageUrl} alt="" />
                            )}
                            <h6>{msg?.content}</h6>
                            <p>{formatTime(msg?.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                      {isSubmitting === true && (
                        <p className="send_status">Sending...</p>
                      )}
                      {isSubmitting === false && (
                        <p className="send_status">Sent</p>
                      )}
                      {isLoading === true && (
                        <p className="loading">Loading...</p>
                      )}
                      <AlwaysScrollToBottom />
                    </div>
                    <div className="chat_input_container">
                      <textarea
                        name="text"
                        type="text"
                        className="input"
                        rows="2"
                        placeholder="Type a message here..."
                        value={formData?.message?.text}
                        onChange={handleMessageChange}
                      />
                      {formData?.message?.attachment && (
                        <div className="file_container">
                          <img
                            src={formData?.message?.attachment?.url}
                            className="file"
                            alt=""
                          />
                          <img
                            src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/close.svg"
                            alt=""
                            className="close"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                message: {
                                  ...formData?.message,
                                  attachment: null,
                                },
                              })
                            }
                          />
                        </div>
                      )}

                      <div className="input_actions">
                        {/* <div className="action">
                          <img
                            src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/smile.svg"
                            alt=""
                          />
                        </div> */}
                        <div className="action" onClick={openFileUploader}>
                          <img
                            src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/attachment.svg"
                            alt=""
                          />
                          <input
                            id="selectImage"
                            hidden
                            type="file"
                            onChange={handleUploadFile}
                          />
                        </div>
                        <div className="action" onClick={replyConversation}>
                          <img
                            src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/send.svg"
                            alt=""
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
            </>
          ) : (
            <>
              <div
                className="top_section"
                style={{
                  backgroundColor: hexcolor,
                  color: determineColorFromBg(),
                }}
              >
                <img src={logo} alt="" />
                <h3>{headtext}</h3>
                <h4>{subtext}</h4>
              </div>
              <div className="bottom_section">
                <div className="channels">
                  {channels?.map(({ name, to }, i) => (
                    <React.Fragment key={i}>
                      {name?.toLowerCase() === "livechat" ? (
                        <div
                          className="item"
                          onClick={() => setIsLiveChatOpen(true)}
                        >
                          <img src={getChannelIcon(name)} alt="" />
                          <span>{name}</span>
                        </div>
                      ) : (
                        <a
                          href={to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="item"
                        >
                          <img src={getChannelIcon(name)} alt="" />
                          <span>{name}</span>
                        </a>
                      )}
                    </React.Fragment>
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
            </>
          )}
        </div>
      )}
      <div className="trigger_container">
        {isWidgetTooltipOpen && (
          <div className={`tooltip ${isWidgetOpen ? "none" : ""}`}>
            {tooltip}
            <span></span>
            <img
              src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/close.svg"
              alt=""
              onClick={() => setIsWidgetTooltipOpen(false)}
            />
          </div>
        )}
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
