import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

import { formatTime, getRequestError } from "./functions";

import "regenerator-runtime/runtime";

import "./App.css";

const baseURL = "https://api.oneroute.io/";

var socket = io(baseURL, {
  reconnectionDelay: 1000,
  reconnection: true,
  transports: ["websocket"],
  upgrade: false,
  forceNew: true,
});

function App(props) {
  var widget_id = props?.widgetid;

  const [showWidget, setShowWidget] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isWidgetTooltipOpen, setIsWidgetTooltipOpen] = useState(true);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isSignUpFormOpen, setIsSignUpFormOpen] = useState(true);
  const [convoData, setConvoData] = useState({});
  const [widgetConfig, setWidgetConfig] = useState({});
  const [formData, setFormData] = useState({});
  const [convos, setConvos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingPrevMessages, setIsLoadingPrevMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [scrolltoBottom, triggerScrollToBottom] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  var { color, logo, headText, subText, toolTip, channels } =
    widgetConfig || {};

  const PAGE_SIZE = 10;

  const liveChatCredentials = channels?.find(
    (x) => x?.name?.toLowerCase() === "livechat"
  );

  const conversationIdRef = useRef(
    localStorage.getItem("conversationId") || null
  );

  const customerIdRef = useRef(localStorage.getItem("customerId") || null);

  const isLastPageOfMessages = useRef(false);

  const convoMessages = useRef([]);

  const chatContentRef = useRef();

  const getWidgetConfigs = async () => {
    try {
      let response = await fetch(`${baseURL}api/widget/${widget_id}`);
      const res = await response.json();

      const success = res?.success;
      if (success === true) {
        setWidgetConfig(res?.data);
      }
    } catch (err) {
      const errorMessage = getRequestError(err);
      setErrorMsg(errorMessage);
    }
  };
  useEffect(() => {
    console.log(convos);

    getWidgetConfigs();

    if (!window.location.href?.includes("/feedback")) {
      setShowWidget(true);
    }

    if (conversationIdRef.current) {
      setIsSignUpFormOpen(false);
      getConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket.io Script Starts Here
  useEffect(() => {
    socket.on("newMessage", (data) => {
      const dataCustomerId = data?.conversation?.customer_id;
      const dataAuthUser = data?.message?.sender?.authUser;

      console.log(".");
      console.log("dataCustomerId: ", dataCustomerId);
      console.log("myCustomerId: ", customerIdRef?.current);
      console.log("dataUserAuth: ", dataAuthUser);

      if (dataCustomerId === customerIdRef?.current && dataAuthUser === true) {
        console.log("I fetched...");
        console.log("--- --- --- --- --- ---");
        getConvoMessages(false, true);
      } else {
        console.log("--- --- --- --- --- ---");
      }
    });

    setInterval(() => {
      socket.emit("ping-alive", "hello wolrd");
    }, 58000); // PING SERVER EVERY 58 seconds

    socket.on("disconnect", (reason) => {
      console.log("REASON:", reason);

      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("error", (error) => {
      console.log("ERROR:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // WebSocket.io Script Ends Here

  useEffect(() => {
    if (!isWidgetOpen) {
      setIsWidgetTooltipOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetOpen]);

  useEffect(() => {
    const chatMessagesEl = document?.querySelector(".chat_messages");

    if (isLiveChatOpen && chatMessagesEl) {
      chatMessagesEl.addEventListener("scroll", loadMoreChats);
      getConvoMessages(false, true);

      triggerScrollToBottom(true);
      const timer = setInterval(() => {
        triggerScrollToBottom(false);
        clearInterval(timer);
      }, 1000);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveChatOpen]);

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
    if (color?.slice(0, 1) === "#") {
      color = color?.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (color?.length === 3) {
      color = color
        ?.split("")
        ?.map(function (hex) {
          return hex + hex;
        })
        ?.join("");
    }

    // Convert to RGB value
    var r = parseInt(color?.substr(0, 2), 16);
    var g = parseInt(color?.substr(2, 2), 16);
    var b = parseInt(color?.substr(4, 2), 16);

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

  const ScrollToBottom = () => {
    const elementRef = useRef();
    useEffect(() => elementRef.current.scrollIntoView({ behavior: "smooth" }));
    return <div ref={elementRef} />;
  };

  const scrollToMiddle = () => {
    const chatContainer = chatContentRef.current;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight / 4;
    }
  };

  const getConversation = async () => {
    try {
      let response = await fetch(
        `${baseURL}api/conversations/${conversationIdRef.current}/widget`
      );
      const res = await response.json();

      const success = res?.success;
      if (success === true) {
        setConvoData(res?.data);
        setFormData({
          email: res?.data?.customer?.email,
          name: res?.data?.customer?.name,
        });

        getConvoMessages(true, true);

        if (!customerIdRef.current || customerIdRef.current === undefined) {
          customerIdRef.current = res?.data?.Customer?.id;
          localStorage.setItem("customerId", res?.data?.Customer?.id);
        }
      } else {
        localStorage.removeItem("conversationId");
        localStorage.removeItem("customerId");
      }
    } catch (err) {
      setIsSignUpFormOpen(true);
      const errorMessage = getRequestError(err);
      setErrorMsg(errorMessage);
    }
  };

  const getConvoMessages = async (load, noPaginate) => {
    load && setIsLoadingMessages(true);

    const lastRowId = convoMessages.current?.[0]?.row_id;

    if (!isLastPageOfMessages.current) {
      try {
        let response = await fetch(
          `${baseURL}api/conversations/${
            conversationIdRef.current
          }/widget-messages?page[size]=${PAGE_SIZE}${
            noPaginate ? `` : `&lastMessageAt=${lastRowId}`
          }`
        );
        const res = await response.json();

        const success = res?.success;
        if (success === true) {
          const data = noPaginate
            ? [...res?.data?.reverse()]
            : [...res?.data?.reverse(), ...(convoMessages.current || [])];
          convoMessages.current = data;
          setConvos(data);

          isLastPageOfMessages.current = res?.data?.length < 10 ? true : false;

          load && setIsLoadingMessages(false);
          load && setIsSubmitting(null);
        } else {
          load && setIsLoadingMessages(false);
        }
      } catch (err) {
        load && setIsLoadingMessages(false);
        setIsSignUpFormOpen(true);
        const errorMessage = getRequestError(err);
        setErrorMsg(errorMessage);
      }
    }
  };

  const loadMoreChats = () => {
    const scrollTop = chatContentRef.current?.scrollTop;

    if (
      scrollTop <= 0 &&
      !isLastPageOfMessages.current &&
      convoMessages.current?.length &&
      !isLoadingMessages &&
      !isLoadingPrevMessages
    ) {
      setIsLoadingPrevMessages(true);
      getConvoMessages().then(() => {
        setIsLoadingPrevMessages(false);
        scrollToMiddle();
      });
    }
  };

  const startConversation = async (e) => {
    e.preventDefault();

    if (formData?.message?.text?.length > 0) {
      setIsSubmitting(true);
      try {
        let response = await fetch(
          `${baseURL}api/conversations/incoming-messages/widget/${liveChatCredentials?.to}`,
          {
            method: "POST",
            body: JSON.stringify({
              email: formData?.email,
              name: formData?.name,
              message: formData?.message,
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
          }
        );
        const res = await response.json();

        const success = res?.success;
        if (success === true) {
          setFormData({
            ...formData,
            message: "",
          });
          conversationIdRef.current = res?.data?.conversation_id;
          localStorage.setItem("conversationId", res?.data?.conversation_id);
          customerIdRef.current = res?.data?.sender?.customer_id;
          localStorage.setItem("customerId", res?.data?.sender?.customer_id);
          getConvoMessages(false, true);

          setConvoData(res?.data);
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
      setIsUploading(true);

      var fileData = new FormData();
      fileData.append("media", fileToUpload);

      try {
        let response = await fetch(`${baseURL}api/utils/upload`, {
          method: "POST",
          body: fileData,
        });
        const res = await response.json();

        if (res?.success === true) {
          setFormData({
            ...formData,
            message: {
              ...formData?.message,
              attachment: {
                url: res?.data,
                type: "IMAGE",
              },
            },
          });
          setIsUploading(false);
        }
      } catch (err) {
        const errorMessage = getRequestError(err);
        setErrorMsg(errorMessage);
        setIsUploading(false);
      }
    }
  };

  const replyConversation = async () => {
    if (formData?.message?.text?.length > 0) {
      convoMessages.current = [
        ...convoMessages.current,
        {
          id: "new",
          imageUrl: formData?.message?.attachment?.url,
          content: formData?.message?.text,
          updatedAt: new Date(),
        },
      ];
      setIsSubmitting(true);
      triggerScrollToBottom(true);

      try {
        let response = await fetch(
          `${baseURL}api/conversations/incoming-messages/widget/${liveChatCredentials?.to}`,
          {
            method: "POST",
            body: JSON.stringify({
              email: formData?.email,
              name: formData?.name,
              message: formData?.message,
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
          }
        );
        const res = await response.json();

        const success = res?.success;
        if (success === true) {
          setFormData({
            ...formData,
            message: { text: "" },
          });
          setIsSubmitting(false);
        }
      } catch (err) {
        const filteredMessage = convoMessages.current?.filter(
          (x) => x?.id !== "new"
        );
        convoMessages.current = filteredMessage;
        setIsSubmitting(null);
        const errorMessage = getRequestError(err);
        setErrorMsg(errorMessage);
      }

      triggerScrollToBottom(false);
    }
  };

  const islastMsgFromMe =
    convoMessages?.current[convoMessages?.current?.length - 1]?.id === "new";

  return (
    <>
      {showWidget ? (
        <>
          {isWidgetOpen && (
            <div className={`widget_container ${isWidgetOpen ? "" : "none"}`}>
              {isLiveChatOpen ? (
                <>
                  <div
                    className="chat_header"
                    style={{
                      backgroundColor: color,
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
                    <p>{convoData?.agent || liveChatCredentials?.identifier}</p>
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
                        <div className="chat_messages" ref={chatContentRef}>
                          {isLoadingPrevMessages ? (
                            <div className="load_previous">
                              Loading previous messages...
                            </div>
                          ) : (
                            !isLastPageOfMessages.current && (
                              <div className="load_previous">
                                Scroll up to load previous messages
                              </div>
                            )
                          )}
                          {convoMessages.current?.map((msg, i) => (
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
                                <p>{formatTime(msg?.updatedAt)}</p>
                              </div>
                            </div>
                          ))}
                          {isUploading === true && (
                            <p className="send_status">Uploading...</p>
                          )}
                          {isSubmitting === true && (
                            <p className="send_status">Sending...</p>
                          )}
                          {isSubmitting === false && islastMsgFromMe && (
                            <p className="send_status">Sent</p>
                          )}
                          {isLoadingMessages === true && (
                            <p className="loading">Loading...</p>
                          )}
                          {scrolltoBottom && <ScrollToBottom />}
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
                      backgroundColor: color,
                      color: determineColorFromBg(),
                    }}
                  >
                    <div
                      className="close"
                      onClick={() => setIsWidgetOpen(!isWidgetOpen)}
                    >
                      <img
                        src="https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/chevron.svg"
                        alt=""
                      />
                    </div>
                    <img className="logo" src={logo} alt="" />
                    <h3>{headText}</h3>
                    <h4>{subText}</h4>
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
          {!isWidgetOpen && (
            <div className="trigger_container">
              {isWidgetTooltipOpen && toolTip && (
                <div className={`tooltip ${isWidgetOpen ? "none" : ""}`}>
                  {toolTip}
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
                style={{ backgroundColor: color || "#000" }}
                onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              >
                <img
                  src={
                    logo ||
                    "https://s3.eu-west-3.amazonaws.com/oneroute.asb.ng/oneroute-w.svg"
                  }
                  className={!isWidgetOpen ? "closed" : ""}
                  alt=""
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default App;
