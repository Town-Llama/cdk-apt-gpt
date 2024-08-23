import {useMemo, useCallback, useState, useEffect} from 'react';
import Modal from "react-modal";
import { useSelector, useDispatch } from "react-redux";
import { useTable } from 'react-table';
import PropertyPreview from "../PropertyPreview/PropertyPreview";

import { updateComparingIndices } from '../../store/actions/dfActions';
import AIExplanation from '../AIExplanation/AIExplanation';
import "./PickMore.css";

const PickMore = ({isOpen, onRequestClose}) => {

    const df = useSelector(state=>state.df);
    const dispatch = useDispatch();

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState(df.comparingIndices || []);

    useEffect(() => {
        const handleResize = () => {
          setIsSmallScreen(window.innerWidth < 960); // Assuming 960px is the breakpoint for md
        };
    
        handleResize(); // Call once to set initial state
        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    const handleCheckboxChange = useCallback((index) => {
        setSelectedIndices(prevSelected => {
            let newArray;
            if (prevSelected.includes(index)) {
                newArray= prevSelected.filter(i => i !== index);
            } else {
                newArray = [...prevSelected, index];
            }
            dispatch(updateComparingIndices(newArray));
            return newArray;
        });
    }, []);

    const columns = useMemo(() => {
        const baseColumns = [
            {
                Header: isSmallScreen ? '' : 'Selected',
                accessor: 'select',
                Cell: ({ row }) => (
                    <input 
                        type="checkbox" 
                        checked={selectedIndices.includes(row.index)} 
                        onChange={() => handleCheckboxChange(row.index)} 
                        disabled={selectedIndices.length === 4 && !selectedIndices.includes(row.index)}
                    />
                ),
            },
            {
                Header: 'Property Preview',
                accessor: 'preview',
                className: isSmallScreen ? "cell-max-width" : ""
            }
        ];
    
        if (!isSmallScreen) {
            baseColumns.push(
                {
                    Header: 'AI Recommendation',
                    accessor: 'name',
                    Cell: ({ cell }) => (
                        <div className="wrap-text">
                            {cell.value}
                        </div>
                    ),
                },
                {
                    Header: 'Distance From Location',
                    accessor: 'distance',
                }
            );
        }
    
        return baseColumns;
    }, [selectedIndices, handleCheckboxChange, isSmallScreen]);
    

    const data = useMemo(() => {
        const seenBuildingNames = new Set();
        return df.payload
            // .filter(property => {
            //     const isDuplicate = seenBuildingNames.has(property.buildingname);
            //     seenBuildingNames.add(property.buildingname);
            //     return !isDuplicate;
            // })
            .map((property, index) => {
                const apt = { ...property, index };
                const obj = {
                    select: selectedIndices.includes(index),
                    preview: (<PropertyPreview apt={apt} />),
                };
                if (!isSmallScreen) {
                    obj.name = (<AIExplanation apt={property} short={true} />);
                    obj.distance = property.distance.toFixed(1) + " miles";
                }
                return obj;
            });
    }, [df, selectedIndices, isSmallScreen]);
    

    const tableInstance = useTable({ columns, data });

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    const customStyles = {
        overlay: {
          zIndex: 1000, // Ensure this is higher than the Leaflet map's z-index
        },
      };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Search"
            className="bg-white rounded-lg max-w-5xl mx-auto shadow-lg w-11/12"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={customStyles}
        >
            <div style={{padding: "10px"}}>
                <h2 className="text-2xl font-bold gradient-text mb-4">Pick Which Of the Top 100 You Want to Compare</h2>
                <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                    <table {...getTableProps()}>
                        <thead>
                            {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                                ))}
                            </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {rows.map(row => {
                                    prepareRow(row);
                                    const isSelected = selectedIndices.includes(row.index);
                                    return (
                                        <tr 
                                            {...row.getRowProps()} 
                                            className={isSelected ? 'bg-blue-100' : selectedIndices.length == 4 ? 'cursor-not-allowed' : ''}
                                        >
                                            {row.cells.map(cell => (
                                                <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap cell-max-width">
                                                    {cell.render('Cell')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}

export default PickMore;