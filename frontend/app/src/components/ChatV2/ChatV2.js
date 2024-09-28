import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import LoginPrompt from "../LoginPrompt/LoginPrompt";
import Sidebar from '../Sidebar/Sidebar';
import AptGptUtility from "../utils/API/AptGptUtility";
import PublicView from "../PublicView/PublicView";
import ViewV2 from "../ViewV2/ViewV2"
import ChatArea from "./ChatArea/ChatArea";
import "./ChatV2.css";

import MenuIcon from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import * as React from "react";
import SearchModal from "../FormV2/SearchModal";

const drawerWidth = 240;

const ChatV2 = ({ showLoading }) => {
  const df = useSelector((state) => state.df);
  const chat = useSelector((state) => state.chat);
  const formData = useSelector((state) => state.formData.payload);
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  console.log("CHat state: ", chat);
  console.log("df state: ", df);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [waitlistApproved, setWaitlistApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  useEffect(() => {
    if (isAuthenticated) {
      process();
      if (isFirstLogin) {
        setModalIsOpen(true);
        setIsFirstLogin(false);
      }
    } else {
      setIsFirstLogin(true);
    }
  }, [isAuthenticated]);

  const process = async () => {
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );
    let approved = await client.datas_waitlist();
    setIsLoading(false);
    setWaitlistApproved(approved);
  };

  const handleDrawerClose = () => {
    setIsClosing(true);
    setDrawerOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setDrawerOpen(!drawerOpen);
    }
  };

  const drawer = (
    <Sidebar isOpen={openModal} handleDrawerToggle={handleDrawerToggle} />
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }} className="bg-gray-100">
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex-shrink-0 h-16 bg-[#121826] flex items-center px-4">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: "white" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ color: "white" }}
          >
            Town Llama
          </Typography>
        </div>
        <div className="flex-grow overflow-auto">
          <SearchModal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            showLoading={showLoading}
          />
          {df.index === null ? (
            <ChatArea showLoading={showLoading} />
          ) : (
            <PublicView id={chat.df[df.index].barid} />
          )}
          {(!isAuthenticated || !waitlistApproved) && (
            <LoginPrompt
              isLoading={isLoading}
              waitlistApproved={waitlistApproved}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>
      </Box>
    </Box>
  );
};

export default ChatV2;