import {useMemo, useCallback, useState, useEffect} from 'react';
import Modal from "react-modal";
import { useSelector, useDispatch } from "react-redux";
import { useTable } from 'react-table';
import PropertyPreview from "../PropertyPreview/PropertyPreview";

import { updateComparingIndices } from '../../store/actions/dfActions';
import AIExplanation from '../AIExplanation/AIExplanation';
import "./PickMore.css";

const PickMoreMobile = () => {

}