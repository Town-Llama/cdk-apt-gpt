import { useAuth0 } from "@auth0/auth0-react";
import MapboxClient from "@mapbox/mapbox-sdk/services/directions";
import { Typography } from '@mui/material';
import Box from "@mui/material/Box";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTable } from "react-table";
import Accordion from "../Accordion/Accordion";
import AIExplanation from "../AIExplanation/AIExplanation";
import MapComponent from "../Map/MapComponent";
import PickMore from "../PickMore/PickMore";
import PropertyPreview from "../PropertyPreview/PropertyPreview";
import styles from "./ApartmentTableV2.module.css";

import { addOpenAINotation, setPoiData } from "../../store/actions/chatActions";
import ReviewAggregation from "../ReviewAggregation/ReviewAggregation";
import { trackButtonClick } from "../utils/analytics";

const POITable = () => {
    const dispatch = useDispatch();
    const chat = useSelector((state) => state.chat);
    const [pickMoreOpen, setPickMoreOpen] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const openModal = () => setPickMoreOpen(true);
    const closeModal = () => setPickMoreOpen(false);

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    const suggestedOptions = useMemo(() => {
        return chat.comparingIndices.map((i) => ({
            ...chat.df[i],
            index: i,
        }));
    }, [chat.comparingIndices, chat.df]);

    console.log(chat);

    const propertyNames = useMemo(() => {
        return suggestedOptions.map((option) => {
            if (Object.keys(option).includes("isdrink")) {
                return option.barid;
            } else {
                return option.name;
            }
        });
    }, [suggestedOptions]);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 960); // Assuming 960px is the breakpoint for md
        };

        handleResize(); // Call once to set initial state
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in kilometers

        return distance;
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    const clickMore = () => {
        trackButtonClick("ApartmentTableV2_MoreApts", user.sub);
        openModal();
    };

    const blogData = useMemo(() => {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    whiteSpace: 'nowrap',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none'
                    },
                    width: '100%',
                    maxWidth: '80vw',
                }}
            >
                {suggestedOptions.map((a, index) => (
                    <Box
                        key={`Apartment_${index}_${a.id}`}
                        sx={{
                            minWidth: '70vw',
                            maxWidth: '70vw',
                            marginRight: '16px',
                            padding: '16px',
                            borderRight: index < suggestedOptions.length - 1 ? '1px solid #bebcc4' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            flexShrink: 0,
                        }}
                    >
                        <PropertyPreview apt={a} index={index} />
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            whiteSpace: 'normal',
                            marginTop: '16px',
                        }}>
                            <AIExplanation apt={a} showOnLoad={true} short={true} />
                            <br />
                            <ReviewAggregation apt={a} />
                        </Box>
                    </Box>
                ))}
                {/* <Box
                    key="Apartment_none"
                    sx={{
                        minWidth: '0vw',
                        maxWidth: '80vw',
                        marginRight: '16px',
                        padding: '16px',
                        borderLeft: '1px solid #bebcc4',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                        margin: "auto"
                    }}
                >
                    <button onClick={clickMore}><span className="gradient-text">See Other Options</span></button>
                </Box> */}
            </Box>
        );
    }, [suggestedOptions, isSmallScreen]);

    return (
        <Accordion title="Report" defaultToOpen={true}>
            {/* <PickMore isOpen={pickMoreOpen} onRequestClose={closeModal} /> */}
            <MapComponent apts={suggestedOptions} />
            <Box sx={{ display: { xs: "block" } }}>
                <br />
                {blogData}
            </Box>
        </Accordion>
    );
};

export default POITable;
