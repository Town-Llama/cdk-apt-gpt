import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import LoginPrompt from "../LoginPrompt/LoginPrompt";
import Sidebar from '../Sidebar/Sidebar';
import AptGptUtility from "../utils/API/AptGptUtility";
import ViewV2 from "../ViewV2/ViewV2";
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

  const [modalIsOpen, setModalIsOpen] = useState(isAuthenticated);
  const [waitlistApproved, setWaitlistApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  useEffect(() => {
    const saveChat = async () => {
      const client = new AptGptUtility(
        getAccessTokenSilently,
        isAuthenticated,
        user
      );
      const aptIdArr = [];
      for (let i = 0; i < df.comparingIndices.length; i++) {
        aptIdArr.push(df.payload[df.comparingIndices[i]].unit_id);
      }
      await client.datas_chats_record(
        formData.ask,
        chat.conversationId,
        chat.commuteAddress,
        chat.poiArr,
        chat.poiData,
        chat.chatState,
        aptIdArr
      );
    };
    if (isAuthenticated && chat.conversationId !== null) {
      saveChat();
    }
  }, [chat, formData, df, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      process();
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
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const drawer = <Sidebar isOpen={openModal} handleDrawerToggle={handleDrawerToggle} />;

  return (
    <Box sx={{ display: "flex", height: "100vh" }} className="bg-gray-100">
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex-shrink-0 h-16 bg-[#121826] flex items-center px-4 sm:hidden">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'white' }}>
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
            <ViewV2 showLoading={showLoading} />
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
