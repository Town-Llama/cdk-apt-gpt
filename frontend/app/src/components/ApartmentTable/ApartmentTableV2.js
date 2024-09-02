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

const ApartmentTableV2 = () => {
  const dispatch = useDispatch();
  const df = useSelector((state) => state.df);
  const chat = useSelector((state) => state.chat);
  const [pickMoreOpen, setPickMoreOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const openModal = () => setPickMoreOpen(true);
  const closeModal = () => setPickMoreOpen(false);

  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  const chosenApts = useMemo(() => {
    return df.comparingIndices.map((i) => ({
      ...df.payload[i],
      index: i,
    }));
  }, [df.comparingIndices, df.payload]);

  const propertyNames = useMemo(() => {
    return chosenApts.map((property) => property.buildingname);
  }, [chosenApts]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 960); // Assuming 960px is the breakpoint for md
    };

    handleResize(); // Call once to set initial state
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = useMemo(() => {
    return [
      {
        Header: "",
        accessor: "attribute",
      },
      ...propertyNames.map((name, index) => ({
        Header: name,
        accessor: `properties[${index}].value`,
      })),
    ];
  }, [propertyNames]);

  const [commuteData, setCommuteData] = useState([]);
  const [poiData, setPoiDataState] = useState({});

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

  useEffect(() => {
    const fetchCommuteData = async () => {
      if (chat.commuteAddress) {
        const directionsClient = MapboxClient({
          accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
        });

        try {
          const commutePromises = chosenApts.map(async (a) => {
            const start = [parseFloat(a.latitude), parseFloat(a.longitude)]; // Assuming `a` has the starting coordinates
            const end = chat.commuteAddress; // Assuming `chat.commuteAddress` has the ending coordinates

            const response = await directionsClient
              .getDirections({
                profile: "driving",
                geometries: "geojson",
                waypoints: [
                  { coordinates: [start[1], start[0]] },
                  { coordinates: [end[1], end[0]] },
                ],
              })
              .send();

            if (
              !response.body ||
              !response.body.routes ||
              response.body.routes.length === 0
            ) {
              throw new Error("No route found in the response");
            }

            const { distance, duration } = response.body.routes[0];
            const minutes = Math.floor(duration / 60);
            const remainingSeconds = Math.floor(duration % 60);
            const t = `${minutes}m ${remainingSeconds}s`;
            return {
              distance: (distance * 0.000621371).toFixed(2) + " miles",
              duration: t,
              buildingname: a.buildingname,
            };
          });

          const data = await Promise.all(commutePromises);
          dispatch(
            addOpenAINotation({
              role: "system",
              content: JSON.stringify(data),
            })
          );
          setCommuteData(data);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchCommuteData();
  }, [chat.commuteAddress, chosenApts]);

  useEffect(() => {
    const fetchPoiData = async () => {
      if (!chat.poiArr || !chosenApts.length) return;

      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.error("Mapbox access token is not set");
        return;
      }

      try {
        const allPoiData = await Promise.all(
          chat.poiArr.map(async (category) => {
            const aptPoiData = await Promise.all(
              chosenApts.map(async (apt) => {
                const baseUrl =
                  "https://api.mapbox.com/search/searchbox/v1/category/";
                let apt_lat = parseFloat(apt.latitude);
                let apt_lng = parseFloat(apt.longitude);
                const params = new URLSearchParams({
                  proximity: `${apt_lng},${apt_lat}`,
                  access_token: accessToken,
                  limit: 4,
                  radius: 5,
                });
                const apiUrl = `${baseUrl}${encodeURIComponent(
                  category
                )}?${params}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                return data.features;
              })
            );
            const obj = {};
            obj[category] = aptPoiData;
            return obj;
          })
        );

        dispatch(
          addOpenAINotation({
            role: "system",
            content: cleanPOIData(allPoiData),
          })
        );
        setPoiDataState(allPoiData);
        dispatch(setPoiData(allPoiData));
      } catch (error) {
        console.error("Error fetching POI data:", error);
      }
    };

    fetchPoiData();
  }, [chat.poiArr, chosenApts]);

  const cleanPOIData = (allPoiData) => {
    //transmute the data to
    const data = {};
    chosenApts.forEach((a, index) => {
      data[a.buildingname] = {};
      let apt_lng = parseFloat(a.longitude);
      let apt_lat = parseFloat(a.latitude);
      for (let i = 0; i < chat.poiArr.length; i++) {
        let readIndex = -1;
        for (let j = 0; j < allPoiData.length; j++) {
          let key = Object.keys(allPoiData[j]);
          if (key[0] == chat.poiArr[i]) {
            readIndex = j;
            break;
          }
        }
        if (readIndex == -1) {
          throw Error("no matches");
        }

        let rawDataArr = allPoiData[readIndex][chat.poiArr[i]][index];
        let cleanedDataArr = rawDataArr.map((r) => {
          let distance = calculateDistance(
            r.geometry.coordinates[1],
            r.geometry.coordinates[0],
            apt_lat,
            apt_lng
          );
          return {
            milesAway: (0.621371 * distance).toFixed(2),
            name: r.properties?.name,
            category: r.properties?.poi_category,
            address: r.properties?.address,
            shortDescription: r.properties?.brand,
            website: r.metadata?.website,
          };
        });
        data[a.buildingname][chat.poiArr[i]] = cleanedDataArr;
      }
    });
    return JSON.stringify(data);
  };

  const data = useMemo(() => {

    if (isSmallScreen) return [];
    const send = [];

    send[0] = {
      attribute: "Property Preview",
      properties: chosenApts.map((a, index) => ({
        value: <PropertyPreview apt={a} index={index} />,
      })),
    };

    send[1] = {
      attribute: "Why this Apartment?",
      properties: chosenApts.map((a, index) => ({
        value: <AIExplanation apt={a} showOnLoad={true} short={true} />,
      })),
    };

    send[2] = {
      attribute: "Rent",
      properties: chosenApts.map((a) => ({
        value: `$${parseFloat(a.rent_12_month_monthly).toFixed(2)}`,
      })),
    };

    send[3] = {
      attribute: "Review Summary (Beta)",
      properties: chosenApts.map((a) => ({
        value: <ReviewAggregation apt={a} />,
      })),
    };

    send[4] = {
      attribute: "Square Feet",
      properties: chosenApts.map((a) => ({
        value: a.area,
      })),
    };

    send[5] = {
      attribute: "Beds",
      properties: chosenApts.map((a) => ({
        value: a.beds,
      })),
    };

    send[6] = {
      attribute: "Baths",
      properties: chosenApts.map((a) => ({
        value: a.baths,
      })),
    };
    let index = 6;

    if (commuteData.length > 0) {
      index++;
      send[index] = {
        attribute: "Commute Time",
        properties: commuteData.map((data) => ({
          value: data.duration,
        })),
      };

      index++;
      send[index] = {
        attribute: "Commute Distance",
        properties: commuteData.map((data) => ({
          value: data.distance,
        })),
      };
    }

    if (poiData.length > 0) {
      for (let i = 0; i < poiData.length; i++) {
        index++;
        let key = Object.keys(poiData[i])[0];
        let apt_lng = parseFloat(chosenApts[i].longitude);
        let apt_lat = parseFloat(chosenApts[i].latitude);
        send[index] = {
          attribute: key,
          properties: poiData[i][key].map((poi) => {
            let ul = [];
            poi.map((p, j) => {
              let distance = calculateDistance(
                p.geometry.coordinates[1],
                p.geometry.coordinates[0],
                apt_lat,
                apt_lng
              );
              ul.push(
                <li key={key + "_" + j}>
                  {p.properties.name} -{" "}
                  {(0.621371 * distance).toFixed(2) + " miles away"}
                </li>
              );
            });
            return {
              value: <div style={{ textAlign: "left" }}>{ul}</div>,
            };
          }),
        };
      }
    }

    return send;
  }, [chosenApts, commuteData, poiData]);

  const clickMore = () => {
    trackButtonClick("ApartmentTableV2_MoreApts", user.sub);
    openModal();
  };

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  const tableData = useMemo(() => {
    if (isSmallScreen) return null;
    return (
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, colIndex) => (
                <th
                  {...column.getHeaderProps()}
                  className={`${styles.th} ${colIndex === 0 ? styles.firstColumn : styles.fixedWidth
                    }`}
                >
                  {colIndex == 0 ? (
                    null
                  ) : (
                    column.render("Header")
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                className={`${rowIndex % 2 === 0 ? styles.evenRow : ""} 
            ${rowIndex == 1 ? styles.alignTop : ""}
            `}
              >
                {row.cells.map((cell, colIndex) => {
                  const cellProps = cell.getCellProps();
                  const cellContent = cell.render("Cell");

                  const colSpan =
                    cell.column.id === "properties[0].value" &&
                    cell.row.original.properties[0].colSpan;

                  return (
                    <td {...cellProps} colSpan={colSpan}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  });

  const blogData = useMemo(() => {
    if (!isSmallScreen) return null;

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
        {chosenApts.map((a, index) => (
          <Box
            key={`Apartment_${index}_${a.buildingname}`}
            sx={{
              minWidth: '70vw',
              maxWidth: '70vw',
              marginRight: '16px',
              padding: '16px',
              borderRight: index < chosenApts.length - 1 ? '1px solid #bebcc4' : 'none',
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

              <Box sx={{
                flexBasis: '30%',
                minWidth: '80px',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                <Typography noWrap>Sq Ft: <span className="gradient-text">{a.area}</span></Typography>
              </Box>
              <Box sx={{
                flexBasis: '30%',
                minWidth: '80px',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                <Typography noWrap>Beds: <span className="gradient-text">{a.beds}</span></Typography>
              </Box>
              <Box sx={{
                flexBasis: '30%',
                minWidth: '80px',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                <Typography noWrap>Baths: <span className="gradient-text">{a.baths}</span></Typography>
              </Box>
              {commuteData.length > index && (
                <>
                  <Typography style={{ margin: "auto" }}>Commute Time: <span className="gradient-text">{commuteData[index].duration}</span></Typography>
                  <Typography style={{ margin: "auto" }}>Commute Distance: <span className="gradient-text">{commuteData[index].distance}</span></Typography>
                </>
              )}
              {poiData.length > 0 && (
                <>
                  {poiData.map((element) => {
                    const key = Object.keys(element)[0];
                    const pArr = element[key][index];
                    if (!pArr) return null;
                    const totalDistance = pArr.reduce((sum, p) => {
                      return sum + calculateDistance(
                        p.geometry.coordinates[1],
                        p.geometry.coordinates[0],
                        parseFloat(a.latitude),
                        parseFloat(a.longitude)
                      );
                    }, 0);
                    const avgDistance = (0.621371 * (totalDistance / pArr.length)).toFixed(2);
                    return (
                      <Typography key={key} style={{ margin: "auto" }}>
                        Average Distance to {key}s:<br />
                        <span className="gradient-text">{avgDistance} miles</span>
                      </Typography>
                    );
                  })}
                </>
              )}
              <ReviewAggregation apt={a} />
            </Box>
          </Box>
        ))}
        <Box
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
        </Box>
      </Box>
    );
  }, [chosenApts, commuteData, poiData, isSmallScreen]);

  return (
    <Accordion title="Report" defaultToOpen={true}>
      <PickMore isOpen={pickMoreOpen} onRequestClose={closeModal} />
      <MapComponent apts={chosenApts} />
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <br />
        {blogData}
      </Box>
      <Box
        className={styles.tableContainer}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        {tableData}
        <br />
        <button onClick={clickMore}><span className="gradient-text">See Other Options</span></button>
      </Box>
    </Accordion>
  );
};

export default ApartmentTableV2;
